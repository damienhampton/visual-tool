import { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

export type BasicShapeType = 'square' | 'circle' | 'triangle' | 'star' | 'diamond' | 'hexagon';

export interface BasicShapeNodeData extends Record<string, unknown> {
  label: string;
  shapeType: BasicShapeType;
}

interface BasicShapeNodeProps {
  id: string;
  data: BasicShapeNodeData;
}

const shapeStyles: Record<BasicShapeType, { background: string; border: string }> = {
  square: { background: '#6366f1', border: '#4f46e5' },
  circle: { background: '#ec4899', border: '#db2777' },
  triangle: { background: '#f59e0b', border: '#d97706' },
  star: { background: '#8b5cf6', border: '#7c3aed' },
  diamond: { background: '#10b981', border: '#059669' },
  hexagon: { background: '#06b6d4', border: '#0891b2' },
};

export function BasicShapeNode({ id, data }: BasicShapeNodeProps) {
  const style = shapeStyles[data.shapeType];
  const { setNodes } = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);

  const updateNodeData = useCallback((newData: Partial<BasicShapeNodeData>) => {
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
      minWidth: '120px',
      minHeight: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative' as const,
    };

    switch (data.shapeType) {
      case 'circle':
        return { ...baseStyle, borderRadius: '50%' };
      case 'triangle':
        return {
          width: 0,
          height: 0,
          borderLeft: '60px solid transparent',
          borderRight: '60px solid transparent',
          borderBottom: `120px solid ${style.background}`,
          position: 'relative' as const,
          minWidth: 0,
          minHeight: 0,
        };
      case 'diamond':
        return { ...baseStyle, transform: 'rotate(45deg)', borderRadius: '8px' };
      case 'star':
        return { ...baseStyle, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
      case 'hexagon':
        return { ...baseStyle, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
      default:
        return { ...baseStyle, borderRadius: '8px' };
    }
  };

  const renderContent = () => {
    if (data.shapeType === 'triangle') {
      return (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
          textAlign: 'center',
          width: '100px',
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
                background: 'rgba(0,0,0,0.3)',
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

    if (data.shapeType === 'diamond') {
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
                width: '80px',
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
              width: '80px',
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
      {data.shapeType === 'triangle' ? (
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <div style={getShapeStyle()} />
          {renderContent()}
        </div>
      ) : (
        <div style={getShapeStyle()}>
          {renderContent()}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
