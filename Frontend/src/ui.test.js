import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

jest.mock('reactflow', () => {
  const mockReact = require('react');
  const ReactFlowMock = ({ nodes = [], children, onInit }) => {
    mockReact.useEffect(() => {
      onInit?.({ fitView: jest.fn(), project: (point) => point });
    }, [onInit]);
    return mockReact.createElement('div', { 'data-testid': 'mock-flow' }, [
      ...nodes.map((node) => mockReact.createElement('div', {
        'data-testid': `node-${node.id}`,
        className: node.className,
        key: node.id,
      }, node.id)),
      children,
    ]);
  };
  return {
    __esModule: true,
    default: ReactFlowMock,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    Handle: () => null,
    Position: { Left: 'left', Right: 'right' },
    MarkerType: { ArrowClosed: 'arrowclosed' },
    addEdge: (edge, edges) => [...edges, edge],
    applyNodeChanges: (_changes, nodes) => nodes,
    applyEdgeChanges: (_changes, edges) => edges,
  };
});

import { PipelineUI } from './ui';
import { useStore } from './store';

const recordedRun = {
  id: 501,
  pipelineId: 41,
  status: 'DONE',
  totalMs: 100,
  simulated: true,
  steps: [
    { id: 1, orderIndex: 0, nodeId: 'input', nodeType: 'customInput', status: 'DONE', durationMs: 2, inputJson: '{}', outputJson: '{"value":"ok"}' },
    { id: 2, orderIndex: 1, nodeId: 'condition', nodeType: 'condition', status: 'DONE', durationMs: 1, inputJson: '{}', outputJson: '{"condition":true,"branch":"true"}' },
    { id: 3, orderIndex: 2, nodeId: 'yes', nodeType: 'text', status: 'DONE', durationMs: 3, inputJson: '{}', outputJson: '{"text":"taken"}' },
    { id: 4, orderIndex: 3, nodeId: 'no', nodeType: 'text', status: 'SKIPPED', durationMs: 0, inputJson: '{}', outputJson: '{}' },
    { id: 5, orderIndex: 4, nodeId: 'output', nodeType: 'customOutput', status: 'DONE', durationMs: 1, inputJson: '{}', outputJson: '{"value":"taken"}' },
  ],
};

const initialState = {
  nodes: [
    { id: 'input', type: 'customInput', position: { x: 0, y: 0 }, data: { inputName: 'request' } },
    { id: 'condition', type: 'condition', position: { x: 100, y: 0 }, data: { expression: 'true' } },
    { id: 'yes', type: 'text', position: { x: 200, y: -30 }, data: { text: 'taken' } },
    { id: 'no', type: 'text', position: { x: 200, y: 30 }, data: { text: 'not taken' } },
    { id: 'output', type: 'customOutput', position: { x: 300, y: 0 }, data: {} },
  ],
  edges: [],
  nodeIDs: {},
  history: [],
  currentRun: null,
  replayIndex: -1,
  playing: false,
  speed: 1,
};

function response(body) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}

describe('PipelineUI staged workflow', () => {
  beforeEach(() => {
    useStore.setState(initialState);
    global.fetch = jest.fn((url, options = {}) => {
      const path = String(url);
      if (path.endsWith('/pipelines/validate')) {
        return response({
          score: 76,
          issues: [{
            id: 'llm-max-token',
            severity: 'WARNING',
            code: 'LLM_NO_MAX_TOKENS',
            nodeId: 'condition',
            title: 'No max-token limit set',
            detail: 'Set a safe generation limit.',
            fix: {
              label: 'Set max tokens to 400',
              ops: [{ type: 'setNodeData', nodeId: 'condition', key: 'maxTokens', value: 400 }],
            },
          }],
        });
      }
      if (path.endsWith('/pipelines/estimate')) {
        return response({ isEstimate: true, method: 'prompt length divided by four', nodes: [], total: { estimatedMs: 0, estimatedTokens: 0 } });
      }
      if (path.endsWith('/pipelines/save')) return response({ status: 'success', id: 41 });
      if (path.endsWith('/pipelines/execute')) return response({ status: 'success', runId: 501, simulated: true });
      if (path.endsWith('/runs/501')) return response(recordedRun);
      if (path.endsWith('/pipelines/41/tests/run')) {
        return response({
          results: [{
            testCaseId: 1,
            passed: false,
            failures: [{ assertion: { type: 'outputEquals' }, expected: 'expected output', actual: 'actual output' }],
          }],
        });
      }
      if (path.endsWith('/pipelines/41/tests')) {
        return response([{ id: 1, pipelineId: 41, name: 'Rejects an unexpected output', inputs: {}, assertions: [] }]);
      }
      if (options.method === 'POST' && path.includes('/from-run/')) {
        return response({ id: 2, name: 'Saved from run' });
      }
      return response({});
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('replay advances through node states and marks an untaken branch skipped', async () => {
    render(<PipelineUI />);
    fireEvent.click(screen.getByRole('button', { name: 'Run', exact: true }));
    await waitFor(() => expect(screen.getByTestId('node-input')).toHaveClass('run-node--active'));

    await act(async () => new Promise((resolve) => window.setTimeout(resolve, 1150)));
    expect(screen.getByTestId('node-condition')).toHaveClass('run-node--active');

    await act(async () => new Promise((resolve) => window.setTimeout(resolve, 1150)));
    expect(screen.getByTestId('node-yes')).toHaveClass('run-node--active');

    await act(async () => new Promise((resolve) => window.setTimeout(resolve, 1150)));
    expect(screen.getByTestId('node-no')).toHaveClass('run-node--skipped');
    expect(screen.getByText('Simulated')).toBeInTheDocument();
  });

  test('Flow Doctor fix updates the Zustand graph as one undoable change', async () => {
    render(<PipelineUI />);
    await screen.findByText('No max-token limit set');
    fireEvent.click(screen.getByRole('button', { name: 'Set max tokens to 400' }));

    await waitFor(() => {
      expect(useStore.getState().nodes.find((node) => node.id === 'condition').data.maxTokens).toBe(400);
    });
    expect(useStore.getState().history).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Applied: Set max tokens to 400');
  });

  test('Tests tab reveals expected and actual output for a failing case', async () => {
    render(<PipelineUI />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/pipelines/save'), expect.objectContaining({ method: 'POST' }),
    ));

    fireEvent.click(screen.getByRole('tab', { name: 'Tests' }));
    await screen.findByText('Rejects an unexpected output');
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }));
    fireEvent.click(await screen.findByText('1 failure'));

    expect(screen.getByText(/Expected: "expected output"/)).toBeInTheDocument();
    expect(screen.getByText(/Actual: "actual output"/)).toBeInTheDocument();
  });
});
