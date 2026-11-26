import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { getTemplates, savePipeline } from '../services/pipelineApi';

function safeJson(value) {
  if (!value) return [];
  try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return []; }
}

const TAG_COLORS = {
  support: '#9fd8b7',
  llm: '#b8a9f8',
  condition: '#f2b84b',
  sales: '#f07167',
  email: '#9fd8b7',
  translation: '#b8a9f8',
  database: '#f2b84b',
  webhook: '#9fd8b7',
  validation: '#f07167',
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(null);

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const cloneTemplate = async (tpl) => {
    setCloning(tpl.id);
    try {
      const nodes = safeJson(tpl.nodes);
      const edges = safeJson(tpl.edges);
      const result = await savePipeline({ nodes, edges });
      if (result.status === 'success') {
        navigate(`/editor/${result.id}`);
      }
    } catch {
      alert('Failed to clone template. Make sure the backend is running.');
    } finally {
      setCloning(null);
    }
  };

  return (
    <div className="templates-page">
      <header className="templates-header">
        <Link to="/dashboard" className="templates-back">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div>
          <h1>Template Marketplace</h1>
          <p>Start from a pre-built pipeline and customize it for your use case.</p>
        </div>
      </header>

      {loading ? (
        <div className="templates-empty">Loading templates…</div>
      ) : (
        <div className="templates-grid">
          {templates.map((tpl) => {
            const nodes = safeJson(tpl.nodes);
            const edges = safeJson(tpl.edges);
            return (
              <article key={tpl.id} className="tpl-card">
                <div className="tpl-card-icon"><Zap size={20} /></div>
                <div className="tpl-card-body">
                  <strong>{tpl.name}</strong>
                  <p>{tpl.description}</p>
                  <div className="tpl-tags">
                    {(tpl.tags || []).map((tag) => (
                      <span key={tag} className="tpl-tag" style={{ '--tag-color': TAG_COLORS[tag] || '#9fd8b7' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="tpl-meta">
                    <span>{Array.isArray(nodes) ? nodes.length : 0} nodes</span>
                    <span>{Array.isArray(edges) ? edges.length : 0} connections</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="tpl-use-btn"
                  onClick={() => cloneTemplate(tpl)}
                  disabled={cloning === tpl.id}
                >
                  {cloning === tpl.id ? 'Cloning…' : 'Use Template →'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
