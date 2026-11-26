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
    <div className={`vs-node${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><GitBranch size={15} /></span>
          <span className="vs-node-title">Condition</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action nodrag" onClick={() => removeNode(id)}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>✕</span>
          </button>
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
      <Handle type="target" position={Position.Left} id="input" className="vs-handle" />
      <Handle type="source" position={Position.Right} id="true" className="vs-handle" style={{ top: '35%' }} />
      <Handle type="source" position={Position.Right} id="false" className="vs-handle" style={{ top: '65%' }} />
    </div>
  );
}
