import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUpRight,
  Bot,
  ChevronDown,
  Database,
  GitBranch,
  Globe,
  LogIn,
  Sparkles,
  Type,
  Workflow,
  Zap,
} from 'lucide-react';
import { PipelineUI } from './ui';
import RequireAuth from './components/RequireAuth';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TemplatesPage from './pages/TemplatesPage';
import { useAuth } from './context/AuthContext';

/* ─── Scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting) return;
        node.classList.add('is-visible');
        observer.unobserve(node);
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...props }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} style={{ '--delay': `${delay}ms`, ...props.style }} {...props}>
      {children}
    </Tag>
  );
}

const workflowNodes = [
  { className: 'preview-node--trigger', label: 'Input', detail: 'Form trigger', number: '01', icon: LogIn },
  { className: 'preview-node--process', label: 'Text', detail: 'Format the data', number: '02', icon: Type },
  { className: 'preview-node--decision', label: 'Condition', detail: 'Check the request', number: '03', icon: GitBranch },
  { className: 'preview-node--output', label: 'API', detail: 'Send request', number: '04', icon: Globe },
];

function WorkflowPreview() {
  return (
    <div className="workflow-preview" aria-label="Preview of a connected Replayflow workflow">
      <div className="preview-window-bar">
        <div className="preview-window-dots" aria-hidden="true"><i /><i /><i /></div>
        <span>New workflow</span>
        <span className="preview-saved"><span aria-hidden="true" /> All changes saved</span>
      </div>
      <div className="preview-canvas">
        <div className="preview-grid" aria-hidden="true" />
        <svg className="preview-connections" viewBox="0 0 640 360" aria-hidden="true">
          <path d="M170 112 C207 112 202 205 240 205" />
          <path d="M400 205 C438 205 430 112 470 112" />
          <path d="M400 205 C438 205 430 284 470 284" />
          <circle cx="170" cy="112" r="4" />
          <circle cx="240" cy="205" r="4" />
          <circle cx="400" cy="205" r="4" />
          <circle cx="470" cy="112" r="4" />
          <circle cx="470" cy="284" r="4" />
        </svg>
        {workflowNodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <div key={node.number} className={`preview-node ${node.className}`} style={{ '--node-delay': `${index * 300}ms` }}>
              <span className="preview-node-icon" aria-hidden="true"><Icon size={15} strokeWidth={1.7} /></span>
              <span><strong>{node.label}</strong><small>{node.detail}</small></span>
              <span className="preview-node-port" aria-hidden="true" />
            </div>
          );
        })}
        <div className="preview-insight"><span className="insight-pulse" aria-hidden="true" /> Your flow, at a glance</div>
      </div>
      <div className="preview-footer">
        <span>4 nodes</span><span>3 connections</span>
        <span className="preview-zoom" aria-hidden="true">− &nbsp; 100% &nbsp; +</span>
      </div>
    </div>
  );
}

function ReplayflowMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

/* ─── Mega-menu dropdown ─── */
function MegaMenu({ label, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mega-menu-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="mega-menu-trigger">
        {label} <ChevronDown size={13} />
      </button>
      {open && (
        <div className="mega-menu-dropdown">
          {items.map((item) => (
            <a key={item.label} href={item.href || '#'} className="mega-menu-item">
              <span className="mega-menu-item-icon">{item.icon}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.desc}</small>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const MEGA_MENUS = {
  Products: [
    { label: 'Workflows', desc: 'Visual DAG pipeline builder', icon: <Workflow size={16} />, href: '/editor/new' },
    { label: 'Knowledge Bases', desc: 'RAG document retrieval', icon: <Database size={16} /> },
    { label: 'Autonomous Agents', desc: 'Self-directed AI agents', icon: <Bot size={16} /> },
    { label: 'Chatbot Interfaces', desc: 'Deploy embeddable chatbots', icon: <Sparkles size={16} /> },
  ],
  Solutions: [
    { label: 'Customer Support', desc: 'Auto-triage and respond', icon: <Zap size={16} /> },
    { label: 'Sales Outreach', desc: 'Personalized cold emails', icon: <ArrowUpRight size={16} /> },
    { label: 'Document Intelligence', desc: 'QA and summarization', icon: <Type size={16} /> },
    { label: 'Financial Analysis', desc: 'Data pipelines for finance', icon: <GitBranch size={16} /> },
  ],
};

const TEMPLATES_SHOWCASE = [
  { title: 'Support Ticket Classifier & Auto-Responder', desc: 'Classify tickets and route urgent ones to Slack automatically.', tags: ['support', 'llm'] },
  { title: 'Customer Feedback Sentiment Triage', desc: 'Analyze sentiment and escalate negative feedback.', tags: ['sentiment', 'condition'] },
  { title: 'Cold Sales Email Personalizer', desc: 'Generate personalized outreach emails from lead data.', tags: ['sales', 'llm'] },
  { title: 'Document QA & Summarizer', desc: 'Answer questions and summarize long documents.', tags: ['rag', 'llm'] },
];

const PRICING = [
  {
    name: 'Starter', price: 'Free', desc: 'Perfect for individuals and side projects.',
    features: ['5 workflows', '100 runs/month', 'Flow Doctor', 'Community support'],
    cta: 'Get started free', accent: false,
  },
  {
    name: 'Pro', price: '$49/mo', desc: 'For professionals who need more power.',
    features: ['Unlimited workflows', '10,000 runs/month', 'Deploy as Chatbot & API', 'Priority support', 'Run history & replay', 'Test cases'],
    cta: 'Start Pro trial', accent: true,
  },
  {
    name: 'Enterprise', price: 'Custom', desc: 'For teams with advanced requirements.',
    features: ['Everything in Pro', 'SSO & RBAC', 'Custom integrations', 'SLA guarantee', 'Dedicated support', 'On-premise option'],
    cta: 'Contact sales', accent: false,
  },
];

/* ─── Editor page (protected) ─── */
function EditorPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <div className="editor-page">
      <PipelineUI
        onBack={() => navigate('/dashboard')}
        onLogout={async () => { await logout(); navigate('/login'); }}
      />
    </div>
  );
}

/* ─── Landing page ─── */
function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing-page" id="home">
      <header className="site-header site-header--vs">
        <a className="brand" href="#home" aria-label="Replayflow home">
          <ReplayflowMark />
          <span>Replayflow</span>
        </a>
        <nav className="site-nav site-nav--vs" aria-label="Main navigation">
          <MegaMenu label="Products" items={MEGA_MENUS.Products} />
          <MegaMenu label="Solutions" items={MEGA_MENUS.Solutions} />
          <Link to="/templates" className="site-nav-link">Templates</Link>
          <a href="#pricing" className="site-nav-link">Pricing</a>
          <a href="#docs" className="site-nav-link">Docs</a>
        </nav>
        <div className="header-actions">
          <Link className="header-contact" to="/login">Sign In</Link>
          <Link className="button button-light button-small" to="/login">
            Start Building Free <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero-section">
          <div className="hero-copy">
            <Reveal as="p" className="eyebrow" delay={0}>
              <span className="eyebrow-line" aria-hidden="true" /> AI WORKFLOW PLATFORM
            </Reveal>
            <h1>
              <span className="hero-line"><span>Build, Test, and</span></span>
              <span className="hero-line"><span><em>Deploy AI Workflows</em></span></span>
              <span className="hero-line"><span>Without Code.</span></span>
            </h1>
            <Reveal as="p" className="hero-description" delay={240}>
              Connect LLMs, APIs, databases, and conditional logic on an intuitive visual canvas. Ship custom AI agents and chatbots in minutes.
            </Reveal>
            <div className="hero-actions">
              <Reveal as="button" className="button button-light" delay={360} type="button" onClick={() => navigate('/editor/new')}>
                Open Studio Canvas <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </Reveal>
              <Reveal as={Link} className="button button-dark" delay={420} to="/templates">
                Browse Templates <ArrowDown size={16} strokeWidth={1.8} aria-hidden="true" />
              </Reveal>
            </div>
            <Reveal as="div" className="hero-note" delay={500}>
              <span className="hero-note-icon" aria-hidden="true"><Sparkles size={15} strokeWidth={1.8} /></span>
              <span>From first idea to deployed AI agent,<br />everything has a place.</span>
            </Reveal>
          </div>
          <div className="hero-art">
            <div className="hero-art-orbit hero-art-orbit--one" aria-hidden="true" />
            <div className="hero-art-orbit hero-art-orbit--two" aria-hidden="true" />
            <div className="hero-art-label hero-art-label--top">VISUAL PIPELINE STUDIO</div>
            <Reveal as="div" className="hero-art-surface" delay={260}>
              <WorkflowPreview />
            </Reveal>
            <div className="hero-art-caption"><span>FIG. 01</span> A workflow, made visible</div>
          </div>
          <div className="hero-index" aria-hidden="true"><span>01</span><i />04</div>
        </section>

        {/* ── Core Pillars ── */}
        <section className="intro-section" id="product">
          <div className="section-heading">
            <Reveal as="p" className="eyebrow" delay={0}>
              <span className="eyebrow-line" aria-hidden="true" /> CORE CAPABILITIES
            </Reveal>
            <Reveal as="h2" delay={120}>
              Everything you need.<br /><em>Nothing you don't.</em>
            </Reveal>
          </div>
          <Reveal as="p" className="intro-description" delay={180}>
            Replayflow gives every part of your AI process a place. Build visually, validate automatically, and deploy with one click.
          </Reveal>
          <div className="feature-grid feature-grid--4">
            {[
              { n: '01', title: 'Visual DAG Pipelines', desc: 'Topological execution, branching logic, and nanosecond telemetry on every run.', icon: <Workflow size={20} strokeWidth={1.8} /> },
              { n: '02', title: 'Knowledge Base & RAG', desc: 'Connect documents and enable vector retrieval for context-aware LLM responses.', icon: <Database size={20} strokeWidth={1.8} /> },
              { n: '03', title: 'Flow Doctor & Self-Healing', desc: 'Automated graph linter detects cycles and dead ends with 1-click fixes.', icon: <Sparkles size={20} strokeWidth={1.8} /> },
              { n: '04', title: 'Deploy Everywhere', desc: 'Export as an embeddable Chatbot widget or a REST API endpoint in seconds.', icon: <Globe size={20} strokeWidth={1.8} /> },
            ].map((pillar, i) => (
              <Reveal as="article" className="feature-card" delay={i * 100} key={pillar.n}>
                <span className="feature-number">{pillar.n} / {pillar.title.split(' ')[0].toUpperCase()}</span>
                <span className="feature-symbol" aria-hidden="true">{pillar.icon}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
                <span className="feature-arrow" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.8} /></span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Templates Showcase ── */}
        <section className="templates-showcase" id="templates">
          <div className="section-heading" style={{ padding: '0 max(40px, calc((100% - 1240px) / 2)) 48px' }}>
            <Reveal as="p" className="eyebrow" delay={0}>
              <span className="eyebrow-line" aria-hidden="true" /> READY-TO-RUN PIPELINES
            </Reveal>
            <Reveal as="h2" delay={120}>Start from a<br /><em>template.</em></Reveal>
          </div>
          <div className="tpl-showcase-grid">
            {TEMPLATES_SHOWCASE.map((tpl, i) => (
              <Reveal as="article" className="tpl-showcase-card" delay={i * 80} key={tpl.title}>
                <div className="tpl-showcase-icon"><Zap size={18} /></div>
                <strong>{tpl.title}</strong>
                <p>{tpl.desc}</p>
                <div className="tpl-tags">
                  {tpl.tags.map((tag) => <span key={tag} className="tpl-tag">{tag}</span>)}
                </div>
                <Link to="/templates" className="tpl-try-btn">Try this template →</Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="how-section" id="use-cases">
          <div className="how-visual">
            <div className="how-visual-top"><span>YOUR WORKFLOW</span><span className="how-live"><i aria-hidden="true" /> READY TO BUILD</span></div>
            <div className="how-flow">
              {workflowNodes.map((node, index) => (
                <Reveal key={node.number} as="div" className="how-flow-item" delay={index * 100}>
                  <div className={`how-flow-node ${node.className}`}>
                    <span className="how-flow-number">{node.number}</span>
                    <span className="how-flow-title">{node.label}</span>
                    <span className="how-flow-detail">{node.detail}</span>
                  </div>
                  {index < workflowNodes.length - 1 && <span className="how-flow-link" aria-hidden="true"><ArrowUpRight size={12} strokeWidth={1.8} /></span>}
                </Reveal>
              ))}
            </div>
            <p className="how-visual-caption">One canvas. Many ways to get there.</p>
          </div>
          <div className="how-copy">
            <Reveal as="p" className="eyebrow" delay={0}><span className="eyebrow-line" aria-hidden="true" /> HOW IT WORKS</Reveal>
            <Reveal as="h2" delay={120}>From first step<br />to <em>finished flow.</em></Reveal>
            <Reveal as="p" delay={180}>Build a workflow you can actually see. Start with a simple Input, connect a Text step, add a Condition, and deploy as a chatbot or API.</Reveal>
            <ol className="how-steps">
              <Reveal as="li" delay={100}><span>01</span><div><strong>Choose your pieces</strong><small>Input, Text, LLM, Condition, API, Database nodes.</small></div></Reveal>
              <Reveal as="li" delay={200}><span>02</span><div><strong>Connect the steps</strong><small>Map the path your data takes through the pipeline.</small></div></Reveal>
              <Reveal as="li" delay={300}><span>03</span><div><strong>Run & replay</strong><small>Execute and review each node's input/output step by step.</small></div></Reveal>
              <Reveal as="li" delay={400}><span>04</span><div><strong>Deploy</strong><small>Ship as an embeddable chatbot or REST API endpoint.</small></div></Reveal>
            </ol>
            <Reveal as="button" className="button button-light" delay={460} type="button" onClick={() => navigate('/editor/new')}>
              Make your first flow <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Reveal>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="pricing-section" id="pricing">
          <div className="section-heading" style={{ padding: '0 max(40px, calc((100% - 1240px) / 2)) 48px' }}>
            <Reveal as="p" className="eyebrow" delay={0}><span className="eyebrow-line" aria-hidden="true" /> SIMPLE PRICING</Reveal>
            <Reveal as="h2" delay={120}>Plans for every<br /><em>team size.</em></Reveal>
          </div>
          <div className="pricing-grid">
            {PRICING.map((plan, i) => (
              <Reveal as="article" className={`pricing-card${plan.accent ? ' pricing-card--accent' : ''}`} delay={i * 100} key={plan.name}>
                <div className="pricing-card-header">
                  <strong>{plan.name}</strong>
                  <div className="pricing-price">{plan.price}</div>
                  <p>{plan.desc}</p>
                </div>
                <ul className="pricing-features">
                  {plan.features.map((f) => <li key={f}><span>✓</span>{f}</li>)}
                </ul>
                <Link to="/login" className={`pricing-cta${plan.accent ? ' pricing-cta--accent' : ''}`}>{plan.cta}</Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <Reveal as="section" className="contact-section" delay={0}>
          <p className="eyebrow"><span className="eyebrow-line" aria-hidden="true" /> YOUR NEXT IDEA STARTS HERE</p>
          <h2>Ready to build<br /><em>AI workflows?</em></h2>
          <button className="button button-light" type="button" onClick={() => navigate('/editor/new')}>
            Open Studio Canvas <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <div className="contact-decoration" aria-hidden="true"><span /><span /><span /></div>
        </Reveal>
      </main>

      <footer className="site-footer" id="docs">
        <h2>GET IN TOUCH</h2>
        <div className="footer-columns">
          <div className="footer-column">
            <strong>Product</strong>
            <Link to="/editor/new">Workflows</Link>
            <Link to="/templates">Templates</Link>
            <a href="#product">Flow Doctor</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="footer-column">
            <strong>Solutions</strong>
            <a href="#use-cases">Customer Support</a>
            <a href="#use-cases">Sales Outreach</a>
            <a href="#use-cases">Document Intelligence</a>
            <a href="#use-cases">Financial Analysis</a>
          </div>
          <div className="footer-column">
            <strong>Resources</strong>
            <a href="#docs">Quickstart</a>
            <a href="#docs">API Reference</a>
            <a href="#docs">Changelog</a>
            <a href="#docs">Status</a>
          </div>
          <div className="footer-column footer-contact">
            <strong>Company</strong>
            <a href="#home">About</a>
            <a href="#home">Blog</a>
            <a href="#home">Careers</a>
            <a href="#home">Legal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Root App with routes ─── */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/templates" element={<RequireAuth><TemplatesPage /></RequireAuth>} />
      <Route path="/editor/:pipelineId" element={<RequireAuth><EditorPage /></RequireAuth>} />
      <Route path="/editor" element={<RequireAuth><EditorPage /></RequireAuth>} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
