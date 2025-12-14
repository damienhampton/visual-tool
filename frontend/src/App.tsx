import { useCallback, useRef, useEffect } from 'react';
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

import { Sidebar } from './components/Sidebar';
import { C4Node } from './components/nodes/C4Node';
import type { C4NodeType, C4NodeData } from './components/nodes/C4Node';

const STORAGE_KEY = 'c4-diagram';

const nodeTypes = {
  c4Node: C4Node,
};

const defaultLabels: Record<C4NodeType, string> = {
  person: 'New Person',
  softwareSystem: 'New System',
  container: 'New Container',
  component: 'New Component',
};

interface StoredDiagram {
  nodes: Node[];
  edges: Edge[];
  nodeIdCounter: number;
}

const loadFromStorage = (): StoredDiagram | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load diagram from localStorage:', e);
  }
  return null;
};

const saveToStorage = (nodes: Node[], edges: Edge[], nodeIdCounter: number) => {
  try {
    const data: StoredDiagram = { nodes, edges, nodeIdCounter };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save diagram to localStorage:', e);
  }
};

const initialData = loadFromStorage();
let nodeId = initialData?.nodeIdCounter ?? 0;
const getNodeId = () => `node_${nodeId++}`;

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialData?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialData?.edges ?? []);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    saveToStorage(nodes, edges, nodeId);
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

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

  return (
    <div ref={reactFlowWrapper} style={{ flex: 1 }}>
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

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <Sidebar />
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
