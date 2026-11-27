import { Position } from 'reactflow';
import { Webhook } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

export function WebhookNode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = data?.runStatus;
  return (
    <div className={`vs-node vs-node--webhook${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header vs-node-header--webhook">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><Webhook size={14} /></span>
          <span className="vs-node-title">Webhook Listener</span>
          <span className="vs-node-id-chip">{id}</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action vs-node-action--delete nodrag" aria-label="Delete node" onClick={() => removeNode(id)}>✕</button>
        </div>
      </div>

      <p className="vs-node-desc">Listen for incoming events from external systems.</p>

      <div className="vs-node-body nodrag">
        <div className="vs-field-row">
          <label className="vs-label">Endpoint</label>
          <input className="vs-input nodrag" type="text" value={data?.endpoint ?? '/webhook/listener'} onChange={(e) => update(id, 'endpoint', e.target.value)} placeholder="/webhook/listener" />
        </div>
        <div className="vs-field-row">
          <label className="vs-label">Secret (optional)</label>
          <input className="vs-input nodrag" type="password" value={data?.secret ?? ''} onChange={(e) => update(id, 'secret', e.target.value)} placeholder="••••••••" />
        </div>
      </div>

      <div className="vs-handle-row vs-handle-row--right" style={{ top: '50%' }}>
        <Handle type="source" position={Position.Right} id="payload" className="vs-handle" />
        <span className="vs-handle-label">payload</span>
      </div>
    </div>
  );
}
