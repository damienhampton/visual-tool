import { Handle, Position } from '@xyflow/react';

export type C4NodeType = 'person' | 'softwareSystem' | 'container' | 'component';

export interface C4NodeData {
  label: string;
  description?: string;
  type: C4NodeType;
}

interface C4NodeProps {
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

export function C4Node({ data }: C4NodeProps) {
  const style = nodeStyles[data.type];

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
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {data.label}
      </div>
      {data.description && (
        <div style={{ fontSize: '12px', opacity: 0.9 }}>
          {data.description}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
