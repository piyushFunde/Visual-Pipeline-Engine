import { Position } from 'reactflow';
import { createNode } from './createNode';

export const ConditionNode = createNode({
  label: 'Condition',
  description: 'Branch your workflow using a conditional expression',
  fields: [
    {
      name: 'expression',
      label: 'Expression',
      type: 'text',
      defaultValue: 'x > 0',
    },
  ],
  handles: [
    { type: 'target', position: Position.Left, id: 'input' },
    { type: 'source', position: Position.Right, id: 'true', style: { top: '30%' } },
    { type: 'source', position: Position.Right, id: 'false', style: { top: '70%' } },
  ],
});
