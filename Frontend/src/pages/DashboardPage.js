import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  Key,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  Workflow,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deletePipeline, duplicatePipeline, getPipelines } from '../services/pipelineApi';

function ReplayflowMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
      <rect x="1" y="4" width="10" height="8" rx="1.5" />
      <rect x="1" y="20" width="10" height="8" rx="1.5" />
      <rect x="21" y="12" width="10" height="8" rx="1.5" />
      <path d="M11,8 C17,8 17,16 21,16" />
      <path d="M11,24 C17,24 17,16 21,16" />
      <circle cx="11" cy="8" r="2" fill="currentColor" stroke="none" />
      <circle cx="11" cy="24" r="2" fill="currentColor" stroke="none" />
      <circle cx="21" cy="16" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Workflows', path: '/dashboard', active: true },
  { icon: Workflow, label: 'Templates', path: '/templates' },
  { icon: Bot, label: 'Chatbot Interfaces', path: '/dashboard' },
  { icon: Key, label: 'API Keys & Webhooks', path: '/dashboard' },
  { icon: Settings, label: 'Settings & Billing', path: '/dashboard' },
];

function safeJson(value) {
  if (!value) return [];
  try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return []; }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pipelines, setPipelines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMenu, setActionMenu] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getPipelines();
      setPipelines(Array.isArray(list) ? list : []);
    } catch {
      setPipelines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workflow?')) return;
    await deletePipeline(id);
    setPipelines((prev) => prev.filter((p) => p.id !== id));
    setActionMenu(null);
  };

  const handleDuplicate = async (id) => {
    await duplicatePipeline(id);
    await load();
    setActionMenu(null);
  };

  const handleExport = (pipe) => {
    const data = JSON.stringify({ nodes: safeJson(pipe.nodesJson), edges: safeJson(pipe.edgesJson) }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-${pipe.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionMenu(null);
  };

  const filtered = pipelines.filter((p) => {
    const name = p.name || `Pipeline #${p.id}`;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <ReplayflowMark />
          <span>Replayflow</span>
        </div>
        <div className="dash-workspace-badge">Personal workspace</div>
        <nav className="dash-nav">
          {NAV_ITEMS.map(({ icon: Icon, label, path, active }) => (
            <Link key={label} to={path} className={`dash-nav-item${active ? ' dash-nav-item--active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="dash-sidebar-footer">
          <div className="dash-user">
            <div className="dash-avatar">{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
            <div className="dash-user-info">
              <strong>{user?.name || 'User'}</strong>
              <small>{user?.email || ''}</small>
            </div>
          </div>
          <button type="button" className="dash-logout" onClick={handleLogout} aria-label="Log out">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1>Workflows</h1>
            <p>Build, manage, and deploy your AI pipelines.</p>
          </div>
          <button type="button" className="dash-new-btn" onClick={() => navigate('/editor/new')}>
            <Plus size={16} /> New Workflow
          </button>
        </div>

        <div className="dash-toolbar">
          <div className="dash-search">
            <Search size={14} />
            <input
              type="search"
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="dash-empty">Loading workflows…</div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <Workflow size={36} />
            <strong>{search ? 'No workflows match your search.' : 'No workflows yet.'}</strong>
            <p>
              {search ? (
                <button type="button" onClick={() => setSearch('')}>Clear search</button>
              ) : (
                <>
                  <button type="button" onClick={() => navigate('/editor/new')}>Create your first workflow</button>
                  {' or '}
                  <Link to="/templates">start from a template</Link>
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="dash-grid">
            {filtered.map((pipe) => {
              const nodes = safeJson(pipe.nodesJson);
              const edges = safeJson(pipe.edgesJson);
              const name = pipe.name || `Pipeline #${pipe.id}`;
              return (
                <div key={pipe.id} className="dash-card">
                  <div className="dash-card-header">
                    <div className="dash-card-icon"><Workflow size={18} /></div>
                    <div className="dash-card-menu-wrap">
                      <button
                        type="button"
                        className="dash-card-menu-btn"
                        onClick={() => setActionMenu(actionMenu === pipe.id ? null : pipe.id)}
                        aria-label="Actions"
                      >
                        ···
                      </button>
                      {actionMenu === pipe.id && (
                        <div className="dash-action-menu">
                          <button type="button" onClick={() => { navigate(`/editor/${pipe.id}`); setActionMenu(null); }}>
                            <ExternalLink size={13} /> Open in Editor
                          </button>
                          <button type="button" onClick={() => handleDuplicate(pipe.id)}>
                            <Copy size={13} /> Duplicate
                          </button>
                          <button type="button" onClick={() => handleExport(pipe)}>
                            <Download size={13} /> Export JSON
                          </button>
                          <button type="button" className="danger" onClick={() => handleDelete(pipe.id)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="dash-card-body">
                    <strong>{name}</strong>
                    <div className="dash-card-meta">
                      <span>{Array.isArray(nodes) ? nodes.length : 0} nodes</span>
                      <span>{Array.isArray(edges) ? edges.length : 0} connections</span>
                    </div>
                  </div>
                  <div className="dash-card-footer">
                    <button
                      type="button"
                      className="dash-open-btn"
                      onClick={() => navigate(`/editor/${pipe.id}`)}
                    >
                      Open
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {actionMenu && (
        <div className="dash-overlay" onClick={() => setActionMenu(null)} />
      )}
    </div>
  );
}
