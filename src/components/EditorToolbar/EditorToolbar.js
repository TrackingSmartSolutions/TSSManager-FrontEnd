import { useState } from 'react';
import './EditorToolbar.css';
import Swal from 'sweetalert2';

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

    const insertLink = async () => {
        if (editorRef.current) {
            const selection = window.getSelection();
            const selectedText = selection.toString();

            // Verificar si hay texto seleccionado
            if (!selectedText) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Texto no seleccionado',
                    text: 'Por favor, selecciona el texto al que quieres agregar un enlace',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            const range = selection.getRangeAt(0);
            const savedRange = range.cloneRange();

            // Solicitar URL al usuario
            const { value: url } = await Swal.fire({
                title: 'Insertar hipervínculo',
                input: 'url',
                inputLabel: 'Ingresa la URL del enlace',
                inputPlaceholder: 'https://ejemplo.com',
                inputValue: 'https://',
                showCancelButton: true,
                confirmButtonText: 'Insertar',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => {
                    if (!value || !value.trim()) {
                        return 'Debes ingresar una URL';
                    }
                }
            });

            if (url && url.trim()) {
                // Validar que sea una URL válida
                let finalUrl = url.trim();
                if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                    finalUrl = 'https://' + finalUrl;
                }

                editorRef.current.focus();
                selection.removeAllRanges();
                selection.addRange(savedRange);

                // Crear el enlace
                document.execCommand('createLink', false, finalUrl);

                // Disparar evento de input
                const event = new Event('input', { bubbles: true });
                editorRef.current.dispatchEvent(event);
            }
        }
    };

    const editLink = async () => {
        const selection = window.getSelection();
        const anchorNode = selection.anchorNode;

        // Buscar si el cursor está sobre un enlace
        let linkElement = anchorNode.parentElement;
        if (linkElement && linkElement.tagName === 'A') {
            const currentUrl = linkElement.href;

            const { value: newUrl } = await Swal.fire({
                title: 'Editar hipervínculo',
                input: 'url',
                inputLabel: 'Editar URL',
                inputValue: currentUrl,
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => {
                    if (!value || !value.trim()) {
                        return 'Debes ingresar una URL';
                    }
                }
            });

            if (newUrl !== undefined && newUrl.trim()) {
                linkElement.href = newUrl.trim();

                const event = new Event('input', { bubbles: true });
                editorRef.current.dispatchEvent(event);
            }
        } else {
            insertLink();
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
                <button
                    type="button"
                    className="toolbar-btn"
                    onClick={editLink}
                    title="Insertar hipervínculo"
                >
                    🔗
                </button>
            </div>

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