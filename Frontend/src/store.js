// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';

export const useStore = create((set, get) => ({
    nodes: [],
    edges: [],
    nodeIDs: {},
    currentRun: null,
    replayIndex: -1,
    playing: false,
    speed: 1,
    history: [],
    setCurrentRun: (currentRun) => set({ currentRun, replayIndex: -1, playing: false }),
    setReplayIndex: (replayIndex) => set({ replayIndex }),
    setPlaying: (playing) => set({ playing }),
    toggleSpeed: () => set({ speed: get().speed === 1 ? 2 : 1 }),
    undo: () => {
      const history = get().history;
      if (!history.length) return;
      const previous = history[history.length - 1];
      set({ nodes: previous.nodes, edges: previous.edges, history: history.slice(0, -1) });
    },
    applyDoctorFix: (operations) => {
      const { nodes, edges } = get();
      const nextNodes = nodes.map((node) => ({ ...node, data: { ...node.data } }));
      const nextEdges = [...edges];
      operations.forEach((operation) => {
        if (operation.type === 'addEdge') {
          const target = nextNodes.find((node) => node.id === operation.target);
          const targetHandle = target?.type === 'llm'
            ? 'prompt'
            : target?.type === 'text'
              ? (target.data?.text?.match(/{{\s*([\w.-]+)\s*}}/) || [])[1]
              : target?.type === 'customOutput' || target?.type === 'output'
                ? 'value'
              : undefined;
          nextEdges.push({
            id: `doctor-${Date.now()}-${nextEdges.length}`,
            source: operation.source,
            target: operation.target,
            sourceHandle: operation.sourceHandle,
            targetHandle,
            type: 'pipeline',
          });
        } else if (operation.type === 'setNodeData') {
          const node = nextNodes.find((item) => item.id === operation.nodeId);
          if (node) node.data[operation.key] = operation.value;
        } else if (operation.type === 'renameNode') {
          const node = nextNodes.find((item) => item.id === operation.nodeId);
          if (node) {
            const nameKey = node.type === 'customInput' || node.type === 'input'
              ? 'inputName'
              : node.type === 'customOutput' || node.type === 'output'
                ? 'outputName'
                : 'name';
            node.data[nameKey] = operation.name;
            node.data.name = operation.name;
          }
        }
      });
      set({
        history: [...get().history, { nodes, edges }],
        nodes: nextNodes,
        edges: nextEdges,
      });
    },
    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },
    setNodes: (nodes) => {
        set({ nodes });
    },
    setEdges: (edges) => {
        set({ edges });
    },
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      set({
        edges: addEdge({
          ...connection,
          type: 'pipeline',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'var(--border-2)',
            height: '16px',
            width: '16px'
          }
        }, get().edges),
      });
    },
    removeNode: (nodeId) => {
      set({
        nodes: get().nodes.filter((node) => node.id !== nodeId),
        edges: get().edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
      });
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      set({
        nodes: get().nodes.map((node) => node.id === nodeId
          ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
          : node),
      });
    },
  }));
