import { Position } from 'reactflow';
import { Database } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

export function DatabaseNode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = data?.runStatus;
  return (
    <div className={`vs-node${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><Database size={15} /></span>
          <span className="vs-node-title">Database</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action nodrag" onClick={() => removeNode(id)}><span style={{ fontSize: 14 }}>✕</span></button>
        </div>
      </div>
      <p className="vs-node-desc">Read from or write to a database collection.</p>
      <div className="vs-node-body nodrag">
        <div className="vs-field-row">
          <label className="vs-label">Action <span className="vs-badge">Dropdown</span></label>
          <div className="vs-select-wrap">
            <select className="vs-select nodrag" value={data?.action ?? 'Read'} onChange={(e) => update(id, 'action', e.target.value)}>
              {['Read','Write','Update','Delete'].map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="vs-field-row">
          <label className="vs-label">Collection</label>
          <input className="vs-input nodrag" type="text" value={data?.collection ?? ''} onChange={(e) => update(id, 'collection', e.target.value)} placeholder="users" />
        </div>
      </div>
      <Handle type="target" position={Position.Left} id="trigger" className="vs-handle" />
      <Handle type="source" position={Position.Right} id="result" className="vs-handle" style={{ top: '35%' }} />
      <Handle type="source" position={Position.Right} id="error" className="vs-handle" style={{ top: '65%' }} />
    </div>
  );
}
