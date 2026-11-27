import { Position } from 'reactflow';
import { GitBranch } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

export function ConditionNode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = data?.runStatus;

  const insertOp = (op) => {
    const cur = data?.expression ?? '';
    update(id, 'expression', cur ? `${cur} ${op} ` : `x ${op} `);
  };

  return (
    <div className={`vs-node vs-node--condition${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header vs-node-header--condition">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><GitBranch size={14} /></span>
          <span className="vs-node-title">Condition</span>
          <span className="vs-node-id-chip">{id}</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action vs-node-action--delete nodrag" aria-label="Delete node" onClick={() => removeNode(id)}>✕</button>
        </div>
      </div>

      <p className="vs-node-desc">Branch your workflow using a conditional expression.</p>

      <div className="vs-node-body nodrag">
        <div className="vs-field-row">
          <label className="vs-label">Expression</label>
          <input className="vs-input nodrag" type="text" value={data?.expression ?? ''} onChange={(e) => update(id, 'expression', e.target.value)} placeholder="x > 10" />
        </div>
        <div className="vs-op-chips nodrag">
          {['==', '!=', '>', '<', 'contains'].map((op) => (
            <button key={op} type="button" className="vs-op-chip nodrag" onClick={() => insertOp(op)}>{op}</button>
          ))}
        </div>
        <div className="vs-branch-labels">
          <span className="vs-branch-label vs-branch-label--true">✓ true</span>
          <span className="vs-branch-label vs-branch-label--false">✗ false</span>
        </div>
      </div>

      {/* Target handle on left */}
      <div className="vs-handle-row vs-handle-row--left" style={{ top: '50%' }}>
        <span className="vs-handle-label">input</span>
        <Handle type="target" position={Position.Left} id="input" className="vs-handle" />
      </div>

      {/* True/false source handles on right, labeled */}
      <div className="vs-handle-row vs-handle-row--right" style={{ top: '38%' }}>
        <Handle type="source" position={Position.Right} id="true" className="vs-handle vs-handle--true" />
        <span className="vs-handle-label vs-handle-label--true">true ✓</span>
      </div>
      <div className="vs-handle-row vs-handle-row--right" style={{ top: '65%' }}>
        <Handle type="source" position={Position.Right} id="false" className="vs-handle vs-handle--false" />
        <span className="vs-handle-label vs-handle-label--false">false ✗</span>
      </div>
    </div>
  );
}
