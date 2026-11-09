import { Position } from 'reactflow';
import { createNode } from './createNode';

export const DatabaseNode = createNode({
  label: 'Database',
  description: 'Read from or write to a database collection',
  fields: [
    {
      name: 'collection',
      label: 'Collection',
      type: 'text',
      defaultValue: 'users',
    },
    {
      name: 'action',
      label: 'Action',
      type: 'select',
      defaultValue: 'Read',
      options: [
        { label: 'Read', value: 'Read' },
        { label: 'Write', value: 'Write' },
        { label: 'Update', value: 'Update' },
        { label: 'Delete', value: 'Delete' },
      ],
    },
  ],
  handles: [
    { type: 'target', position: Position.Left, id: 'trigger' },
    { type: 'source', position: Position.Right, id: 'result', style: { top: '30%' } },
    { type: 'source', position: Position.Right, id: 'error', style: { top: '70%' } },
  ],
});
