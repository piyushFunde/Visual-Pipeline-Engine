import { Position } from 'reactflow';
import { createNode } from './createNode';

export const TimerNode = createNode({
  label: 'Timer',
  description: 'Delay execution by a selected duration',
  fields: [
    {
      name: 'delay',
      label: 'Delay (ms)',
      type: 'number',
      defaultValue: 1000,
    },
  ],
  handles: [
    { type: 'target', position: Position.Left, id: 'start' },
    { type: 'source', position: Position.Right, id: 'done' },
  ],
});
