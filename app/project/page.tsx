"use client";
import { useState, useEffect, useRef } from 'react';

export default function DraggableHRAssistant({ projectId = "8e3ba3ee-6e97-4bed-be02-72b4a66f243f" }) {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState(() => {
    // Load position from localStorage if available
    if (typeof window !== 'undefined') {
      const savedPosition = localStorage.getItem('hrAssistantPosition');
      return savedPosition ? JSON.parse(savedPosition) : { x: window.innerWidth - 100, y: window.innerHeight - 100 };
    }
    return { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [listening, setListening] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  
  const containerRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  
  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis;
      
      // Initialize speech recognition
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event) => {
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
          
          // Process with AI
          processWithGemini(text);
          setListening(false);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);
  
  // Save position to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hrAssistantPosition', JSON.stringify(position));
    }
  }, [position]);

  // Fetch project data when component mounts
  useEffect(() => {
    if (!projectId) return;
    
    const fetchProjectData = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProjectMembers(data.members);
        } else {
          console.error('Failed to fetch project data');
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };
    
    fetchProjectData();
  }, [projectId]);
  
  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && containerRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep button within viewport bounds
        const maxX = window.innerWidth - (isExpanded ? 320 : 64); // Adjust based on expanded width
        const maxY = window.innerHeight - (isExpanded ? 400 : 64); // Adjust based on expanded height
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isExpanded]);
  
  // Start drag operation
  const handleMouseDown = (e) => {
    if (containerRef.current && e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
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
      setTimeout(() => speakText(greeting), 300);
    }
    
    setIsExpanded(!isExpanded);
  };
  
  // Process text with Gemini API
  const processWithGemini = async (text) => {
    try {
      // Add loading state message
      const tempId = Date.now();
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: '...', id: tempId, loading: true }
      ]);
      
      const response = await fetch('/api/gemini-hr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          projectId,
          projectMembers,
          messageHistory: chatMessages,  // Include message history
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Replace loading message with actual response
        setChatMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { role: 'assistant', content: data.response } 
            : msg
        ));
        
        // Speak the response
        speakText(data.response);
        
        // Refresh project data if needed
        if (data.projectUpdated) {
          refreshProjectData();
        }
      } else {
        // Replace loading message with error
        setChatMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { role: 'assistant', content: "I'm sorry, I couldn't process your request." } 
            : msg
        ));
      }
    } catch (error) {
      console.error('Error processing with Gemini:', error);
      // Handle error in UI
      setChatMessages(prev => prev.filter(msg => !msg.loading));
    }
  };
  
  // Text-to-speech function
  const speakText = (text) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current.speak(utterance);
    }
  };
  
  // Toggle listening state for voice input
  const toggleListening = () => {
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
  
  // Refresh project data
  const refreshProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectMembers(data.members);
      }
    } catch (error) {
      console.error('Error refreshing project data:', error);
    }
  };
  
  // Send chat message
  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
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
  
  return (
    <div
      ref={containerRef}
      className={`fixed shadow-lg rounded-lg bg-white z-50 transition-all duration-300 ${isExpanded ? 'w-80 h-96' : 'w-16 h-16 rounded-full bg-blue-600'}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
    >
      {isExpanded ? (
        // Expanded view
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-blue-600 text-black p-3 flex justify-between items-center rounded-t-lg drag-handle cursor-move">
            <h3 className="font-semibold">HR Assistant</h3>
            <button onClick={toggleExpanded} className="text-black hover:text-blue-200">
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
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
            <button
              onClick={toggleListening}
              className={`ml-2 p-2 rounded-md ${listening ? 'bg-red-500' : 'bg-blue-500'} text-black`}
              title="Converse with voice"
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
          onClick={toggleExpanded}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </button>
      )}
    </div>
  );
}