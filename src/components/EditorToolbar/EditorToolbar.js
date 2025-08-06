import { useState } from 'react';
import './EditorToolbar.css';

const EditorToolbar = ({ editorRef }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const executeCommand = (command, value = null) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(command, false, value);

            const event = new Event('input', { bubbles: true });
            editorRef.current.dispatchEvent(event);
        }
    };

    const insertList = (listType) => {
        if (editorRef.current) {
            editorRef.current.focus();

            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const selectedText = selection.toString();

            const listElement = document.createElement(listType === 'bullet' ? 'ul' : 'ol');

            if (listType === 'bullet') {
                listElement.style.listStyleType = 'disc';
            } else if (listType === 'number') {
                listElement.style.listStyleType = 'decimal';
            } else if (listType === 'roman') {
                listElement.style.listStyleType = 'lower-roman';
            } else if (listType === 'alpha') {
                listElement.style.listStyleType = 'lower-alpha';
            }

            if (selectedText.trim()) {
                // Si hay texto seleccionado, dividir por líneas
                const lines = selectedText.split('\n').filter(line => line.trim());

                if (lines.length > 1) {
                    lines.forEach(line => {
                        const listItem = document.createElement('li');
                        listItem.textContent = line.trim();
                        listElement.appendChild(listItem);
                    });
                } else {
                    const listItem = document.createElement('li');
                    listItem.textContent = selectedText.trim();
                    listElement.appendChild(listItem);
                }
            } else {
                const listItem = document.createElement('li');
                listItem.innerHTML = 'Nuevo elemento';
                listElement.appendChild(listItem);
            }

            range.deleteContents();
            range.insertNode(listElement);

            const lastItem = listElement.lastElementChild;
            if (lastItem) {
                const newRange = document.createRange();
                newRange.setStart(lastItem, lastItem.childNodes.length);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }

            const event = new Event('input', { bubbles: true });
            editorRef.current.dispatchEvent(event);
        }
    };

    return (
        <div className="editor-toolbar">
            <div className="toolbar-group">
                <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => executeCommand('bold')}
                    title="Negrita (Ctrl+B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => executeCommand('italic')}
                    title="Cursiva (Ctrl+I)"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => executeCommand('underline')}
                    title="Subrayado (Ctrl+U)"
                >
                    <u>U</u>
                </button>
            </div>

            <div className="toolbar-separator"></div>

            <div className="toolbar-group">
                <div className="dropdown-container">
                    <button
                        type="button"
                        className="toolbar-btn dropdown-btn"
                        onClick={() => setShowDropdown(!showDropdown)}
                        title="Tipo de lista"
                    >
                        Viñetas ▼
                    </button>
                    {showDropdown && (
                        <div className="dropdown-menu">
                            <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => { insertList('bullet'); setShowDropdown(false); }}
                            >
                                •
                            </button>
                            <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => { insertList('number'); setShowDropdown(false); }}
                            >
                                1.
                            </button>
                            <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => { insertList('roman'); setShowDropdown(false); }}
                            >
                                i.
                            </button>
                            <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => { insertList('alpha'); setShowDropdown(false); }}
                            >
                                a.
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorToolbar;