import { Position } from 'reactflow';
import { Globe } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

export function APINode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = data?.runStatus;
  return (
    <div className={`vs-node${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><Globe size={15} /></span>
          <span className="vs-node-title">API Request</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action nodrag" onClick={() => removeNode(id)}><span style={{ fontSize: 14 }}>✕</span></button>
        </div>
      </div>
      <p className="vs-node-desc">Call an external HTTP endpoint.</p>
      <div className="vs-node-body nodrag">
        <div className="vs-field-row">
          <label className="vs-label">Method <span className="vs-badge">Dropdown</span></label>
          <div className="vs-select-wrap">
            <select className="vs-select nodrag" value={data?.method ?? 'GET'} onChange={(e) => update(id, 'method', e.target.value)}>
              {['GET','POST','PUT','DELETE'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="vs-field-row">
          <label className="vs-label">URL</label>
          <input className="vs-input nodrag" type="text" value={data?.url ?? ''} onChange={(e) => update(id, 'url', e.target.value)} placeholder="https://api.example.com/endpoint" />
        </div>
      </div>
      <Handle type="target" position={Position.Left} id="trigger" className="vs-handle" />
      <Handle type="source" position={Position.Right} id="response" className="vs-handle" style={{ top: '35%' }} />
      <Handle type="source" position={Position.Right} id="error" className="vs-handle" style={{ top: '65%' }} />
    </div>
  );
}
