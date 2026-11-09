import { Position } from 'reactflow';
import { createNode } from './createNode';

export const APINode = createNode({
  label: 'API Request',
  description: 'Call an external service endpoint',
  fields: [
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      defaultValue: 'https://api.example.com',
    },
    {
      name: 'method',
      label: 'Method',
      type: 'select',
      defaultValue: 'GET',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
      ],
    },
  ],
  handles: [
    { type: 'target', position: Position.Left, id: 'trigger' },
    { type: 'source', position: Position.Right, id: 'response', style: { top: '30%' } },
    { type: 'source', position: Position.Right, id: 'error', style: { top: '70%' } },
  ],
});
