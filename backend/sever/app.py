from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import base64, io, cv2
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from torchvision import transforms
# from pytorch_grad_cam import GradCAM
from pytorch_grad_cam import GradCAMPlusPlus
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image

app = Flask(__name__)
CORS(app)

EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
IMG_SIZE = 224

# architecture 
class GeM(nn.Module):
    def __init__(self, p=3, eps=1e-6):
        super().__init__()
        self.p = nn.Parameter(torch.ones(1) * p)
        self.eps = eps

    def forward(self, x):
        return F.avg_pool2d(
            x.clamp(min=self.eps).pow(self.p),
            (x.size(-2), x.size(-1))
        ).pow(1. / self.p)


class CarlaAttention(nn.Module):
    def __init__(self, in_channels, reduction=16):
        super().__init__()
        self.channel_att = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(in_channels, in_channels // reduction, 1),
            nn.ReLU(inplace=True),
            nn.Conv2d(in_channels // reduction, in_channels, 1),
            nn.Sigmoid()
        )
        self.spatial_att = nn.Sequential(
            nn.Conv2d(2, 1, kernel_size=7, padding=3),
            nn.Sigmoid()
        )

    def forward(self, x):
        ch_att = self.channel_att(x)
        x = x * ch_att
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        sp_att = self.spatial_att(torch.cat([avg_out, max_out], dim=1))
        x = x * sp_att
        return x


class EfficientNetCarla(nn.Module):
    def __init__(self, num_classes=7, dropout=0.4):
        super().__init__()
        backbone = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
        self.features = backbone.features
        in_features = backbone.classifier[1].in_features
        self.attention = CarlaAttention(in_features)
        self.pool = GeM()
        self.classifier = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.attention(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x


def crop_face(pil_img):
    """Detects and crops the face from the image. Returns original if no face found."""
    img_cv = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    
    # OpenCV built-in face detector
    detector = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    faces = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    if len(faces) == 0:
        return pil_img  # no face found, use original
    
    # Take the largest face
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    
    # Add 20% padding around the face
    pad = int(0.2 * max(w, h))
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(pil_img.width,  x + w + pad)
    y2 = min(pil_img.height, y + h + pad)
    
    return pil_img.crop((x1, y1, x2, y2))



# model
model = EfficientNetCarla(num_classes=7, dropout=0.4)
checkpoint = torch.load('../model/efficientnet_carla_best.pth', map_location='cpu')
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

target_layers = [model.features[4][-1]]
# cam = GradCAM(model=model, target_layers=target_layers)
cam = GradCAMPlusPlus(model=model, target_layers=target_layers)


transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])


@app.route('/predict', methods=['POST'])
def predict():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image provided'}), 400

    pil_img = Image.open(file.stream).convert('RGB')
    # pil_img = crop_face(pil_img) 
    input_tensor = transform(pil_img).unsqueeze(0)

    with torch.no_grad():
        logits = model(input_tensor)
        probs = torch.softmax(logits, dim=1)[0].numpy()

    class_idx = int(np.argmax(probs))

    grayscale_cam = cam(
        input_tensor=input_tensor,
        targets=[ClassifierOutputTarget(class_idx)]
    )[0]

    # original_float = np.array(pil_img.resize((IMG_SIZE, IMG_SIZE)), dtype=np.float32) / 255.0
    # blended = show_cam_on_image(original_float, grayscale_cam, use_rgb=True)
    original_float = np.array(pil_img.resize((IMG_SIZE, IMG_SIZE)), dtype=np.float32) / 255.0
    # smooth the cam before blending so edges are less harsh
    grayscale_cam_smooth = cv2.GaussianBlur(grayscale_cam, (15, 15), 0)
    # normalize after smoothing
    grayscale_cam_smooth = (grayscale_cam_smooth - grayscale_cam_smooth.min()) / \
                       (grayscale_cam_smooth.max() - grayscale_cam_smooth.min() + 1e-8)
    # suppress weak activations — only show top 40% intensity
    grayscale_cam_smooth = np.where(grayscale_cam_smooth > 0.4, grayscale_cam_smooth, 0.0)
    
    # normalize again after smoothing
    grayscale_cam_smooth = (grayscale_cam_smooth - grayscale_cam_smooth.min()) / \
                        (grayscale_cam_smooth.max() - grayscale_cam_smooth.min() + 1e-8)
    blended = show_cam_on_image(original_float, grayscale_cam_smooth, use_rgb=True, image_weight=0.45)

    buf = io.BytesIO()
    Image.fromarray(blended).save(buf, format='PNG')
    heatmap_b64 = base64.b64encode(buf.getvalue()).decode()

    scores = {EMOTIONS[i]: round(float(probs[i]) * 100, 1) for i in range(len(EMOTIONS))}

    return jsonify({
        'emotion': EMOTIONS[class_idx],
        'confidence': round(float(probs[class_idx]) * 100, 1),
        'scores': scores,
        'heatmap': heatmap_b64,
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)



