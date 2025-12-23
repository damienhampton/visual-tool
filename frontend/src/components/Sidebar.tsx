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
    <aside className="w-[220px] p-5 bg-gray-100 border-r border-gray-300 flex flex-col gap-2.5">
      <h3 className="m-0 mb-2 text-sm font-semibold text-gray-800">
        C4 Elements
      </h3>
      {c4Elements.map((element) => (
        <div
          key={element.type}
          draggable
          onDragStart={(e) => onDragStart(e, element.type)}
          className="p-3 text-white rounded cursor-grab text-sm text-center font-medium hover:opacity-90 transition-opacity"
          style={{ background: element.color }}
        >
          {element.label}
        </div>
      ))}
    </aside>
  );
}
