import { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

export type C4NodeType = 'person' | 'softwareSystem' | 'container' | 'component';

export interface C4NodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  type: C4NodeType;
}

interface C4NodeProps {
  id: string;
  data: C4NodeData;
}

const nodeStyles: Record<C4NodeType, { background: string; border: string }> = {
  person: { background: '#08427b', border: '#052e56' },
  softwareSystem: { background: '#1168bd', border: '#0b4884' },
  container: { background: '#438dd5', border: '#2e6295' },
  component: { background: '#85bbf0', border: '#5a9bd4' },
};

const nodeLabels: Record<C4NodeType, string> = {
  person: 'Person',
  softwareSystem: 'Software System',
  container: 'Container',
  component: 'Component',
};

export function C4Node({ id, data }: C4NodeProps) {
  const style = nodeStyles[data.type];
  const { setNodes } = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);
  const [descriptionValue, setDescriptionValue] = useState(data.description || '');

  const updateNodeData = useCallback((newData: Partial<C4NodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [id, setNodes]);

  const handleLabelDoubleClick = () => {
    setIsEditingLabel(true);
  };

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    if (labelValue !== data.label) {
      updateNodeData({ label: labelValue });
    }
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelBlur();
    } else if (e.key === 'Escape') {
      setLabelValue(data.label);
      setIsEditingLabel(false);
    }
  };

  const handleDescriptionDoubleClick = () => {
    setIsEditingDescription(true);
  };

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false);
    if (descriptionValue !== (data.description || '')) {
      updateNodeData({ description: descriptionValue || undefined });
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDescriptionBlur();
    } else if (e.key === 'Escape') {
      setDescriptionValue(data.description || '');
      setIsEditingDescription(false);
    }
  };

  return (
    <div
      style={{
        padding: '16px 24px',
        borderRadius: data.type === 'person' ? '50% 50% 8px 8px' : '8px',
        background: style.background,
        border: `2px solid ${style.border}`,
        color: 'white',
        minWidth: '150px',
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px' }}>
        [{nodeLabels[data.type]}]
      </div>
      
      {isEditingLabel ? (
        <input
          type="text"
          value={labelValue}
          onChange={(e) => setLabelValue(e.target.value)}
          onBlur={handleLabelBlur}
          onKeyDown={handleLabelKeyDown}
          autoFocus
          style={{
            fontWeight: 'bold',
            marginBottom: '4px',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '4px',
            color: 'white',
            textAlign: 'center',
            width: '100%',
            padding: '2px 4px',
            fontSize: 'inherit',
          }}
        />
      ) : (
        <div
          style={{ fontWeight: 'bold', marginBottom: '4px', cursor: 'text' }}
          onDoubleClick={handleLabelDoubleClick}
        >
          {data.label}
        </div>
      )}

      {isEditingDescription ? (
        <input
          type="text"
          value={descriptionValue}
          onChange={(e) => setDescriptionValue(e.target.value)}
          onBlur={handleDescriptionBlur}
          onKeyDown={handleDescriptionKeyDown}
          autoFocus
          placeholder="Add description..."
          style={{
            fontSize: '12px',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '4px',
            color: 'white',
            textAlign: 'center',
            width: '100%',
            padding: '2px 4px',
          }}
        />
      ) : (
        <div
          style={{ fontSize: '12px', opacity: 0.9, cursor: 'text', minHeight: '18px' }}
          onDoubleClick={handleDescriptionDoubleClick}
        >
          {data.description || <span style={{ opacity: 0.5 }}>Double-click to add description</span>}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
