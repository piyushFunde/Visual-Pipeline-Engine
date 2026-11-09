// BaseNode.js

import { Handle } from 'reactflow';
import { useStore } from '../store';
import { useState } from 'react';

export const BaseNode = ({
  id,
  label,
  description = '',
  children,
  handles = [],
  fields = [],
  values = {},
}) => {
  const getNodeTheme = (title) => {
    if (title.includes('Input')) return { accent: '#8b8cf8' };
    if (title.includes('API')) return { accent: '#6f8cff' };
    if (title.includes('LLM')) return { accent: '#9b7df5' };
    if (title.includes('Output')) return { accent: '#7b86ff' };
    if (title.includes('Condition')) return { accent: '#f59e0b' };
    if (title.includes('Timer')) return { accent: '#10b981' };
    if (title.includes('Database')) return { accent: '#ec4899' };
    return { accent: '#8b8cf8' }; // Default
  };

  const theme = getNodeTheme(label);
  const updateNodeField = useStore((state) => state.updateNodeField);
  const removeNode = useStore((state) => state.removeNode);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderField = (field) => {
    const value = values[field.name] ?? '';

    if (field.type === 'select') {
      return (
        <div className="cn-type-section" key={field.name} style={{ marginBottom: '12px' }}>
          <div className="cn-type-header">
            <span className="cn-type-label">{field.label} <span className="cn-type-info">?</span></span>
            <span className="cn-type-badge">Dropdown</span>
          </div>
          <select
            className="cn-type-select"
            value={value}
            onChange={(event) => updateNodeField(id, field.name, event.target.value)}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Default text/number field styling
    return (
      <div className="cn-name-wrapper" key={field.name} style={{ marginBottom: '12px' }}>
        <input
          type={field.type || 'text'}
          className="cn-name-input"
          value={value}
          onChange={(event) => updateNodeField(id, field.name, event.target.value)}
          placeholder={field.label}
        />
      </div>
    );
  };

  return (
    <div
      className="custom-node"
      style={{
        borderColor: theme.accent,
      }}
    >
      {/* Header */}
      <div className="cn-header">
        <div className="cn-header-left">
          {/* Default generic icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          <span className="cn-title">{label}</span>
        </div>
        <div className="cn-header-right">
          <svg onClick={() => setIsCollapsed(!isCollapsed)} className="cn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Toggle Node"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          <svg className="cn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Settings"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <svg onClick={() => removeNode(id)} className="cn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Delete"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
      </div>

      {!isCollapsed && (
      <div className="cn-body">
        {description ? <p className="cn-desc">{description}</p> : null}
        
        {fields.map(renderField)}
        {children}

        {/* Global Suggestion Box (requested by user) */}
        <div className="cn-suggestion" style={{ marginTop: '16px' }}>
          <div className="cn-suggestion-icon">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a3cc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
          </div>
          <div className="cn-suggestion-text">
            <strong>Suggestion:</strong> Give the node a distinct name
          </div>
        </div>
      </div>
      )}

      {handles.map((h, i) => (
        <Handle
          key={`${id}-${h.id}-${i}`}
          type={h.type}
          position={h.position}
          id={`${id}-${h.id}`}
          className="cn-handle"
          style={{ borderColor: theme.accent, ...h.style }}
        />
      ))}
    </div>
  );
};
