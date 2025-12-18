import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { useChat } from '../../contexts/ChatContext';
import './Chat.css';

const ChatLayout = () => {
  const { selectedChat } = useChat();
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="chat-layout">
      <Sidebar show={showSidebar} onToggle={() => setShowSidebar(!showSidebar)} />
      <ChatWindow />
      {!selectedChat && (
        <div className="no-chat-selected">
          <h2>Select a chat to start messaging</h2>
          <p>Choose from your existing conversations or start a new one</p>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
