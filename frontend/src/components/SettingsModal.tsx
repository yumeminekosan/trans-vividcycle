import { useState } from 'react';

interface SettingsModalProps {
  apiUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

function SettingsModal({ apiUrl, onSave, onClose }: SettingsModalProps) {
  const [url, setUrl] = useState(apiUrl);

  const handleSave = () => {
    localStorage.setItem('api_url', url);
    onSave(url);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Settings</h2>
        
        <div className="form-group">
          <label>Backend API URL:</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:3000"
          />
        </div>

        <p className="hint">
          Default: http://localhost:3000<br/>
          For local testing, run: docker-compose up
        </p>

        <button onClick={handleSave}>Save</button>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
    </div>
  );
}

export default SettingsModal;