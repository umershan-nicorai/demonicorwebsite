import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import apiService, { ChatSession } from '../services/api';

interface SidebarProps {
  onNavClick: (view: string) => void;
  activeView: string | null;
  onToggle?: (expanded: boolean) => void;
}

// Custom CSS for the logo text to match the pixelated style
const logoTextStyle = {
  fontFamily: "var(--font-press-start-2p)",
  letterSpacing: "0.05em",
  fontWeight: 400,
  color: "#0f0f0f",
  fontSize: "1.2rem",
};

// Custom CSS for the navigation items to use Pixelify Sans font
const navItemStyle = {
  fontFamily: "var(--Sixtyfour Convergence-sans-serif)",
  letterSpacing: "0.02em",
  fontWeight: 400,
};

const Sidebar: React.FC<SidebarProps> = ({ onNavClick, activeView, onToggle }) => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch chat history when component mounts or when localStorage changes
  useEffect(() => {
    const loadChatHistory = () => {
      const history = apiService.getChatHistory();
      setChatHistory(history);
      setCurrentChatId(apiService.getCurrentChatId());
    };
    
    // Load initial history
    loadChatHistory();
    
    // Set up an interval to periodically check for updates (every 5 seconds)
    const intervalId = setInterval(loadChatHistory, 5000);
    
    // Add event listener for storage changes (to sync across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nicoraiChatHistory') {
        loadChatHistory();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const navItems = [
    { id: 'what-we-do', label: 'What We Do' },
    { id: 'what-weve-done', label: 'What We\'ve Done' },
    { id: 'connect', label: 'Connect' },
    { id: 'us', label: 'Us' },
    { id: 'inspiration', label: 'Our Inspiration' },
  ];

  const handleNavClick = (id: string) => {
    onNavClick(id);
  };

  // Handle selecting a chat from the history
  const handleSelectChat = (chatId: string) => {
    apiService.setCurrentChat(chatId);
    setCurrentChatId(chatId);
    
    // Update local state - no need to reload the page
    const currentMessages = apiService.getCurrentChatMessages();
    
    // Create a custom event to notify other components of the chat change
    const chatChangeEvent = new CustomEvent('chatChanged', { 
      detail: { chatId, messages: currentMessages }
    });
    window.dispatchEvent(chatChangeEvent);
  };

  // Format the date for display in the sidebar
  const formatChatDate = (date: Date) => {
    const now = new Date();
    const chatDate = new Date(date);
    
    // If the chat is from today, show the time
    if (chatDate.toDateString() === now.toDateString()) {
      return chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If the chat is from yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (chatDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise, show the date
    return chatDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Handle deleting a chat
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    
    if (window.confirm('Are you sure you want to delete this chat?')) {
      apiService.deleteChat(chatId);
      
      // Update the local state
      setChatHistory(prevHistory => prevHistory.filter(chat => chat.id !== chatId));
      
      // If we deleted the current chat, update messages
      if (chatId === currentChatId) {
        const newChatId = apiService.getCurrentChatId();
        setCurrentChatId(newChatId);
        
        // Get messages for the new current chat
        const newMessages = newChatId ? apiService.getCurrentChatMessages() : [];
        
        // Notify other components
        const chatChangeEvent = new CustomEvent('chatChanged', { 
          detail: { chatId: newChatId, messages: newMessages }
        });
        window.dispatchEvent(chatChangeEvent);
      }
    }
  };

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    // Notify parent component about the change
    if (onToggle) {
      onToggle(newExpandedState);
    }
    
    // For debugging
    console.log("Toggle sidebar:", newExpandedState, "Mobile:", isMobile);
  };

  // Check if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle window resize to detect mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768; // 768px is typical md breakpoint
      setIsMobile(isMobileView);
      console.log("Mobile detection:", isMobileView, window.innerWidth);
    };
    
    // Initial check
    checkIfMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Auto-collapse on mobile initially - only on first render
  useEffect(() => {
    if (isMobile) {
      console.log("Mobile detected, collapsing sidebar");
      setIsExpanded(false);
      if (onToggle) {
        onToggle(false);
      }
    }
  // Empty dependency array ensures this only runs once on mount
  }, []);

  return (
    <>
      {/* Mobile overlay - only visible when sidebar is expanded on mobile */}
      {isExpanded && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={toggleSidebar}
          style={{ touchAction: 'none' }}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-screen transition-all duration-300 flex flex-col
          ${isExpanded ? 'w-64 z-[90]' : 'w-12 z-50'} 
          ${isExpanded ? 'bg-white border-r border-gray-100' : isMobile ? 'bg-white' : 'bg-white border-r border-gray-100'}
          ${!isExpanded && isMobile ? '-translate-x-full' : 'translate-x-0'}
        `}
        style={{ willChange: 'transform', maxWidth: isMobile ? '80%' : 'none' }}
      >
        {/* Only render sidebar content if expanded or on desktop */}
        {(isExpanded || !isMobile) && (
          <>
            {/* Logo with toggle button positioned relative to it */}
            <div className="relative">
              <div className={`p-4 h-[58px] flex items-center ${!isExpanded ? 'justify-center' : ''}`}>
                {/* Only show logo when expanded or on mobile */}
                {(isExpanded || isMobile) && (
                  <div 
                    className={`flex items-center gap-2 cursor-pointer ${!isExpanded ? 'justify-center' : ''}`} 
                    onClick={() => {
                      // Reset to initial view by dispatching a chatChanged event with empty messages
                      const chatChangeEvent = new CustomEvent('chatChanged', { detail: { chatId: null, messages: [] } });
                      window.dispatchEvent(chatChangeEvent);
                      
                      // On mobile, close the sidebar after navigation
                      if (isMobile) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <Image 
                      src="/images/nicor-logo-black-removebg_without_text.png" 
                      alt="NicorAI Logo" 
                      width={isExpanded ? 48 : 32} 
                      height={isExpanded ? 48 : 32} 
                      className="object-contain"
                      priority
                    />
                    {isExpanded && <h1 className="pixelify-text" style={logoTextStyle}>NicorAI</h1>}
                  </div>
                )}
                
                {/* Show toggle button in the center when collapsed on desktop */}
                {!isExpanded && !isMobile && (
                  <button
                    onClick={toggleSidebar}
                    className="bg-white rounded-full p-2 focus:outline-none hover:bg-blue-100"
                    aria-label="Expand sidebar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Toggle button for desktop - positioned at the border - only when expanded */}
              {!isMobile && isExpanded && (
                <button
                  onClick={toggleSidebar}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md z-50 focus:outline-none hover:bg-blue-100"
                  aria-label="Collapse sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
            </div>

            {/* Navigation Links - only visible when expanded */}
            {isExpanded && (
              <nav className="p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          handleNavClick(item.id);
                          
                          // On mobile, close the sidebar after navigation
                          if (isMobile) {
                            toggleSidebar();
                          }
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-semibold ${
                          activeView === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                        style={navItemStyle}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {/* Recent Chats Section - only visible when expanded except for New Chat button */}
            <div className={`${isExpanded ? 'p-4 border-t border-gray-200 mt-2' : 'p-2 mt-4'} flex-1 overflow-y-auto sidebar-scroll`}>
              {isExpanded && (
                <div className="flex justify-between items-center mb-3 px-4">
                  <h2 className="font-semibold text-gray-800">Recent Chat</h2>
                  {chatHistory.length > 0 && (
                    <button 
                      onClick={() => {
                        if (window.confirm('Clear all chat history? This cannot be undone.')) {
                          apiService.clearAllChats();
                          setChatHistory([]);
                          
                          // Update current chat ID
                          const newChatId = apiService.getCurrentChatId();
                          setCurrentChatId(newChatId);
                          
                          // Notify other components
                          const chatChangeEvent = new CustomEvent('chatChanged', { 
                            detail: { chatId: newChatId, messages: [] }
                          });
                          window.dispatchEvent(chatChangeEvent);
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
              
              <ul className="space-y-2">
                {/* New Chat Button styled like a chat history item */}
                <li className="group">
                  <div 
                    onClick={() => {
                      const newChatId = apiService.createNewChat();
                      setCurrentChatId(newChatId);
                      
                      // Notify other components
                      const chatChangeEvent = new CustomEvent('chatChanged', { 
                        detail: { chatId: newChatId, messages: [] }
                      });
                      window.dispatchEvent(chatChangeEvent);
                      
                      // On mobile, close the sidebar after creating a new chat
                      if (isMobile && isExpanded) {
                        toggleSidebar();
                      }
                    }}
                    className={`flex items-start ${isExpanded ? 'p-2 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer border border-dashed border-gray-300' : 'p-1 justify-center'}`}
                  >
                    <div className={`flex-1 min-w-0 flex ${isExpanded ? 'items-center' : 'justify-center'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`${isExpanded ? 'w-4 h-4 mr-2' : 'w-6 h-6'} text-blue-600`}>
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                      </svg>
                      {isExpanded && (
                        <p className="text-sm font-medium text-blue-600">
                          New Chat
                        </p>
                      )}
                    </div>
                  </div>
                </li>
                
                {/* Chat history - only visible when expanded */}
                {isExpanded && (
                  <>
                    {chatHistory.length > 0 ? (
                      chatHistory.map((chat) => (
                        <li key={chat.id} className="group">
                          <div 
                            onClick={() => {
                              handleSelectChat(chat.id);
                              
                              // On mobile, close the sidebar after selecting a chat
                              if (isMobile) {
                                toggleSidebar();
                              }
                            }}
                            className={`flex items-start p-2 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer ${
                              chat.id === currentChatId ? 'bg-blue-50 border-l-2 border-blue-600 pl-3.5' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate group-hover:text-blue-600 ${
                                chat.id === currentChatId ? 'text-blue-600' : 'text-gray-900'
                              }`}>
                                {chat.title}
                              </p>
                              <p className={`text-xs ${
                                chat.id === currentChatId ? 'text-blue-500' : 'text-gray-600'
                              } group-hover:text-blue-500`}>
                                {formatChatDate(chat.lastUpdated)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteChat(e, chat.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                              title="Delete chat"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500 italic px-4">No recent chats</li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
      
      {/* Mobile toggle button - always visible when on mobile and sidebar is collapsed */}
      {isMobile && !isExpanded && (
        <div className="fixed top-0 left-0 z-[100] p-4">
          <button
            onClick={() => {
              console.log("Mobile button clicked, current state:", isExpanded);
              // Force expanded state to true
              setIsExpanded(true);
              if (onToggle) {
                onToggle(true);
              }
              console.log("After click, state set to:", true);
            }}
            className="bg-white border border-gray-200 rounded-full p-2 shadow-lg focus:outline-none hover:bg-blue-50"
            aria-label="Expand sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default Sidebar; 