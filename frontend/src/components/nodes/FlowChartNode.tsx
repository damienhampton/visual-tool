import { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

export type FlowChartType = 'start' | 'end' | 'process' | 'decision' | 'input' | 'output' | 'document';

export interface FlowChartNodeData extends Record<string, unknown> {
  label: string;
  flowType: FlowChartType;
}

interface FlowChartNodeProps {
  id: string;
  data: FlowChartNodeData;
}

const flowStyles: Record<FlowChartType, { background: string; border: string }> = {
  start: { background: '#22c55e', border: '#16a34a' },
  end: { background: '#ef4444', border: '#dc2626' },
  process: { background: '#3b82f6', border: '#2563eb' },
  decision: { background: '#f59e0b', border: '#d97706' },
  input: { background: '#8b5cf6', border: '#7c3aed' },
  output: { background: '#06b6d4', border: '#0891b2' },
  document: { background: '#64748b', border: '#475569' },
};

export function FlowChartNode({ id, data }: FlowChartNodeProps) {
  const style = flowStyles[data.flowType];
  const { setNodes } = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);

  const updateNodeData = useCallback((newData: Partial<FlowChartNodeData>) => {
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

  const getShapeStyle = () => {
    const baseStyle = {
      background: style.background,
      border: `2px solid ${style.border}`,
      color: 'white',
      minWidth: '140px',
      minHeight: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative' as const,
    };

    switch (data.flowType) {
      case 'start':
      case 'end':
        return { ...baseStyle, borderRadius: '40px' };
      case 'decision':
        return { ...baseStyle, transform: 'rotate(45deg)', minWidth: '100px', minHeight: '100px' };
      case 'input':
        return { ...baseStyle, clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' };
      case 'output':
        return { ...baseStyle, clipPath: 'polygon(0% 0%, 90% 0%, 100% 100%, 10% 100%)' };
      case 'document':
        return { ...baseStyle, borderRadius: '8px 8px 0 0', clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)' };
      default:
        return { ...baseStyle, borderRadius: '8px' };
    }
  };

  const renderContent = () => {
    if (data.flowType === 'decision') {
      return (
        <div style={{
          transform: 'rotate(-45deg)',
          fontWeight: 'bold',
          fontSize: '14px',
          textAlign: 'center',
        }}>
          {isEditingLabel ? (
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeyDown}
              autoFocus
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: '4px',
                color: 'white',
                textAlign: 'center',
                width: '100%',
                padding: '4px',
                fontSize: 'inherit',
              }}
            />
          ) : (
            <div onDoubleClick={handleLabelDoubleClick} style={{ cursor: 'text' }}>
              {data.label}
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
        {isEditingLabel ? (
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            autoFocus
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '4px',
              color: 'white',
              textAlign: 'center',
              width: '100%',
              padding: '4px',
              fontSize: 'inherit',
            }}
          />
        ) : (
          <div onDoubleClick={handleLabelDoubleClick} style={{ cursor: 'text' }}>
            {data.label}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <Handle type="target" position={Position.Top} />
      <div style={getShapeStyle()}>
        {renderContent()}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
