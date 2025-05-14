// API service for NicorAI frontend
// Connects to the real API Gateway

// Configuration
const API_GATEWAY_URL = 'http://localhost:4000';
const DEVELOPMENT_MODE = true; // Set to false in production

// Types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  lastUpdated: Date;
  messages: ChatMessage[];
}

export interface DynamicView {
  id: string;
  type: 'chart' | 'card' | 'table' | 'custom';
  data: any;
}

// Extend ChatMessage interface to include view information
interface ChatMessageWithView extends ChatMessage {
  dynamicView?: DynamicView;
}

// Define interface for dynamic view associations
interface ViewAssociations {
  [chatId: string]: {
    [messageId: string]: string;  // messageId -> viewId
  };
}

// API class
class ApiService {
  private currentChatId: string | null = null;
  private lastDynamicViewId: string | null = null; // Track the last view to prevent repetition

  constructor() {
    // Initialize with the most recent chat or create a new one
    this.initializeChat();
  }

  private initializeChat() {
    const history = this.getChatHistory();
    if (history.length > 0) {
      this.currentChatId = history[0].id; // Use the most recent chat
    } else {
      this.createNewChat();
    }
  }

  // Create a new chat session
  createNewChat(): string {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      lastUpdated: new Date(),
      messages: []
    };

    // Save to localStorage
    this.saveChatSession(newChat);
    this.currentChatId = newChatId;
    return newChatId;
  }

  // Get all chat sessions from localStorage
  getChatHistory(): ChatSession[] {
    try {
      let chatHistoryJSON = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        chatHistoryJSON = localStorage.getItem('nicoraiChatHistory');
      }
      if (!chatHistoryJSON) return [];

      const history = JSON.parse(chatHistoryJSON);

      // Convert string timestamps back to Date objects
      const convertedHistory = history.map((chat: any) => ({
        ...chat,
        lastUpdated: new Date(chat.lastUpdated),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));

      // Filter out empty chats (chats with no messages or just with the default title)
      return convertedHistory.filter((chat: ChatSession) =>
        chat.messages.length > 0 &&
        !(chat.title === 'New Chat' && chat.messages.length === 0)
      );
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  // Get messages for the current chat session
  getCurrentChatMessages(): ChatMessage[] {
    if (!this.currentChatId) return [];

    const history = this.getChatHistory();
    const currentChat = history.find(c => c.id === this.currentChatId);
    return currentChat ? currentChat.messages : [];
  }

  // Set the current active chat
  setCurrentChat(chatId: string) {
    this.currentChatId = chatId;
  }

  // Get the current chat ID
  getCurrentChatId(): string | null {
    return this.currentChatId;
  }

  // Save a chat session to localStorage
  private saveChatSession(chat: ChatSession) {
    try {
      const history = this.getChatHistory();

      // Remove existing chat with the same ID if it exists
      const filteredHistory = history.filter(c => c.id !== chat.id);

      // Add the new/updated chat at the beginning (most recent)
      const updatedHistory = [chat, ...filteredHistory];

      // Keep only the last 20 chats to prevent localStorage from growing too large
      const trimmedHistory = updatedHistory.slice(0, 20);

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('nicoraiChatHistory', JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  }

  // Update chat title based on first few messages
  private updateChatTitle(chatId: string, messages: ChatMessage[]) {
    if (messages.length < 2) return; // Need at least one user message and one AI response

    const userMessage = messages.find(m => m.sender === 'user');
    if (!userMessage) return;

    // Use the first user message as the title (truncated)
    const title = userMessage.content.length > 30
      ? `${userMessage.content.substring(0, 30)}...`
      : userMessage.content;

    const history = this.getChatHistory();
    const chat = history.find(c => c.id === chatId);

    if (chat && chat.title === 'New Chat') {
      const updatedChat = {
        ...chat,
        title,
        lastUpdated: new Date()
      };

      this.saveChatSession(updatedChat);
    }
  }

  // Send a chat message and get a response
  async sendMessage(message: string): Promise<ChatMessageWithView> {
    // Create the user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to current chat
    this.addMessageToCurrentChat(userMessage);

    try {
      // Always try the API first
      const payload = {
        userId: 'user-123', // Can be dynamic in a real app
        message: message,
        timestamp: new Date().toISOString()
      };

      // Log request for debugging
      console.log('Sending request to API Gateway:', payload);

      // Make the actual API call
      const response = await fetch(`${API_GATEWAY_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const responseData = await response.json();
      console.log('API Gateway response:', responseData);

      // Create AI message from response
      let aiContent = '';
      if (responseData.responseType === 'text' && responseData.content && typeof responseData.content.text === 'string') {
        aiContent = responseData.content.text;
      } else if (responseData.responseType === 'view') {
        aiContent = '';
      } else if (responseData.content && typeof responseData.content === 'string') {
        aiContent = responseData.content;
      }
      const aiMessage: ChatMessageWithView = {
        id: `msg-${Date.now()}-ai`,
        content: aiContent,
        sender: 'ai',
        timestamp: new Date()
      };

      // Check for dynamic view in response
      let dynamicView = null;
      // Method 1: Direct view in responseData
      if (responseData.responseType === 'view') {
        dynamicView = this.checkResponseForDynamicView(responseData);
      } 
      // Method 2: View in content field
      else if (responseData.content && typeof responseData.content === 'object') {
        // Check for items array in the content
        if (responseData.content.items && Array.isArray(responseData.content.items)) {
          dynamicView = {
            id: `dynamic-${Date.now()}`,
            type: 'custom',
            data: responseData.content
          };
        }
        // Check for dynamicView or view property
        else if (responseData.content.dynamicView || responseData.content.view) {
          const viewData = responseData.content.dynamicView || responseData.content.view;
          dynamicView = {
            id: `dynamic-${Date.now()}`,
            type: viewData.type || 'custom',
            data: viewData.data || viewData
          };
        }
      }
      // Add the dynamic view to the message if found
      if (dynamicView) {
        console.log('Dynamic view found in API response:', dynamicView);
        aiMessage.dynamicView = dynamicView;
      }
      // Add AI message to current chat
      this.addMessageToCurrentChat(aiMessage);
      return aiMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      // If API fails, check for mock triggers
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes("table of technologies")) {
        return this.createSpecialViewResponse('table', 'Technologies', {
          title: 'Technologies',
          description: 'List of technologies used by NicorAI',
          headers: ['Technology', 'Category', 'Description'],
          rows: [
            ['React', 'Frontend', 'JavaScript library for building user interfaces'],
            ['Next.js', 'Framework', 'React framework for production with SSR and SSG'],
            ['TypeScript', 'Language', 'Typed superset of JavaScript'],
            ['TailwindCSS', 'Styling', 'Utility-first CSS framework'],
            ['Node.js', 'Backend', 'JavaScript runtime environment']
          ]
        });
      } else if (lowerMessage.includes("case studies as chart") || lowerMessage.includes("show me the case studies as chart")) {
        return this.createSpecialViewResponse('chart', 'Case Studies', {
          title: 'Case Studies Success Rate',
          labels: ['E-commerce', 'Healthcare', 'Finance', 'Manufacturing', 'Technology'],
          values: [88, 75, 92, 70, 95]
        });
      } else if (
        lowerMessage.includes("show me as card technologies") || 
        lowerMessage.includes("card technologies") ||
        lowerMessage.includes("technologies in card")
      ) {
        return this.createSpecialViewResponse('card', 'Technologies Card', {
          title: 'Our Technology Stack',
          content: 'We use cutting-edge technologies to build robust, scalable applications that meet your business needs.',
          cards: [
            { title: 'Frontend', content: 'React, Next.js, TypeScript, TailwindCSS' },
            { title: 'Backend', content: 'Node.js, Express, Python, Django' },
            { title: 'Database', content: 'MongoDB, PostgreSQL, Redis' }
          ]
        });
      }
      // Create error message
      const errorMessage: ChatMessageWithView = {
        id: `msg-${Date.now()}-ai`,
        content: "I'm sorry, but I encountered an error processing your request. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      // Add error message to current chat
      this.addMessageToCurrentChat(errorMessage);
      return errorMessage;
    }
  }

  // Add a message to the current chat session
  private addMessageToCurrentChat(message: ChatMessage) {
    if (!this.currentChatId) {
      this.createNewChat();
    }

    const history = this.getChatHistory();
    const currentChat = history.find(c => c.id === this.currentChatId) || {
      id: this.currentChatId as string,
      title: 'New Chat',
      lastUpdated: new Date(),
      messages: []
    };

    // Add the new message
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, message],
      lastUpdated: new Date()
    };

    // Save the updated chat
    this.saveChatSession(updatedChat);

    // Update chat title if this is a new chat
    this.updateChatTitle(updatedChat.id, updatedChat.messages);
  }

  // Generate a dynamic view (mock)
  async getDynamicView(viewId: string): Promise<DynamicView | null> {
    // In a real app, we would call the API Gateway to get the view
    // But for development, we'll use mock data

    try {
      // Wait a bit to simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if this is a dynamic ID (created at runtime) that we may not have stored
      if (viewId.startsWith('dynamic-')) {
        // If it's a card view
        if (viewId.includes('card')) {
          console.log(`Creating fallback card view for dynamic ID: ${viewId}`);
          return {
            id: viewId,
            type: 'card',
            data: {
              title: 'Our Technology Stack',
              content: 'We use cutting-edge technologies to build robust, scalable applications that meet your business needs.',
              cards: [
                { title: 'Frontend', content: 'React, Next.js, TypeScript, TailwindCSS' },
                { title: 'Backend', content: 'Node.js, Express, Python, Django' },
                { title: 'Database', content: 'MongoDB, PostgreSQL, Redis' }
              ]
            }
          };
        }
        
        // If it's a table view
        if (viewId.includes('table')) {
          console.log(`Creating fallback table view for dynamic ID: ${viewId}`);
          return {
            id: viewId,
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
        }
        
        // Generic fallback for any dynamic ID
        console.log(`Creating generic fallback view for dynamic ID: ${viewId}`);
        return {
          id: viewId,
          type: 'custom',
          data: {
            title: 'Dynamic Content',
            content: '<div class="p-4 text-center"><p>This view was dynamically generated.</p></div>'
          }
        };
      }

      // Create a view based on the requested ID
      switch (viewId) {
        case 'table-example':
          return {
            id: 'table-example',
            type: 'table',
            data: {
              title: 'NicorAI Services Comparison(M)',
              headers: ['Service', 'Features', 'Use Case', 'Price'],
              rows: [
                ['API Master', 'API Integration, Custom Endpoints, Documentation', 'Streamline API Management', 'Custom Pricing'],
                ['AI Agent Builder', 'Custom AI Agents, NLP Processing, Integration', 'Automate Customer Support', 'Based on Complexity'],
                ['Data Services', 'Data Processing, Analytics, Dashboards', 'Business Intelligence', 'Subscription Based'],
                ['Web Solutions', 'Custom Web Apps, UI/UX Design, Hosting', 'Online Presence', 'Project Based']
              ]
            }
          };

        case 'contact-info':
          return {
            id: 'contact-info',
            type: 'table',
            data: {
              title: 'Contact NicorAI(M)',
              description: 'Reach out to us through any of these channels',
              headers: ['Contact Method', 'Details'],
              rows: [
                ['Email', 'contact@nicor.ai'],
                ['Phone', '+91 (555) 123-4567'],
                ['Office', 'TC 22/228(2), First Floor, SS Plaza, Sastamangalam, Thiruvananthapuram, Kerala, India - 695010'],
                ['Schedule', 'Book a free consultation through our website']
              ],
              footer: 'We typically respond within 24 hours on business days.'
            }
          };

        case 'chart-example':
          return {
            id: 'chart-example',
            type: 'chart',
            data: {
              title: 'AI Implementation Success Rate by Industry(MOCK)',
              labels: ['Retail', 'Healthcare', 'Finance', 'Manufacturing', 'Technology'],
              values: [85, 72, 90, 68, 95]
            }
          };

        case 'card-example':
          return {
            id: 'card-example',
            type: 'card',
            data: {
              title: 'About NicorAI(MOCK)',
              content: 'NicorAI Systems Private Limited is a company specializing in building custom AI solutions and rapid product development. We help businesses leverage the power of artificial intelligence to automate processes, gain insights from data, and enhance customer experiences.',
              actions: [
                {
                  label: 'Learn More',
                  url: '#'
                },
                {
                  label: 'Contact Us',
                  url: '#'
                }
              ]
            }
          };

        default:
          console.log(`Creating fallback view for unknown ID: ${viewId}`);
          return {
            id: viewId,
            type: 'card',
            data: {
              title: 'NicorAI Information',
              content: 'Information about our services and technologies',
              cards: [
                { title: 'Frontend Technologies', content: 'React, Next.js, TypeScript, TailwindCSS' },
                { title: 'Backend Technologies', content: 'Node.js, Express, Python, Django' },
                { title: 'Database Technologies', content: 'MongoDB, PostgreSQL, Redis' }
              ]
            }
          };
      }
    } catch (error) {
      console.error('Error fetching dynamic view:', error);
      return null;
    }
  }

  // Private helper to generate responses for fallback mode
  private generateResponse(message: string): string {
    message = message.toLowerCase();

    if (message.includes('hello') || message.includes('hi')) {
      return "Hello! I'm the NicorAI assistant. How can I help you today?";
    }

    if (message.includes('help')) {
      return "I'd be happy to help! You can ask me about our AI services, schedule a demo, or get information about how our solutions can benefit your business.";
    }

    // Default response
    return `Thanks for your message. Our team at NicorAI specializes in building custom AI solutions to help businesses like yours. Would you like to know more about how we can assist with your specific needs?`;
  }

  // Delete a chat session
  deleteChat(chatId: string) {
    const history = this.getChatHistory();
    const filteredHistory = history.filter(c => c.id !== chatId);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('nicoraiChatHistory', JSON.stringify(filteredHistory));
    }

    // If we deleted the current chat, set the current chat to the most recent one
    if (this.currentChatId === chatId) {
      this.currentChatId = filteredHistory.length > 0 ? filteredHistory[0].id : null;

      // If there are no chats left, create a new one
      if (!this.currentChatId) {
        this.createNewChat();
      }
    }
  }

  // Clear all chat history
  clearAllChats() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('nicoraiChatHistory');
    }
    this.createNewChat();
  }

  // Check if API response has suggested a dynamic view (for Day 6)
  async checkForDynamicView(query: string): Promise<DynamicView | null> {
    try {
      // In a real implementation, this would check if the last API response
      // contained a suggestion for a dynamic view

      // For MVP demonstration, we can simulate this by checking if the API response
      // included a responseType field set to "view" with a viewSpec

      // To prevent showing the same view for every query, we should only
      // return a view when the query specifically asks for relevant information
      const lowerQuery = query.toLowerCase().trim();

      // Get the current chat messages
      const messages = this.getCurrentChatMessages();
      if (messages.length === 0) return null;

      // Get the last AI message
      const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
      if (!lastAiMessage) return null;

      // Check if the content has special markers for a view
      // This is just a simple implementation for the MVP - real implementation
      // would use actual API response fields according to the API contract
      const content = lastAiMessage.content;

      // If we detect a "view suggestion" pattern in the API response
      // Format: [VIEW_TYPE:data description]
      const viewMatch = content.match(/\[(\w+)_VIEW:([^\]]+)\]/i);
      if (viewMatch) {
        const viewType = viewMatch[1].toLowerCase();
        const viewDescription = viewMatch[2];

        // Handle different view types based on markers from the API
        if (viewType === 'table') {
          // For MVP, we'll map to our pre-defined views based on what the API suggested
          if (viewDescription.toLowerCase().includes('contact')) {
            const viewId = 'contact-info';
            // Check if this is the same view we just showed
            if (this.lastDynamicViewId === viewId) {
              // Only repeat if explicitly requested with the same keywords
              if (!lowerQuery.includes('contact')) {
                return null;
              }
            }
            const view = await this.getDynamicView(viewId);
            if (view) {
              this.lastDynamicViewId = viewId;
              return view;
            }
          } else if (viewDescription.toLowerCase().includes('service') ||
            viewDescription.toLowerCase().includes('product')) {
            const viewId = 'table-example';
            // Check if this is the same view we just showed
            if (this.lastDynamicViewId === viewId) {
              // Only repeat if explicitly requested with the same keywords
              if (!lowerQuery.includes('service') && !lowerQuery.includes('product')) {
                return null;
              }
            }
            const view = await this.getDynamicView(viewId);
            if (view) {
              this.lastDynamicViewId = viewId;
              return view;
            }
          }
        } else if (viewType === 'chart') {
          const viewId = 'chart-example';
          if (this.lastDynamicViewId === viewId && !lowerQuery.includes('chart')) {
            return null;
          }
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        } else if (viewType === 'card') {
          const viewId = 'card-example';
          if (this.lastDynamicViewId === viewId && !lowerQuery.includes('about')) {
            return null;
          }
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        }
      }

      // In development, check keywords in the query itself - only for specific queries
      if (DEVELOPMENT_MODE) {
        // We only want to show a view when specifically asked for it
        // Contact info view
        if (
          lowerQuery === 'contact?' ||
          lowerQuery.includes('contact information') ||
          lowerQuery.includes('how can i contact') ||
          lowerQuery.includes('contact details')
        ) {
          const viewId = 'contact-info';
          if (this.lastDynamicViewId === viewId && !query.trim().toLowerCase().endsWith('contact?')) {
            // Only show again if explicitly requesting with just "contact?"
            return null;
          }
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        }
        // Service comparison view
        else if (
          lowerQuery.includes('compare services') ||
          lowerQuery.includes('service comparison') ||
          lowerQuery.includes('show comparison') ||
          lowerQuery.includes('compare products') ||
          lowerQuery.includes('product table')
        ) {
          const viewId = 'table-example';
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        }
        // Performance chart view
        else if (
          lowerQuery.includes('show chart') ||
          lowerQuery.includes('show performance') ||
          lowerQuery.includes('performance chart') ||
          lowerQuery.includes('success rate')
        ) {
          const viewId = 'chart-example';
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        }
        // About us card view
        else if (
          lowerQuery.includes('about nicor') ||
          lowerQuery.includes('company info') ||
          lowerQuery.includes('about the company')
        ) {
          const viewId = 'card-example';
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking for dynamic view:', error);
      return null;
    }
  }

  // Clear the tracked dynamic view (call this when closing a view)
  clearLastDynamicView() {
    this.lastDynamicViewId = null;
  }

  // Helper method to create a dynamic view from API response data
  createDynamicViewFromResponse(responseData: any): DynamicView | null {
    if (!responseData) return null;

    try {
      // For the console-visible format where responseType is 'view'
      if (responseData.responseType === 'view' && responseData.content) {
        // Handle both content as an object with viewSpec or direct data format
        const viewData = responseData.content.viewSpec || responseData.content;
        const viewType = responseData.content.viewType || 'custom'; // Default to custom if not specified

        // For items array format seen in the console
        if (viewType === 'custom' && responseData.content.data && responseData.content.data.items) {
          return {
            id: `dynamic-${Date.now()}`,
            type: 'custom',
            data: responseData.content.data
          };
        }

        // Create a dynamic view from the API-provided spec
        return {
          id: `dynamic-${Date.now()}`,
          type: viewType as any, // Cast to our supported types
          data: viewData
        };
      }

      // Direct dynamic view ID format
      if (responseData.id && responseData.id.startsWith('dynamic-')) {
        return {
          id: responseData.id,
          type: responseData.type || 'custom',
          data: responseData.data
        };
      }

      // Alternative format that might come from the API
      if (responseData.view) {
        return {
          id: `dynamic-${Date.now()}`,
          type: responseData.view.type || 'custom',
          data: responseData.view.data || responseData.view
        };
      }

      // Check if the response itself matches our expected data structure
      if (responseData.items && Array.isArray(responseData.items)) {
        // This looks like the "items" array format seen in the console
        return {
          id: `dynamic-${Date.now()}`,
          type: 'custom',
          data: responseData
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating dynamic view from response:', error);
      return null;
    }
  }

  // Update sendMessage to also check for dynamic view data in API response
  private checkResponseForDynamicView(data: any): DynamicView | null {
    if (!data) return null;
    
    try {
      // Check common format with responseType and content
      if (data.responseType === 'view' && data.content) {
        return this.createDynamicViewFromResponse(data);
      }
      
      // Check for direct dynamic view format
      if (data.id && data.id.startsWith('dynamic-') && data.type) {
        return {
          id: data.id,
          type: data.type,
          data: data.data
        };
      }
      
      // Check for nested view property
      if (data.view) {
        return this.createDynamicViewFromResponse({ view: data.view });
      }
      
      // Check for items array format that should be a custom view
      if (data.items && Array.isArray(data.items)) {
        // This looks like a custom view with items array
        return {
          id: `dynamic-${Date.now()}`,
          type: 'custom',
          data: data
        };
      }
      
      // Check the response for data payload of known formats
      if (data.data) {
        // If data contains nested items array
        if (data.data.items && Array.isArray(data.data.items)) {
          return {
            id: `dynamic-${Date.now()}`,
            type: 'custom',
            data: data.data
          };
        }
        
        // Check if data contains table-like structure
        if (data.data.headers || data.data.columns || data.data.rows) {
          return {
            id: `dynamic-${Date.now()}`,
            type: 'table',
            data: data.data
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for dynamic view in response:', error);
      return null;
    }
  }

  // Helper method to store a view and its message association
  private storeViewAndAssociation(messageId: string, view: DynamicView) {
    if (!view || !view.id || !messageId) return;
    
    try {
      // Ensure each messageId gets a unique viewId based on the message content
      // This ensures different messages get different views
      const currentChatId = this.getCurrentChatId();
      if (!currentChatId) return;
      
      // Generate a unique view ID that includes the message ID to ensure uniqueness
      const uniqueViewId = `view-for-message-${messageId}`;
      
      // Create a copy of the view with the unique ID
      const uniqueView: DynamicView = {
        ...view,
        id: uniqueViewId
      };
      
      // Store the view itself
      let storedViews: Record<string, DynamicView> = {};
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (storedViewsJson) {
        storedViews = JSON.parse(storedViewsJson);
      }
      
      // Store with unique ID to ensure each message has its own view
      storedViews[uniqueViewId] = uniqueView;
      localStorage.setItem('storedDynamicViews', JSON.stringify(storedViews));
      
      // Store the association
      let viewAssociations: ViewAssociations = {};
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (associationsJson) {
        viewAssociations = JSON.parse(associationsJson);
      }
      
      if (!viewAssociations[currentChatId]) {
        viewAssociations[currentChatId] = {};
      }
      
      // Store the association with the unique view ID
      viewAssociations[currentChatId][messageId] = uniqueViewId;
      localStorage.setItem('dynamicViewAssociations', JSON.stringify(viewAssociations));
      
      console.log(`Stored view ${uniqueViewId} for message ${messageId}`);
    } catch (e) {
      console.error('Error storing view and association:', e);
    }
  }

  // Helper method to create a special dynamic view response
  private createSpecialViewResponse(viewType: 'table' | 'chart' | 'card' | 'custom', viewName: string, viewData: any): ChatMessageWithView {
    // Create an AI message with empty content (to ensure view rendering)
    const aiMessage: ChatMessageWithView = {
      id: `msg-${Date.now()}-ai`,
      content: "", // Empty content to allow rendering the view
      sender: 'ai',
      timestamp: new Date()
    };
    
    // Create dynamic view with a message-specific ID
    const dynamicView: DynamicView = {
      id: `dynamic-${viewType}-${viewName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      type: viewType,
      data: viewData
    };
    
    // Attach the view to the message
    aiMessage.dynamicView = dynamicView;
    
    // Add the AI message to the chat
    this.addMessageToCurrentChat(aiMessage);
    
    // Store the view for future reference with the unique ID
    this.storeViewAndAssociation(aiMessage.id, dynamicView);
    
    return aiMessage;
  }
}

// Export a singleton instance
const apiService = new ApiService();
export default apiService; 