import { useState, useEffect } from 'react';
import { diagramApi } from '../lib/api';
import type { Diagram } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionBanner } from './SubscriptionBanner';
import { PricingPage } from './PricingPage';

interface DiagramListProps {
  onSelectDiagram: (diagramId: string) => void;
  onClose: () => void;
}

export function DiagramList({ onSelectDiagram, onClose }: DiagramListProps) {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDiagramTitle, setNewDiagramTitle] = useState('');
  const [showPricing, setShowPricing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadDiagrams();
  }, []);

  const loadDiagrams = async () => {
    try {
      setIsLoading(true);
      const data = await diagramApi.list();
      setDiagrams(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load diagrams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiagramTitle.trim()) return;

    try {
      const newDiagram = await diagramApi.create(newDiagramTitle, {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      });
      setShowCreateModal(false);
      setNewDiagramTitle('');
      onSelectDiagram(newDiagram.id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create diagram';
      setError(errorMessage);
      
      // If it's a limit error, show pricing modal
      if (errorMessage.includes('limit') || errorMessage.includes('Upgrade')) {
        setShowCreateModal(false);
        setShowPricing(true);
      }
    }
  };

  const handleDeleteDiagram = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this diagram?')) return;

    try {
      await diagramApi.delete(id);
      setDiagrams(diagrams.filter(d => d.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete diagram');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-8 w-[600px] max-w-[90%] max-h-[80vh] overflow-auto relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="m-0 text-2xl font-bold text-gray-800">
            Your Diagrams
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + New Diagram
          </button>
        </div>

        <SubscriptionBanner onUpgradeClick={() => setShowPricing(true)} />

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-gray-500">
            Loading diagrams...
          </div>
        ) : diagrams.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No diagrams yet. Create your first one!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                onClick={() => onSelectDiagram(diagram.id)}
                className="p-4 border border-gray-300 rounded cursor-pointer transition-all flex justify-between items-center hover:bg-gray-50 hover:border-blue-600"
              >
                <div>
                  <div className="font-semibold text-base text-gray-800 mb-1">
                    {diagram.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {diagram.userRole && (
                      <span className={`inline-block px-2 py-0.5 rounded mr-2 text-[11px] font-semibold ${
                        diagram.userRole === 'owner' ? 'bg-blue-100 text-blue-700' :
                        diagram.userRole === 'editor' ? 'bg-orange-100 text-orange-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {diagram.userRole.toUpperCase()}
                      </span>
                    )}
                    Updated {new Date(diagram.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                {diagram.userRole === 'owner' && (
                  <button
                    onClick={(e) => handleDeleteDiagram(diagram.id, e)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-gray-400 hover:text-gray-600"
        >
          ×
        </button>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]">
            <div className="bg-white rounded-lg p-6 w-[400px] max-w-[90%]">
              <h3 className="m-0 mb-4 text-lg font-semibold text-gray-800">
                Create New Diagram
              </h3>
              <form onSubmit={handleCreateDiagram}>
                <input
                  type="text"
                  value={newDiagramTitle}
                  onChange={(e) => setNewDiagramTitle(e.target.value)}
                  placeholder="Diagram title"
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewDiagramTitle('');
                    }}
                    className="px-4 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {showPricing && (
        <PricingPage onClose={() => setShowPricing(false)} />
      )}
    </div>
  );
}
