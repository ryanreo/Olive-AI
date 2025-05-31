import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [symptoms, setSymptoms] = useState('');
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  const API_BASE_URL = 'http://localhost:5000/api';

  // Check if backend is running when app loads
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health-check`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const checkEmergency = async (symptomsText) => {
    try {
      const response = await fetch(`${API_BASE_URL}/emergency-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms: symptomsText }),
      });
      
      const data = await response.json();
      return data.is_emergency;
    } catch (err) {
      console.error('Emergency check failed:', err);
      return false;
    }
  };

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      setError('Please describe your symptoms');
      return;
    }

    setLoading(true);
    setError('');
    setAdvice('');

    try {
      // First check for emergency
      const emergency = await checkEmergency(symptoms);
      setIsEmergency(emergency);

      if (emergency) {
        setAdvice('⚠️ EMERGENCY: Your symptoms may require immediate medical attention. Please call emergency services (911) or go to the nearest emergency room immediately.');
        setLoading(false);
        return;
      }

      // Get AI analysis
      const response = await fetch(`${API_BASE_URL}/analyze-symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();

      if (data.success) {
        setAdvice(data.advice);
      } else {
        setError(data.error || 'Failed to analyze symptoms');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Error:', err);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      analyzeSymptoms();
    }
  };

  const clearAll = () => {
    setSymptoms('');
    setAdvice('');
    setError('');
    setIsEmergency(false);
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🫒 Olive</h1>
          <p className="subtitle">Your Personal Health Information Assistant</p>
          <div className={`connection-status ${backendStatus}`}>
            {backendStatus === 'checking' && '🔄 Checking connection...'}
            {backendStatus === 'connected' && '✅ Connected to backend'}
            {backendStatus === 'disconnected' && '❌ Backend disconnected - Please start Flask server'}
          </div>
        </header>

        <div className="disclaimer-box">
          <p><strong>⚠️ Medical Disclaimer:</strong> Olive provides general health information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers for medical concerns.</p>
        </div>

        <div className="input-section">
          <label htmlFor="symptoms">Describe your symptoms:</label>
          <textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., I have a headache and feel nauseous..."
            rows={4}
            disabled={loading}
          />
          
          <div className="button-group">
            <button 
              onClick={analyzeSymptoms} 
              disabled={loading || !symptoms.trim() || backendStatus !== 'connected'}
              className="analyze-btn"
            >
              {loading ? '🔄 Analyzing...' : '🔍 Analyze Symptoms'}
            </button>
            
            <button 
              onClick={clearAll} 
              className="clear-btn"
              disabled={loading}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="error-box">
            <p>❌ {error}</p>
          </div>
        )}

        {advice && (
          <div className={`advice-box ${isEmergency ? 'emergency' : ''}`}>
            <h3>{isEmergency ? '🚨 EMERGENCY ALERT' : '💡 Health Information'}</h3>
            <div className="advice-content">
              {advice.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        )}

        <footer className="footer">
          <p>Made with ❤️ for better health awareness</p>
          <p><small>Always seek professional medical advice for serious health concerns</small></p>
        </footer>
      </div>
    </div>
  );
}

export default App;