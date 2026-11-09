import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Boxes,
  GitBranch,
  Globe,
  LogIn,
  Play,
  Sparkles,
  Type,
  Workflow,
} from 'lucide-react';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';

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
      {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px',
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...props }) {
  const ref = useReveal();

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={{ '--delay': `${delay}ms`, ...props.style }}
      {...props}
    >
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
    <div className="workflow-preview" aria-label="Preview of a connected PipeCanvas workflow">
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
            <div
              key={node.number}
              className={`preview-node ${node.className}`}
              style={{ '--node-delay': `${index * 300}ms` }}
            >
              <span className="preview-node-icon" aria-hidden="true">
                <Icon size={15} strokeWidth={1.7} />
              </span>
              <span><strong>{node.label}</strong><small>{node.detail}</small></span>
              <span className="preview-node-port" aria-hidden="true" />
            </div>
          );
        })}

        <div className="preview-insight"><span className="insight-pulse" aria-hidden="true" /> Your flow, at a glance</div>
      </div>
      <div className="preview-footer">
        <span>4 nodes</span>
        <span>3 connections</span>
        <span className="preview-zoom" aria-hidden="true">− &nbsp; 100% &nbsp; +</span>
      </div>
    </div>
  );
}

function PipeCanvasMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3.5a12.5 12.5 0 1 0 12.5 12.5H16V3.5Z" />
      <path d="M19.5 3.9v8.6h8.6a12.5 12.5 0 0 0-8.6-8.6Z" />
      <circle cx="10.5" cy="20.5" r="1.25" />
      <circle cx="15.75" cy="20.5" r="1.25" />
      <circle cx="21" cy="20.5" r="1.25" />
    </svg>
  );
}

function App() {
  const [showCanvas, setShowCanvas] = useState(false);

  if (showCanvas) {
    return (
      <div className="editor-page">
        <div className="editor-topbar">
          <button className="editor-back-button" type="button" onClick={() => setShowCanvas(false)}>
            <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" style={{ transform: 'rotate(225deg)' }} /> Back to PipeCanvas
          </button>
          <span className="editor-brand"><PipeCanvasMark /> PipeCanvas <span>WORKSPACE</span></span>
        </div>
        <PipelineToolbar />
        <PipelineUI />
        <SubmitButton />
      </div>
    );
  }

  return (
    <div className="landing-page" id="home">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="PipeCanvas home">
          <PipeCanvasMark />
          <span>PipeCanvas</span>
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#product">Product</a>
          <a href="#use-cases">Use cases</a>
        </nav>
        <div className="header-actions">
          <a className="header-contact" href="#contact">Contact</a>
          <button className="button button-light button-small" type="button" onClick={() => setShowCanvas(true)}>
            Open the canvas <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <Reveal as="p" className="eyebrow" delay={0}>
              <span className="eyebrow-line" aria-hidden="true" /> A VISUAL WORKFLOW STUDIO
            </Reveal>
            <h1>
              <span className="hero-line"><span>MAKE IT FLOW.</span></span>
              <span className="hero-line"><span><em>See the whole</em></span></span>
              <span className="hero-line"><span>picture.</span></span>
            </h1>
            <Reveal as="p" className="hero-description" delay={240}>
              Turn tangled steps into clear, connected workflows. Build visually, follow every connection, and turn ideas into a simulated run with a step-by-step log.
            </Reveal>
            <div className="hero-actions">
              <Reveal as="button" className="button button-light" delay={360} type="button" onClick={() => setShowCanvas(true)}>
                Start building <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </Reveal>
              <Reveal as="a" className="button button-dark" delay={420} href="#product">
                See how it works <ArrowDown size={16} strokeWidth={1.8} aria-hidden="true" />
              </Reveal>
            </div>
            <Reveal as="div" className="hero-note" delay={500}>
              <span className="hero-note-icon" aria-hidden="true"><Sparkles size={15} strokeWidth={1.8} /></span>
              <span>From first idea to finished flow,<br />everything has a place.</span>
            </Reveal>
          </div>

          <div className="hero-art">
            <div className="hero-art-orbit hero-art-orbit--one" aria-hidden="true" />
            <div className="hero-art-orbit hero-art-orbit--two" aria-hidden="true" />
            <div className="hero-art-label hero-art-label--top">A LITTLE LESS COMPLEXITY</div>
            <Reveal as="div" className="hero-art-surface" delay={260}>
              <WorkflowPreview />
            </Reveal>
            <div className="hero-art-caption"><span>FIG. 01</span> A workflow, made visible</div>
          </div>
          <div className="hero-index" aria-hidden="true"><span>01</span><i />04</div>
        </section>

        <section className="intro-section" id="product">
          <div className="section-heading">
            <Reveal as="p" className="eyebrow" delay={0}>
              <span className="eyebrow-line" aria-hidden="true" /> THE CANVAS IS YOURS
            </Reveal>
            <Reveal as="h2" delay={120}>
              Big ideas.<br /><em>Clear connections.</em>
            </Reveal>
          </div>
          <Reveal as="p" className="intro-description" delay={180}>
            PipeCanvas gives every part of your process a place. Add the pieces, connect the logic, and see how your workflow comes together before you run a simulated flow.
          </Reveal>
          <div className="feature-grid">
            <Reveal as="article" className="feature-card" delay={0}>
              <span className="feature-number">01 / BUILD</span>
              <span className="feature-symbol feature-symbol--nodes" aria-hidden="true"><Boxes size={20} strokeWidth={1.8} /></span>
              <h3>Start with a node</h3>
              <p>Choose from Input, Text, Condition, API, and Output building blocks.</p>
              <span className="feature-arrow" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.8} /></span>
            </Reveal>
            <Reveal as="article" className="feature-card" delay={120}>
              <span className="feature-number">02 / CONNECT</span>
              <span className="feature-symbol feature-symbol--connect" aria-hidden="true"><Workflow size={20} strokeWidth={1.8} /></span>
              <h3>Make it make sense</h3>
              <p>Map each step so the flow stays clear and easy to follow.</p>
              <span className="feature-arrow" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.8} /></span>
            </Reveal>
            <Reveal as="article" className="feature-card" delay={240}>
              <span className="feature-number">03 / RUN</span>
              <span className="feature-symbol feature-symbol--run" aria-hidden="true"><Play size={18} strokeWidth={1.8} /></span>
              <h3>Put it in motion</h3>
              <p>Run a simulated workflow and review the step-by-step log.</p>
              <span className="feature-arrow" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.8} /></span>
            </Reveal>
          </div>
        </section>

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
            <Reveal as="p" className="eyebrow" delay={0}>
              <span className="eyebrow-line" aria-hidden="true" /> HOW IT WORKS
            </Reveal>
            <Reveal as="h2" delay={120}>From first step<br />to <em>finished flow.</em></Reveal>
            <Reveal as="p" delay={180}>Build a workflow you can actually see. Start with a simple Input, connect a Text step, add a Condition, and shape the path before a simulated run.</Reveal>
            <ol className="how-steps">
              <Reveal as="li" delay={100}><span>01</span><div><strong>Choose your pieces</strong><small>Start with Input, Text, Condition, and API nodes.</small></div></Reveal>
              <Reveal as="li" delay={200}><span>02</span><div><strong>Connect the steps</strong><small>Map the path your information takes.</small></div></Reveal>
              <Reveal as="li" delay={300}><span>03</span><div><strong>Simulated run</strong><small>Review a step-by-step log without claiming live integrations.</small></div></Reveal>
            </ol>
            <Reveal as="button" className="button button-light" delay={360} type="button" onClick={() => setShowCanvas(true)}>
              Make your first flow <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Reveal>
          </div>
        </section>

        <Reveal as="section" className="clarity-section" delay={0}>
          <div className="clarity-mark" aria-hidden="true"><span><GitBranch size={22} strokeWidth={1.8} /></span><i /><i /><i /></div>
          <div>
            <p className="eyebrow"><span className="eyebrow-line" aria-hidden="true" /> MADE TO BE FOLLOWED</p>
            <h2>Every connection<br /><em>has a reason.</em></h2>
          </div>
          <p className="clarity-description">
            No mystery behind the next step. Keep your logic on the canvas, see how each node connects, and make changes with the full picture in view.
          </p>
        </Reveal>

        <Reveal as="section" className="contact-section" id="contact" delay={0}>
          <p className="eyebrow"><span className="eyebrow-line" aria-hidden="true" /> YOUR NEXT IDEA STARTS HERE</p>
          <h2>Ready to make<br /><em>things flow?</em></h2>
          <button className="button button-light" type="button" onClick={() => setShowCanvas(true)}>
            Open PipeCanvas <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <div className="contact-decoration" aria-hidden="true"><span /><span /><span /></div>
        </Reveal>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home"><PipeCanvasMark /><span>PipeCanvas</span></a>
        <p>A clearer way to build what comes next.</p>
        <div className="footer-bottom"><span>© 2026 PipeCanvas</span><a href="#home">Back to top ↑</a><span>Made for ideas in motion.</span></div>
      </footer>
    </div>
  );
}

export default App;
