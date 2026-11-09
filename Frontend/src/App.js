import { useState } from 'react';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';

const workflowNodes = [
  { className: 'preview-node--trigger', label: 'Trigger', detail: 'New form response', number: '01' },
  { className: 'preview-node--process', label: 'Process', detail: 'Format the data', number: '02' },
  { className: 'preview-node--decision', label: 'Condition', detail: 'Check the request', number: '03' },
  { className: 'preview-node--output', label: 'Deliver', detail: 'Send a notification', number: '04' },
];

function WorkflowPreview() {
  return (
    <div className="workflow-preview" aria-label="Preview of a connected PieCanvas workflow">
      <div className="preview-window-bar">
        <div className="preview-window-dots" aria-hidden="true"><i /><i /><i /></div>
        <span>New workflow</span>
        <span className="preview-saved"><span /> All changes saved</span>
      </div>
      <div className="preview-canvas">
        <div className="preview-grid" />
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
        <div className="preview-node preview-node--trigger">
          <span className="preview-node-icon">↗</span>
          <span><strong>New response</strong><small>Form trigger</small></span>
          <span className="preview-node-port" />
        </div>
        <div className="preview-node preview-node--process">
          <span className="preview-node-icon">⌘</span>
          <span><strong>Clean up data</strong><small>Text transform</small></span>
          <span className="preview-node-port" />
        </div>
        <div className="preview-node preview-node--decision">
          <span className="preview-node-icon">◇</span>
          <span><strong>Is it urgent?</strong><small>Condition</small></span>
          <span className="preview-node-port" />
        </div>
        <div className="preview-node preview-node--output">
          <span className="preview-node-icon">◎</span>
          <span><strong>Notify the team</strong><small>Send message</small></span>
          <span className="preview-node-port" />
        </div>
        <div className="preview-insight"><span className="insight-pulse" /> Your flow, at a glance</div>
      </div>
      <div className="preview-footer"><span>4 nodes</span><span>3 connections</span><span className="preview-zoom">− &nbsp; 100% &nbsp; +</span></div>
    </div>
  );
}

function PieCanvasMark() {
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
            <span aria-hidden="true">←</span> Back to PieCanvas
          </button>
          <span className="editor-brand"><PieCanvasMark /> PieCanvas <span>WORKSPACE</span></span>
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
        <a className="brand" href="#home" aria-label="PieCanvas home">
          <PieCanvasMark />
          <span>PieCanvas</span>
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#product">Product</a>
          <a href="#use-cases">Use cases</a>
          <a href="#security">Security</a>
        </nav>
        <div className="header-actions">
          <a className="header-contact" href="#contact">Contact</a>
          <button className="button button-light button-small" type="button" onClick={() => setShowCanvas(true)}>
            Open the canvas <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> A VISUAL WORKFLOW STUDIO</p>
            <h1>MAKE IT FLOW.<br /><em>See the whole</em><br />picture.</h1>
            <p className="hero-description">
              Turn tangled steps into clear, connected workflows. Build visually, follow every connection, and bring your ideas to life on one canvas.
            </p>
            <div className="hero-actions">
              <button className="button button-light" type="button" onClick={() => setShowCanvas(true)}>
                Start building <span aria-hidden="true">↗</span>
              </button>
              <a className="button button-dark" href="#product">See how it works <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-note">
              <span className="hero-note-icon" aria-hidden="true">✳</span>
              <span>From first idea to finished flow,<br />everything has a place.</span>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-art-orbit hero-art-orbit--one" />
            <div className="hero-art-orbit hero-art-orbit--two" />
            <div className="hero-art-label hero-art-label--top">A LITTLE LESS COMPLEXITY</div>
            <WorkflowPreview />
            <div className="hero-art-caption"><span>FIG. 01</span> A workflow, made visible</div>
          </div>
          <div className="hero-index" aria-hidden="true"><span>01</span><i />04</div>
        </section>

        <section className="intro-section" id="product">
          <div className="section-heading">
            <p className="eyebrow"><span className="eyebrow-line" /> THE CANVAS IS YOURS</p>
            <h2>Big ideas.<br /><em>Clear connections.</em></h2>
          </div>
          <p className="intro-description">
            PieCanvas gives every part of your process a place. Add the pieces, connect the logic, and see how your workflow comes together—before you run it.
          </p>
          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-number">01 / BUILD</span>
              <span className="feature-symbol feature-symbol--nodes" aria-hidden="true"><i /><i /><i /></span>
              <h3>Start with a node</h3>
              <p>Pick from useful building blocks for inputs, text, decisions, APIs, and more.</p>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </article>
            <article className="feature-card">
              <span className="feature-number">02 / CONNECT</span>
              <span className="feature-symbol feature-symbol--connect" aria-hidden="true"><i /><i /><i /></span>
              <h3>Make it make sense</h3>
              <p>Draw the connections between steps and map out how information should move.</p>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </article>
            <article className="feature-card">
              <span className="feature-number">03 / RUN</span>
              <span className="feature-symbol feature-symbol--run" aria-hidden="true">↗</span>
              <h3>Put it in motion</h3>
              <p>Save your work, run your pipeline, and make your process easier to follow.</p>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </article>
          </div>
        </section>

        <section className="how-section" id="use-cases">
          <div className="how-visual">
            <div className="how-visual-top"><span>YOUR WORKFLOW</span><span className="how-live"><i /> READY TO BUILD</span></div>
            <div className="how-flow">
              {workflowNodes.map((node, index) => (
                <div className="how-flow-item" key={node.number}>
                  <div className={`how-flow-node ${node.className}`}>
                    <span className="how-flow-number">{node.number}</span>
                    <span className="how-flow-title">{node.label}</span>
                    <span className="how-flow-detail">{node.detail}</span>
                  </div>
                  {index < workflowNodes.length - 1 && <span className="how-flow-link" aria-hidden="true">→</span>}
                </div>
              ))}
            </div>
            <p className="how-visual-caption">One canvas. Many ways to get there.</p>
          </div>
          <div className="how-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> HOW IT WORKS</p>
            <h2>From first step<br />to <em>finished flow.</em></h2>
            <p>Make a workflow you can actually see. Start with a simple trigger, connect the steps you need, and shape the logic as you go.</p>
            <ol className="how-steps">
              <li><span>01</span><div><strong>Choose your pieces</strong><small>Drag the nodes your process needs.</small></div></li>
              <li><span>02</span><div><strong>Connect the steps</strong><small>Map the path your information takes.</small></div></li>
              <li><span>03</span><div><strong>Save and run</strong><small>Bring the workflow together and execute.</small></div></li>
            </ol>
            <button className="button button-light" type="button" onClick={() => setShowCanvas(true)}>
              Make your first flow <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>

        <section className="clarity-section" id="security">
          <div className="clarity-mark" aria-hidden="true"><span>◎</span><i /><i /><i /></div>
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> MADE TO BE FOLLOWED</p>
            <h2>Every connection<br /><em>has a reason.</em></h2>
          </div>
          <p className="clarity-description">
            No mystery behind the next step. Keep your logic on the canvas, see how each node connects, and make changes with the full picture in view.
          </p>
        </section>

        <section className="contact-section" id="contact">
          <p className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT IDEA STARTS HERE</p>
          <h2>Ready to make<br /><em>things flow?</em></h2>
          <button className="button button-light" type="button" onClick={() => setShowCanvas(true)}>
            Open PieCanvas <span aria-hidden="true">↗</span>
          </button>
          <div className="contact-decoration" aria-hidden="true"><span /><span /><span /></div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home"><PieCanvasMark /><span>PieCanvas</span></a>
        <p>A clearer way to build what comes next.</p>
        <div className="footer-bottom"><span>© 2026 PieCanvas</span><a href="#home">Back to top ↑</a><span>Made for ideas in motion.</span></div>
      </footer>
    </div>
  );
}

export default App;
