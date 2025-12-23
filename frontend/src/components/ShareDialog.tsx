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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-8 w-[500px] max-w-[90%]">
        <h2 className="m-0 mb-4 text-2xl font-bold text-gray-800">
          Share Diagram
        </h2>

        <p className="m-0 mb-4 text-sm text-gray-600">
          Anyone with this link can view and edit this diagram. They'll be added as a viewer automatically.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-100"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 text-white rounded text-sm font-semibold min-w-[80px] transition-colors ${
              copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex gap-2 justify-between items-center">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate Link'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
          <strong>Note:</strong> Regenerating the link will invalidate the old one. Anyone using the old link will lose access.
        </div>
      </div>
    </div>
  );
}
