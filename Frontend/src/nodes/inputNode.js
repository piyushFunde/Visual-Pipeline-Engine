import { Position } from 'reactflow';
import { createNode } from './createNode';

export const InputNode = createNode({
  label: 'Input',
  description: 'Pass data of different types into your workflow',
  fields: [
    {
      name: 'inputName',
      label: 'Name',
      type: 'text',
      defaultValue: 'input_0',
    },
    {
      name: 'inputType',
      label: 'Type',
      type: 'select',
      defaultValue: 'Text',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'File', value: 'File' },
      ],
    },
  ],
  handles: [{ type: 'source', position: Position.Right, id: 'output' }],
});
