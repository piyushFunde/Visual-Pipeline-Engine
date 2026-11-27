import { Position } from 'reactflow';
import { Timer } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

export function TimerNode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = data?.runStatus;
  return (
    <div className={`vs-node vs-node--timer${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header vs-node-header--timer">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><Timer size={14} /></span>
          <span className="vs-node-title">Timer</span>
          <span className="vs-node-id-chip">{id}</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action vs-node-action--delete nodrag" aria-label="Delete node" onClick={() => removeNode(id)}>✕</button>
        </div>
      </div>

      <p className="vs-node-desc">Delay execution by a selected duration.</p>

      <div className="vs-node-body nodrag">
        <div className="vs-field-row">
          <label className="vs-label">Delay (ms)</label>
          <input className="vs-input nodrag" type="number" value={data?.delay ?? 1000} onChange={(e) => update(id, 'delay', e.target.value)} placeholder="1000" />
        </div>
      </div>

      <div className="vs-handle-row vs-handle-row--left" style={{ top: '50%' }}>
        <span className="vs-handle-label">start</span>
        <Handle type="target" position={Position.Left} id="start" className="vs-handle" />
      </div>
      <div className="vs-handle-row vs-handle-row--right" style={{ top: '50%' }}>
        <Handle type="source" position={Position.Right} id="done" className="vs-handle" />
        <span className="vs-handle-label">done</span>
      </div>
    </div>
  );
}
