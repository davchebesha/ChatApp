import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

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
  
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  // Load chats
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !connected) return;

    // Join all chat rooms
    const chatIds = chats.map(chat => chat._id);
    if (chatIds.length > 0) {
      socket.emit('join_chats', chatIds);
    }

    // New message
    socket.on('new_message', (message) => {
      if (selectedChat && message.chat === selectedChat._id) {
        setMessages(prev => [...prev, message]);
      }
      
      // Update chat's last message
      setChats(prev => prev.map(chat => 
        chat._id === message.chat 
          ? { ...chat, lastMessage: message, updatedAt: new Date() }
          : chat
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));

      // Show notification if not in current chat
      if (!selectedChat || message.chat !== selectedChat._id) {
        if (message.sender._id !== user.id) {
          toast.info(`New message from ${message.sender.username}`);
        }
      }
    });

    // User typing
    socket.on('user_typing', ({ userId, username, chatId, isTyping }) => {
      if (selectedChat && chatId === selectedChat._id) {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: isTyping ? username : null
        }));
      }
    });

    // Message edited
    socket.on('message_edited', (message) => {
      setMessages(prev => prev.map(msg => 
        msg._id === message._id ? message : msg
      ));
    });

    // Message deleted
    socket.on('message_deleted', ({ messageId, deleteForEveryone }) => {
      if (deleteForEveryone) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, deleted: true, content: 'This message was deleted' }
            : msg
        ));
      } else {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    });

    // Reaction added
    socket.on('reaction_added', ({ messageId, userId, emoji }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const reactions = msg.reactions || [];
          const existingIndex = reactions.findIndex(r => r.user === userId);
          
          if (existingIndex >= 0) {
            reactions[existingIndex].emoji = emoji;
          } else {
            reactions.push({ user: userId, emoji });
          }
          
          return { ...msg, reactions };
        }
        return msg;
      }));
    });

    // User status
    socket.on('user_status', ({ userId, status, lastSeen }) => {
      if (status === 'online') {
        setOnlineUsers(prev => new Set([...prev, userId]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }

      // Update user status in chats
      setChats(prev => prev.map(chat => ({
        ...chat,
        participants: chat.participants?.map(p => 
          p._id === userId ? { ...p, status, lastSeen } : p
        )
      })));
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('reaction_added');
      socket.off('user_status');
    };
  }, [socket, connected, chats, selectedChat, user]);

  const loadChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data.chats);
    } catch (error) {
      console.error('Load chats error:', error);
      toast.error('Failed to load chats');
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await api.get(`/messages/${chatId}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Load messages error:', error);
      toast.error('Failed to load messages');
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    await loadMessages(chat._id);
    
    if (socket) {
      socket.emit('join_chat', chat._id);
    }
  };

  const sendMessage = (content, type = 'text', replyTo = null) => {
    if (!socket || !selectedChat) return;

    socket.emit('send_message', {
      chatId: selectedChat._id,
      content,
      type,
      replyTo
    });
  };

  const sendTyping = (isTyping) => {
    if (!socket || !selectedChat) return;

    socket.emit('typing', {
      chatId: selectedChat._id,
      isTyping
    });
  };

  const createChat = async (type, participants, name, description) => {
    try {
      const response = await api.post('/chats', {
        type,
        participants,
        name,
        description
      });
      
      const newChat = response.data.chat;
      setChats(prev => [newChat, ...prev]);
      
      if (socket) {
        socket.emit('join_chat', newChat._id);
      }
      
      return newChat;
    } catch (error) {
      console.error('Create chat error:', error);
      toast.error('Failed to create chat');
      return null;
    }
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
