// src/editors/CodeEditor.js
import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

const CodeEditor = ({ content, onChange, language = 'javascript' }) => {
  const [value, setValue] = useState(content);

  useEffect(() => {
    setValue(content); // Update when file changes
  }, [content]);

  const handleEditorChange = (val) => {
    setValue(val);
    onChange(val);
  };

  // src/editors/CodeEditor.js
return (
  <div style={{ height: '100%', width: '100%' }}>
    <Editor
      height="100%"
      defaultLanguage={language}
      value={value}
      onChange={handleEditorChange}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: 'on',
      }}
    />
  </div>
);

};

export default CodeEditor;
