import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Database,
  GitBranch,
  Globe,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  Timer,
  Type,
  Webhook,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'inputs',
    label: 'Inputs & Triggers',
    nodes: [
      { type: 'customInput', label: 'Input', icon: LogIn, subtitle: 'Pass data into your workflow', color: '#10b981' },
      { type: 'webhook', label: 'Webhook', icon: Webhook, subtitle: 'Listen for incoming events', color: '#10b981' },
    ],
  },
  {
    id: 'ai',
    label: 'AI & Models',
    nodes: [
      { type: 'llm', label: 'LLM', icon: Sparkles, subtitle: 'Generate using a language model', color: '#8b5cf6' },
      { type: 'text', label: 'Text', icon: Type, subtitle: 'Static or dynamic text template', color: '#0ea5e9' },
    ],
  },
  {
    id: 'logic',
    label: 'Logic & Control',
    nodes: [
      { type: 'condition', label: 'Condition', icon: GitBranch, subtitle: 'Branch with an expression', color: '#f59e0b' },
      { type: 'timer', label: 'Timer', icon: Timer, subtitle: 'Delay execution', color: '#f59e0b' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations & Data',
    nodes: [
      { type: 'api', label: 'API Request', icon: Globe, subtitle: 'Call an external HTTP endpoint', color: '#3b82f6' },
      { type: 'database', label: 'Database', icon: Database, subtitle: 'Read or write to a collection', color: '#14b8a6' },
    ],
  },
  {
    id: 'outputs',
    label: 'Outputs',
    nodes: [
      { type: 'customOutput', label: 'Output', icon: LogOut, subtitle: 'Return data from your workflow', color: '#f43f5e' },
    ],
  },
];

export function NodeLibrary({ onAdd }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, true])));

  const toggle = (id) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const q = search.trim().toLowerCase();
  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    nodes: q ? cat.nodes.filter((n) => n.label.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)) : cat.nodes,
  })).filter((cat) => cat.nodes.length > 0);

  if (collapsed) {
    return (
      <div className="node-library node-library--slim" aria-label="Node library collapsed">
        <button
          type="button"
          className="node-library__toggle"
          onClick={() => setCollapsed(false)}
          aria-label="Expand node library"
          title="Open Node Library"
        >
          <PanelLeftOpen size={18} />
        </button>
        <div className="node-library__slim-icons">
          {CATEGORIES.flatMap((cat) => cat.nodes).map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              type="button"
              className="node-library__slim-btn"
              title={label}
              style={{ '--node-color': color }}
              onClick={() => onAdd(type)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', type);
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="node-library" aria-label="Node library">
      {/* Header */}
      <div className="node-library__head">
        <span className="node-library__title">Nodes</span>
        <button
          type="button"
          className="node-library__toggle"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse node library"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="node-library__search-wrap">
        <Search size={13} className="node-library__search-icon" />
        <input
          className="node-library__search"
          type="search"
          placeholder="Search nodes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search nodes"
        />
      </div>

      {/* Categories */}
      <div className="node-library__body">
        {filtered.map((cat) => (
          <div key={cat.id} className="node-library__group">
            <button
              type="button"
              className="node-library__group-header"
              onClick={() => toggle(cat.id)}
              aria-expanded={openGroups[cat.id]}
            >
              {openGroups[cat.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>{cat.label}</span>
            </button>
            {openGroups[cat.id] && (
              <div className="node-library__group-items">
                {cat.nodes.map(({ type, label, icon: Icon, subtitle, color }) => (
                  <div
                    key={type}
                    className="node-library__item"
                    style={{ '--node-color': color }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', type);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={() => onAdd(type)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onAdd(type); }}
                    aria-label={`Add ${label} node`}
                    title={`Drag or click to add ${label}`}
                  >
                    <span className="node-library__item-icon">
                      <Icon size={14} />
                    </span>
                    <div className="node-library__item-info">
                      <strong>{label}</strong>
                      <span>{subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="node-library__empty">No nodes match "{search}"</div>
        )}
      </div>
    </div>
  );
}
