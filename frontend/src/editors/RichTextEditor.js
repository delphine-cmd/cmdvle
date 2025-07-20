import React, { useEffect, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Highlight from '@tiptap/extension-highlight';
import './RichTextEditor.css';

const fontOptions = ['Inter', 'Roboto', 'Georgia', 'Arial', 'Courier New'];
const fontSizes = ['12px', '14px', '16px', '18px', '24px', '32px'];
const headingOptions = [
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
  { label: 'Heading 4', level: 4 },
];

const RichTextEditor = ({ file, content, onChange }) => {
  const [saveMessage, setSaveMessage] = useState('');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Strike,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize.configure({ types: ['textStyle'] }),
      Color.configure({ types: ['textStyle'] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Heading.configure({ levels: [1, 2, 3, 4] }),
      BulletList,
      OrderedList,
      ListItem,
      Highlight.configure(),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
  if (editor && content) {
    editor.commands.setContent(content);
  }
}, [file?.id, content, editor]);


  // Keyboard shortcuts (Mac & Windows)
  const handleKeyDown = useCallback((e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmd = isMac ? e.metaKey : e.ctrlKey;

    if (cmd) {
      switch (e.key.toLowerCase()) {
        case 's': // Save
        e.preventDefault();
        saveContent();
        return;

        case 'k': // Clear
          e.preventDefault();
          editor.commands.clearContent();
          return;
        case 'z': // Undo
          e.preventDefault();
          editor.commands.undo();
          return;
        case 'y': // Redo
        case 'shift':
          if (e.shiftKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            editor.commands.redo();
            return;
          }
          break;
        case 'b':
          e.preventDefault();
          editor.commands.toggleBold();
          return;
        case 'i':
          e.preventDefault();
          editor.commands.toggleItalic();
          return;
        case 'u':
          e.preventDefault();
          editor.commands.toggleUnderline();
          return;
        case 'backspace': // Delete all
          e.preventDefault();
          editor.commands.clearContent();
          return;
        default:
          break;
      }
    }
  }, [editor]);

const saveContent = async () => {
  if (!file || !file.id) {
    console.warn('No active file to save.');
    return;
  }

  try {
    const res = await fetch(`http://localhost:4000/api/files/file/${file.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: editor.getHTML() }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Error saving file:', error.message || res.statusText);
    } else {
      console.log('✅ File saved successfully.');
    }
  } catch (err) {
    console.error('Failed to save file:', err);
  }
};


  if (!editor) return null;

  return (
    
    <div className="editor-wrapper">
      <div className="toolbar">

        {/* Fonts Group */}
        <div className="toolbar-group">
          <select
            defaultValue=""
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          >
            <option disabled value="">Font Family</option>
            {fontOptions.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>

          <select
            defaultValue=""
            onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          >
            <option disabled value="">Font Size</option>
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Headings Group */}
        <div className="toolbar-group">
          <select
            defaultValue=""
            onChange={(e) => {
              const level = parseInt(e.target.value);
              if (level) editor.chain().focus().toggleHeading({ level }).run();
            }}
          >
            <option disabled value="">Headings</option>
            {headingOptions.map(({ label, level }) => (
              <option key={level} value={level}>{label}</option>
            ))}
          </select>
        </div>

        {/* Alignment Group */}
        <div className="toolbar-group">
          <select
            defaultValue=""
            onChange={(e) =>
              editor.chain().focus().setTextAlign(e.target.value).run()
            }
          >
            <option disabled value="">Align</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>

        {/* Styling Group */}
        <div className="toolbar-group">
          <select
            defaultValue=""
            onChange={(e) => {
              const action = e.target.value;
              const chain = editor.chain().focus();
              if (action === 'bold') chain.toggleBold().run();
              if (action === 'italic') chain.toggleItalic().run();
              if (action === 'underline') chain.toggleUnderline().run();
              if (action === 'strike') chain.toggleStrike().run();
            }}
          >
            <option disabled value="">Style</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
            <option value="underline">Underline</option>
            <option value="strike">Strikethrough</option>
          </select>
        </div>

       

        {/* List Group */}
        <div className="toolbar-group">
          <select
            defaultValue=""
            onChange={(e) => {
              const type = e.target.value;
              const chain = editor.chain().focus();
              if (type === 'bullet') chain.toggleBulletList().run();
              else if (type === 'number') chain.toggleOrderedList().run();
              else if (type === 'letter') chain.setOrderedList().run(); // simulate
              else if (type === 'roman') chain.setOrderedList().run(); // simulate
            }}
          >
            <option disabled value="">Lists</option>
            <option value="bullet">• Bullets</option>
            <option value="number">1. Numbers</option>
            <option value="letter">a. Letters</option>
            <option value="roman">i. Roman</option>
          </select>
        </div>

        
       {/* Paragraph Group */}
    <div className="toolbar-group">
    <select
        defaultValue=""
        onChange={(e) => {
        if (e.target.value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        }
        }}
    >
    <option disabled value="">Text Style</option>
    <option value="paragraph">Paragraph</option>
  </select>
</div>

 {/* Color Group */}
<div className="toolbar-group">
  <label title="Text Color" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    🎨
    <input
  type="color"
  defaultValue="#ffff00" // <-- Replace black with a more neutral color
  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
  style={{
    width: '32px',
    height: '32px',
    padding: '0',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
  }}
/>

  </label>

  <label title="Highlight" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    🖍️
    <input
  type="color"
  defaultValue="#b12d1eff" // <-- Light yellow for highlighting
  onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
  style={{
    width: '32px',
    height: '32px',
    padding: '0',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
  }}
/>

  </label>
</div>


      </div>

      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
};

export default RichTextEditor;
