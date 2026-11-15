const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

async function parseResponse(response) {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || `Request failed with status ${response.status}`);
  }
  return body;
}

function pipelineForm(pipeline, pipelineId) {
  const form = new FormData();
  form.append('pipeline', JSON.stringify(pipeline));
  if (pipelineId) form.append('pipelineId', pipelineId);
  return form;
}

export async function savePipeline(pipeline) {
  return parseResponse(await fetch(`${API_BASE}/pipelines/save`, {
    method: 'POST',
    body: pipelineForm(pipeline),
  }));
}

export async function loadPipeline(pipelineId) {
  return parseResponse(await fetch(`${API_BASE}/pipelines/${pipelineId}`));
}

export async function executePipeline(pipeline, pipelineId) {
  return parseResponse(await fetch(`${API_BASE}/pipelines/execute`, {
    method: 'POST',
    body: pipelineForm(pipeline, pipelineId),
  }));
}

export async function getRun(runId) {
  return parseResponse(await fetch(`${API_BASE}/runs/${runId}`));
}

export async function validatePipeline(pipeline) {
  return parseResponse(await fetch(`${API_BASE}/pipelines/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline),
  }));
}

export async function estimatePipeline(pipeline) {
  return parseResponse(await fetch(`${API_BASE}/pipelines/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline),
  }));
}

export async function getTestCases(pipelineId) {
  return parseResponse(await fetch(`${API_BASE}/pipelines/${pipelineId}/tests`));
}

export async function runTestCases(pipelineId) {
  return parseResponse(await fetch(`${API_BASE}/pipelines/${pipelineId}/tests/run`, { method: 'POST' }));
}

export async function createTestFromRun(pipelineId, runId) {
  return parseResponse(await fetch(`${API_BASE}/pipelines/${pipelineId}/tests/from-run/${runId}`, {
    method: 'POST',
  }));
}
