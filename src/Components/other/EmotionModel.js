import React, { useState, useRef, useEffect } from 'react';
import './EmotionModel.css';


const EMOTION_META = {
  happy:    { color: '#DAA520', bg: '#fefce8', text: '#854d0e'},
  sad:      { color: '#60a5fa', bg: '#eff6ff', text: '#1e40af'},
  angry:    { color: '#ef4444', bg: '#fef2f2', text: '#991b1b'},
  fear:     { color: '#a855f7', bg: '#faf5ff', text: '#6b21a8'},
  surprise: { color: '#fb923c', bg: '#fff7ed', text: '#9a3412'},
  disgust:  { color: '#16a34a', bg: '#f0fdf4', text: '#14532d'},
  neutral:  { color: '#57615A', bg: '#f9fafb', text: '#374151'},
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

  const [isServerOnline, setIsServerOnline] = useState(false);
  const [expandedTip, setExpandedTip] = useState(null);

  const [statsSubTab, setStatsSubTab] = useState('summary');
  const [batchFiles, setBatchFiles] = useState([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [labHistory, setLabHistory] = useState([]);

  const [userPrediction, setUserPrediction] = useState('neutral');
  
  useEffect(() => {
    const saved = localStorage.getItem('emotion_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  
  useEffect(() => {
    localStorage.setItem('emotion_history', JSON.stringify(history));
  }, [history]);

  // live server check
  useEffect(() => {
  const checkServer = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/predict', { method: 'OPTIONS' });
      setIsServerOnline(true);
    } catch {
      setIsServerOnline(false);
    }
  };
  checkServer();
  const interval = setInterval(checkServer, 5000); 
  return () => clearInterval(interval);
  }, []);

  const tips = [
    { id: 1, title: "Lighting", desc: "Lights from the front or natural light give the best results. Avoid heavy shadows." },
    { id: 2, title: "Position", desc: "Keep the face within the center. Keep the face as main focus of the image. The background elements should be minimal." },
    { id: 3, title: "Expression", desc: "Exaggerated expressions are easier for the AI to add in categories." }
  ];

  
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




  const handleBatchUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsBatchLoading(true);
    const batchResults = []; 
  
    for (const file of files) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise(resolve => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        const previewBase64 = await base64Promise;
        
        const blob = await (await fetch(previewBase64)).blob();
        const form = new FormData();
        form.append('image', blob);
        form.append('is_batch', 'true');
  
        const res = await fetch('http://127.0.0.1:5000/predict', { method: 'POST', body: form });
        const data = await res.json();
        
        batchResults.push({
          id: Date.now() + Math.random(),
          image: previewBase64,
          emotion: data.emotion,
          confidence: data.confidence || 0
        });
      } catch (err) {
        console.error("Batch item error:", err);
      }
    }
    
    setLabHistory(batchResults);
    setIsBatchLoading(false);
  };


  
  const renderStats = () => {
    const validHistory = history.filter(item => item.userLabel);
    const totalValid = validHistory.length;

    const matches = validHistory.reduce((acc, item) => {
      return acc + (item.emotion === item.userLabel ? 1 : 0);
    }, 0);

    const Accuracy = totalValid > 0 ? (matches / totalValid) * 100 : 0;
    const totalSummary = history.length;
    // separat analisis
    const totalLab = labHistory.length;
    const labScores = labHistory.map(item => item.confidence);
    const labMean = totalLab > 0 ? labScores.reduce((a, b) => a + b, 0) / totalLab : 0;
    const labStdDev = totalLab > 0 ? Math.sqrt(labScores.map(x => Math.pow(x - labMean, 2)).reduce((a, b) => a + b, 0) / totalLab) : 0;
    const labSE = totalLab > 0 ? labStdDev / Math.sqrt(totalLab) : 0;



   
    const stats = Object.keys(EMOTION_META).map(key => {
      const count = history.filter(item => item.emotion === key).length;
      const percentage = totalSummary > 0 ? Math.round((count / totalSummary) * 100) : 0;
      return { key, count, percentage, ...EMOTION_META[key] };
    }).sort((a, b) => b.count - a.count);
  
    return (
      <div className="em-stats-view">
        <div className="em-stats-nav">
          <button className={`em-sub-tab ${statsSubTab === 'summary' ? 'active' : ''}`} onClick={() => setStatsSubTab('summary')}>Overview</button>
          <button className={`em-sub-tab ${statsSubTab === 'reliability' ? 'active' : ''}`} onClick={() => setStatsSubTab('reliability')}>Batch Analysis</button>
        </div>
  
        {statsSubTab === 'summary' && (
          <div className="animate-in">
            <div className="em-stats-header">
              <div className="em-stat-main-card">
                <span className="em-stat-label">Total analysed</span>
                <span className="em-stat-value">{totalSummary}</span>
              </div>
              <div className="em-stat-main-card">
                <span className="em-stat-label">Top emotion</span>
                <span className="em-stat-value" style={{ color: stats[0].color }}>{stats[0].key}</span>
              </div>
              <div className="em-stat-main-card">
                 <span className="em-stat-label">Score:</span>
                 <div className="em-stat-value">
                    {matches} / {totalValid} 
                    <span style={{ fontSize: '16px', fontWeight: '500', marginLeft: '8px'}}>  Correct</span>
                </div>
              </div>
              <div className="em-stat-main-card">
                  <span className="em-stat-label">Accuracy:</span>
                  <span className="em-stat-value" style={{ color: Accuracy > 70 ? '#10b981' : '#f59e0b' }}>
                {Accuracy.toFixed(1)}%</span>
              </div>
            </div>
            <div className="em-stats-body">
              <p className="em-stat-label" style={{marginBottom:'30px'}}>Distribution</p>
              {stats.map(s => (
                <div key={s.key} className="em-stat-row">
                  <div className="em-stat-info">
                    <span className="em-stat-name">{s.key}: {s.count}</span>
                    <span className="em-stat-percentage">{s.percentage}%</span>
                  </div>
                  <div className="em-progress-container">
                    <div className="em-progress-fill" style={{ width: `${s.percentage}%`, background: s.color }}></div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
  
        {statsSubTab === 'reliability' && (
          <div className="animate-in">
            <div className="em-card laboratory-card">
              <h3 style={{color: '#0a7e8b', marginBottom: '10px'}}>Standard Error Analysis</h3>
              <p style={{fontSize: '13px', color: '#64748b', marginBottom: '20px'}}>
                Upload a batch of images for one chosen emotion.
              </p>
              
              <div className="em-batch-upload-box">
                <input type="file" multiple accept="image/*" onChange={handleBatchUpload} id="batch-input" hidden />
                <label htmlFor="batch-input" className="em-batch-btn">
                  {isBatchLoading ? "Processing..." : "Upload images"}
                </label>
                {totalLab > 0 && (
                  <button className="em-clear-lab" onClick={() => setLabHistory([])}>Reset</button>
                )}
              </div>
  
              {totalLab > 0 ? (
                <>
                  <div className="em-se-graphic-container">
                    <p className="em-section-label">Confidence Plot (images={totalLab})</p>
                    <div className="em-plot-area">
                      <div className="em-plot-mean-line" style={{bottom: `${labMean}%`}}>
                        <span>accuracy</span>
                      </div>
                      {labHistory.map((item, idx) => (
                        <div 
                          key={item.id} 
                          className="em-plot-dot" 
                          style={{
                            left: `${(idx / (totalLab - 1 || 1)) * 100}%`,
                            bottom: `${item.confidence}%`,
                            background: EMOTION_META[item.emotion]?.color
                          }}
                          title={`${item.emotion}: ${item.confidence}%`}
                        />
                      ))}
                    </div>
                    <div className="em-plot-legend">
                      <span>Accuracy</span>
                      <span>Image Order</span>
                    </div>
                  </div>
  
                <div className="em-formula-grid">

                <div className="em-formula-step">
                  <div className="em-step-label">Accuracy</div>
                  <div className="em-step-value">{labMean.toFixed(2)}%</div>
                </div>


                <div className={`em-formula-step highlight ${labSE < 5 ? 'stable' : 'unstable'}`}>
                  <div className="em-step-label">Standard Error</div>
                  <div className="em-step-value">±{labSE.toFixed(2)}%</div>
                </div>
              </div>
                </>
              ) : (
                <div className="em-lab-placeholder">
                  Upload...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  

  
  const handleAnalyze = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const blob = await (await fetch(preview)).blob();
      const form = new FormData();
      form.append('image', blob);
      form.append('user_label', userPrediction);
      form.append('is_batch', 'true');

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
      userLabel: userPrediction,
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
        <div className="em-card" style={{marginTop:'50px'}}>
           <p style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', margin: '0 150px 4px' }}>
            Facial emotion detector
           </p>
         </div>

         <div className="em-card">
           <p className="em-section-label">1. Your Prediction</p>
            <select 
              className="em-dropdown" 
              value={userPrediction} 
              onChange={(e) => setUserPrediction(e.target.value)}
            >
              {Object.keys(EMOTION_META).map(emo => (
                <option key={emo} value={emo}>{emo.toUpperCase()}</option>
              ))}
            </select>
        </div>
         <div className="em-card">
           <p className="em-section-label">2. Upload image</p>
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
                <p className="em-upload-title">Drop image here</p>
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
        <button className="em-save-btn" style={{ margin: '10px 250px 4px' }} onClick={saveToHistory}>Add to History</button>

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
                <div key={emotion} className="em-bar-row" style={{marginRight: '32px'}} >
                  <span style={{ fontSize: '16px', width: '22px'}}></span>
                  <span className="em-bar-label" style={{ width: '68px', minWidth: '68px', display: 'inline-block' }}>{emotion}</span>
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
                    <span className="em-legend-label">More focuse</span>
                    <span className="em-legend-dot" style={{ background: '#3b82f6', marginLeft: '8px' }} />
                    <span className="em-legend-label">Less focuse</span>
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
          {history.filter(item => item.emotion === emotionKey).map(item => {
            const isMatch = item.emotion === item.userLabel;
              return (
                <div key={item.id} className="em-history-card">
                  <img src={item.image} alt="history" />
                  <button className="em-delete-btn" onClick={() => deleteFromHistory(item.id)}>×</button>
                  
                  <div className="em-history-info-box">
                    <div className="em-history-conf">{item.confidence}% confidence</div>
                    
                    {/* Human Label Validation */}
                    <div 
                      className="em-history-user-label" 
                      style={{ color: isMatch ? '#10b981' : '#ef4444' }}
                    >
                      Your Prediction: {item.userLabel}
                    </div>
                  </div>
                </div>
              );
            })}
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
          onClick={() => setActiveTab('history')}>History</button>
          <button className={`em-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}>Statistics</button>
        </div>
      </div>

      
      <div className="em-main-layout" style={{paddingTop:'50px'}}>
        {activeTab !== 'history' && (
          <div className="em-sidebar left" style={{marginTop:'30px'}}>
            <p className="em-side-title">Enhance accuracy tips:</p>
            {tips.map(tip => (
              <div 
                key={tip.id} 
                className={`em-interactive-card ${expandedTip === tip.id ? 'active' : ''}`}
                onClick={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
              >
                <div className="em-card-header">
                  <span className="em-card-bullet">• </span>
                  <span className="em-card-label">{tip.title}</span>
                </div>
                {expandedTip === tip.id && <p className="em-card-detail">{tip.desc}</p>}
              </div>
            ))}
          </div>
        )}
        
        <div className={`em-container ${activeTab === 'history' ? 'em-wide' : 'em-narrow'}`}>
        {activeTab === 'analyze' && renderAnalyze()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'stats' && renderStats()}
        </div>

        {activeTab !== 'history' && (
        <div className="em-sidebar right" style={{marginTop:'30px'}}>
          <p className="em-side-label">System Health</p>
          
          <div className={`em-status-card ${isServerOnline ? 'is-online' : 'is-offline'}`}>
            <div className="em-status-header">
              <div className={`em-indicator-dot ${isServerOnline ? 'pulse-green' : 'pulse-red'}`}></div>
              <span className="em-status-text">
                Server: **{isServerOnline ? 'ONLINE' : 'OFFLINE'}**
              </span>
            </div>
      
      <div className="em-status-body">
        <p className="em-status-description">
          {isServerOnline 
            ? "Connection made. " 
            : "No response from Flask."}
        </p>
        
        {!isServerOnline && (
          <div className="em-terminal-prompt">
            <span className="em-prompt-label">Run Command:</span>
            <code>python app.py</code>
          </div>
        )}
      </div>
    </div>

  
  </div>
  )}
  </div>
      
  </div>
);
}
 

