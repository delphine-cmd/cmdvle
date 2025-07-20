import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const SpreadsheetEditor = ({ content, onChange }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
  if (!content) return;

  try {
    // Convert base64 string to ArrayBuffer
    const binaryStr = atob(content);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const workbook = XLSX.read(bytes.buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsed = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('📊 Parsed data:', parsed);
    setData(parsed);
  } catch (err) {
    console.error('❌ Failed to parse spreadsheet:', err);
  }
}, [content]);


  const handleChange = (rowIdx, colIdx, value) => {
    const updated = data.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? value : cell || ''))
    );
    setData(updated);

    const ws = XLSX.utils.aoa_to_sheet(updated);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const output = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
    onChange(output);
  };

  return (
    <div style={{ overflowX: 'auto', padding: '1rem', maxHeight: '80vh', overflowY: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => (
                <td key={colIdx} style={{ border: '1px solid #ccc', padding: '4px' }}>
                  <input
                    type="text"
                    value={cell || ''}
                    onChange={(e) => handleChange(rowIdx, colIdx, e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      padding: '2px',
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SpreadsheetEditor;
