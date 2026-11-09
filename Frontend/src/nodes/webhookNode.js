import { Position } from 'reactflow';
import { createNode } from './createNode';

export const WebhookNode = createNode({
  label: 'Webhook Listener',
  description: 'Listen for incoming events from external systems',
  fields: [
    {
      name: 'endpoint',
      label: 'Endpoint',
      type: 'text',
      defaultValue: '/webhook/listener',
    },
  ],
  handles: [{ type: 'source', position: Position.Right, id: 'payload' }],
});
