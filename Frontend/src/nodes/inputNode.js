import { Position } from 'reactflow';
import { LogIn, Lightbulb } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

export function InputNode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = data?.runStatus;

  return (
    <div className={`vs-node vs-node--input${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      {/* Color-coded category header */}
      <div className="vs-node-header vs-node-header--input">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><LogIn size={14} /></span>
          <span className="vs-node-title">Input</span>
          <span className="vs-node-id-chip">{id}</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action vs-node-action--delete nodrag" aria-label="Delete node" onClick={() => removeNode(id)}>✕</button>
        </div>
      </div>

      <p className="vs-node-desc">Pass data of different types into your workflow</p>

      <div className="vs-node-body nodrag">
        {/* Name pill */}
        <div className="vs-name-pill">{data?.inputName || 'input_0'}</div>

        {/* Suggestion */}
        <div className="vs-suggestion">
          <Lightbulb size={12} className="vs-suggestion-icon" />
          <span><strong>Tip:</strong> Give the node a distinct name</span>
        </div>

        {/* Name field */}
        <div className="vs-field-row">
          <label className="vs-label">Name</label>
          <input
            className="vs-input nodrag"
            type="text"
            value={data?.inputName ?? 'input_0'}
            onChange={(e) => update(id, 'inputName', e.target.value)}
            placeholder="input_0"
          />
        </div>

        {/* Type field */}
        <div className="vs-field-row">
          <label className="vs-label">Type <span className="vs-badge">Dropdown</span></label>
          <div className="vs-select-wrap">
            <select
              className="vs-select nodrag"
              value={data?.inputType ?? 'Text'}
              onChange={(e) => update(id, 'inputType', e.target.value)}
            >
              <option value="Text">Text</option>
              <option value="File">File</option>
              <option value="JSON">JSON</option>
            </select>
          </div>
        </div>
      </div>

      {/* Labeled source handle on right */}
      <div className="vs-handle-row vs-handle-row--right" style={{ top: '50%' }}>
        <Handle type="source" position={Position.Right} id="output" className="vs-handle" />
        <span className="vs-handle-label">output</span>
      </div>
    </div>
  );
}
