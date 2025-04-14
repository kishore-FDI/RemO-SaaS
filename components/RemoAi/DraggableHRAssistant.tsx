"use client";
import { useState, useEffect, useRef, MouseEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Position {
  x: number;
  y: number;
}

interface DragOffset {
  x: number;
  y: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: number;
  loading?: boolean;
}

interface ProjectMember {
  id: string;
  name: string;
  role: string;
  // Add other member properties as needed
}

interface DraggableHRAssistantProps {
  projectId?: string;
}

export default function DraggableHRAssistant({ projectId = "fca9a4ae-96b1-4372-8d1e-9b3ef39af589" }: DraggableHRAssistantProps) {
  const queryClient = useQueryClient();
  
  // State management with safe initialization to prevent hydration errors
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [listening, setListening] = useState<boolean>(false);
  const [messageInput, setMessageInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isClient, setIsClient] = useState<boolean>(false);
  const MOVEMENT_THRESHOLD = 5;
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ 
    isDragging: boolean, 
    startTime: number,
    startX: number,
    startY: number 
  }>({ 
    isDragging: false, 
    startTime: 0,
    startX: 0,
    startY: 0 
  });
  
  // Fetch project data using React Query
  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId || !isClient) return { members: [] };
      
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project data');
      }
      return response.json();
    },
    enabled: isClient && !!projectId, // Only run query on client-side and when projectId exists
  });
  
  // Extract members from project data
  const projectMembers = projectData?.members || [];
  
  // Mutation for sending messages to Gemini API
  const geminiMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/gemini-hr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          projectId,
          projectMembers,
          messageHistory: chatMessages,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process with Gemini');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // If project was updated, invalidate the project query to trigger a refetch
      if (data.projectUpdated) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
    },
  });
  
  // Fix hydration issues by initializing client-side state after mount
  useEffect(() => {
    setIsClient(true);
    
    // Initialize position from localStorage after component mount
    const savedPosition = localStorage.getItem('hrAssistantPosition');
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        setPosition(parsedPosition);
      } catch (e) {
        // If parsing fails, set default position
        setPosition({ 
          x: window.innerWidth - 100, 
          y: window.innerHeight - 100 
        });
      }
    } else {
      // Default position if nothing saved
      setPosition({ 
        x: window.innerWidth - 100, 
        y: window.innerHeight - 100 
      });
    }
  }, []);
  
  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (!isClient) return; // Skip during SSR
    
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;
    
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        // Stop AI from speaking when user starts talking
        if (synthRef.current) {
          synthRef.current.cancel();
        }
        
        // Add user message to chat
        setChatMessages(prev => [
          ...prev,
          { role: 'user', content: text }
        ]);
        
        // Process with Gemini
        processWithGemini(text);
        setListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isClient]);
  
  // Save position to localStorage when it changes
  useEffect(() => {
    if (!isClient) return; // Skip during SSR
    
    // Debounce localStorage updates to avoid performance issues
    const timeoutId = setTimeout(() => {
      localStorage.setItem('hrAssistantPosition', JSON.stringify(position));
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [position, isClient]);
  
  // Handle dragging with improved performance
  useEffect(() => {
    if (!isDragging || !isClient) return;
    
    let lastX = 0;
    let lastY = 0;
    
    const updatePosition = (clientX: number, clientY: number) => {
      if (!isDragging || !containerRef.current) return;
      
      // Only update if values have changed to reduce unnecessary renders
      if (clientX === lastX && clientY === lastY) return;
      
      lastX = clientX;
      lastY = clientY;
      
      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;
      
      // Keep button within viewport bounds
      const maxX = window.innerWidth - (isExpanded ? 320 : 64);
      const maxY = window.innerHeight - (isExpanded ? 400 : 64);
      
      // Apply position directly to element for smooth dragging
      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${Math.max(0, Math.min(newX, maxX))}px, ${Math.max(0, Math.min(newY, maxY))}px, 0)`;
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updatePosition(e.clientX, e.clientY);
    };
    
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      handleEnd(e.clientX, e.clientY);
    };
    
    const handleEnd = (clientX: number, clientY: number) => {
      setIsDragging(false);
      
      // Sync the real position state with the transform we've been applying
      if (containerRef.current) {
        const style = getComputedStyle(containerRef.current);
        const transform = new DOMMatrix(style.transform);
        setPosition({
          x: transform.m41,
          y: transform.m42
        });
      }
      
      // Calculate total movement distance
      const moveX = Math.abs(clientX - dragStartRef.current.startX);
      const moveY = Math.abs(clientY - dragStartRef.current.startY);
      const totalMovement = Math.sqrt(moveX * moveX + moveY * moveY);
      
      // Reset the drag reference
      dragStartRef.current.isDragging = false;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      } else {
        handleEnd(0, 0);  // Fallback values
      }
    };
    
    // Update your event listeners
    document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp as unknown as EventListener);
    document.addEventListener('touchend', handleTouchEnd as unknown as EventListener);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp as unknown as EventListener);
      document.removeEventListener('touchend', handleTouchEnd as unknown as EventListener);
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, dragOffset, isExpanded, isClient]);
  
  // Start drag operation
  const handleMouseDown = (e: MouseEvent) => {
    if (!containerRef.current || !isClient) return;
    
    if (e.target instanceof Element && e.target.closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      
      // Record drag start time and position for movement detection
      dragStartRef.current = {
        isDragging: true,
        startTime: Date.now(),
        startX: e.clientX,
        startY: e.clientY
      };
      
      // Use the current transform position rather than state to avoid lag
      const style = getComputedStyle(containerRef.current);
      const transform = new DOMMatrix(style.transform);
      
      setDragOffset({
        x: e.clientX - (transform.m41 || position.x),
        y: e.clientY - (transform.m42 || position.y)
      });
      
      // Apply position directly for immediate feedback
      if (containerRef.current) {
        containerRef.current.style.transition = 'none';
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current || !isClient) return;
    
    if (e.target instanceof Element && e.target.closest('.drag-handle')) {
      if (e.touches.length > 0) {
        e.preventDefault();
        setIsDragging(true);
        
        // Record drag start time and position for movement detection
        dragStartRef.current = {
          isDragging: true,
          startTime: Date.now(),
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY
        };
        
        // Use the current transform position rather than state to avoid lag
        const style = getComputedStyle(containerRef.current);
        const transform = new DOMMatrix(style.transform);
        
        setDragOffset({
          x: e.touches[0].clientX - (transform.m41 || position.x),
          y: e.touches[0].clientY - (transform.m42 || position.y)
        });
        
        // Apply position directly for immediate feedback
        if (containerRef.current) {
          containerRef.current.style.transition = 'none';
        }
      }
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    // If we're collapsing, make sure to stop any ongoing speech
    if (isExpanded && synthRef.current) {
      synthRef.current.cancel();
    }
    
    // If we're expanding and there are no messages, add a greeting
    if (!isExpanded && chatMessages.length === 0) {
      const greeting = "Hello! I'm your HR assistant. How can I help with team members or tasks today?";
      setChatMessages([{ role: 'assistant', content: greeting }]);
      
      // Delay speaking to allow animation to complete
      if (isClient) {
        setTimeout(() => speakText(greeting), 300);
      }
    }
    
    // Restore transition for expand/collapse animation
    if (containerRef.current) {
      containerRef.current.style.transition = 'width 0.3s, height 0.3s, border-radius 0.3s, background-color 0.3s';
    }
    
    setIsExpanded(!isExpanded);
  };
  
  // Process text with Gemini API
  const processWithGemini = async (text: string) => {
    if (!isClient) return;
    
    try {
      // Add loading state message
      const tempId = Date.now();
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: '...', id: tempId, loading: true }
      ]);
      
      // Use the mutation to process the message
      const data = await geminiMutation.mutateAsync(text);
      
      // Replace loading message with actual response
      setChatMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { role: 'assistant', content: data.response } 
          : msg
      ));
      
      // Speak the response
      speakText(data.response);
      
    } catch (error) {
      console.error('Error processing with Gemini:', error);
      // Handle error in UI
      setChatMessages(prev => prev.filter(msg => !msg.loading).concat({
        role: 'assistant',
        content: "I'm sorry, I couldn't process your request."
      }));
    }
  };
  
  // Text-to-speech function
  const speakText = (text: string) => {
    if (!isClient) return;
    
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current.speak(utterance);
    }
  };
  
  // Toggle listening state for voice input
  const toggleListening = () => {
    if (!isClient) return;
    
    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      if (recognitionRef.current) {
        // Stop any ongoing speech synthesis
        if (synthRef.current) {
          synthRef.current.cancel();
        }
        recognitionRef.current.start();
        setListening(true);
      }
    }
  };
  
  // Send chat message
  const sendMessage = () => {
    if (!messageInput.trim() || !isClient) return;
    
    // Add user message to chat
    setChatMessages(prev => [
      ...prev,
      { role: 'user', content: messageInput }
    ]);
    
    // Process with Gemini
    processWithGemini(messageInput);
    
    // Clear input
    setMessageInput('');
  };
  
  // Handle clicks separately from dragging
  const handleClick = (e: MouseEvent) => {
    if (!isClient) return;
    
    const moveX = Math.abs(e.clientX - dragStartRef.current.startX);
    const moveY = Math.abs(e.clientY - dragStartRef.current.startY);
    const totalMovement = Math.sqrt(moveX * moveX + moveY * moveY);
    
    // Only toggle if there was minimal movement (5px threshold)
    if (totalMovement < 5) {
      e.preventDefault();
      e.stopPropagation();
      toggleExpanded();
    }
  };
  
  // If we're still server-side or haven't initialized client yet, render a placeholder
  // This prevents hydration errors
  if (!isClient) {
    return <div className="fixed" />;
  }
  
  return (
    <div
      ref={containerRef}
      className="fixed shadow-lg rounded-lg text-black bg-white z-50"
      style={{
        width: isExpanded ? '320px' : '64px',
        height: isExpanded ? '384px' : '64px',
        borderRadius: isExpanded ? '0.5rem' : '32px',
        backgroundColor: isExpanded ? 'white' : '#2563eb',
        left: 0,
        top: 0,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: 'width 0.3s, height 0.3s, border-radius 0.3s, background-color 0.3s',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {isExpanded ? (
        // Expanded view
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-blue-600 text-black p-3 flex justify-between items-center rounded-t-lg drag-handle cursor-move">
            <h3 className="font-semibold">HR Assistant</h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              className="text-black hover:text-blue-200"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Chat area */}
          <div className="flex-1 overflow-auto p-2 bg-gray-50">
            <div className="space-y-3">
              {chatMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-100 ml-4' 
                      : 'bg-white border border-gray-200 mr-4'
                  } ${message.loading ? 'opacity-70' : ''}`}
                >
                  {message.content}
                </div>
              ))}
            </div>
          </div>
          
          {/* Input area */}
          <div className="p-2 border-t border-gray-200 flex">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-black rounded-r-md px-3 py-2"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
            <button
              onClick={toggleListening}
              className={`ml-2 p-2 rounded-md ${listening ? 'bg-red-500' : 'bg-blue-500'} text-black`}
              title="Converse with voice"
              type="button"
            >
              {listening ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Collapsed view (button only)
        <button 
          className="w-full h-full flex items-center justify-center text-black drag-handle"
          onClick={handleClick}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </button>
      )}
    </div>
  );
}