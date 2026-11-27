import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap } from 'reactflow';
import { NodeLibrary } from './components/NodeLibrary';
import { shallow } from 'zustand/shallow';
import { useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code2,
  Database,
  FlaskConical,
  Gauge,
  GitBranch,
  Globe,
  LoaderCircle,
  LogIn,
  LogOut,
  MessageSquare,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Timer,
  Type,
  Webhook,
  Workflow,
} from 'lucide-react';
import { useStore } from './store';
import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { TimerNode } from './nodes/timerNode';
import { ConditionNode } from './nodes/conditionNode';
import { APINode } from './nodes/apiNode';
import { DatabaseNode } from './nodes/databaseNode';
import { WebhookNode } from './nodes/webhookNode';
import { PipelineEdge } from './nodes/PipelineEdge';
import {
  createTestFromRun,
  estimatePipeline,
  executePipeline,
  getPipelines,
  getRun,
  getTestCases,
  loadPipeline,
  runTestCases,
  savePipeline,
  updatePipeline,
  validatePipeline,
} from './services/pipelineApi';

import 'reactflow/dist/style.css';

const NODE_CATALOG = [
  { type: 'customInput', label: 'Input', icon: LogIn, defaults: { inputName: 'input_0', inputType: 'Text' } },
  { type: 'text', label: 'Text', icon: Type, defaults: { text: '{{input}}' } },
  { type: 'condition', label: 'Condition', icon: GitBranch, defaults: { expression: 'x > 0' } },
  { type: 'llm', label: 'LLM', icon: Sparkles, defaults: { prompt: '' } },
  { type: 'timer', label: 'Timer', icon: Timer, defaults: {} },
  { type: 'api', label: 'API', icon: Globe, defaults: {} },
  { type: 'database', label: 'Database', icon: Database, defaults: {} },
  { type: 'webhook', label: 'Webhook', icon: Webhook, defaults: {} },
  { type: 'customOutput', label: 'Output', icon: LogOut, defaults: { outputName: 'output_0', outputType: 'Text' } },
];

const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  timer: TimerNode,
  condition: ConditionNode,
  api: APINode,
  database: DatabaseNode,
  webhook: WebhookNode,
};
const edgeTypes = { pipeline: PipelineEdge };
const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  nodeIDs: state.nodeIDs,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  currentRun: state.currentRun,
  replayIndex: state.replayIndex,
  playing: state.playing,
  speed: state.speed,
  setCurrentRun: state.setCurrentRun,
  setReplayIndex: state.setReplayIndex,
  setPlaying: state.setPlaying,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  toggleSpeed: state.toggleSpeed,
  applyDoctorFix: state.applyDoctorFix,
});

function safeJson(value) {
  if (!value) return {};
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return { value };
  }
}

function severityClass(severity) {
  return String(severity || 'info').toLowerCase();
}

function DeployModal({ pipelineId, onClose }) {
  const [tab, setTab] = useState('chatbot');
  const chatUrl = `http://localhost:3000/chat/${pipelineId || '{id}'}`;
  const curlSnippet = `curl -X POST http://localhost:8081/api/v1/pipelines/${pipelineId || '{id}'}/execute \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"inputs": {"request": "My question"}}'`;
  const iframeSnippet = `<iframe src="${chatUrl}" width="100%" height="600px"></iframe>`;
  const copy = (text) => { navigator.clipboard.writeText(text); };
  return (
    <div className="pipeline-modal-backdrop" onClick={onClose}>
      <div className="pipeline-modal deploy-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="pipeline-modal-header">
          <h3>Deploy Workflow</h3>
          <button type="button" className="pipeline-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="deploy-tabs">
          <button type="button" className={tab === 'chatbot' ? 'active' : ''} onClick={() => setTab('chatbot')}>
            <MessageSquare size={14} /> Chatbot
          </button>
          <button type="button" className={tab === 'api' ? 'active' : ''} onClick={() => setTab('api')}>
            <Code2 size={14} /> REST API
          </button>
        </div>
        <div className="pipeline-modal-body">
          {tab === 'chatbot' ? (
            <>
              <p className="deploy-desc">Embed this workflow as a chatbot on any website.</p>
              <label className="deploy-label">Chatbot URL</label>
              <div className="deploy-code-wrap">
                <code>{chatUrl}</code>
                <button type="button" onClick={() => copy(chatUrl)}>Copy</button>
              </div>
              <label className="deploy-label">Embed Snippet</label>
              <div className="deploy-code-wrap">
                <code>{iframeSnippet}</code>
                <button type="button" onClick={() => copy(iframeSnippet)}>Copy</button>
              </div>
            </>
          ) : (
            <>
              <p className="deploy-desc">Call this workflow as a REST API from any application.</p>
              <label className="deploy-label">cURL Example</label>
              <div className="deploy-code-wrap deploy-code-wrap--tall">
                <code>{curlSnippet}</code>
                <button type="button" onClick={() => copy(curlSnippet)}>Copy</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const PipelineUI = ({ onBack, onLogout }) => {
  const { pipelineId: routeId } = useParams();
  const wrapperRef = useRef(null);
  const flowInstanceRef = useRef(null);
  const suppressUnsavedRef = useRef(false);
  const deployWrapRef = useRef(null);
  const [activeTab, setActiveTab] = useState('doctor');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [pipelineId, setPipelineId] = useState(routeId && routeId !== 'new' ? Number(routeId) : null);
  const [workflowTitle, setWorkflowTitle] = useState('Untitled Workflow');
  const [editingTitle, setEditingTitle] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [deployMenuOpen, setDeployMenuOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [doctor, setDoctor] = useState({ score: 100, issues: [] });
  const [estimate, setEstimate] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [testResults, setTestResults] = useState({});
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [focusedNode, setFocusedNode] = useState('');
  const [fixedIssues, setFixedIssues] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pipelineList, setPipelineList] = useState([]);
  const {
    nodes, edges, nodeIDs, getNodeID, addNode, onNodesChange, onEdgesChange, onConnect,
    currentRun, replayIndex, playing, speed, setCurrentRun, setReplayIndex, setPlaying,
    setNodes, setEdges, toggleSpeed, applyDoctorFix,
  } = useStore(selector, shallow);

  const graph = useMemo(() => ({ nodes, edges }), [nodes, edges]);
  const runSteps = useMemo(() => currentRun?.steps || [], [currentRun]);
  const activeStep = replayIndex >= 0 && replayIndex < runSteps.length ? runSteps[replayIndex] : null;
  const scoreTone = doctor.score < 60 ? 'error' : doctor.score < 90 ? 'warning' : 'good';

  // Load pipeline from route param on mount
  useEffect(() => {
    if (!routeId || routeId === 'new') return;
    const id = Number(routeId);
    if (isNaN(id)) return;
    loadPipeline(id).then((result) => {
      if (result.status !== 'success') return;
      suppressUnsavedRef.current = true;
      setNodes(safeJson(result.nodes));
      setEdges(safeJson(result.edges));
      setPipelineId(id);
      if (result.name) setWorkflowTitle(result.name);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  useEffect(() => {
    if (suppressUnsavedRef.current) {
      suppressUnsavedRef.current = false;
      setDraftSaved(true);
      return;
    }
    setDraftSaved(false);
  }, [graph]);

  useEffect(() => {
    if (!playing || !currentRun) return undefined;
    const timer = window.setTimeout(() => {
      const next = replayIndex + 1;
      setReplayIndex(next);
      if (next >= runSteps.length) setPlaying(false);
    }, 1100 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, currentRun, replayIndex, runSteps.length, speed, setPlaying, setReplayIndex]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const result = await validatePipeline(graph);
        setDoctor(result);
        setError('');
      } catch (requestError) {
        setError(requestError.message);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [graph]);

  useEffect(() => {
    if (activeTab !== 'estimate') return undefined;
    const timer = window.setTimeout(async () => {
      try {
        setEstimate(await estimatePipeline(graph));
        setError('');
      } catch (requestError) {
        setError(requestError.message);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [activeTab, graph]);

  useEffect(() => {
    if (!pipelineId || activeTab !== 'tests') return undefined;
    let active = true;
    getTestCases(pipelineId).then((cases) => {
      if (!active) return;
      setTestCases(cases);
      setTestResults((current) => {
        const restored = { ...current };
        cases.forEach((testCase) => {
          if (testCase.latestResult) restored[testCase.id] = testCase.latestResult;
        });
        return restored;
      });
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    });
    return () => { active = false; };
  }, [pipelineId, activeTab]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!deployMenuOpen) return undefined;
    const handleOutside = (event) => {
      if (deployWrapRef.current && !deployWrapRef.current.contains(event.target)) {
        setDeployMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [deployMenuOpen]);

  const stepIndexByNode = useMemo(() => {
    const result = new Map();
    runSteps.forEach((step) => result.set(step.nodeId, step));
    return result;
  }, [runSteps]);
  const displayNodes = useMemo(() => nodes.map((node, nodeIndex) => {
    const step = stepIndexByNode.get(node.id);
    const visibleStep = step && step.orderIndex <= replayIndex ? step : null;
    let status = 'pending';
    if (visibleStep?.status === 'SKIPPED') status = 'skipped';
    else if (visibleStep?.status === 'ERROR') status = 'error';
    else if (visibleStep && visibleStep.orderIndex === replayIndex) status = 'active';
    else if (visibleStep?.status === 'DONE') status = 'done';
    const classNames = [
      `run-node--${status}`,
      focusedNode === node.id ? 'doctor-focus' : '',
    ].filter(Boolean).join(' ');
    return {
      ...node,
      style: { ...node.style, '--node-index': nodeIndex },
      className: classNames,
      data: {
        ...node.data,
        nodeType: node.data?.nodeType || node.type,
        runtimeMs: visibleStep?.durationMs,
        runStatus: visibleStep?.status,
      },
    };
  }), [nodes, stepIndexByNode, replayIndex, focusedNode]);
  const displayEdges = useMemo(() => edges.map((edge) => {
    const sourceStep = stepIndexByNode.get(edge.source);
    const targetStep = stepIndexByNode.get(edge.target);
    const sourceOutput = safeJson(sourceStep?.outputJson);
    const sourceHandle = String(edge.sourceHandle || '');
    const branchHandle = sourceHandle.startsWith(`${edge.source}-`)
      ? sourceHandle.slice(edge.source.length + 1)
      : sourceHandle;
    const untaken = sourceStep?.nodeType === 'condition'
      && ['true', 'false'].includes(branchHandle)
      && sourceOutput.branch !== branchHandle;
    let status = 'idle';
    if (untaken || targetStep?.status === 'SKIPPED') status = 'skipped';
    else if (sourceStep?.orderIndex === replayIndex || targetStep?.orderIndex === replayIndex) status = 'active';
    else if (sourceStep && targetStep && targetStep.orderIndex <= replayIndex) status = 'done';
    return { ...edge, type: 'pipeline', className: `edge-state--${status}`, data: { status } };
  }), [edges, stepIndexByNode, replayIndex]);

  const addNodeAt = useCallback((type, position) => {
    const catalogItem = NODE_CATALOG.find((item) => item.type === type);
    if (!catalogItem) return;
    const id = getNodeID(type);
    addNode({
      id,
      type,
      position: position || { x: 120 + (nodeIDs[type] || 0) * 24, y: 120 + (nodeIDs[type] || 0) * 20 },
      data: { id, nodeType: type, ...catalogItem.defaults },
    });
  }, [addNode, getNodeID, nodeIDs]);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType || !flowInstanceRef.current || !wrapperRef.current) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
    addNodeAt(nodeType, flowInstanceRef.current.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }));
  }, [addNodeAt]);

  const save = async () => {
    setBusy('save');
    try {
      if (pipelineId) {
        await updatePipeline(pipelineId, { name: workflowTitle, nodes: graph.nodes, edges: graph.edges });
        setDraftSaved(true);
        setToast('Draft saved');
      } else {
        const result = await savePipeline(graph);
        if (result.status !== 'success') throw new Error(result.message || 'Pipeline could not be saved.');
        setPipelineId(result.id);
        setDraftSaved(true);
        setToast('Draft saved');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  };

  const openPicker = async () => {
    setBusy('load');
    try {
      const list = await getPipelines();
      setPipelineList(Array.isArray(list) ? list : []);
      setPickerOpen(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  };

  const loadById = async (targetId) => {
    setBusy('load');
    try {
      const result = await loadPipeline(targetId);
      if (result.status !== 'success') throw new Error(result.message || 'Pipeline not found.');
      suppressUnsavedRef.current = true;
      setNodes(safeJson(result.nodes));
      setEdges(safeJson(result.edges));
      setPipelineId(targetId);
      if (result.name) setWorkflowTitle(result.name);
      setToast(`Pipeline #${targetId} loaded`);
      setPickerOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  };

  const load = openPicker;

  const run = async () => {
    setBusy('run');
    setError('');
    try {
      const result = await executePipeline(graph, pipelineId);
      if (result.status !== 'success') throw new Error(result.message || 'Pipeline execution failed.');
      const runRecord = await getRun(result.runId);
      setCurrentRun(runRecord);
      setReplayIndex(runRecord.steps.length ? 0 : runRecord.steps.length);
      setPlaying(runRecord.steps.length > 0);
      setActiveTab('replay');
      setDrawerOpen(true);
      setToast('Run recorded');
    } catch (requestError) {
      setError(requestError.message);
      setPlaying(false);
    } finally {
      setBusy('');
    }
  };

  const jumpToStep = (index) => {
    setPlaying(false);
    setReplayIndex(index);
  };

  const replay = () => {
    if (!currentRun) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (replayIndex >= runSteps.length) setReplayIndex(0);
    setPlaying(true);
  };

  const selectIssue = (issue) => {
    if (!issue.nodeId) return;
    setFocusedNode(issue.nodeId);
    flowInstanceRef.current?.fitView({ nodes: [{ id: issue.nodeId }], duration: 400, padding: 0.6 });
    window.setTimeout(() => setFocusedNode(''), 2100);
  };

  const applyFix = (issue) => {
    if (!issue.fix?.ops) return;
    applyDoctorFix(issue.fix.ops);
    setFixedIssues((current) => [...current, issue.id]);
    setToast(`Applied: ${issue.fix.label}`);
    window.setTimeout(() => {
      setFixedIssues((current) => current.filter((id) => id !== issue.id));
    }, 1800);
  };

  const runTests = async () => {
    if (!pipelineId) {
      setError('Save this pipeline before running its test cases.');
      return;
    }
    setBusy('tests');
    try {
      const result = await runTestCases(pipelineId);
      const nextResults = {};
      result.results.forEach((item) => { nextResults[item.testCaseId] = item; });
      setTestResults(nextResults);
      setTestCases(await getTestCases(pipelineId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  };

  const saveRunAsTest = async () => {
    if (!pipelineId || !currentRun?.id) {
      setError('Save the pipeline before creating a test from this run.');
      return;
    }
    setBusy('from-run');
    try {
      await createTestFromRun(pipelineId, currentRun.id);
      setTestCases(await getTestCases(pipelineId));
      setActiveTab('tests');
      setToast('Run saved as a test');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  };

  const slowestStep = useMemo(() => runSteps.reduce((slowest, step) =>
    !slowest || (step.durationMs || 0) > (slowest.durationMs || 0) ? step : slowest, null), [runSteps]);
  const scoreLabel = typeof doctor.score === 'number' ? doctor.score : 0;
  const visibleIssues = doctor.issues.filter((issue) => !fixedIssues.includes(issue.id));

  return (
    <main className="pipeline-shell">
      <header className="pipeline-topbar">
        <div className="pipeline-brand">
          <button type="button" className="pipeline-back" aria-label="Back to dashboard" onClick={onBack}>
            <ArrowLeft size={15} />
          </button>
          <Workflow size={19} aria-hidden="true" />
          <div className="pipeline-brand__titles">
            <span>Replayflow / Workflows</span>
            {editingTitle ? (
              <input
                className="pipeline-title-input"
                value={workflowTitle}
                autoFocus
                onChange={(e) => setWorkflowTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(false); }}
              />
            ) : (
              <button type="button" className="pipeline-title-btn" onClick={() => setEditingTitle(true)}>
                <strong>{workflowTitle}</strong>
                <Pencil size={11} />
              </button>
            )}
          </div>
        </div>
        <div className="pipeline-topbar__actions">
          <button
            type="button"
            className={`flow-health flow-health--${scoreTone}`}
            onClick={() => { setActiveTab('doctor'); setDrawerOpen(true); }}
          >
            <span /> Flow health {scoreLabel}
          </button>
          <span className="draft-state"><i /> {draftSaved ? 'Draft saved' : 'Unsaved changes'}</span>
          <button type="button" className="pipeline-button pipeline-button--outline" onClick={load} disabled={busy !== ''}>
            {busy === 'load' ? 'Loading…' : 'Load'}
          </button>
          <button type="button" className="pipeline-button pipeline-button--outline" onClick={save} disabled={busy !== ''}>
            {busy === 'save' ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="pipeline-button pipeline-button--accent" onClick={run} disabled={busy !== ''}>
            {busy === 'run' ? <LoaderCircle className="spin" size={15} /> : <Play size={14} fill="currentColor" />}
            Run
          </button>
          <div className="deploy-dropdown-wrap" ref={deployWrapRef}>
            <button
              type="button"
              className="pipeline-button pipeline-button--deploy"
              onClick={() => setDeployMenuOpen((v) => !v)}
            >
              Deploy <ChevronDown size={13} />
            </button>
            {deployMenuOpen && (
              <div className="deploy-dropdown">
                <button type="button" onClick={() => { setDeployOpen(true); setDeployMenuOpen(false); }}>
                  <MessageSquare size={13} /> Embeddable Chatbot
                </button>
                <button type="button" onClick={() => { setDeployOpen(true); setDeployMenuOpen(false); }}>
                  <Code2 size={13} /> REST API Endpoint
                </button>
              </div>
            )}
          </div>
          {onLogout ? <button type="button" className="pipeline-logout" onClick={onLogout}>Log out</button> : null}
        </div>
      </header>

      <div className="pipeline-workspace">
        {/* ── Left Node Library Sidebar ── */}
        <NodeLibrary onAdd={(type) => addNodeAt(type)} />

        {/* ── Canvas ── */}
        <section className="pipeline-canvas-column" aria-label="Pipeline canvas">
          <div className="pipeline-canvas" ref={wrapperRef} onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
            {nodes.length === 0 ? (
              <div className="pipeline-empty">
                <span><Plus size={20} /></span>
                <strong>Build your first flow</strong>
                <small>Drag a node from the left panel or click it to place it on the canvas.</small>
              </div>
            ) : null}
            <ReactFlow
              nodes={displayNodes}
              edges={displayEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={(instance) => { flowInstanceRef.current = instance; }}
              proOptions={{ hideAttribution: true }}
              fitView
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1.3}
                color="rgba(255,255,255,0.12)"
              />
              <Controls className="vs-controls" />
              <MiniMap
                pannable
                zoomable
                className="vs-minimap"
                nodeColor={(node) => node.className?.includes('skipped') ? '#4A4A50' : '#8b5cf6'}
                maskColor="rgba(13,15,20,0.75)"
              />
            </ReactFlow>
            <div className="canvas-legend" aria-label="Node status legend">
              <span><i className="legend-running" /> Running</span>
              <span><i className="legend-done" /> Done</span>
              <span><i className="legend-warning" /> Needs attention</span>
              <span><i className="legend-skipped" /> Skipped</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Collapsible Bottom Studio Drawer ── */}
      <section
        className={`studio-drawer ${drawerOpen ? 'studio-drawer--open' : 'studio-drawer--collapsed'}`}
        aria-label="Workflow studio drawer"
      >
        <div className="studio-drawer__bar">
          <div className="studio-drawer__tabs" role="tablist" aria-label="Pipeline tools">
            {[
              ['doctor', 'Flow Doctor', Stethoscope, visibleIssues.length > 0 ? visibleIssues.length : null],
              ['replay', 'Run Replay', Activity, runSteps.length > 0 ? runSteps.length : null],
              ['tests', 'Tests', FlaskConical, testCases.length > 0 ? testCases.length : null],
              ['estimate', 'Estimate', Gauge, null],
            ].map(([tab, title, TabIcon, badge]) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                key={tab}
                className={`studio-drawer__tab${activeTab === tab ? ' is-active' : ''}`}
                onClick={() => {
                  if (activeTab === tab && drawerOpen) return;
                  setActiveTab(tab);
                  setDrawerOpen(true);
                }}
              >
                <TabIcon size={13} aria-hidden="true" />
                <span>{title}</span>
                {badge !== null ? <em className="studio-drawer__badge">{badge}</em> : null}
              </button>
            ))}
          </div>

          <div className="studio-drawer__right">
            {currentRun?.simulated ? <span className="simulated-chip">Simulated</span> : null}
            {activeTab === 'replay' && slowestStep ? (
              <small className="studio-drawer__hint">
                Slowest: {nodes.find((node) => node.id === slowestStep.nodeId)?.data?.name || slowestStep.nodeId}
                {' · '}{slowestStep.durationMs} ms ({currentRun.totalMs
                  ? Math.round((slowestStep.durationMs / currentRun.totalMs) * 100) : 0}%)
              </small>
            ) : null}
            <button
              type="button"
              className="studio-drawer__toggle"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? 'Collapse bottom drawer' : 'Expand bottom drawer'}
              title={drawerOpen ? 'Collapse drawer' : 'Expand drawer'}
            >
              {drawerOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          </div>
        </div>

        {drawerOpen ? (
          <div className="studio-drawer__content">
            {error ? <div className="pipeline-error" role="alert">{error}</div> : null}

            {activeTab === 'doctor' ? (
              <div className="doctor-panel doctor-panel--horizontal">
                <div className="doctor-summary">
                  <div className={`score-ring score-ring--${scoreTone}`} style={{ '--score': `${scoreLabel}%` }}>
                    <span>{scoreLabel}</span>
                  </div>
                  <div>
                    <h2>Flow Doctor</h2>
                    <p>{visibleIssues.length} issues to review. Click one to locate it on the canvas.</p>
                  </div>
                </div>
                <div className="doctor-issues doctor-issues--grid">
                  {visibleIssues.length === 0 ? (
                    <div className="doctor-empty">Your flow is looking good.</div>
                  ) : visibleIssues.map((issue) => (
                    <article className={`doctor-issue doctor-issue--${severityClass(issue.severity)}`} key={issue.id}>
                      <button type="button" className="doctor-issue__select" onClick={() => selectIssue(issue)}>
                        <span className="issue-kicker">{issue.code.replaceAll('_', ' ')} · {issue.nodeId || 'PIPELINE'}</span>
                        <strong>{issue.title}</strong>
                        <span>{issue.detail}</span>
                      </button>
                      {issue.fix ? (
                        <button type="button" className="doctor-fix" onClick={() => applyFix(issue)}>
                          {issue.fix.label}
                        </button>
                      ) : null}
                    </article>
                  ))}
                  {fixedIssues.map((issueId) => (
                    <div className="doctor-fixed" key={issueId}>Fixed</div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'replay' ? (
              <div className="replay-panel replay-panel--drawer" aria-label="Run replay">
                <div className="replay-header">
                  <div className="replay-title">
                    <h2>Run replay</h2>
                    {slowestStep ? (
                      <small>Slowest step: {nodes.find((node) => node.id === slowestStep.nodeId)?.data?.name || slowestStep.nodeId}
                        {' · '}{slowestStep.durationMs} ms ({currentRun.totalMs
                          ? Math.round((slowestStep.durationMs / currentRun.totalMs) * 100) : 0}% of the run)
                      </small>
                    ) : null}
                  </div>
                  <div className="replay-controls">
                    <button type="button" aria-label="Previous step" onClick={() => jumpToStep(Math.max(0, replayIndex - 1))}
                      disabled={!runSteps.length}><ChevronLeft size={16} /></button>
                    <button type="button" className="replay-play" onClick={replay} disabled={!runSteps.length}>
                      {playing ? <Pause size={15} /> : replayIndex >= runSteps.length ? <RotateCcw size={15} /> : <Play size={15} />}
                      {playing ? 'Pause' : replayIndex >= runSteps.length ? 'Replay' : 'Play'}
                    </button>
                    <button type="button" aria-label="Next step" onClick={() => jumpToStep(Math.min(runSteps.length, replayIndex + 1))}
                      disabled={!runSteps.length}><ChevronRight size={16} /></button>
                    <button type="button" className="speed-toggle" onClick={toggleSpeed}>Speed {speed}x</button>
                    {currentRun ? <button type="button" className="save-run-test" onClick={saveRunAsTest}>Save this run as a test</button> : null}
                  </div>
                </div>
                {runSteps.length ? (
                  <>
                    <div className="replay-timeline" role="list" aria-label="Run timeline">
                      {runSteps.map((step, index) => {
                        const node = nodes.find((item) => item.id === step.nodeId);
                        const label = node?.data?.name || node?.data?.inputName || node?.data?.outputName
                          || node?.type || step.nodeId;
                        return (
                          <button
                            type="button"
                            role="listitem"
                            className={`timeline-step ${index < replayIndex ? 'is-done' : ''} ${index === replayIndex ? 'is-active' : ''} ${step.status === 'SKIPPED' ? 'is-skipped' : ''}`}
                            key={step.id || step.nodeId}
                            style={{ flexGrow: Math.max(1, step.durationMs || 1) }}
                            onClick={() => jumpToStep(index)}
                            aria-label={`${label}, ${step.status}, ${step.durationMs} milliseconds`}
                          >
                            <strong>{label}</strong>
                            <span>{step.status === 'SKIPPED' ? 'Not taken' : `${step.durationMs} ms`}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="replay-inspector">
                      {activeStep ? (
                        <>
                          <div className="replay-data"><strong>Input</strong><pre>{JSON.stringify(safeJson(activeStep.inputJson), null, 2)}</pre></div>
                          <div className="replay-data"><strong>Output</strong><pre>{JSON.stringify(safeJson(activeStep.outputJson), null, 2)}</pre></div>
                          <div className="replay-meta">
                            <span>Step {activeStep.orderIndex + 1} / {runSteps.length}</span>
                            <strong>{nodes.find((node) => node.id === activeStep.nodeId)?.data?.name || activeStep.nodeId}</strong>
                            <span>{activeStep.durationMs} ms</span>
                            {activeStep.tokens != null ? <span>{activeStep.tokens} tokens</span> : null}
                          </div>
                        </>
                      ) : (
                        <p className="replay-empty">Run a pipeline to record a sample, then click any timeline step to inspect its inputs and outputs.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="replay-empty replay-empty--idle">Press Run to record a sample run and review each node’s input and output.</div>
                )}
              </div>
            ) : null}

            {activeTab === 'tests' ? (
              <div className="tests-panel tests-panel--horizontal">
                <div className="panel-heading">
                  <div>
                    <h2>Test cases</h2>
                    <p>
                      Run saved assertions against this flow ·{' '}
                      {Object.values(testResults).filter((result) => result.passed).length} of {testCases.length} passing
                    </p>
                  </div>
                  <button type="button" className="doctor-fix" onClick={runTests} disabled={busy !== ''}>
                    {busy === 'tests' ? 'Running…' : 'Run all'}
                  </button>
                </div>
                <div className="tests-grid">
                  {testCases.map((testCase) => {
                    const result = testResults[testCase.id];
                    return (
                      <article className="test-case" key={testCase.id}>
                        <div className="test-case__head">
                          <strong>{testCase.name}</strong>
                          <span className={`test-status ${result ? (result.passed ? 'passed' : 'failed') : ''}`}>
                            {busy === 'tests' ? 'Running' : result ? (result.passed ? 'Passed' : 'Failed') : 'Not run'}
                          </span>
                        </div>
                        {result?.failures?.length ? (
                          <details className="test-failures">
                            <summary>{result.failures.length} failure{result.failures.length === 1 ? '' : 's'}</summary>
                            {result.failures.map((failure, index) => (
                              <pre key={index}>Expected: {JSON.stringify(failure.expected)}{'\n'}Actual: {JSON.stringify(failure.actual)}</pre>
                            ))}
                          </details>
                        ) : null}
                      </article>
                    );
                  })}
                  {testCases.length === 0 ? (
                    <div className="doctor-empty">Save the pipeline and add a test case to get started.</div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeTab === 'estimate' ? (
              <div className="estimate-panel estimate-panel--horizontal">
                <div className="panel-heading">
                  <div><h2>Estimate</h2><p>Heuristic only · not measured</p></div>
                  <span className="estimate-badge">Estimate</span>
                </div>
                <div className="estimate-grid">
                  {estimate?.nodes?.map((nodeEstimate) => {
                    const node = nodes.find((item) => item.id === nodeEstimate.nodeId);
                    const max = Math.max(1, ...estimate.nodes.map((item) => item.estimatedMs));
                    return (
                      <div className="estimate-row" key={nodeEstimate.nodeId}>
                        <div><strong>{node?.data?.name || node?.data?.inputName || node?.type || nodeEstimate.nodeId}</strong>
                          <span>{nodeEstimate.estimatedMs} ms · {nodeEstimate.estimatedTokens} tokens</span></div>
                        <i style={{ width: `${Math.max(4, (nodeEstimate.estimatedMs / max) * 100)}%` }} />
                      </div>
                    );
                  })}
                </div>
                {estimate ? (
                  <div className="estimate-total">
                    <strong>Total estimate · {estimate.total.estimatedMs} ms</strong>
                    <span>{estimate.total.estimatedTokens} prompt tokens</span>
                    <small>{estimate.method}</small>
                  </div>
                ) : <div className="doctor-empty">Calculating estimate…</div>}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
      {pickerOpen ? (
        <div className="pipeline-modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="pipeline-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="picker-title">
            <div className="pipeline-modal-header">
              <h3 id="picker-title">Load Saved Pipeline</h3>
              <button type="button" className="pipeline-modal-close" onClick={() => setPickerOpen(false)} aria-label="Close dialog">×</button>
            </div>
            <div className="pipeline-modal-body">
              {pipelineList.length === 0 ? (
                <p className="pipeline-modal-empty">No saved pipelines found. Save your current canvas to create one.</p>
              ) : (
                <ul className="pipeline-modal-list">
                  {pipelineList.map((pipe) => {
                    const nodesList = safeJson(pipe.nodesJson);
                    const edgesList = safeJson(pipe.edgesJson);
                    const nodeCount = Array.isArray(nodesList) ? nodesList.length : 0;
                    const edgeCount = Array.isArray(edgesList) ? edgesList.length : 0;
                    return (
                      <li key={pipe.id} className="pipeline-modal-item">
                        <div>
                          <strong>Pipeline #{pipe.id}</strong>
                          <small>{nodeCount} nodes • {edgeCount} connections</small>
                        </div>
                        <button
                          type="button"
                          className="pipeline-button pipeline-button--small pipeline-button--accent"
                          onClick={() => loadById(pipe.id)}
                        >
                          Load
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {deployOpen ? <DeployModal pipelineId={pipelineId} onClose={() => setDeployOpen(false)} /> : null}
      {toast ? <div className="pipeline-toast" role="status">{toast}</div> : null}
    </main>
  );
};
