import React, { useState, useRef } from 'react';
import './EmotionModel.css';

const EMOTION_META = {
  happy:    { color: '#eab308', bg: '#fefce8', text: '#854d0e', emoji: '😊' },
  sad:      { color: '#60a5fa', bg: '#eff6ff', text: '#1e40af', emoji: '😢' },
  angry:    { color: '#ef4444', bg: '#fef2f2', text: '#991b1b', emoji: '😠' },
  fear:     { color: '#a855f7', bg: '#faf5ff', text: '#6b21a8', emoji: '😨' },
  surprise: { color: '#fb923c', bg: '#fff7ed', text: '#9a3412', emoji: '😲' },
  disgust:  { color: '#16a34a', bg: '#f0fdf4', text: '#14532d', emoji: '🤢' },
  neutral:  { color: '#9ca3af', bg: '#f9fafb', text: '#374151', emoji: '😐' },
};

export default function EmotionModel() {
  const [preview, setPreview]         = useState(null);
  const [result, setResult]           = useState(null);
  const [heatmap, setHeatmap]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [dragOver, setDragOver]       = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setHeatmap(null);
    setError(null);
    setShowHeatmap(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!fileRef.current?.files[0]) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', fileRef.current.files[0]);
      const res = await fetch('http://127.0.0.1:5000/predict', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setResult(data);
      setHeatmap(`data:image/png;base64,${data.heatmap}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortedScores = result
    ? Object.entries(result.scores).sort((a, b) => b[1] - a[1])
    : [];

  const meta = result ? (EMOTION_META[result.emotion] || EMOTION_META.neutral) : null;

  return (
    <div className="em-page">
      <div className="em-container">

        <div className="em-card">
          <p style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px' }}>
            Facial emotion detector
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Upload a face photo and the AI will analyze the emotion
          </p>
        </div>

        <div className="em-card">
          <p className="em-section-label">Upload image</p>
          <div
            className={`em-upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileRef.current.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {preview ? (
              <>
                <img src={preview} alt="Selected" className="em-preview-img" />
                <p className="em-change-hint">Click to change image</p>
              </>
            ) : (
              <>
                <div className="em-upload-icon">🖼️</div>
                <p className="em-upload-title">Drop your image here</p>
                <p className="em-upload-sub">or click to browse · JPG, PNG supported</p>
              </>
            )}
          </div>

          {preview && (
            <button
              className="em-analyze-btn"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Analyzing…
                </>
              ) : 'Analyze emotion'}
            </button>
          )}

          {error && <div className="em-error-box"> {error}</div>}
        </div>


        {result && meta && (
          <div className="em-card">
            <p className="em-section-label">Results</p>

  
            <div
              className="em-emotion-badge"
              style={{ background: meta.bg, borderColor: `${meta.color}40` }}
            >
              <span style={{ fontSize: '52px', lineHeight: 1 }}>{meta.emoji}</span>
              <div style={{ flex: 1 }}>
                <p className="em-emotion-name" style={{ color: meta.text }}>{result.emotion}</p>
                <p className="em-emotion-confidence" style={{ color: meta.text }}>
                  {result.confidence}% confidence
                </p>
                <div className="em-confidence-track">
                  <div
                    className="em-confidence-fill"
                    style={{ width: `${result.confidence}%`, background: meta.color }}
                  />
                </div>
              </div>
            </div>

            {/* all emotion  */}
            <p className="em-section-label">All emotions</p>
            {sortedScores.map(([emotion, score]) => {
              const m = EMOTION_META[emotion] || EMOTION_META.neutral;
              return (
                <div key={emotion} className="em-bar-row">
                  <span style={{ fontSize: '16px', width: '22px' }}>{m.emoji}</span>
                  <span className="em-bar-label">{emotion}</span>
                  <div className="em-bar-track">
                    <div className="em-bar-fill" style={{ width: `${score}%`, background: m.color }} />
                  </div>
                  <span className="em-bar-pct">{score}%</span>
                </div>
              );
            })}

            {/* heatmap */}
            <div className="em-heatmap-section">
              <div className="em-heatmap-row">
                <div>
                  <p className="em-heatmap-title">Grad-CAM heatmap</p>
                  <p className="em-heatmap-sub">Areas the model focused on most</p>
                </div>
                <button
                  className={`em-toggle-btn ${showHeatmap ? 'active' : ''}`}
                  onClick={() => setShowHeatmap(v => !v)}
                >
                  {showHeatmap ? 'Hide' : 'Show'}
                </button>
              </div>

              {showHeatmap && heatmap && (
                <>
                  <img src={heatmap} alt="Grad-CAM heatmap" className="em-heatmap-img" />
                  <div className="em-legend">
                    <span className="em-legend-dot" style={{ background: '#ef4444' }} />
                    <span className="em-legend-label">High attention</span>
                    <span className="em-legend-dot" style={{ background: '#3b82f6', marginLeft: '8px' }} />
                    <span className="em-legend-label">Low attention</span>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}