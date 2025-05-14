'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService, { ChatMessage, ChatSession } from './api';

interface ChatContextType {
  currentChatId: string | null;
  messages: ChatMessage[];
  chatHistory: ChatSession[];
  isLoading: boolean;
  setCurrentChat: (chatId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  createNewChat: () => void;
  deleteChat: (chatId: string) => void;
  clearAllChats: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize chat data when the component mounts
  useEffect(() => {
    const loadChatData = () => {
      const history = apiService.getChatHistory();
      setChatHistory(history);
      
      const currChatId = apiService.getCurrentChatId();
      setCurrentChatId(currChatId);
      
      if (currChatId) {
        const messages = apiService.getCurrentChatMessages();
        setMessages(messages);
      }
    };
    
    loadChatData();
    
    // Set up an interval to periodically check for updates
    const intervalId = setInterval(loadChatData, 3000);
    
    // Add event listener for storage changes (to sync across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nicoraiChatHistory') {
        loadChatData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Set current chat and update messages
  const handleSetCurrentChat = (chatId: string) => {
    apiService.setCurrentChat(chatId);
    setCurrentChatId(chatId);
    
    const messages = apiService.getCurrentChatMessages();
    setMessages(messages);
  };

  // Create a new chat
  const handleCreateNewChat = () => {
    const newChatId = apiService.createNewChat();
    setCurrentChatId(newChatId);
    setMessages([]);
    
    // Update chat history
    setChatHistory(apiService.getChatHistory());
  };

  // Send a message
  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    
    try {
      await apiService.sendMessage(content);
      
      // Update messages
      const updatedMessages = apiService.getCurrentChatMessages();
      setMessages(updatedMessages);
      
      // Update chat history
      setChatHistory(apiService.getChatHistory());
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a chat
  const handleDeleteChat = (chatId: string) => {
    apiService.deleteChat(chatId);
    
    // Update chat history
    const updatedHistory = apiService.getChatHistory();
    setChatHistory(updatedHistory);
    
    // If we deleted the current chat, update current chat data
    if (chatId === currentChatId) {
      const newCurrentChatId = apiService.getCurrentChatId();
      setCurrentChatId(newCurrentChatId);
      
      if (newCurrentChatId) {
        const newMessages = apiService.getCurrentChatMessages();
        setMessages(newMessages);
      } else {
        setMessages([]);
      }
    }
  };

  // Clear all chats
  const handleClearAllChats = () => {
    apiService.clearAllChats();
    
    // Reset state
    const newChatId = apiService.getCurrentChatId();
    setCurrentChatId(newChatId);
    setMessages([]);
    setChatHistory(apiService.getChatHistory());
  };

  const value = {
    currentChatId,
    messages,
    chatHistory,
    isLoading,
    setCurrentChat: handleSetCurrentChat,
    sendMessage: handleSendMessage,
    createNewChat: handleCreateNewChat,
    deleteChat: handleDeleteChat,
    clearAllChats: handleClearAllChats
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Hook for accessing the chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}; 