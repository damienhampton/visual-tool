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
import { BasicShapeNode } from './components/nodes/BasicShapeNode';
import type { BasicShapeType, BasicShapeNodeData } from './components/nodes/BasicShapeNode';
import { FlowChartNode } from './components/nodes/FlowChartNode';
import type { FlowChartType, FlowChartNodeData } from './components/nodes/FlowChartNode';
import { diagramApi } from './lib/api';
import type { Diagram } from './lib/api';
import { useCollaboration } from './hooks/useCollaboration';
import { RemoteCursors } from './components/RemoteCursors';
import { UserPresence } from './components/UserPresence';
import { ShareDialog } from './components/ShareDialog';
import { AccountMenu } from './components/AccountMenu';
import { PricingPage } from './components/PricingPage';
import { ResetPassword } from './components/ResetPassword';

const nodeTypes = {
  c4Node: C4Node,
  basicShapeNode: BasicShapeNode,
  flowChartNode: FlowChartNode,
};

const defaultLabels: Record<C4NodeType, string> = {
  person: 'New Person',
  softwareSystem: 'New System',
  container: 'New Container',
  component: 'New Component',
};

const basicShapeLabels: Record<BasicShapeType, string> = {
  square: 'Square',
  circle: 'Circle',
  triangle: 'Triangle',
  diamond: 'Diamond',
  star: 'Star',
  hexagon: 'Hexagon',
};

const flowChartLabels: Record<FlowChartType, string> = {
  start: 'Start',
  end: 'End',
  process: 'Process',
  decision: 'Decision',
  input: 'Input',
  output: 'Output',
  document: 'Document',
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
  const canEditRef = useRef(false);
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
      canEditRef.current = data.userRole === 'owner' || data.userRole === 'editor';
      if (data.currentVersion) {
        const loadedNodes = data.currentVersion.data.nodes || [];
        setNodes(loadedNodes);
        setEdges(data.currentVersion.data.edges || []);
        
        // Update nodeId counter to avoid ID collisions
        loadedNodes.forEach((node: Node) => {
          const match = node.id.match(/^node_(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num >= nodeId) {
              nodeId = num + 1;
            }
          }
        });
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

  useEffect(() => {
    if (!diagramId || !canEditRef.current) return;
    
    const timeoutId = setTimeout(async () => {
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
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, diagramId]);

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

      const nodeType = event.dataTransfer.getData('application/node-type');
      const paletteType = event.dataTransfer.getData('application/palette-type');
      
      if (!nodeType || !paletteType || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      let newNode: Node;

      if (paletteType === 'c4') {
        const c4Type = nodeType as C4NodeType;
        newNode = {
          id: getNodeId(),
          type: 'c4Node',
          position,
          data: {
            label: defaultLabels[c4Type],
            type: c4Type,
          } as C4NodeData,
        };
      } else if (paletteType === 'basicShapes') {
        const shapeType = nodeType as BasicShapeType;
        newNode = {
          id: getNodeId(),
          type: 'basicShapeNode',
          position,
          data: {
            label: basicShapeLabels[shapeType],
            shapeType,
          } as BasicShapeNodeData,
        };
      } else if (paletteType === 'flowChart') {
        const flowType = nodeType as FlowChartType;
        newNode = {
          id: getNodeId(),
          type: 'flowChartNode',
          position,
          data: {
            label: flowChartLabels[flowType],
            flowType,
          } as FlowChartNodeData,
        };
      } else {
        return;
      }

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
  const { user, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiagramList, setShowDiagramList] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    const token = params.get('token');

    if (token) {
      setResetToken(token);
      window.history.replaceState({}, '', window.location.pathname);
    }

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
        <h1 className="m-0 text-xl font-bold">Visual Diagram Tool</h1>
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
      {resetToken && (
        <ResetPassword
          token={resetToken}
          onClose={() => setResetToken(null)}
          onSuccess={() => {
            setResetToken(null);
            setShowResetSuccess(true);
            setTimeout(() => {
              setShowResetSuccess(false);
              setShowAuthModal(true);
            }, 2000);
          }}
        />
      )}
      {showResetSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Password reset successfully! Please login with your new password.
        </div>
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
