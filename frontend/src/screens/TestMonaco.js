import React from 'react';
import Editor from '@monaco-editor/react';

const TestMonaco = () => {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue="// Hello Monaco"
        theme="vs-dark"
        options={{
          fontSize: 16,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
};

export default TestMonaco;
