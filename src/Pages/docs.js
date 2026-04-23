import React from 'react';
import Header from "../Components/other/header";

const Docs = () => {
    return (
        <div className="em-page" style={{background: '#f8fafc'}}>
            <Header />
            <div className="em-main-layout" style={{paddingTop: '100px', maxWidth: '800px'}}>
                <div className="em-card">
                    <h1 style={{color: '#1e293b', fontSize: '28px', marginBottom: '16px'}}>Documentation</h1>
                    <p style={{color: '#64748b', lineHeight: '1.6'}}>
                        Welcome to the emotionAI guide. This platform uses 
                        Convolutional Neural Networks (CNN), EfficientNet-B0 model to detect human emotions in real-time.
                    </p>
                    
                    <h3 style={{marginTop: '30px', color: '#0a7e8b'}}>How it works</h3>
                    <ul style={{color: '#475569', paddingLeft: '20px', marginTop: '10px'}}>
                        <li>In the "Analysis" tab you can find the image prediction tool.</li>
                        <li>Upload any clear photo of a human face in the "Facial emotion detector" box.</li>
                        <li>The model analyzes expressions across 7 key emotions: happy, sad, angry, fear, surprise, disgust and neutral and gives a procentual number of which emotions was detected and which was the predominant one.</li>
                        <li>Grad-CAM heatmaps highlights pixels that influenced the decision most.</li>
                        <li>Analysed images can be added to history.</li>
                        <li>The third tab "Statistics" shows how accurate the model is.</li>
                    </ul>

                    <h3 style={{marginTop: '30px', color: '#0a7e8b'}}>API Call</h3>
                    <p style={{color: '#64748b', fontSize: '14px', background: '#f1f5f9', padding: '12px', borderRadius: '8px', fontFamily: 'monospace'}}>
                        POST http://127.0.0.1:5000/predict
                    </p>
                    <p style={{color: '#475569', marginTop: '10px'}}>To start the server navigate to backend/server and run command:</p>
                    <p style={{color: '#64748b', fontSize: '14px', background: '#f1f5f9', padding: '12px', borderRadius: '8px', fontFamily: 'monospace'}}>
                        python app.py
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Docs;