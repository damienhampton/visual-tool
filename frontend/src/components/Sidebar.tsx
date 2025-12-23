import { useState, type DragEvent } from 'react';
import type { C4NodeType } from './nodes/C4Node';
import type { BasicShapeType } from './nodes/BasicShapeNode';
import type { FlowChartType } from './nodes/FlowChartNode';

type PaletteType = 'c4' | 'basicShapes' | 'flowChart';

const c4Elements: { type: C4NodeType; label: string; color: string }[] = [
  { type: 'person', label: 'Person', color: '#08427b' },
  { type: 'softwareSystem', label: 'Software System', color: '#1168bd' },
  { type: 'container', label: 'Container', color: '#438dd5' },
  { type: 'component', label: 'Component', color: '#85bbf0' },
];

const basicShapeElements: { type: BasicShapeType; label: string; color: string }[] = [
  { type: 'square', label: 'Square', color: '#6366f1' },
  { type: 'circle', label: 'Circle', color: '#ec4899' },
  { type: 'triangle', label: 'Triangle', color: '#f59e0b' },
  { type: 'diamond', label: 'Diamond', color: '#10b981' },
  { type: 'star', label: 'Star', color: '#8b5cf6' },
  { type: 'hexagon', label: 'Hexagon', color: '#06b6d4' },
];

const flowChartElements: { type: FlowChartType; label: string; color: string }[] = [
  { type: 'start', label: 'Start/End (Oval)', color: '#22c55e' },
  { type: 'process', label: 'Process', color: '#3b82f6' },
  { type: 'decision', label: 'Decision', color: '#f59e0b' },
  { type: 'input', label: 'Input', color: '#8b5cf6' },
  { type: 'output', label: 'Output', color: '#06b6d4' },
  { type: 'document', label: 'Document', color: '#64748b' },
];

export function Sidebar() {
  const [activePalette, setActivePalette] = useState<PaletteType>('c4');

  const onDragStart = (event: DragEvent, nodeType: string, palette: PaletteType) => {
    event.dataTransfer.setData('application/node-type', nodeType);
    event.dataTransfer.setData('application/palette-type', palette);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getCurrentElements = () => {
    switch (activePalette) {
      case 'c4':
        return c4Elements;
      case 'basicShapes':
        return basicShapeElements;
      case 'flowChart':
        return flowChartElements;
    }
  };

  const getPaletteTitle = () => {
    switch (activePalette) {
      case 'c4':
        return 'C4 Elements';
      case 'basicShapes':
        return 'Basic Shapes';
      case 'flowChart':
        return 'Flow Chart';
    }
  };

  return (
    <aside className="w-[220px] p-5 bg-gray-100 border-r border-gray-300 flex flex-col gap-2.5">
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Palette
        </label>
        <select
          value={activePalette}
          onChange={(e) => setActivePalette(e.target.value as PaletteType)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white text-gray-800 font-medium cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="c4">C4 Model</option>
          <option value="basicShapes">Basic Shapes</option>
          <option value="flowChart">Flow Chart</option>
        </select>
      </div>

      <h3 className="m-0 mb-2 text-sm font-semibold text-gray-800">
        {getPaletteTitle()}
      </h3>
      
      <div className="flex flex-col gap-2.5 overflow-y-auto">
        {getCurrentElements().map((element) => (
          <div
            key={element.type}
            draggable
            onDragStart={(e) => onDragStart(e, element.type, activePalette)}
            className="p-3 text-white rounded cursor-grab text-sm text-center font-medium hover:opacity-90 transition-opacity"
            style={{ background: element.color }}
          >
            {element.label}
          </div>
        ))}
      </div>
    </aside>
  );
}
