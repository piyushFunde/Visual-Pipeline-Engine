import { Position } from 'reactflow';
import { createNode } from './createNode';

export const OutputNode = createNode({
  label: 'Output',
  description: 'Collect the final result from your workflow',
  fields: [
    {
      name: 'outputName',
      label: 'Name',
      type: 'text',
      defaultValue: 'output_0',
    },
    {
      name: 'outputType',
      label: 'Type',
      type: 'select',
      defaultValue: 'Text',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'Image', value: 'File' },
      ],
    },
  ],
  handles: [{ type: 'target', position: Position.Left, id: 'value' }],
});
