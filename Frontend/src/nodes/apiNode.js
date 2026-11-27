import { Position } from 'reactflow';
import { Globe } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

export function APINode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = data?.runStatus;
  return (
    <div className={`vs-node vs-node--api${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header vs-node-header--api">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><Globe size={14} /></span>
          <span className="vs-node-title">API Request</span>
          <span className="vs-node-id-chip">{id}</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action vs-node-action--delete nodrag" aria-label="Delete node" onClick={() => removeNode(id)}>✕</button>
        </div>
      </div>

      <p className="vs-node-desc">Call an external HTTP endpoint.</p>

      <div className="vs-node-body nodrag">
        <div className="vs-field-row">
          <label className="vs-label">Method <span className="vs-badge">Dropdown</span></label>
          <div className="vs-select-wrap">
            <select className="vs-select nodrag" value={data?.method ?? 'GET'} onChange={(e) => update(id, 'method', e.target.value)}>
              {['GET', 'POST', 'PUT', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="vs-field-row">
          <label className="vs-label">URL</label>
          <input className="vs-input nodrag" type="text" value={data?.url ?? ''} onChange={(e) => update(id, 'url', e.target.value)} placeholder="https://api.example.com/endpoint" />
        </div>
        <div className="vs-field-row">
          <label className="vs-label">Body (JSON)</label>
          <textarea className="vs-textarea nodrag" rows={2} value={data?.body ?? ''} onChange={(e) => update(id, 'body', e.target.value)} placeholder='{"key": "{{value}}"}' />
        </div>
      </div>

      {/* Target on left */}
      <div className="vs-handle-row vs-handle-row--left" style={{ top: '50%' }}>
        <span className="vs-handle-label">trigger</span>
        <Handle type="target" position={Position.Left} id="trigger" className="vs-handle" />
      </div>

      {/* Two source handles on right */}
      <div className="vs-handle-row vs-handle-row--right" style={{ top: '38%' }}>
        <Handle type="source" position={Position.Right} id="response" className="vs-handle" />
        <span className="vs-handle-label">response</span>
      </div>
      <div className="vs-handle-row vs-handle-row--right" style={{ top: '65%' }}>
        <Handle type="source" position={Position.Right} id="error" className="vs-handle vs-handle--false" />
        <span className="vs-handle-label vs-handle-label--false">error</span>
      </div>
    </div>
  );
}
