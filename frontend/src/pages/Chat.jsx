import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Send, User, Bot, Loader2, MessageSquare, Plus, Trash2, Edit2, Check, X, Activity, Pill, Apple } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Chat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm HealthMate, your AI healthcare assistant. How can I help you today? Please note that I provide preliminary information, not professional medical diagnoses.", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/chat/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const loadSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    setLoading(true);
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      const formattedMessages = res.data.messages.map(m => ({
        text: m.content,
        isUser: m.is_user
      }));
      setMessages(formattedMessages);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      { text: "Hello! I'm HealthMate, your AI healthcare assistant. How can I help you today? Please note that I provide preliminary information, not professional medical diagnoses.", isUser: false }
    ]);
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
      fetchSessions();
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleRenameSession = (e, sessionId, currentTitle) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle || "New Chat");
  };

  const handleSaveRename = async (e, sessionId) => {
    e.stopPropagation();
    if (!editingTitle || editingTitle.trim() === "") {
      setEditingSessionId(null);
      return;
    }
    
    try {
      await api.put(`/chat/sessions/${sessionId}`, { title: editingTitle.trim() });
      setEditingSessionId(null);
      fetchSessions();
    } catch (err) {
      console.error("Failed to rename session:", err);
    }
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userText, isUser: true }]);
    setLoading(true);

    try {
      const payload = { message: userText };
      if (currentSessionId) {
        payload.session_id = currentSessionId;
      }
      const response = await api.post('/chat', payload);
      setMessages(prev => [...prev, { text: response.data.response, isUser: false }]);
      
      if (!currentSessionId && response.data.session_id) {
        setCurrentSessionId(response.data.session_id);
        fetchSessions(); // refresh sidebar to show new session
      }

      // Optionally save to health history
      await api.post('/health-history', {
        record_type: 'ai_chat',
        description: userText,
        report_details: response.data.response
      });

    } catch (err) {
      setMessages(prev => [...prev, { text: "I'm sorry, I encountered an error. Please try again.", isUser: false, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content flex flex-col w-full h-[calc(100dvh-70px)] md:h-[calc(100vh-80px)] pb-0">
      <div className="hidden md:flex mb-2 md:mb-4 items-center justify-between md:justify-start gap-2 flex-shrink-0">
        <h1 className="text-primary-dark text-xl md:text-3xl mb-0 md:mb-1 font-semibold">HealthMate Assistant</h1>
        <p className="text-muted-foreground text-sm md:text-base hidden md:block ml-4">Ask questions about symptoms, health practices, and get general guidance.</p>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-4 overflow-hidden w-full min-h-0 relative">
        
        {/* Sidebar for Chat History */}
        <Card className="hidden md:flex w-[280px] flex-col p-4 overflow-hidden flex-shrink-0 h-auto border-r border-border rounded-none shadow-none bg-background">
          <Button onClick={handleNewChat} icon={Plus} className="w-full mb-4 flex justify-center">
            New Chat
          </Button>
          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Recent Chats</h4>
            {sessionsLoading ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}><Loader2 className="animate-spin" size={20} /></div>
            ) : sessions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No recent chats</p>
            ) : (
              sessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: currentSessionId === session.id ? 'var(--primary-light)' : 'transparent',
                    color: currentSessionId === session.id ? 'white' : 'var(--text)',
                    marginBottom: '0.25rem',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                    <MessageSquare size={16} style={{ flexShrink: 0 }} />
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(e, session.id);
                          if (e.key === 'Escape') handleCancelRename(e);
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.5)',
                          color: currentSessionId === session.id ? 'white' : 'var(--text)',
                          borderRadius: '0.25rem',
                          padding: '0.25rem',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {session.title || 'New Chat'}
                      </span>
                    )}
                  </div>
                  
                  {editingSessionId === session.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button 
                        onClick={(e) => handleSaveRename(e, session.id)}
                        style={{ background: 'none', border: 'none', color: currentSessionId === session.id ? 'white' : 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={handleCancelRename}
                        style={{ background: 'none', border: 'none', color: currentSessionId === session.id ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button 
                        onClick={(e) => handleRenameSession(e, session.id, session.title)}
                        style={{ background: 'none', border: 'none', color: currentSessionId === session.id ? 'white' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Rename Chat"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        style={{ background: 'none', border: 'none', color: currentSessionId === session.id ? 'white' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Delete Chat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Mobile Header (matches ChatGPT screenshot) */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
          <button 
            onClick={toggleSidebar}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
          </button>
          
          <button className="flex items-center gap-2 bg-[#f3f7ff] text-[#2563eb] px-4 py-2 rounded-full font-medium text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Get Plus
          </button>
          
          <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white" onClick={handleNewChat}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white md:bg-background w-full min-h-0 relative rounded-2xl md:rounded-none">
          
          {messages.length === 1 && !currentSessionId ? (
            // EMPTY STATE
            <div className="flex-1 flex flex-col items-center justify-end p-0 md:p-8 mx-auto w-full max-w-3xl overflow-y-auto">
              <div className="hidden md:flex flex-1 items-center justify-center">
                <h2 className="text-2xl md:text-4xl font-semibold text-foreground mb-8 text-center px-4">
                  What's on your mind?
                </h2>
              </div>
              
              {/* Suggestions List (stacked bottom, hidden on mobile) */}
              <div className="hidden md:flex flex-col gap-2 w-full max-w-2xl mx-auto mb-4">
                <button 
                  onClick={() => setInput("Can you help me check my symptoms?")} 
                  className="flex items-center gap-4 p-3 md:p-4 rounded-xl border border-transparent hover:border-border bg-transparent hover:bg-surface cursor-pointer text-left transition-all"
                >
                  <div className="text-primary"><Activity size={20} /></div>
                  <span className="text-sm md:text-base text-foreground font-medium">Check symptoms</span>
                </button>
                <button 
                  onClick={() => setInput("What is the standard dosage for Ibuprofen?")} 
                  className="flex items-center gap-4 p-3 md:p-4 rounded-xl border border-transparent hover:border-border bg-transparent hover:bg-surface cursor-pointer text-left transition-all"
                >
                  <div className="text-primary"><Pill size={20} /></div>
                  <span className="text-sm md:text-base text-foreground font-medium">About a medicine</span>
                </button>
                <button 
                  onClick={() => setInput("What are some good dietary habits for high blood pressure?")} 
                  className="flex items-center gap-4 p-3 md:p-4 rounded-xl border border-transparent hover:border-border bg-transparent hover:bg-surface cursor-pointer text-left transition-all"
                >
                  <div className="text-primary"><Apple size={20} /></div>
                  <span className="text-sm md:text-base text-foreground font-medium">Dietary advice</span>
                </button>
              </div>

              {/* Empty state input bar wrapper */}
              <div className="w-full max-w-2xl relative mx-auto mb-4 md:mb-8 px-4 md:px-0">
                <form onSubmit={handleSend} className="flex items-center bg-surface border border-border rounded-full overflow-hidden p-1 shadow-sm md:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                  <div className="pl-3 pr-1 text-muted-foreground">
                    <Plus size={24} />
                  </div>
                  <input
                    type="text"
                    className="flex-1 border-none bg-transparent px-2 py-3 md:py-3.5 text-base outline-none text-foreground w-full placeholder-muted-foreground"
                    placeholder="Ask Health Mate"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                  />
                  <div className="pr-1 flex items-center gap-2">
                    {/* Voice icon placeholder */}
                    <div className="w-8 h-8 rounded-full bg-primary/20 md:hidden flex items-center justify-center text-primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                    <button type="submit" disabled={loading || !input.trim()} className={`p-2 rounded-full flex items-center justify-center transition-colors ${loading || !input.trim() ? 'bg-transparent text-muted-foreground cursor-not-allowed' : 'bg-primary text-white cursor-pointer hover:opacity-90'}`}>
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} className="rotate-90" />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            // ACTIVE CHAT STATE
            <>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {messages.map((msg, idx) => {
                  // Skip the default first message if we are in an active chat
                  if (idx === 0 && !msg.isUser && msg.text.includes("Hello! I'm HealthMate")) return null;
                  
                  return (
                    <div key={idx} className={`flex gap-3 md:gap-4 mb-6 md:mb-8 w-full md:max-w-4xl mx-auto ${msg.isUser ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isUser ? 'bg-primary text-white' : 'bg-secondary text-primary-dark'}`}>
                        {msg.isUser ? <User size={18} className="md:w-5 md:h-5" /> : <Bot size={18} className="md:w-5 md:h-5" />}
                      </div>
                      <div className={`flex-1 md:flex-initial leading-relaxed pt-1 md:pt-0 overflow-x-hidden break-words text-sm md:text-base md:px-5 md:py-3 md:rounded-2xl md:shadow-sm md:max-w-[75%] ${msg.isUser ? 'text-foreground md:bg-primary md:text-white md:rounded-tr-none' : 'text-foreground md:bg-white md:border md:border-border md:rounded-tl-none'}`}>
                        <ReactMarkdown
                          components={{
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 break-words" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 break-words" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1 break-words" {...props} />,
                            p: ({node, ...props}) => <p className="m-0 whitespace-pre-wrap break-words mb-2" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold break-words" {...props} />
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-3 md:gap-4 mb-6 md:mb-8 w-full md:max-w-4xl mx-auto md:flex-row">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary text-primary-dark flex items-center justify-center flex-shrink-0">
                      <Bot size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="flex-1 md:flex-initial pt-1 md:pt-0 md:bg-white md:border md:border-border md:px-5 md:py-3 md:rounded-2xl md:rounded-tl-none md:shadow-sm">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-3 md:p-6 lg:p-8 bg-white md:bg-background mt-auto flex-shrink-0 md:border-t md:border-border">
                <form onSubmit={handleSend} className="flex items-center w-full max-w-4xl mx-auto bg-[#f4f4f4] md:bg-transparent rounded-full md:rounded-none overflow-hidden md:overflow-visible p-1 md:p-0 shadow-sm md:shadow-none md:gap-4">
                  
                  {/* Mobile plus icon */}
                  <div className="pl-3 pr-1 text-gray-500 md:hidden">
                    <Plus size={24} />
                  </div>

                  <div className="flex-1 md:bg-surface md:border md:border-border md:rounded-2xl md:flex md:items-center md:px-2 md:focus-within:border-primary md:focus-within:shadow-md transition-all">
                    <input
                      type="text"
                      className="border-none bg-transparent px-2 py-3 md:py-3.5 text-base outline-none text-gray-800 md:text-foreground w-full placeholder-gray-500 md:placeholder-muted-foreground"
                      placeholder="Ask Health Mate"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {/* Submit button wrapper */}
                  <div className="pr-1 md:pr-0 flex items-center gap-2 md:flex-shrink-0">
                    {/* Voice icon placeholder */}
                    <div className="w-8 h-8 rounded-full bg-[#fbbc05] md:hidden flex items-center justify-center text-white">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>

                    {/* Mobile submit button */}
                    <button type="submit" disabled={loading || !input.trim()} className={`md:hidden p-2 rounded-full flex items-center justify-center transition-colors ${loading || !input.trim() ? 'bg-transparent text-gray-400 cursor-not-allowed' : 'bg-black text-white cursor-pointer hover:bg-gray-800'}`}>
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} className="rotate-90" />}
                    </button>

                    {/* Desktop submit button */}
                    <Button type="submit" disabled={loading || !input.trim()} icon={Send} className="hidden md:flex px-6 py-3.5">
                      Send
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Chat;
