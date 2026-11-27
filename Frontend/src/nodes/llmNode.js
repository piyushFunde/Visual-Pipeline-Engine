import { Position } from 'reactflow';
import { Sparkles } from 'lucide-react';
import { Handle } from 'reactflow';
import { useStore } from '../store';

const MODELS = ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Llama 3.3'];

export function LLMNode({ id, data }) {
  const update = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = data?.runStatus;

  return (
    <div className={`vs-node vs-node--llm${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className="vs-node-header vs-node-header--llm">
        <div className="vs-node-header-left">
          <span className="vs-node-icon"><Sparkles size={14} /></span>
          <span className="vs-node-title">LLM</span>
          <span className="vs-node-id-chip">{id}</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action vs-node-action--delete nodrag" aria-label="Delete node" onClick={() => removeNode(id)}>✕</button>
        </div>
      </div>

      <p className="vs-node-desc">Generate a response using a language model.</p>

      <div className="vs-node-body nodrag">
        <div className="vs-field-row">
          <label className="vs-label">Model <span className="vs-badge">Dropdown</span></label>
          <div className="vs-select-wrap">
            <select className="vs-select nodrag" value={data?.model ?? 'GPT-4o'} onChange={(e) => update(id, 'model', e.target.value)}>
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="vs-field-row">
          <label className="vs-label">System prompt</label>
          <textarea className="vs-textarea nodrag" rows={2} value={data?.system ?? ''} onChange={(e) => update(id, 'system', e.target.value)} placeholder="You are a helpful assistant…" />
        </div>
        <div className="vs-field-row">
          <label className="vs-label">Prompt <span className="vs-badge vs-badge--accent">supports {'{{var}}'}</span></label>
          <textarea className="vs-textarea nodrag" rows={3} value={data?.prompt ?? ''} onChange={(e) => update(id, 'prompt', e.target.value)} placeholder="Enter prompt or use {{input}}…" />
        </div>
        <div className="vs-field-row">
          <label className="vs-label">Max tokens</label>
          <input className="vs-input nodrag" type="number" value={data?.maxTokens ?? ''} onChange={(e) => update(id, 'maxTokens', e.target.value)} placeholder="512" />
        </div>
      </div>

      {/* Labeled target handles on left */}
      <div className="vs-handle-row vs-handle-row--left" style={{ top: '38%' }}>
        <span className="vs-handle-label">system</span>
        <Handle type="target" position={Position.Left} id="system" className="vs-handle" />
      </div>
      <div className="vs-handle-row vs-handle-row--left" style={{ top: '62%' }}>
        <span className="vs-handle-label">prompt</span>
        <Handle type="target" position={Position.Left} id="prompt" className="vs-handle" />
      </div>

      {/* Labeled source handle on right */}
      <div className="vs-handle-row vs-handle-row--right" style={{ top: '50%' }}>
        <Handle type="source" position={Position.Right} id="response" className="vs-handle" />
        <span className="vs-handle-label">response</span>
      </div>
    </div>
  );
}
