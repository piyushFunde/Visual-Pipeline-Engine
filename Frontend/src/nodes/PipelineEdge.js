import { BaseEdge, getSmoothStepPath } from 'reactflow';

export function PipelineEdge(props) {
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    borderRadius: 12,
  });
  const pathId = `edge-motion-${String(props.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const active = props.data?.status === 'active';
  const done = props.data?.status === 'done';
  return (
    <>
      <BaseEdge
        id={pathId}
        path={path}
        className={`edge-state--${props.data?.status || 'idle'}`}
        markerEnd={props.markerEnd}
        style={{
          stroke: done ? 'var(--done)' : active ? 'var(--accent)' : 'var(--border-2)',
          strokeWidth: active || done ? 2 : 1.5,
          strokeDasharray: done ? undefined : '5 5',
          opacity: props.data?.status === 'skipped' ? 0.3 : 1,
        }}
      />
      {active ? (
        <circle r="3" fill="var(--accent)" className="pipeline-edge-dot">
          <animateMotion dur="1.4s" repeatCount="indefinite">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ) : null}
    </>
  );
}
