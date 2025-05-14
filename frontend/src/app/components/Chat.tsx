import React, { useState, useRef, useEffect } from 'react';
import apiService, { ChatMessage, DynamicView } from '../services/api';
import DynamicContentRenderer from './DynamicContentRenderer';
import Image from 'next/image';
import LogoBackground from './LogoBackground';

// Define interface for dynamic view associations
interface ViewAssociations {
  [chatId: string]: {
    [messageId: string]: string;  // messageId -> viewId
  };
}

interface ChatProps {
  isVisible: boolean;
  onMessageSent?: (isClosing?: boolean, dynamicView?: DynamicView, isClosed?: boolean) => void;
  isInitialView?: boolean;
  activeView?: string | null;
  pendingDynamicView?: DynamicView | null;
  closedDynamicView?: DynamicView | null;
}

const Chat: React.FC<ChatProps> = ({ 
  isVisible, 
  onMessageSent, 
  isInitialView, 
  activeView, 
  pendingDynamicView,
  closedDynamicView: externalClosedDynamicView
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicView, setDynamicView] = useState<DynamicView | null>(null);
  const [internalClosedDynamicView, setInternalClosedDynamicView] = useState<DynamicView | null>(null);
  const [dynamicViewMessageId, setDynamicViewMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use either external or internal closed dynamic view
  const closedDynamicView = externalClosedDynamicView || internalClosedDynamicView;

  const faqSuggestions = [
    "How can AI help my business?",
    "What services does NicorAI offer?",
    "What are the technologies used by nicorAI? Show in a card",
    "What industries do you specialize in?"
  ];

  // Process pending dynamic view from parent
  useEffect(() => {
    if (pendingDynamicView) {
      console.log('Received pending dynamic view:', pendingDynamicView);
      setDynamicView(pendingDynamicView);
      // Clear internal closed view when a new pending view arrives
      setInternalClosedDynamicView(null);
      
      // If we have messages, associate the dynamic view with the latest AI message
      if (messages.length > 0) {
        const latestAiMessage = [...messages]
          .filter(m => m.sender === 'ai')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (latestAiMessage) {
          setDynamicViewMessageId(latestAiMessage.id);
        }
      }
    }
  }, [pendingDynamicView]);

  // Update internal state when external closed view changes
  useEffect(() => {
    if (externalClosedDynamicView) {
      setInternalClosedDynamicView(null);
    }
  }, [externalClosedDynamicView]);

  // Load messages from the API service when the component mounts
  useEffect(() => {
    const loadMessages = () => {
      const currentMessages = apiService.getCurrentChatMessages();
      setMessages(currentMessages);
    };
    
    // Load initial messages
    loadMessages();
    
    // Listen for chat change events
    const handleChatChange = (e: CustomEvent) => {
      console.log('Chat change event received:', e.detail);
      // Always reload messages from the API service
      const updatedMessages = apiService.getCurrentChatMessages();
      setMessages(updatedMessages);
    };
    
    // Add event listeners
    window.addEventListener('chatChanged', handleChatChange as EventListener);
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'nicoraiChatHistory') {
        loadMessages();
      }
    });
    
    return () => {
      window.removeEventListener('chatChanged', handleChatChange as EventListener);
      window.removeEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'nicoraiChatHistory') {
          loadMessages();
        }
      });
    };
  }, []);

  // Special effect to reload messages when component becomes visible (additional fix)
  useEffect(() => {
    if (isVisible) {
      const currentMessages = apiService.getCurrentChatMessages();
      setMessages(currentMessages);
    }
  }, [isVisible]);

  // Listen for when isInitialView changes
  useEffect(() => {
    // If we're returning to the initial view, clear the messages
    // so we treat it as a new chat
    if (isInitialView) {
      setMessages([]);
      // Don't clear closed dynamic view
      if (dynamicView) {
        setDynamicView(null);
      }
      // Also clear the message ID association
      setDynamicViewMessageId(null);
    }
  }, [isInitialView]);

  // Always reload messages when the current chat ID changes
  useEffect(() => {
    const currentMessages = apiService.getCurrentChatMessages();
    setMessages(currentMessages);
  }, [apiService.getCurrentChatId()]);

  // Load externally stored dynamic views on mount
  useEffect(() => {
    // Try to load stored views from localStorage
    try {
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (storedViewsJson) {
        const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);
        
        // If we have a closedDynamicView from props but no internal one, check if it's stored
        if (externalClosedDynamicView && !internalClosedDynamicView) {
          // Already have external view, no need to load from storage
          return;
        }
        
        // Check if we have associations for the current chat
        const currentChatId = apiService.getCurrentChatId();
        if (currentChatId) {
          const associationsJson = localStorage.getItem('dynamicViewAssociations');
          if (associationsJson) {
            const associations: ViewAssociations = JSON.parse(associationsJson);
            
            if (associations[currentChatId]) {
              // We have associations for this chat
              const messageIds = Object.keys(associations[currentChatId]);
              
              if (messageIds.length > 0) {
                // Find the first stored view association
                const viewId = associations[currentChatId][messageIds[0]];
                const view = storedViews[viewId];
                
                if (view && !internalClosedDynamicView) {
                  // Set as internal closed view
                  setInternalClosedDynamicView(view);
                  setDynamicViewMessageId(messageIds[0]);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error loading stored dynamic views', e);
    }
  }, []);
  
  // Enhanced useEffect to properly restore message-view associations
  useEffect(() => {
    // Skip if we're in initial view or there are no messages
    if (isInitialView || messages.length === 0) return;
    
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) return;
    
    try {
      // Load message-view associations from localStorage
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (!associationsJson) return;
      
      const viewAssociations: ViewAssociations = JSON.parse(associationsJson);
      if (!viewAssociations[currentChatId]) return;
      
      // Load stored dynamic views
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (!storedViewsJson) return;
      
      const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);

      // For each message in the current chat, check if it has a closed view association
      for (const message of messages) {
        // Only check AI messages
        if (message.sender !== 'ai') continue;
        
        if (viewAssociations[currentChatId][message.id]) {
          // This message had a dynamic view that was closed
          const viewId = viewAssociations[currentChatId][message.id];
          const view = storedViews[viewId];
          
          if (view && !dynamicView) {
            // We found a stored view for this message - set it as closed view if we don't have one
            if (!internalClosedDynamicView) {
              setInternalClosedDynamicView(view);
            }
            
            // Set the message ID to show the "Show the response" button
            setDynamicViewMessageId(message.id);
          }
        }
      }
    } catch (e) {
      console.error('Error loading stored view associations', e);
    }
  }, [messages, apiService.getCurrentChatId(), isInitialView, dynamicView]);

  // Store dynamic view in localStorage whenever it changes
  useEffect(() => {
    if (dynamicView) {
      try {
        // Get existing stored views
        let storedViews: Record<string, DynamicView> = {};
        const storedViewsJson = localStorage.getItem('storedDynamicViews');
        if (storedViewsJson) {
          storedViews = JSON.parse(storedViewsJson);
        }
        
        // Add or update the current view
        storedViews[dynamicView.id] = dynamicView;
        
        // Save back to localStorage
        localStorage.setItem('storedDynamicViews', JSON.stringify(storedViews));
      } catch (e) {
        console.error('Error storing dynamic view', e);
      }
    }
  }, [dynamicView]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced function to check if a message has an associated dynamic view
  const messageHasAssociatedView = (messageId: string): boolean => {
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) return false;
    
    try {
      // console.log(`Checking if message ${messageId} has an associated view`);
      
      // Step 1: Check direct localStorage associations (most specific match)
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (associationsJson) {
        const viewAssociations: ViewAssociations = JSON.parse(associationsJson);
        
        if (viewAssociations[currentChatId] && viewAssociations[currentChatId][messageId]) {
          // We found a view ID association for this message
          const viewId = viewAssociations[currentChatId][messageId];
          // console.log(`Found explicit view association: ${viewId} for message ${messageId}`);
          
          // Verify if the view exists in storage
          const storedViewsJson = localStorage.getItem('storedDynamicViews');
          if (storedViewsJson) {
            const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);
            if (storedViews[viewId]) {
              // Make sure it's a valid view
              const view = storedViews[viewId];
              return !!(view && view.id && view.type && view.data);
            }
          }
          
          // Even if we don't have the stored view, we know there should be one
          return true;
        }
      }
      
      // Step 2: Check message content for view indicators
      const message = messages.find(m => m.id === messageId);
      if (message) {
        // Safety check for null/undefined content
        if (message.content === null || message.content === undefined) {
          console.log(`Message ${messageId} has null/undefined content, treating as visual content`);
          return true;
        }
        
        const lowerContent = message.content.toLowerCase();
        
        // Check for specific view indicators in content
        if (lowerContent.includes("table of technologies") || 
            lowerContent.includes("show me as card") || 
            lowerContent.includes("case studies as chart") ||
            lowerContent.includes("technologies in card") ||
            lowerContent.includes("visual content") || 
            lowerContent === "this response contains visual content." ||
            lowerContent.includes("this response contains visual content") ||
            message.content.trim() === "") {
          console.log(`Message ${messageId} content indicates it should have a view`);
          return true;
        }
      }
      
      return false;
    } catch (e) {
      console.error('Error checking message for associated view:', e);
      return false;
    }
  };

  // Function to handle sending a message
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    // Always create and set a new chat if there are no messages (new view or new chat)
    if (messages.length === 0) {
      const newChatId = apiService.createNewChat();
      apiService.setCurrentChat(newChatId);
    }
    
    // Clear any previous dynamic view when sending a new message
    // Only keep it if the new message specifically requests a view
    const lowerContent = content.toLowerCase().trim();
    const isViewRequest = 
      lowerContent.includes('contact') ||
      lowerContent.includes('comparison') || 
      lowerContent.includes('products') ||
      lowerContent.includes('chart') || 
      lowerContent.includes('table') ||
      lowerContent.includes('about nicor') ||
      lowerContent.includes('technologies in card') ||
      lowerContent.includes('card') ||
      lowerContent.includes('show');
      
    if (!isViewRequest) {
      setDynamicView(null);
    }
    
    // Notify parent that a message was sent
    onMessageSent?.(false);
    
    // Create a user message object and display it immediately
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      content: content,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Update UI immediately with the user message
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Scroll to the bottom to show the new message
    setTimeout(scrollToBottom, 100);
    
    try {
      // Use the API service to get a response
      console.log(`Sending message: "${content}"`);
      const aiResponse = await apiService.sendMessage(content);
      
      // Check for dynamic view in the response
      if (aiResponse.dynamicView) {
        console.log('Dynamic view found in AI response:', aiResponse.dynamicView);

      // Get the ID of the latest AI message for associating with dynamic view
        const updatedMessages = apiService.getCurrentChatMessages();
      const latestAiMessage = updatedMessages
        .filter(m => m.sender === 'ai')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (latestAiMessage) {
          // Generate a unique view ID specifically for this message
          const uniqueViewId = `view-for-message-${latestAiMessage.id}`;
          
          // Create a copy of the view with this unique ID
          const uniqueView: DynamicView = {
            ...aiResponse.dynamicView,
            id: uniqueViewId
          };
          
          // Store the association and the view
          storeViewMessageAssociation(latestAiMessage.id, uniqueViewId, uniqueView);
          
          // Show the view
            setDynamicViewMessageId(latestAiMessage.id);
            
          // Notify parent to hide chat and show view
          if (onMessageSent) {
            onMessageSent(true, uniqueView, false);
          }
        }
      }
      
      // Set messages from the API service to include the AI response
      setMessages(apiService.getCurrentChatMessages());
      
      // Scroll to the bottom again to show the AI response
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setError("Sorry, we're having trouble connecting to the AI. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleFaqClick = (question: string) => {
    // If in initial view, create a new chat before sending FAQ
    if (isInitialView) {
      const newChatId = apiService.createNewChat();
      apiService.setCurrentChat(newChatId);
    }
    
    sendMessage(question);
  };

  // Enhanced function to store message-view associations in localStorage
  // This will be called whenever a dynamic view is generated or shown
  const storeViewMessageAssociation = (messageId: string, viewId: string, view?: DynamicView) => {
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) return;
    
    console.log(`Storing association between message ${messageId} and view ${viewId}`);
    
    try {
      // STEP 1: Store the view itself if provided
      if (view) {
        console.log(`Storing view with ID ${viewId}`);
        // Get existing stored views
        let storedViews: Record<string, DynamicView> = {};
        const storedViewsJson = localStorage.getItem('storedDynamicViews');
        if (storedViewsJson) {
          storedViews = JSON.parse(storedViewsJson);
        }
        
        // Store the view with its ID
        storedViews[viewId] = view;
        localStorage.setItem('storedDynamicViews', JSON.stringify(storedViews));
      }
      
      // STEP 2: Store the message-view association
    // Get existing associations or initialize new object
    let viewAssociations: ViewAssociations = {};
    try {
      const stored = localStorage.getItem('dynamicViewAssociations');
      if (stored) {
        viewAssociations = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing stored view associations', e);
    }
    
    // Update associations for current chat
    if (!viewAssociations[currentChatId]) {
      viewAssociations[currentChatId] = {};
    }
    
    // Store the association: message ID -> view ID
    viewAssociations[currentChatId][messageId] = viewId;
    
    // Save back to localStorage
    localStorage.setItem('dynamicViewAssociations', JSON.stringify(viewAssociations));
      console.log(`Saved association for message ${messageId} -> view ${viewId}`);
    } catch (e) {
      console.error('Error storing view message association:', e);
    }
  };
    
  // Helper function to retrieve a stored dynamic view by ID
  const getStoredDynamicViewById = (viewId: string): DynamicView | null => {
    try {
      console.log(`Looking for stored view with ID: ${viewId}`);
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (storedViewsJson) {
        const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);
        
        // Try to get the exact view with this ID
        if (storedViews[viewId]) {
          console.log(`Found stored view: ${viewId}`);
          return storedViews[viewId];
        }
        
        // If it's a 'view-for-message-X' format, try looking for it
        if (viewId.startsWith('view-for-message-')) {
          console.log(`Looking for message-specific view: ${viewId}`);
          return storedViews[viewId] || null;
        }
        
        console.log(`View with ID ${viewId} not found in local storage`);
      } else {
        console.log('No stored views found in localStorage');
            }
          } catch (e) {
      console.error(`Error retrieving stored view with ID ${viewId}:`, e);
    }
    return null;
  };

  // Function to handle closing a dynamic view
  const handleCloseDynamicView = () => {
    try {
    // Only store closed view if we're in chat view (not initial view)
    if (!isInitialView && dynamicView) {
      // Store the current dynamic view before closing it
      setInternalClosedDynamicView(dynamicView);
      
      // Check if we already have a message ID associated with this view
      // If not, find the latest AI message to associate with
      if (!dynamicViewMessageId) {
        const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
        if (lastAiMessage) {
          setDynamicViewMessageId(lastAiMessage.id);
          
          // Store the association in localStorage (using our helper)
          storeViewMessageAssociation(lastAiMessage.id, dynamicView.id, dynamicView);
        }
      } else {
        // We already have a message ID, ensure the association is stored
        storeViewMessageAssociation(dynamicViewMessageId, dynamicView.id, dynamicView);
      }
      
      // Also notify parent of the closed view
      if (onMessageSent) {
        onMessageSent(false, dynamicView, true);
      }
    }
    
    // Clear the dynamic view
    setDynamicView(null);
    } catch (error) {
      console.error('Error closing dynamic view:', error);
      // Ensure the view is cleared even if there was an error
      setDynamicView(null);
      // Notify parent
      if (onMessageSent) {
        onMessageSent(false);
      }
    }
  };

  // Function to handle clicking "Show the response" for a specific message
  const handleShowResponseClick = (messageId: string) => {
    // Get the view ID from the association table
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) return;
    
    try {
      console.log(`Looking for view associated with message ID: ${messageId}`);
      
      // First, check if we have a stored association for this message
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (associationsJson) {
        const viewAssociations: ViewAssociations = JSON.parse(associationsJson);
        
        // Check if we have an association for this chat and message
        if (viewAssociations[currentChatId] && viewAssociations[currentChatId][messageId]) {
          // We found a view ID for this message
          const viewId = viewAssociations[currentChatId][messageId];
          console.log(`Found view ID ${viewId} for message ${messageId}`);
          
          // Try to get the stored view from localStorage
          const storedView = getStoredDynamicViewById(viewId);
          
          if (storedView) {
            console.log(`Retrieved stored view for message ${messageId}:`, storedView);
            showDynamicView(messageId, storedView);
            return;
          } else {
            console.log(`View ${viewId} not found in localStorage`);
          }
        } else {
          console.log(`No association found for message ${messageId} in chat ${currentChatId}`);
        }
      }
      
      // If we don't have a stored view, try to derive one from the message content
      const message = messages.find(m => m.id === messageId);
      if (!message) {
        console.error(`Message ${messageId} not found in current messages`);
        return;
      }
      
      // Safely get message content
      const content = getSafeMessageContent(message);
      const lowerContent = content.toLowerCase();
      
      console.log(`Creating view based on message content: "${content}"`);
      
      // Create appropriate view based on message content
      if (lowerContent.includes("table of technologies")) {
        createAndShowTechnologiesTableView(messageId);
      } 
      else if (lowerContent.includes("technologies in card")) {
        createAndShowTechnologiesCardView(messageId);
      }
      else if (lowerContent.includes("case studies as chart")) {
        createAndShowCaseStudiesChartView(messageId);
      }
      else if (lowerContent.includes("this response contains visual content")) {
        // Try to determine the appropriate view type from context
        determineBestViewFromContext(messageId);
      }
      else {
        // If we can't determine the view type, show a generic view
        console.log("Couldn't determine specific view type, using generic view");
        createAndShowGenericView(messageId);
      }
    } catch (e) {
      console.error('Error retrieving view for message:', e);
      // Show a generic error view
      createAndShowErrorView(messageId);
    }
  };

  // Helper functions to create and show specific view types

  const createAndShowTechnologiesTableView = (messageId: string) => {
    const techTableView: DynamicView = {
      id: `dynamic-tech-table-${Date.now()}`,
      type: 'table',
      data: {
        title: 'Technologies(M)',
        description: 'List of technologies used by NicorAI',
        headers: ['Technology', 'Category', 'Description'],
        rows: [
          ['React', 'Frontend', 'JavaScript library for building user interfaces'],
          ['Next.js', 'Framework', 'React framework for production with SSR and SSG'],
          ['TypeScript', 'Language', 'Typed superset of JavaScript'],
          ['TailwindCSS', 'Styling', 'Utility-first CSS framework'],
          ['Node.js', 'Backend', 'JavaScript runtime environment']
        ]
      }
    };
    
    // Store this view with the message ID to ensure it can be retrieved exactly the same later
    storeViewMessageAssociation(messageId, techTableView.id, techTableView);
    
    // Show the view
    showDynamicView(messageId, techTableView);
  };

  const createAndShowTechnologiesCardView = (messageId: string) => {
    const techCardView: DynamicView = {
      id: `dynamic-tech-card-${Date.now()}`,
      type: 'card',
      data: {
        title: 'Our Technology Stack(M)',
        content: 'We use cutting-edge technologies to build robust, scalable applications that meet your business needs.',
        cards: [
          { title: 'Frontend', content: 'React, Next.js, TypeScript, TailwindCSS' },
          { title: 'Backend', content: 'Node.js, Express, Python, Django' },
          { title: 'Database', content: 'MongoDB, PostgreSQL, Redis' }
        ]
      }
    };
    
    // Store this view with the message ID
    storeViewMessageAssociation(messageId, techCardView.id, techCardView);
    
    // Show the view
    showDynamicView(messageId, techCardView);
  };

  const createAndShowCaseStudiesChartView = (messageId: string) => {
    const chartView: DynamicView = {
      id: `dynamic-chart-${Date.now()}`,
      type: 'chart',
      data: {
        title: 'Case Studies Success Rate(M)',
        labels: ['E-commerce', 'Healthcare', 'Finance', 'Manufacturing', 'Technology'],
        values: [88, 75, 92, 70, 95]
      }
    };
    
    // Store this view with the message ID
    storeViewMessageAssociation(messageId, chartView.id, chartView);
    
    // Show the view
    showDynamicView(messageId, chartView);
  };

  const determineBestViewFromContext = (messageId: string) => {
    // Look at previous messages to determine context
    const recentMessages = messages.slice(-5); // Get last 5 messages
    
    // Look for keywords in recent messages
    const allContent = recentMessages.map(m => getSafeMessageContent(m).toLowerCase()).join(' ');
    
    if (allContent.includes('table') || allContent.includes('technologies')) {
      createAndShowTechnologiesTableView(messageId);
    } 
    else if (allContent.includes('card')) {
      createAndShowTechnologiesCardView(messageId);
    }
    else if (allContent.includes('chart') || allContent.includes('case studies')) {
      createAndShowCaseStudiesChartView(messageId);
    }
    else {
      // Default to a table view if context is unclear
      createAndShowTechnologiesTableView(messageId);
    }
  };

  const createAndShowGenericView = (messageId: string) => {
    const genericView: DynamicView = {
      id: `dynamic-generic-${Date.now()}`,
      type: 'card',
      data: {
        title: 'NicorAI Information(M)',
        content: 'Information about our services and technologies',
        cards: [
          { title: 'Services', content: 'Custom AI Solutions, Web Development, Mobile Apps, API Integration' },
          { title: 'Technologies', content: 'React, Next.js, Node.js, Python, TensorFlow, MongoDB' },
          { title: 'Contact', content: 'info@nicorai.com | +91 555-123-4567' }
        ]
      }
    };
    
    // Store this view with the message ID
    storeViewMessageAssociation(messageId, genericView.id, genericView);
    
    // Show the view
    showDynamicView(messageId, genericView);
  };

  const createAndShowErrorView = (messageId: string) => {
    const errorView: DynamicView = {
      id: `dynamic-error-${Date.now()}`,
      type: 'custom',
      data: {
        title: 'Error Retrieving Content(M)',
        content: '<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-center"><p class="text-red-600 mb-2">We encountered an error retrieving the content.</p><p class="text-gray-700">Please try refreshing the page or contact support if the issue persists.</p></div>'
      }
    };
    
    // Show the error view
    showDynamicView(messageId, errorView);
  };

  // Helper function to display dynamic view and handle state updates
  const showDynamicView = (messageId: string, view: DynamicView) => {
    console.log(`Showing dynamic view ${view.id} for message ${messageId}`);
    
    // Set the messageId for when we return to chat
    setDynamicViewMessageId(messageId);
    
    // Clear any internal closed view
    setInternalClosedDynamicView(null);
    
    // Store the association to ensure we can retrieve it again
    storeViewMessageAssociation(messageId, view.id, view);
    
    // Notify parent to hide chat and display the view in full-screen
    if (onMessageSent) {
      onMessageSent(true, view, false);
    }
  };

  // Add a utility function for safely getting message content
  const getSafeMessageContent = (message: ChatMessage | undefined): string => {
    if (!message) return "";
    return message.content !== null && message.content !== undefined ? message.content : "";
  };

  const renderInitialView = () => (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Show Close button if we're forced to show initial view but have messages */}
      {!isInitialView && messages.length > 0 && (
        <div className="absolute top-0 right-0 p-3">
          <button 
            onClick={() => {
              // Pass true to indicate we're closing the chat
              onMessageSent?.(true);
            }}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            title="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome to <span className="text-blue-600">NicorAI</span> Assistant</h2>
          <p className="text-gray-700 text-xl leading-relaxed">How can I help you today?</p>
        </div>
        
        {/* Render dynamic view in initial view if available */}
        {dynamicView && (
          <div className="mb-8">
            <div className="flex justify-start mb-4">
              <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden">
                <img 
                  src="/nicor-ai-avatar.png" 
                  alt="NicorAI" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="w-full max-w-[80%]">
                <DynamicContentRenderer 
                  view={dynamicView} 
                  onClose={handleCloseDynamicView} 
                />
                <div className="text-xs text-gray-500 mt-1 text-left">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask any question about NicorAi..."
              className="w-full p-9 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-25 placeholder-gray-500 text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </form>
        
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Frequently asked questions:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faqSuggestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleFaqClick(question)}
                className="p-3 text-left text-sm rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="flex flex-col h-full relative">
      {/* Header section with close button */}
      <div className="p-2 flex justify-end">
        {!dynamicView && (
          <button 
            onClick={() => onMessageSent?.(true)}
            className="p-2 rounded-full hover:bg-blue-100 transition-colors bg-white"
            title="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
      {/* Message container with custom scrollbar styling */}
      <div className="flex-1 p-4 overflow-y-auto relative sidebar-scroll">
        {/* Always show dynamic view on top when available, regardless of sidebar state */}
        {dynamicView && (
          <div className={`absolute inset-0 z-30 flex items-center justify-center bg-white bg-opacity-80 p-4 ${activeView ? 'sticky top-0' : ''}`}>
            <div className="w-full h-full flex items-center justify-center">
              <DynamicContentRenderer 
                view={dynamicView} 
                onClose={handleCloseDynamicView} 
              />
            </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* AI Avatar - only show for AI messages */}
              {message.sender !== 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden">
                  <img 
                    src="/nicor-ai-avatar.png" 
                    alt="NicorAI" 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col">
                <div 
                  className={`rounded-2xl px-4 py-3 break-words whitespace-pre-line max-w-[80vw] md:max-w-2xl ml-auto ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-blue-100 text-gray-800 rounded-tl-none ml-0'
                  }`}
                >
                  {/* If AI message content is empty but has a view, show a placeholder message */}
                  {message.sender === 'ai' && (!getSafeMessageContent(message) || getSafeMessageContent(message).trim() === '') ? (
                    <p className="italic text-gray-600 mb-2">This response contains visual content.</p>
                  ) : (
                    getSafeMessageContent(message)
                  )}
                  
                  {/* Show "Show the response" button for any message that has an associated view */}
                  {message.sender === 'ai' && !dynamicView && messageHasAssociatedView(message.id) && (
                    <div className="dynamic-view-button mt-2">
                      <button 
                        onClick={() => handleShowResponseClick(message.id)}
                        className="text-blue-700 font-medium hover:underline flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                        Show the response
                      </button>
                    </div>
                  )}
                </div>
                {/* Timestamp */}
                <div 
                  className={`text-xs text-gray-500 mt-1 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {/* User Avatar - only show for user messages */}
              {message.sender === 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full ml-1 bg-blue-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))
        )}
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden">
              <img 
                src="/nicor-ai-avatar.png" 
                alt="NicorAI" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="bg-blue-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center max-w-[80%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        {/* Error message */}
        {error && (
          <div className="flex justify-start mb-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden">
              <img 
                src="/nicor-ai-avatar.png" 
                alt="NicorAI" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col max-w-[80%]">
              <div className="bg-blue-100 rounded-2xl rounded-tl-none px-4 py-3 text-red-700">
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-medium">Connection Error</p>
                </div>
                <p className="text-sm">{error}</p>
                <button 
                  onClick={() => setError(null)} 
                  className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm text-red-800"
                >
                  Dismiss
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-left">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </div>
            </div>
          </div>
        )}
        {/* Remove inline dynamic view rendering here */}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area - Updated to match the initial view styling */}
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask any question about NicorAi..."
              className="w-full p-4 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-14 placeholder-gray-500 text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex-1 h-full flex flex-col relative">
      {/* Only show LogoBackground in chat view, not in initial/welcome view */}
      {!(messages.length === 0 || isInitialView) && <LogoBackground />}
      {(messages.length === 0 || isInitialView) ? renderInitialView() : renderChatView()}
    </div>
  );
};

export default Chat; 