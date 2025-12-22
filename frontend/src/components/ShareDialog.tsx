import { useState } from 'react';
import { diagramApi } from '../lib/api';

interface ShareDialogProps {
  diagramId: string;
  shareToken: string;
  onClose: () => void;
  onTokenRegenerated: (newToken: string) => void;
}

export function ShareDialog({ diagramId, shareToken, onClose, onTokenRegenerated }: ShareDialogProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}?share=${shareToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('This will invalidate the current link. Continue?')) return;

    setIsRegenerating(true);
    try {
      const response = await diagramApi.regenerateShareToken(diagramId);
      onTokenRegenerated(response.shareToken);
    } catch (err) {
      console.error('Failed to regenerate token:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '32px',
        width: '500px',
        maxWidth: '90%',
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', color: '#333' }}>
          Share Diagram
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
          Anyone with this link can view and edit this diagram. They'll be added as a viewer automatically.
        </p>

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
        }}>
          <input
            type="text"
            value={shareUrl}
            readOnly
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              background: '#f5f5f5',
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 16px',
              background: copied ? '#4caf50' : '#1168bd',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              minWidth: '80px',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            style={{
              padding: '8px 16px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRegenerating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: isRegenerating ? 0.6 : 1,
            }}
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate Link'}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Close
          </button>
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#1976d2',
        }}>
          <strong>Note:</strong> Regenerating the link will invalidate the old one. Anyone using the old link will lose access.
        </div>
      </div>
    </div>
  );
}
