import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FiMenu, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './DualSidebarLayout.css';

const DualSidebarLayout = ({ 
  leftSidebar, 
  rightSidebar, 
  children, 
  leftSidebarWidth = 280,
  rightSidebarWidth = 320,
  showRightSidebar = false 
}) => {
  const { theme } = useTheme();
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(!showRightSidebar);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (mobile) {
        setLeftCollapsed(true);
        setRightCollapsed(true);
        setMobileMenuOpen(false);
      } else {
        setLeftCollapsed(false);
        setRightCollapsed(!showRightSidebar);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [showRightSidebar]);

  const toggleLeftSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setLeftCollapsed(!leftCollapsed);
    }
  };

  const toggleRightSidebar = () => {
    setRightCollapsed(!rightCollapsed);
  };

  const closeMobileMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="dual-sidebar-layout" data-theme={theme?.name}>
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu} />
      )}

      {/* Left Sidebar */}
      <div 
        className={`left-sidebar ${leftCollapsed ? 'collapsed' : ''} ${isMobile && mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{ 
          width: isMobile ? '280px' : leftCollapsed ? '60px' : `${leftSidebarWidth}px` 
        }}
      >
        <div className="sidebar-content">
          {leftSidebar}
        </div>
        
        {!isMobile && (
          <button 
            className="sidebar-toggle left-toggle"
            onClick={toggleLeftSidebar}
            title={leftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {leftCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div 
        className="main-content"
        style={{
          marginLeft: isMobile ? '0' : leftCollapsed ? '60px' : `${leftSidebarWidth}px`,
          marginRight: isMobile ? '0' : rightCollapsed ? '0' : `${rightSidebarWidth}px`
        }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="mobile-header">
            <button className="mobile-menu-btn" onClick={toggleLeftSidebar}>
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
            <h1>Nexus ChatApp</h1>
            {showRightSidebar && (
              <button className="mobile-menu-btn" onClick={toggleRightSidebar}>
                <FiMenu />
              </button>
            )}
          </div>
        )}

        <div className="content-wrapper">
          {children}
        </div>
      </div>

      {/* Right Sidebar */}
      {showRightSidebar && (
        <div 
          className={`right-sidebar ${rightCollapsed ? 'collapsed' : ''}`}
          style={{ 
            width: rightCollapsed ? '0' : `${rightSidebarWidth}px` 
          }}
        >
          <div className="sidebar-content">
            {rightSidebar}
          </div>
          
          {!isMobile && (
            <button 
              className="sidebar-toggle right-toggle"
              onClick={toggleRightSidebar}
              title={rightCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              {rightCollapsed ? <FiChevronLeft /> : <FiChevronRight />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DualSidebarLayout;