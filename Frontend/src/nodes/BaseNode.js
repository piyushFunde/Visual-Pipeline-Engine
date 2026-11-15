import { useState } from 'react';
import {
  Database,
  GitBranch,
  Globe,
  LogIn,
  LogOut,
  MoreHorizontal,
  Sparkles,
  Timer,
  Type,
  Webhook,
} from 'lucide-react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';

const NODE_ICONS = {
  Input: LogIn,
  Output: LogOut,
  Text: Type,
  LLM: Sparkles,
  Timer,
  Condition: GitBranch,
  API: Globe,
  'API Request': Globe,
  Database,
  Webhook,
  'Webhook Listener': Webhook,
};

export const BaseNode = ({
  id,
  label,
  description = '',
  children,
  handles = [],
  fields = [],
  values = {},
}) => {
  const [editing, setEditing] = useState(false);
  const updateNodeField = useStore((state) => state.updateNodeField);
  const removeNode = useStore((state) => state.removeNode);
  const Icon = NODE_ICONS[label] || Type;
  const subtitle = values.inputName || values.outputName || values.name || values.text
    || values.expression || description || 'Pipeline step';
  const footer = values.runStatus === 'SKIPPED' ? 'Not taken'
    : Number.isFinite(values.runtimeMs) ? `${values.runtimeMs} ms` : label;
  const resolvedHandles = handles.length ? handles : [
    { type: 'target', position: Position.Left },
    { type: 'source', position: Position.Right },
  ];

  const renderField = (field) => {
    const value = values[field.name] ?? '';
    return (
      <label className="pipeline-node-field" key={field.name}>
        <span>{field.label}</span>
        {field.type === 'select' ? (
          <select value={value} onChange={(event) => updateNodeField(id, field.name, event.target.value)}>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(event) => updateNodeField(id, field.name, event.target.value)}
            placeholder={field.label}
          />
        )}
      </label>
    );
  };

  return (
    <div className={`pipeline-node pipeline-node--${label.toLowerCase()}`}>
      <div className="pipeline-node__main">
        <span className="pipeline-node__icon"><Icon size={16} aria-hidden="true" /></span>
        <span className="pipeline-node__copy">
          <strong>{label}</strong>
          <small title={String(subtitle)}>{String(subtitle)}</small>
        </span>
      </div>
      <div className="pipeline-node__footer">
        <span>{values.nodeType || label}</span>
        <span>{footer}</span>
      </div>
      <button
        type="button"
        className="pipeline-node__edit nodrag"
        aria-label={`Edit ${label} node`}
        onClick={() => setEditing((current) => !current)}
      >
        <MoreHorizontal size={15} aria-hidden="true" />
      </button>
      {editing ? (
        <div className="pipeline-node__editor nodrag">
          {fields.map(renderField)}
          {children}
          <button type="button" onClick={() => removeNode(id)}>Delete node</button>
        </div>
      ) : null}
      {resolvedHandles.map((handle, index) => (
        <Handle
          key={`${id}-${handle.id || index}`}
          type={handle.type}
          position={handle.position || Position.Right}
          id={handle.id}
          className="pipeline-node__handle"
          style={handle.style}
        />
      ))}
    </div>
  );
};
