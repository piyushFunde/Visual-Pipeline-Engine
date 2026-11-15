import { Position } from 'reactflow';
import { createNode } from './createNode';

export const LLMNode = createNode({
  label: 'LLM',
  description: 'Generate a response from prompt and system inputs',
  fields: [
    {
      name: 'prompt',
      label: 'Prompt',
      type: 'text',
      defaultValue: '',
    },
    {
      name: 'maxTokens',
      label: 'Max tokens',
      type: 'number',
      defaultValue: '',
    },
  ],
  handles: [
    { type: 'target', position: Position.Left, id: 'system', style: { top: `${100 / 3}%` } },
    { type: 'target', position: Position.Left, id: 'prompt', style: { top: `${200 / 3}%` } },
    { type: 'source', position: Position.Right, id: 'response' },
  ],
  renderContent: () => <span>This is a LLM.</span>,
});
