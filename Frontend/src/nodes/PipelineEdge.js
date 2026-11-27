import { BaseEdge, getBezierPath } from 'reactflow';

export function PipelineEdge(props) {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
  const pathId = `edge-motion-${String(props.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const status = props.data?.status || 'idle';
  const active = status === 'active';
  const done = status === 'done';
  const skipped = status === 'skipped';

  const stroke = done
    ? '#22c55e'
    : active
      ? '#8b5cf6'
      : 'rgba(255, 255, 255, 0.24)';

  return (
    <>
      <BaseEdge
        id={pathId}
        path={path}
        className={`edge-state--${status}`}
        markerEnd={props.markerEnd}
        style={{
          stroke,
          strokeWidth: active || done ? 2.2 : 1.6,
          strokeDasharray: skipped || active ? '5 5' : undefined,
          opacity: skipped ? 0.25 : 1,
        }}
      />
      {active ? (
        <circle r="3.5" fill="#a78bfa" className="pipeline-edge-dot">
          <animateMotion dur="1.2s" repeatCount="indefinite">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ) : null}
    </>
  );
}
