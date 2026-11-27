import { Position } from 'reactflow';
import { LogOut } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

export function OutputNode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = data?.runStatus;

  return (
    <div className={`vs-node vs-node--output${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header vs-node-header--output">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><LogOut size={14} /></span>
          <span className="vs-node-title">Output</span>
          <span className="vs-node-id-chip">{id}</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action vs-node-action--delete nodrag" aria-label="Delete node" onClick={() => removeNode(id)}>✕</button>
        </div>
      </div>

      <p className="vs-node-desc">Output data of different types from your workflow.</p>

      <div className="vs-node-body nodrag">
        <div className="vs-name-pill">{data?.outputName || 'output_0'}</div>

        <div className="vs-field-row">
          <label className="vs-label">Type <span className="vs-badge">Dropdown</span></label>
          <div className="vs-select-wrap">
            <select
              className="vs-select nodrag"
              value={data?.outputType ?? 'Text'}
              onChange={(e) => update(id, 'outputType', e.target.value)}
            >
              <option value="Text">Text</option>
              <option value="Raw JSON">Raw JSON</option>
              <option value="File">File</option>
            </select>
          </div>
        </div>

        <div className="vs-field-row">
          <label className="vs-label">Output name <span className="vs-badge vs-badge--accent">Text</span></label>
          <input
            className="vs-input nodrag"
            type="text"
            value={data?.outputName ?? 'output_0'}
            onChange={(e) => update(id, 'outputName', e.target.value)}
            placeholder="output_0"
          />
        </div>

        <div className="vs-field-row vs-field-row--toggle">
          <label className="vs-label">Format output</label>
          <label className="vs-toggle nodrag">
            <input
              type="checkbox"
              checked={data?.formatOutput ?? true}
              onChange={(e) => update(id, 'formatOutput', e.target.checked)}
            />
            <span className="vs-toggle-track" />
          </label>
        </div>
      </div>

      {/* Labeled target handle on left */}
      <div className="vs-handle-row vs-handle-row--left" style={{ top: '50%' }}>
        <span className="vs-handle-label">value</span>
        <Handle type="target" position={Position.Left} id="value" className="vs-handle" />
      </div>
    </div>
  );
}
