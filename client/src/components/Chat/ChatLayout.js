import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ChatInfo from './ChatInfo';
import DraggableSidebar from '../Layout/DraggableSidebar';
import { useChat } from '../../contexts/ChatContext';
import './Chat.css';

const ChatLayout = () => {
  const { selectedChat } = useChat();
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);

  const mainContent = selectedChat ? (
    <ChatWindow onShowInfo={() => setShowChatInfo(true)} />
  ) : (
    <div className="no-chat-selected">
      <div className="no-chat-content">
        <div className="no-chat-icon">💬</div>
        <h2>Welcome to Nexus ChatApp</h2>
        <p>Select a chat to start messaging or create a new conversation</p>
        <div className="no-chat-features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span>End-to-end encrypted</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>Real-time messaging</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌐</span>
            <span>Cross-platform sync</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="chat-layout-container">
      {/* Left Draggable Sidebar */}
      <DraggableSidebar
        side="left"
        initialWidth={280}
        minWidth={200}
        maxWidth={400}
        isOpen={leftSidebarOpen}
        onWidthChange={setLeftSidebarWidth}
        onToggle={setLeftSidebarOpen}
      >
        <Sidebar />
      </DraggableSidebar>

      {/* Main Content */}
      <div 
        className="main-content-area"
        style={{
          marginLeft: leftSidebarOpen ? `${leftSidebarWidth}px` : '0',
          marginRight: showChatInfo && selectedChat ? `${rightSidebarWidth}px` : '0'
        }}
      >
        {mainContent}
      </div>

      {/* Right Draggable Sidebar */}
      {showChatInfo && selectedChat && (
        <DraggableSidebar
          side="right"
          initialWidth={320}
          minWidth={250}
          maxWidth={500}
          isOpen={showChatInfo}
          onWidthChange={setRightSidebarWidth}
          onToggle={setShowChatInfo}
        >
          <ChatInfo 
            chat={selectedChat} 
            onClose={() => setShowChatInfo(false)} 
          />
        </DraggableSidebar>
      )}
    </div>
  );
};

export default ChatLayout;
