import { useState, useEffect } from 'react';
import { diagramApi } from '../lib/api';
import type { Diagram } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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
      setError(err.response?.data?.message || 'Failed to create diagram');
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
        width: '600px',
        maxWidth: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
            Your Diagrams
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 16px',
              background: '#1168bd',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            + New Diagram
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee',
            color: '#c33',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Loading diagrams...
          </div>
        ) : diagrams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No diagrams yet. Create your first one!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                onClick={() => onSelectDiagram(diagram.id)}
                style={{
                  padding: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#1168bd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#ddd';
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333', marginBottom: '4px' }}>
                    {diagram.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {diagram.userRole && (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: diagram.userRole === 'owner' ? '#e3f2fd' : diagram.userRole === 'editor' ? '#fff3e0' : '#f3e5f5',
                        color: diagram.userRole === 'owner' ? '#1976d2' : diagram.userRole === 'editor' ? '#f57c00' : '#7b1fa2',
                        borderRadius: '4px',
                        marginRight: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}>
                        {diagram.userRole.toUpperCase()}
                      </span>
                    )}
                    Updated {new Date(diagram.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                {diagram.userRole === 'owner' && (
                  <button
                    onClick={(e) => handleDeleteDiagram(diagram.id, e)}
                    style={{
                      padding: '6px 12px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
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
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999',
          }}
        >
          ×
        </button>

        {showCreateModal && (
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
            zIndex: 1001,
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '400px',
              maxWidth: '90%',
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
                Create New Diagram
              </h3>
              <form onSubmit={handleCreateDiagram}>
                <input
                  type="text"
                  value={newDiagramTitle}
                  onChange={(e) => setNewDiagramTitle(e.target.value)}
                  placeholder="Diagram title"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    marginBottom: '16px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewDiagramTitle('');
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#f5f5f5',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      background: '#1168bd',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
