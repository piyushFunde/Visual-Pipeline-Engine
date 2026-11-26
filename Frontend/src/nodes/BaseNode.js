import { Handle, Position } from 'reactflow';
import { Maximize2, Settings, X } from 'lucide-react';
import { useStore } from '../store';

export const BaseNode = ({ id, label, icon: Icon, description = '', children, handles = [], values = {} }) => {
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = values?.runStatus;

  const borderColor = runStatus === 'DONE'    ? '#22c55e'
                    : runStatus === 'ERROR'   ? '#ef4444'
                    : runStatus === 'SKIPPED' ? '#94a3b8'
                    : undefined; // default CSS var

  return (
    <div className={`vs-node${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}
      style={borderColor ? { borderColor } : undefined}>

      {/* ── Header ── */}
      <div className="vs-node-header">
        <div className="vs-node-header-left">
          {Icon && <span className="vs-node-icon"><Icon size={15} /></span>}
          <span className="vs-node-title">{label}</span>
        </div>
        <div className="vs-node-header-actions">
          <button type="button" className="vs-node-action nodrag" aria-label="Expand"><Maximize2 size={12} /></button>
          <button type="button" className="vs-node-action nodrag" aria-label="Settings"><Settings size={12} /></button>
          <button type="button" className="vs-node-action vs-node-action--delete nodrag" aria-label="Delete" onClick={() => removeNode(id)}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Description ── */}
      {description && <p className="vs-node-desc">{description}</p>}

      {/* ── Body ── */}
      <div className="vs-node-body nodrag">
        {children}
      </div>

      {/* ── Handles ── */}
      {handles.map((h, i) => (
        <Handle
          key={`${id}-${h.id || i}`}
          type={h.type}
          position={h.position}
          id={h.id}
          className="vs-handle"
          style={h.style}
        />
      ))}
    </div>
  );
};
