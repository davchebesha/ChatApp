import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './DraggableSidebar.css';

const DraggableSidebar = ({ 
  children, 
  side = 'left', 
  initialWidth = 280, 
  minWidth = 200, 
  maxWidth = 500,
  isOpen = true,
  onWidthChange,
  onToggle 
}) => {
  const { theme } = useTheme();
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const sidebarRef = useRef(null);
  const resizerRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartWidth(width);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;

    const deltaX = side === 'left' ? e.clientX - dragStartX : dragStartX - e.clientX;
    const newWidth = Math.min(maxWidth, Math.max(minWidth, dragStartWidth + deltaX));
    
    setWidth(newWidth);
    if (onWidthChange) {
      onWidthChange(newWidth);
    }
  }, [isResizing, dragStartX, dragStartWidth, side, minWidth, maxWidth, onWidthChange]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Touch support for mobile
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setIsResizing(true);
    setIsDragging(true);
    setDragStartX(touch.clientX);
    setDragStartWidth(width);
  }, [width]);

  const handleTouchMove = useCallback((e) => {
    if (!isResizing) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = side === 'left' ? touch.clientX - dragStartX : dragStartX - touch.clientX;
    const newWidth = Math.min(maxWidth, Math.max(minWidth, dragStartWidth + deltaX));
    
    setWidth(newWidth);
    if (onWidthChange) {
      onWidthChange(newWidth);
    }
  }, [isResizing, dragStartX, dragStartWidth, side, minWidth, maxWidth, onWidthChange]);

  const handleTouchEnd = useCallback(() => {
    setIsResizing(false);
    setIsDragging(false);
  }, []);

  return (
    <div 
      ref={sidebarRef}
      className={`draggable-sidebar ${side}-sidebar ${isOpen ? 'open' : 'closed'} ${isDragging ? 'dragging' : ''}`}
      style={{ 
        width: isOpen ? `${width}px` : '0px',
        [side]: 0 
      }}
      data-theme={theme?.name}
    >
      <div className="sidebar-content">
        {children}
      </div>
      
      {isOpen && (
        <div 
          ref={resizerRef}
          className={`sidebar-resizer ${side}-resizer ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="resizer-handle">
            <div className="resizer-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      
      {/* Resize indicator */}
      {isDragging && (
        <div className="resize-indicator">
          {width}px
        </div>
      )}
    </div>
  );
};

export default DraggableSidebar;