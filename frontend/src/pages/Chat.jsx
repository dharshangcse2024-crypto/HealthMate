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
  const messagesEndRef = useRef(null);

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
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', paddingBottom: '0' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--primary-dark)' }}>AI Assistant</h1>
        <p style={{ color: 'var(--text-muted)' }}>Ask questions about symptoms, health practices, and get general guidance.</p>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden' }}>
        
        {/* Sidebar for Chat History */}
        <Card style={{ width: '280px', display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
          <Button onClick={handleNewChat} icon={Plus} style={{ width: '100%', marginBottom: '1rem' }}>
            New Chat
          </Button>
          <div style={{ flex: 1, overflowY: 'auto' }}>
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

        {/* Main Chat Area */}
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0', backgroundColor: 'var(--background)' }}>
          
          {messages.length === 1 && !currentSessionId ? (
            // EMPTY STATE
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', margin: '0 auto', width: '100%', maxWidth: '800px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text)', marginBottom: '3rem', textAlign: 'center' }}>
                What's on your mind today?
              </h2>
              
              <div style={{ width: '100%', maxWidth: '700px', position: 'relative', margin: '0 auto 2rem auto' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2rem', overflow: 'hidden', padding: '0.25rem 0.5rem', boxShadow: 'var(--shadow-md)', transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                  <input
                    type="text"
                    style={{ flex: 1, border: 'none', background: 'transparent', padding: '1rem', fontSize: '1.1rem', outline: 'none', color: 'var(--text)' }}
                    placeholder="Ask HealthMate anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                  />
                  <div style={{ paddingRight: '0.5rem' }}>
                    <button type="submit" disabled={loading || !input.trim()} style={{ backgroundColor: (loading || !input.trim()) ? 'var(--secondary)' : 'var(--primary)', color: (loading || !input.trim()) ? 'var(--text-muted)' : 'white', border: 'none', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                  </div>
                </form>
              </div>

              {/* Suggestions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%', maxWidth: '700px' }}>
                <button 
                  onClick={() => setInput("Can you help me check my symptoms?")} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary-light)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                >
                  <div style={{ color: 'var(--primary)' }}><Activity size={20} /></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500 }}>Check symptoms</span>
                </button>
                <button 
                  onClick={() => setInput("What is the standard dosage for Ibuprofen?")} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary-light)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                >
                  <div style={{ color: 'var(--primary)' }}><Pill size={20} /></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500 }}>About a medicine</span>
                </button>
                <button 
                  onClick={() => setInput("What are some good dietary habits for high blood pressure?")} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary-light)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                >
                  <div style={{ color: 'var(--primary)' }}><Apple size={20} /></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500 }}>Dietary advice</span>
                </button>
              </div>
            </div>
          ) : (
            // ACTIVE CHAT STATE
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                {messages.map((msg, idx) => {
                  // Skip the default first message if we are in an active chat
                  if (idx === 0 && !msg.isUser && msg.text.includes("Hello! I'm HealthMate")) return null;
                  
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      marginBottom: '1.5rem',
                      flexDirection: msg.isUser ? 'row-reverse' : 'row'
                    }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        backgroundColor: msg.isUser ? 'var(--primary)' : 'var(--secondary)',
                        color: msg.isUser ? 'white' : 'var(--primary-dark)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {msg.isUser ? <User size={20} /> : <Bot size={20} />}
                      </div>
                      <div style={{ 
                        backgroundColor: msg.isUser ? 'var(--primary)' : 'white',
                        color: msg.isUser ? 'white' : 'var(--text)',
                        padding: '1rem 1.5rem',
                        borderRadius: '1rem',
                        borderTopRightRadius: msg.isUser ? '0' : '1rem',
                        borderTopLeftRadius: msg.isUser ? '1rem' : '0',
                        maxWidth: '75%',
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                        border: msg.isUser ? 'none' : '1px solid var(--border)'
                      }}>
                        <ReactMarkdown
                          components={{
                            ul: ({node, ...props}) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }} {...props} />,
                            ol: ({node, ...props}) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }} {...props} />,
                            li: ({node, ...props}) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
                            p: ({node, ...props}) => <p style={{ margin: 0, whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }} {...props} />,
                            strong: ({node, ...props}) => <strong style={{ fontWeight: 600 }} {...props} />
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--primary-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Bot size={20} />
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '1rem', display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
                      <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', alignItems: 'center', maxWidth: '900px', margin: '0 auto' }}>
                  <Input 
                    type="text" 
                    containerStyle={{ flex: 1, margin: 0 }}
                    placeholder="Ask me about a symptom or health concern..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                  />
                  <Button type="submit" disabled={loading || !input.trim()} icon={Send}>
                    Send
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>

      </div>
    </div>
  );
};

export default Chat;
