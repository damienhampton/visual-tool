import { useCallback, useRef, useEffect, useState } from 'react';
import type { DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { DiagramList } from './components/DiagramList';
import { Sidebar } from './components/Sidebar';
import { C4Node } from './components/nodes/C4Node';
import type { C4NodeType, C4NodeData } from './components/nodes/C4Node';
import { diagramApi, Diagram } from './lib/api';
import { useCollaboration } from './hooks/useCollaboration';
import { RemoteCursors } from './components/RemoteCursors';
import { UserPresence } from './components/UserPresence';

const nodeTypes = {
  c4Node: C4Node,
};

const defaultLabels: Record<C4NodeType, string> = {
  person: 'New Person',
  softwareSystem: 'New System',
  container: 'New Container',
  component: 'New Component',
};

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

interface FlowProps {
  diagramId: string | null;
}

function Flow({ diagramId }: FlowProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { user } = useAuth();
  const { isConnected, activeUsers, myColor, sendCursorPosition } = useCollaboration({
    diagramId,
  });

  useEffect(() => {
    if (diagramId) {
      loadDiagram(diagramId);
    }
  }, [diagramId]);

  const loadDiagram = async (id: string) => {
    try {
      const data = await diagramApi.get(id);
      setDiagram(data);
      if (data.currentVersion) {
        setNodes(data.currentVersion.data.nodes || []);
        setEdges(data.currentVersion.data.edges || []);
      }
    } catch (error) {
      console.error('Failed to load diagram:', error);
    }
  };

  const saveDiagram = useCallback(async () => {
    if (!diagramId) return;
    try {
      await diagramApi.update(diagramId, {
        data: {
          nodes,
          edges,
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      });
    } catch (error) {
      console.error('Failed to save diagram:', error);
    }
  }, [diagramId, nodes, edges]);

  useEffect(() => {
    if (diagramId && nodes.length > 0) {
      const timeoutId = setTimeout(saveDiagram, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, diagramId, saveDiagram]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      sendCursorPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    },
    [sendCursorPosition]
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/c4-node-type') as C4NodeType;
      if (!type || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: getNodeId(),
        type: 'c4Node',
        position,
        data: {
          label: defaultLabels[type],
          type,
        } as C4NodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  if (!diagramId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        Select or create a diagram to get started
      </div>
    );
  }

  return (
    <div 
      ref={reactFlowWrapper} 
      style={{ flex: 1, position: 'relative' }}
      onMouseMove={handleMouseMove}
    >
      {diagram && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10,
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#333',
        }}>
          {diagram.title}
        </div>
      )}
      {user && (
        <UserPresence
          users={activeUsers}
          myColor={myColor}
          myName={user.name}
          isConnected={isConnected}
        />
      )}
      <RemoteCursors users={activeUsers} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiagramList, setShowDiagramList] = useState(false);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true);
    }
  }, [isLoading, user]);

  const handleSelectDiagram = (diagramId: string) => {
    setCurrentDiagramId(diagramId);
    setShowDiagramList(false);
  };

  if (isLoading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '18px', color: '#999' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        height: '60px',
        background: '#1168bd',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>C4 Diagram Tool</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <>
              <button
                onClick={() => setShowDiagramList(true)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                My Diagrams
              </button>
              <span style={{ fontSize: '14px' }}>{user.name}</span>
              <button
                onClick={logout}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        <Sidebar />
        <ReactFlowProvider>
          <Flow diagramId={currentDiagramId} />
        </ReactFlowProvider>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showDiagramList && (
        <DiagramList
          onSelectDiagram={handleSelectDiagram}
          onClose={() => setShowDiagramList(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
