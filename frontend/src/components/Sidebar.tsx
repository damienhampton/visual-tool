import type { DragEvent } from 'react';
import type { C4NodeType } from './nodes/C4Node';

const c4Elements: { type: C4NodeType; label: string; color: string }[] = [
  { type: 'person', label: 'Person', color: '#08427b' },
  { type: 'softwareSystem', label: 'Software System', color: '#1168bd' },
  { type: 'container', label: 'Container', color: '#438dd5' },
  { type: 'component', label: 'Component', color: '#85bbf0' },
];

export function Sidebar() {
  const onDragStart = (event: DragEvent, nodeType: C4NodeType) => {
    event.dataTransfer.setData('application/c4-node-type', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside
      style={{
        width: '200px',
        padding: '16px',
        background: '#f5f5f5',
        borderRight: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#333' }}>
        C4 Elements
      </h3>
      {c4Elements.map((element) => (
        <div
          key={element.type}
          draggable
          onDragStart={(e) => onDragStart(e, element.type)}
          style={{
            padding: '12px',
            background: element.color,
            color: 'white',
            borderRadius: '4px',
            cursor: 'grab',
            fontSize: '13px',
            textAlign: 'center',
          }}
        >
          {element.label}
        </div>
      ))}
    </aside>
  );
}
