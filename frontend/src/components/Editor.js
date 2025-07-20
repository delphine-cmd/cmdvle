import React from 'react';
import RichTextEditor from '../editors/RichTextEditor';
import CodeEditor from '../editors/CodeEditor';
import SpreadsheetEditor from '../editors/SpreadsheetEditor';

const getFileExtension = (name) => {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const getLanguageFromExtension = (ext) => {
  const map = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rb: 'ruby',
    php: 'php',
    rs: 'rust',
    sh: 'shell',
    swift: 'swift',
    kt: 'kotlin',
  };
  return map[ext] || 'plaintext';
};

const Editor = ({ file, content, onChange }) => {
  if (!file || !file.name) return null;

  const extension = getFileExtension(file.name);

  const isTextFile = ['txt', 'md', 'rtf'].includes(extension) || !extension;
  const isCodeFile = [
    'js', 'ts', 'tsx',
    'py', 'html', 'css', 'json',
    'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'rs', 'sh', 'swift', 'kt',
  ].includes(extension);
  const isSpreadsheet = ['xlsx', 'xls', 'csv'].includes(extension);

  if (isTextFile) {
    return <RichTextEditor file={file} content={content} onChange={onChange} />;
  }

  if (isCodeFile) {
    return (
      <CodeEditor
        content={content}
        onChange={onChange}
        language={getLanguageFromExtension(extension)}
      />
    );
  }

  if (isSpreadsheet) {
  return <SpreadsheetEditor content={file.contentBase64} onChange={onChange} />;
}


  return (
    <div style={{ padding: '1rem', fontStyle: 'italic', color: 'gray' }}>
      No editor available for ".{extension}" files.
    </div>
  );
};

export default Editor;
