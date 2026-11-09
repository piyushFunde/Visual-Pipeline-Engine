// toolbar.js

import { DraggableNode } from './draggableNode';
import { useStore } from './store';

export const PipelineToolbar = () => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const setNodes = useStore((state) => state.setNodes);
    const setEdges = useStore((state) => state.setEdges);

    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('pipeline', JSON.stringify({ nodes, edges }));

            const response = await fetch('http://localhost:8080/pipelines/save', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            alert(`Pipeline saved with ID: ${data.id}`);
        } catch (error) {
            console.error('Error saving pipeline:', error);
            alert('Error saving pipeline. Ensure backend is running.');
        }
    };

    const handleLoad = async () => {
        try {
            // For simplicity, load the first pipeline (ID 1)
            const response = await fetch('http://localhost:8080/pipelines/1');

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (data.status === 'success') {
                const loadedNodes = JSON.parse(data.nodes);
                const loadedEdges = JSON.parse(data.edges);
                setNodes(loadedNodes);
                setEdges(loadedEdges);
                alert('Pipeline loaded successfully');
            } else {
                alert('Pipeline not found');
            }
        } catch (error) {
            console.error('Error loading pipeline:', error);
            alert('Error loading pipeline. Ensure backend is running.');
        }
    };

    const handleExecute = async () => {
        try {
            const formData = new FormData();
            formData.append('pipeline', JSON.stringify({ nodes, edges }));

            const response = await fetch('http://localhost:8080/pipelines/execute', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (data.status === 'success') {
                console.log('Execution logs:', data.logs);
                alert('Pipeline executed successfully. Check console for logs.');
            } else {
                alert('Execution failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error executing pipeline:', error);
            alert('Error executing pipeline. Ensure backend is running.');
        }
    };

    const toolbarStyle = {
        padding: '16px',
        borderRadius: '24px',
        background: 'rgba(12, 19, 45, 0.96)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        marginBottom: '18px',
    };

    const actionsStyle = {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px',
    };

    const actionButtonStyle = {
        background: 'linear-gradient(135deg, #4f6cff 0%, #5ef2ff 100%)',
        color: '#0b1120',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '999px',
        fontWeight: 700,
        fontSize: '0.95rem',
        letterSpacing: '0.02em',
        cursor: 'pointer',
        minWidth: '140px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 10px 30px rgba(79, 108, 255, 0.28)',
    };

    const nodesStyle = {
        marginTop: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
    };

    return (
        <div style={toolbarStyle}>
            <div style={actionsStyle}>
                <button type='button' onClick={handleSave} style={actionButtonStyle}>Save Pipeline</button>
                <button type='button' onClick={handleLoad} style={actionButtonStyle}>Load Pipeline</button>
                <button type='button' onClick={handleExecute} style={actionButtonStyle}>Execute Pipeline</button>
            </div>
            <div style={nodesStyle}>
                <DraggableNode type='customInput' label='Input' />
                <DraggableNode type='llm' label='LLM' />
                <DraggableNode type='customOutput' label='Output' />
                <DraggableNode type='text' label='Text' />
                <DraggableNode type='timer' label='Timer' />
                <DraggableNode type='condition' label='Condition' />
                <DraggableNode type='api' label='API Request' />
                <DraggableNode type='database' label='Database' />
                <DraggableNode type='webhook' label='Webhook' />
            </div>
        </div>
    );
};
