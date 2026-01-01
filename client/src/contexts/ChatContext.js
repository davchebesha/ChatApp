import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const { user } = useAuth();

  // Mock data for development
  useEffect(() => {
    if (user) {
      // Create some mock chats for testing
      const mockChats = [
        {
          _id: '1',
          name: 'General',
          type: 'group',
          participants: [
            { _id: user.id, username: user.username, avatar: user.avatar },
            { _id: '2', username: 'Alice', avatar: null },
            { _id: '3', username: 'Bob', avatar: null }
          ],
          lastMessage: {
            content: 'Welcome to NexusChat!',
            sender: { username: 'System' },
            timestamp: new Date()
          },
          updatedAt: new Date()
        },
        {
          _id: '2',
          type: 'direct',
          participants: [
            { _id: user.id, username: user.username, avatar: user.avatar },
            { _id: '2', username: 'Alice', avatar: null }
          ],
          lastMessage: {
            content: 'Hey there!',
            sender: { username: 'Alice' },
            timestamp: new Date()
          },
          updatedAt: new Date()
        }
      ];
      setChats(mockChats);
    }
  }, [user]);

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    
    // Mock messages for the selected chat
    const mockMessages = [
      {
        _id: '1',
        content: 'Welcome to NexusChat! This is a professional messaging platform.',
        sender: { _id: 'system', username: 'System', avatar: '/logo.svg' },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        type: 'text'
      },
      {
        _id: '2',
        content: 'Thanks for trying out our chat application!',
        sender: { _id: '2', username: 'Alice', avatar: null },
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        type: 'text'
      },
      {
        _id: '3',
        content: 'The interface looks great! Really professional.',
        sender: { _id: user?.id, username: user?.username, avatar: user?.avatar },
        createdAt: new Date(Date.now() - 900000).toISOString(),
        type: 'text'
      }
    ];
    setMessages(mockMessages);
  };

  const sendMessage = (content, type = 'text', replyTo = null) => {
    if (!selectedChat || !user) return;

    const newMessage = {
      _id: Date.now().toString(),
      content,
      type,
      sender: {
        _id: user.id,
        username: user.username,
        avatar: user.avatar
      },
      createdAt: new Date().toISOString(),
      replyTo
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Update chat's last message
    setChats(prev => prev.map(chat => 
      chat._id === selectedChat._id 
        ? { ...chat, lastMessage: newMessage, updatedAt: new Date() }
        : chat
    ));
  };

  const sendTyping = (isTyping) => {
    // Mock typing indicator
    console.log('Typing:', isTyping);
  };

  const createChat = async (type, participants, name, description) => {
    const newChat = {
      _id: Date.now().toString(),
      type,
      participants,
      name,
      description,
      lastMessage: null,
      updatedAt: new Date()
    };
    
    setChats(prev => [newChat, ...prev]);
    return newChat;
  };

  const loadChats = async () => {
    // Mock function - chats are loaded in useEffect
    console.log('Loading chats...');
  };

  const value = {
    chats,
    selectedChat,
    messages,
    typingUsers,
    onlineUsers,
    selectChat,
    sendMessage,
    sendTyping,
    createChat,
    loadChats
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
