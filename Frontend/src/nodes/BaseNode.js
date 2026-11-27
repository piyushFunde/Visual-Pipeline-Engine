import { Handle, Position } from 'reactflow';
import { useStore } from '../store';

export const BaseNode = ({
  id,
  label,
  category = 'default',
  icon: Icon,
  description = '',
  children,
  handles = [],
  values = {},
}) => {
  const removeNode = useStore((s) => s.removeNode);
  const runStatus = values?.runStatus;

  return (
    <div className={`vs-node vs-node--${category}${runStatus ? ` vs-node--${runStatus.toLowerCase()}` : ''}`}>
      <div className={`vs-node-header vs-node-header--${category}`}>
        <div className="vs-node-header-left">
          {Icon && <span className="vs-node-icon"><Icon size={14} /></span>}
          <span className="vs-node-title">{label}</span>
          <span className="vs-node-id-chip">{id}</span>
        </div>
        <div className="vs-node-header-actions">
          <button
            type="button"
            className="vs-node-action vs-node-action--delete nodrag"
            aria-label="Delete node"
            onClick={() => removeNode(id)}
          >
            ✕
          </button>
        </div>
      </div>

      {description && <p className="vs-node-desc">{description}</p>}

      <div className="vs-node-body nodrag">
        {children}
      </div>

      {handles.map((h, i) => {
        const isLeft = h.position === Position.Left;
        const rowClass = `vs-handle-row ${isLeft ? 'vs-handle-row--left' : 'vs-handle-row--right'}`;
        const labelText = h.label || h.id;
        return (
          <div key={`${id}-${h.id || i}`} className={rowClass} style={h.style}>
            {isLeft ? (
              <>
                {labelText && <span className="vs-handle-label">{labelText}</span>}
                <Handle type={h.type} position={h.position} id={h.id} className="vs-handle" />
              </>
            ) : (
              <>
                <Handle type={h.type} position={h.position} id={h.id} className="vs-handle" />
                {labelText && <span className="vs-handle-label">{labelText}</span>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
