import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import { shallow } from 'zustand/shallow';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Database,
  GitBranch,
  Globe,
  LoaderCircle,
  LogIn,
  LogOut,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
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

export const PipelineUI = ({ onBack, onLogout }) => {
  const wrapperRef = useRef(null);
  const flowInstanceRef = useRef(null);
  const suppressUnsavedRef = useRef(false);
  const [activeTab, setActiveTab] = useState('doctor');
  const [pipelineId, setPipelineId] = useState(null);
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
      const result = await savePipeline(graph);
      if (result.status !== 'success') throw new Error(result.message || 'Pipeline could not be saved.');
      setPipelineId(result.id);
      setDraftSaved(true);
      setToast('Draft saved');
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
          <button type="button" className="pipeline-back" aria-label="Back to home" onClick={onBack}>
            <ArrowLeft size={15} />
          </button>
          <Workflow size={19} aria-hidden="true" />
          <div className="pipeline-brand__titles">
            <span>Replayflow / Projects</span>
            <strong>Support triage</strong>
          </div>
        </div>
        <div className="pipeline-topbar__actions">
          <button
            type="button"
            className={`flow-health flow-health--${scoreTone}`}
            onClick={() => setActiveTab('doctor')}
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
          {onLogout ? <button type="button" className="pipeline-logout" onClick={onLogout}>Log out</button> : null}
        </div>
      </header>

      <div className="pipeline-workspace">
        <section className="pipeline-canvas-column" aria-label="Pipeline canvas">
          <div className="pipeline-canvas" ref={wrapperRef} onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
            <nav className="node-dock" aria-label="Add pipeline node">
              {NODE_CATALOG.map(({ type, label, icon: Icon }) => (
                <button
                  type="button"
                  key={type}
                  aria-label={`Add ${label} node`}
                  title={`Add ${label}`}
                  onClick={() => addNodeAt(type)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/reactflow', type);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                </button>
              ))}
            </nav>
            {nodes.length === 0 ? (
              <div className="pipeline-empty">
                <span><Plus size={20} /></span>
                <strong>Build your first flow</strong>
                <small>Add a node from the dock and connect its next step.</small>
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
              <Background color="#29292D" gap={20} size={1} />
              <Controls />
              <MiniMap
                pannable
                zoomable
                nodeColor={(node) => node.className?.includes('skipped') ? '#4A4A50' : '#9FD8B7'}
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

        <aside className="pipeline-inspector" aria-label="Pipeline inspector">
          <div className="pipeline-tabs" role="tablist" aria-label="Pipeline tools">
            {[
              ['doctor', 'Flow Doctor'],
              ['tests', 'Tests'],
              ['estimate', 'Estimate'],
            ].map(([tab, title]) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                key={tab}
                onClick={() => setActiveTab(tab)}
              >
                {title}
              </button>
            ))}
          </div>
          {error ? <div className="pipeline-error" role="alert">{error}</div> : null}
          {activeTab === 'doctor' ? (
            <div className="doctor-panel">
              <div className="doctor-summary">
                <div className={`score-ring score-ring--${scoreTone}`} style={{ '--score': `${scoreLabel}%` }}>
                  <span>{scoreLabel}</span>
                </div>
                <div>
                  <h2>Flow Doctor</h2>
                  <p>{visibleIssues.length} issues to review. Click one to find it on the canvas.</p>
                </div>
              </div>
              <div className="doctor-issues">
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

          {activeTab === 'tests' ? (
            <div className="tests-panel">
              <div className="panel-heading">
                <div><h2>Test cases</h2><p>Run saved assertions against this flow.</p></div>
                <button type="button" className="doctor-fix" onClick={runTests} disabled={busy !== ''}>
                  {busy === 'tests' ? 'Running…' : 'Run all'}
                </button>
              </div>
              <p className="test-summary">
                {Object.values(testResults).filter((result) => result.passed).length} of {testCases.length} passing
              </p>
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
          ) : null}

          {activeTab === 'estimate' ? (
            <div className="estimate-panel">
              <div className="panel-heading"><div><h2>Estimate</h2><p>Heuristic only · not measured</p></div></div>
              <span className="estimate-badge">Estimate</span>
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
              {estimate ? (
                <div className="estimate-total">
                  <strong>Total estimate · {estimate.total.estimatedMs} ms</strong>
                  <span>{estimate.total.estimatedTokens} prompt tokens</span>
                  <small>{estimate.method}</small>
                </div>
              ) : <div className="doctor-empty">Calculating estimate…</div>}
            </div>
          ) : null}
        </aside>
      </div>

      <section className="replay-panel" aria-label="Run replay">
        <div className="replay-header">
          <div className="replay-title">
            <h2>Run replay</h2>
            {currentRun?.simulated ? <span className="simulated-chip">Simulated</span> : null}
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
      {toast ? <div className="pipeline-toast" role="status">{toast}</div> : null}
    </main>
  );
};
