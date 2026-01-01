import React, { useState, useRef, useEffect } from 'react';
import { 
  FiBold, 
  FiItalic, 
  FiUnderline, 
  FiCode, 
  FiLink, 
  FiType,
  FiMoreHorizontal,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight
} from 'react-icons/fi';
import './TelegramTextToolbar.css';

const TelegramTextToolbar = ({ 
  onFormatText, 
  onInsertLink, 
  selectedText, 
  textAreaRef,
  isVisible,
  position 
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const toolbarRef = useRef(null);

  // Text formatting options
  const formatOptions = [
    {
      id: 'bold',
      icon: <FiBold />,
      label: 'Bold',
      shortcut: 'Ctrl+B',
      format: (text) => `**${text}**`
    },
    {
      id: 'italic',
      icon: <FiItalic />,
      label: 'Italic',
      shortcut: 'Ctrl+I',
      format: (text) => `*${text}*`
    },
    {
      id: 'underline',
      icon: <FiUnderline />,
      label: 'Underline',
      shortcut: 'Ctrl+U',
      format: (text) => `__${text}__`
    },
    {
      id: 'strikethrough',
      icon: <span style={{ textDecoration: 'line-through' }}>S</span>,
      label: 'Strikethrough',
      shortcut: 'Ctrl+Shift+X',
      format: (text) => `~~${text}~~`
    },
    {
      id: 'code',
      icon: <FiCode />,
      label: 'Monospace',
      shortcut: 'Ctrl+Shift+M',
      format: (text) => `\`${text}\``
    },
    {
      id: 'spoiler',
      icon: <span>||</span>,
      label: 'Spoiler',
      shortcut: 'Ctrl+Shift+P',
      format: (text) => `||${text}||`
    }
  ];

  const moreOptions = [
    {
      id: 'quote',
      icon: <span>"</span>,
      label: 'Quote',
      format: (text) => `> ${text}`
    },
    {
      id: 'codeblock',
      icon: <FiCode />,
      label: 'Code Block',
      format: (text) => `\`\`\`\n${text}\n\`\`\``
    },
    {
      id: 'link',
      icon: <FiLink />,
      label: 'Link',
      action: 'link'
    }
  ];

  // Handle format application
  const handleFormat = (option) => {
    if (option.action === 'link') {
      setLinkText(selectedText || '');
      setShowLinkDialog(true);
      return;
    }

    const formattedText = option.format(selectedText || 'text');
    onFormatText(formattedText, option.id);
    setShowMoreOptions(false);
  };

  // Handle link insertion
  const handleInsertLink = () => {
    if (linkUrl && linkText) {
      const linkMarkdown = `[${linkText}](${linkUrl})`;
      onInsertLink(linkMarkdown);
      setShowLinkDialog(false);
      setLinkUrl('');
      setLinkText('');
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handleFormat(formatOptions.find(opt => opt.id === 'bold'));
            break;
          case 'i':
            e.preventDefault();
            handleFormat(formatOptions.find(opt => opt.id === 'italic'));
            break;
          case 'u':
            e.preventDefault();
            handleFormat(formatOptions.find(opt => opt.id === 'underline'));
            break;
          case 'm':
            if (e.shiftKey) {
              e.preventDefault();
              handleFormat(formatOptions.find(opt => opt.id === 'code'));
            }
            break;
          case 'x':
            if (e.shiftKey) {
              e.preventDefault();
              handleFormat(formatOptions.find(opt => opt.id === 'strikethrough'));
            }
            break;
          case 'p':
            if (e.shiftKey) {
              e.preventDefault();
              handleFormat(formatOptions.find(opt => opt.id === 'spoiler'));
            }
            break;
          case 'k':
            e.preventDefault();
            handleFormat(moreOptions.find(opt => opt.id === 'link'));
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedText]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setShowMoreOptions(false);
        setShowLinkDialog(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <div 
        className="telegram-text-toolbar" 
        ref={toolbarRef}
        style={{
          top: position?.top || 'auto',
          left: position?.left || 'auto',
          bottom: position?.bottom || 'auto',
          right: position?.right || 'auto'
        }}
      >
        <div className="toolbar-section">
          {formatOptions.slice(0, 4).map((option) => (
            <button
              key={option.id}
              className="toolbar-btn"
              onClick={() => handleFormat(option)}
              title={`${option.label} (${option.shortcut})`}
            >
              {option.icon}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          {formatOptions.slice(4).map((option) => (
            <button
              key={option.id}
              className="toolbar-btn"
              onClick={() => handleFormat(option)}
              title={`${option.label} (${option.shortcut})`}
            >
              {option.icon}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <button
            className="toolbar-btn"
            onClick={() => handleFormat(moreOptions.find(opt => opt.id === 'link'))}
            title="Insert Link (Ctrl+K)"
          >
            <FiLink />
          </button>

          <button
            className={`toolbar-btn ${showMoreOptions ? 'active' : ''}`}
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            title="More options"
          >
            <FiMoreHorizontal />
          </button>
        </div>

        {showMoreOptions && (
          <div className="toolbar-dropdown">
            {moreOptions.filter(opt => opt.id !== 'link').map((option) => (
              <button
                key={option.id}
                className="dropdown-item"
                onClick={() => handleFormat(option)}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showLinkDialog && (
        <div className="link-dialog-overlay">
          <div className="link-dialog">
            <div className="link-dialog-header">
              <h3>Insert Link</h3>
              <button 
                className="close-btn"
                onClick={() => setShowLinkDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="link-dialog-body">
              <div className="form-group">
                <label>Link Text:</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Enter link text"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>URL:</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="link-dialog-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowLinkDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleInsertLink}
                disabled={!linkUrl || !linkText}
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TelegramTextToolbar;