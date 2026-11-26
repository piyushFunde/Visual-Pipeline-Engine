import { useEffect, useRef, useState } from 'react';
import { Position, useUpdateNodeInternals } from 'reactflow';
import { Type } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

export function TextNode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const updateNodeInternals = useUpdateNodeInternals();
  const [text, setText] = useState(data?.text ?? '{{input}}');
  const [vars, setVars] = useState([]);
  const ref = useRef(null);
  const runStatus = data?.runStatus;

  useEffect(() => { setText(data?.text ?? '{{input}}'); }, [data?.text]);

  useEffect(() => {
    const matches = text.match(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g) || [];
    const unique = [...new Set(matches.map((v) => v.replace(/[{}]/g, '').trim()))];
    if (JSON.stringify(unique) !== JSON.stringify(vars)) {
      setVars(unique);
      updateNodeInternals(id);
    }
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${Math.max(64, ref.current.scrollHeight)}px`;
    }
  }, [text, id, vars, updateNodeInternals]);

  return (
    <div className={`vs-node${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><Type size={15} /></span>
          <span className="vs-node-title">Text</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action nodrag" onClick={() => removeNode(id)}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>✕</span>
          </button>
        </div>
      </div>
      <p className="vs-node-desc">Static or dynamic text with variable interpolation.</p>
      <div className="vs-node-body nodrag">
        <div className="vs-field-row">
          <label className="vs-label">Template <span className="vs-badge vs-badge--accent">{'{{var}}'}</span></label>
          <textarea
            ref={ref}
            className="vs-textarea nodrag"
            value={text}
            onChange={(e) => { setText(e.target.value); update(id, 'text', e.target.value); }}
            placeholder='Type "{{" to use variables'
            rows={3}
          />
        </div>
        {vars.length > 0 && (
          <div className="vs-var-chips">
            {vars.map((v) => <span key={v} className="vs-var-chip">{'{{' + v + '}}'}</span>)}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="output" className="vs-handle" />
      {vars.map((v, i) => (
        <Handle
          key={v}
          type="target"
          position={Position.Left}
          id={v}
          className="vs-handle"
          style={{ top: `${((i + 1) / (vars.length + 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}
