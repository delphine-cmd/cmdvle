import React from 'react';
import RichTextEditor from './RichTextEditor';
import CodeEditor from './editors/CodeEditor'; // ⬅️ NEW import

const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const getLanguageFromExtension = (ext) => {
  const map = {
    js: 'javascript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
  };
  return map[ext] || 'plaintext';
};

const SmartEditor = ({ file, content, onChange }) => {
  const ext = getFileExtension(file?.name);
  console.log('🧩 Detected extension:', ext);
console.log('File name:', file?.name);
console.log('Detected extension:', ext);

  const isTextFile = ['txt', 'md', 'rtf'].includes(ext) || !ext;
  const isCodeFile = ['js', 'py', 'html', 'css', 'json'].includes(ext); // ⬅️ NEW check

  if (isTextFile) {
    return <RichTextEditor content={content} onChange={onChange} />;
  }

  if (isCodeFile) {
    return (
      <CodeEditor
        content={content}
        onChange={onChange}
        language={getLanguageFromExtension(ext)}
      />
    );
  }

  return (
    <div style={{ padding: '1rem', color: 'white' }}>
      No editor available for this file type: <strong>{ext || 'unknown'}</strong>
    </div>
  );
};

export default SmartEditor;
