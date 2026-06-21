import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { MainLayout } from '../components/Layout/MainLayout';
import { Card, Button, Input, Textarea, Badge, EmptyState, Modal } from '../components/ui';
import {
  MessageSquare,
  Plus,
  Send,
  Paperclip,
  ChevronRight,
  Upload,
  X
} from 'lucide-react';
import type { SupportTicket, TicketMessage } from '../types';

export const Support: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });
      setTickets(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="info">Open</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      case 'resolved': return <Badge variant="success">Resolved</Badge>;
      case 'closed': return <Badge variant="default">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <MainLayout title="Support">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">My Tickets</h2>
          <Button size="sm" onClick={() => setShowNewTicket(true)} icon={<Plus className="w-4 h-4" />}>
            New Ticket
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-20" />
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <Card
                key={ticket.id}
                hover
                onClick={() => navigate(`/support/${ticket.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{ticket.subject}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(ticket.status)}
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageSquare className="w-8 h-8" />}
            title="No Support Tickets"
            description="Create a new ticket if you need help"
            action={<Button onClick={() => setShowNewTicket(true)}>Create Ticket</Button>}
          />
        )}

        {/* New Ticket Modal */}
        <NewTicketModal
          isOpen={showNewTicket}
          onClose={() => setShowNewTicket(false)}
          onSuccess={() => {
            setShowNewTicket(false);
            fetchTickets();
          }}
        />
      </div>
    </MainLayout>
  );
};

const NewTicketModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const { user, addNotification } = useApp();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async () => {
    if (!subject || !message) return;

    setLoading(true);
    try {
      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          subject,
          status: 'open',
          priority
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create initial message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user?.id,
          sender_type: 'user',
          message
        });

      if (messageError) throw messageError;

      addNotification({
        type: 'success',
        title: 'Ticket Created',
        message: 'Your support ticket has been submitted'
      });

      onSuccess();
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Support Ticket" size="lg">
      <div className="space-y-4">
        <Input
          label="Subject"
          placeholder="Brief description of your issue"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <Textarea
          label="Message"
          placeholder="Describe your issue in detail..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
          <div className="flex gap-2">
            {['low', 'medium', 'high'].map(p => (
              <button
                key={p}
                onClick={() => setPriority(p as typeof priority)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  priority === p
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#1e1e2d] text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Attachments</label>
          <div className="border-2 border-dashed border-[#2a2a3d] rounded-xl p-4 text-center">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Click to upload files</p>
            </label>
          </div>
          {files.length > 0 && (
            <div className="mt-2 space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#1e1e2d] rounded-lg px-3 py-2">
                  <span className="text-sm text-white truncate">{file.name}</span>
                  <button onClick={() => removeFile(idx)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            Submit Ticket
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const TicketDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useApp();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchMessages();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTicket = async () => {
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();
      setTicket(data);
    } catch {
      // Handle error
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await supabase.from('ticket_messages').insert({
        ticket_id: id,
        sender_id: user?.id,
        sender_type: 'user',
        message: newMessage
      });

      setNewMessage('');
      fetchMessages();
    } catch {
      // Handle error
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Loading...">
        <div className="p-4 animate-pulse space-y-4">
          <div className="h-20 bg-[#1e1e2d] rounded-xl" />
          <div className="h-40 bg-[#1e1e2d] rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!ticket) {
    return (
      <MainLayout title="Not Found">
        <div className="p-4">
          <EmptyState
            icon={<MessageSquare className="w-8 h-8" />}
            title="Ticket Not Found"
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={ticket.subject}>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Ticket Info */}
        <div className="p-4 border-b border-[#1e1e2d]">
          <h1 className="text-lg font-semibold text-white">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={ticket.status === 'open' ? 'info' : ticket.status === 'resolved' ? 'success' : 'warning'}>
              {ticket.status}
            </Badge>
            <span className="text-gray-400 text-sm">
              Created {new Date(ticket.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.sender_type === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-[#1e1e2d] text-white rounded-bl-sm'
                }`}
              >
                {msg.sender_type === 'admin' && (
                  <p className="text-xs text-indigo-400 mb-1">Support Team</p>
                )}
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {ticket.status !== 'closed' && (
          <div className="p-4 border-t border-[#1e1e2d]">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-[#1e1e2d] rounded-xl transition-colors">
                <Paperclip className="w-5 h-5 text-gray-400" />
              </button>
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-[#1e1e2d] border border-[#2a2a3d] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
              />
              <Button onClick={sendMessage} loading={sending} icon={<Send className="w-4 h-4" />} />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
