import React, { useState, useRef, useEffect } from 'react';
import './EmotionModel.css';

const EMOTION_META = {
  happy:    { color: '#eab308', bg: '#fefce8', text: '#854d0e'},
  sad:      { color: '#60a5fa', bg: '#eff6ff', text: '#1e40af'},
  angry:    { color: '#ef4444', bg: '#fef2f2', text: '#991b1b'},
  fear:     { color: '#a855f7', bg: '#faf5ff', text: '#6b21a8'},
  surprise: { color: '#fb923c', bg: '#fff7ed', text: '#9a3412'},
  disgust:  { color: '#16a34a', bg: '#f0fdf4', text: '#14532d'},
  neutral:  { color: '#9ca3af', bg: '#f9fafb', text: '#374151'},
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

  const [activeTab, setActiveTab] = useState('analyze');
  const [history, setHistory] = useState([]);

  //load history from localeStorage
  useEffect(() => {
    const saved = localStorage.getItem('emotion_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  //save history to LS 
  useEffect(() => {
    localStorage.setItem('emotion_history', JSON.stringify(history));
  }, [history]);


  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result); 
    reader.readAsDataURL(file);
    setResult(null);
    setHeatmap(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const blob = await (await fetch(preview)).blob();
      const form = new FormData();
      form.append('image', blob);

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

  const saveToHistory = () => {
    if (!result) return;
    const entry = {
      id: Date.now(),
      image: preview,
      emotion: result.emotion,
      confidence: result.confidence,
      date: new Date().toLocaleDateString()
    };
    setHistory([entry, ...history]);
    alert("Saved to History!");
  };

  const deleteFromHistory = (id) => {
    setHistory(history.filter(item => item.id !== id));
  };

  const sortedScores = result
    ? Object.entries(result.scores).sort((a, b) => b[1] - a[1])
    : [];

  const meta = result ? (EMOTION_META[result.emotion] || EMOTION_META.neutral) : null;

  const renderAnalyze = () => (
       <div>
        <div className="em-card">
           <p style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', margin: '0 150px 4px' }}>
            Facial emotion detector
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
                <p className="em-upload-sub">JPG, PNG </p>
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
        <button className="em-save-btn" style={{ margin: '10px 230px 4px' }} onClick={saveToHistory}>Add to History</button>

        {result && meta && (
          <div className="em-card">
            <div className="em-result-header">
              <p className="em-section-label">Results</p>
            </div>
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

            <p className="em-section-label">All emotions procentage</p>
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

            {/* Grad-CAM heatmap */}
            <div className="em-heatmap-section">
              <div className="em-heatmap-row">
                <div>
                  <p className="em-heatmap-title">Heatmap</p>
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
                    <span className="em-legend-label">Areas the model focused on most</span>
                    <span className="em-legend-dot" style={{ background: '#3b82f6', marginLeft: '8px' }} />
                    <span className="em-legend-label">Areas the model focused on less</span>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </div>
  );

  const renderHistory = () => (
    <div className="em-history-grid">
      {Object.keys(EMOTION_META).map(emotionKey => (
        <div key={emotionKey} className="em-history-column">
          <div className="em-column-header" style={{ color: EMOTION_META[emotionKey].color }}>
            {EMOTION_META[emotionKey].emoji} {emotionKey}
          </div>
          <div className="em-column-items">
            {history.filter(item => item.emotion === emotionKey).map(item => (
              <div key={item.id} className="em-history-card">
                <img src={item.image} alt="history" />
                <button className="em-delete-btn" onClick={() => deleteFromHistory(item.id)}>×</button>
                <div className="em-history-info">{item.confidence}%</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="em-page">
      <div className="em-nav-container">
        <div className="em-tabs">
          <button className={`em-tab ${activeTab === 'analyze' ? 'active' : ''}`} 
          onClick={() => setActiveTab('analyze')}>Analyze</button>
          <button className={`em-tab ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => setActiveTab('history')}>History ({history.length})</button>
        </div>
      </div>

      <div className={`em-container ${activeTab === 'analyze' ? 'em-narrow' : 'em-wide'}`}>
        {activeTab === 'analyze' ? renderAnalyze() : renderHistory()}
      </div>
    </div>
  );
}
 

