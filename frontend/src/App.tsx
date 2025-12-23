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
import { diagramApi } from './lib/api';
import type { Diagram } from './lib/api';
import { useCollaboration } from './hooks/useCollaboration';
import { RemoteCursors } from './components/RemoteCursors';
import { UserPresence } from './components/UserPresence';
import { ShareDialog } from './components/ShareDialog';
import { AccountMenu } from './components/AccountMenu';
import { PricingPage } from './components/PricingPage';

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
  const [showShareDialog, setShowShareDialog] = useState(false);
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

  const handleTokenRegenerated = (newToken: string) => {
    if (diagram) {
      setDiagram({ ...diagram, shareToken: newToken });
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
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select or create a diagram to get started
      </div>
    );
  }

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 relative"
      onMouseMove={handleMouseMove}
    >
      {diagram && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded shadow-md z-10 text-sm font-semibold text-gray-800 flex items-center gap-3">
          <span>{diagram.title}</span>
          {(diagram.userRole === 'owner' || diagram.userRole === 'editor') && (
            <button
              onClick={() => setShowShareDialog(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Share
            </button>
          )}
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
      {showShareDialog && diagram && (
        <ShareDialog
          diagramId={diagram.id}
          shareToken={diagram.shareToken}
          onClose={() => setShowShareDialog(false)}
          onTokenRegenerated={handleTokenRegenerated}
        />
      )}
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
  const [showPricing, setShowPricing] = useState(false);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');

    if (shareToken && user) {
      diagramApi.getByShareToken(shareToken)
        .then((diagram) => {
          setCurrentDiagramId(diagram.id);
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch((err) => {
          console.error('Failed to load shared diagram:', err);
          alert('Failed to load shared diagram. The link may be invalid or expired.');
        });
    }
  }, [user]);

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
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="h-[60px] bg-blue-600 text-white flex items-center justify-between px-8 shadow-md">
        <h1 className="m-0 text-xl font-bold">C4 Diagram Tool</h1>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <button
                onClick={() => setShowDiagramList(true)}
                className="px-4 py-2 bg-white/20 text-white rounded font-semibold text-sm hover:bg-white/30 transition-colors"
              >
                My Diagrams
              </button>
              <AccountMenu onUpgradeClick={() => setShowPricing(true)} />
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
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
      {showPricing && <PricingPage onClose={() => setShowPricing(false)} />}
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
