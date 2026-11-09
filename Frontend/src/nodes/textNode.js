// textNode.js

import { useState, useRef, useEffect } from 'react';
import { Position, useUpdateNodeInternals } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const TextNode = ({ id, data }) => {
  const [currText, setCurrText] = useState(data?.text || '{{input}}');
  const [variables, setVariables] = useState([]);
  const textareaRef = useRef(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeField = useStore((state) => state.updateNodeField);

  useEffect(() => {
    setCurrText(data?.text || '{{input}}');
  }, [data?.text]);

  useEffect(() => {
    const matches = currText.match(/{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g) || [];
    const uniqueVars = [...new Set(matches.map((v) => v.replace(/[{}]/g, '').trim()))];
    
    if (JSON.stringify(uniqueVars) !== JSON.stringify(variables)) {
        setVariables(uniqueVars);
        updateNodeInternals(id);
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.max(64, textareaRef.current.scrollHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      updateNodeInternals(id);
    }

    }, [currText, id, variables, updateNodeInternals]);


  const handleTextChange = (e) => {
    const nextValue = e.target.value;
    setCurrText(nextValue);
    updateNodeField(id, 'text', nextValue);
  };

  // Default output handle on the right
  const handles = [
    { type: 'source', position: Position.Right, id: 'output' }
  ];

  // Map extracted variables to dynamically generated handles on the left
  variables.forEach((variable, index) => {
    const spacing = 100 / (variables.length + 1);
    handles.push({
      type: 'target',
      position: Position.Left,
      id: variable,
      style: { top: `${spacing * (index + 1)}%` }
    });
  });

  return (
    <BaseNode id={id} label="Text" handles={handles}>
      <label style={{ display: 'block' }}>
        Text:
        <textarea
          ref={textareaRef}
          value={currText}
          onChange={handleTextChange}
          placeholder='Type "{{" to utilize variables'
          style={{
            display: 'block',
            marginTop: '5px',
            boxSizing: 'border-box',
            width: '100%',
            resize: 'none',
            overflow: 'hidden',
            fontFamily: 'inherit',
            fontSize: '14px',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-select)',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            backgroundColor: 'var(--bg-input)',
            minHeight: '64px',
            lineHeight: '1.4',
            color: 'var(--text-input)',
            transition: 'background 0.2s, color 0.2s'
          }}
        />
      </label>
    </BaseNode>
  );
}
