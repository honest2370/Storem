import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card, Button, Input, Badge, Modal, EmptyState } from '../../components/ui';
import { MessageSquare, Search, ChevronRight, Send, Paperclip } from 'lucide-react';
import type { SupportTicket, TicketMessage } from '../../types';

export const AdminTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchTickets(); }, [search]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase.from('support_tickets').select('*');
      if (search) query = query.ilike('subject', `%${search}%`);
      const { data } = await query.order('updated_at', { ascending: false });
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
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <MainLayout title="Support Tickets" showBottomNav={false}>
      <div className="p-4 space-y-4">
        <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />} />

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-20" />)}</div>
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <Card key={ticket.id} hover onClick={() => { setSelectedTicket(ticket); setShowModal(true); }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{ticket.subject}</h3>
                    <p className="text-gray-400 text-sm">User: {ticket.user_id}</p>
                    <p className="text-gray-500 text-xs">{new Date(ticket.created_at).toLocaleDateString()}</p>
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
          <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No Tickets" />
        )}

        <TicketDetailModal isOpen={showModal} onClose={() => setShowModal(false)} ticket={selectedTicket}
          onUpdate={() => { setShowModal(false); fetchTickets(); }} />
      </div>
    </MainLayout>
  );
};

const TicketDetailModal: React.FC<{
  isOpen: boolean; onClose: () => void; ticket: SupportTicket | null; onUpdate: () => void;
}> = ({ isOpen, onClose, ticket, onUpdate }) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket) fetchMessages();
  }, [ticket]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchMessages = async () => {
    if (!ticket) return;
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticket.id).order('created_at');
    setMessages(data || []);
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;
    setSending(true);
    try {
      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id, sender_id: 'admin', sender_type: 'admin', message: newMessage
      });
      await supabase.from('support_tickets').update({ status: 'in_progress' }).eq('id', ticket.id);
      setNewMessage('');
      fetchMessages();
    } catch {
      // Handle error
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!ticket) return;
    await supabase.from('support_tickets').update({ status }).eq('id', ticket.id);
    onUpdate();
  };

  if (!ticket) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ticket.subject} size="lg">
      <div className="flex flex-col h-[60vh]">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={ticket.status === 'open' ? 'info' : ticket.status === 'resolved' ? 'success' : 'warning'}>
            {ticket.status}
          </Badge>
          <Badge variant="default">{ticket.priority}</Badge>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.sender_type === 'admin' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-[#1e1e2d] text-white rounded-bl-sm'
              }`}>
                {msg.sender_type === 'user' && <p className="text-xs text-indigo-400 mb-1">User</p>}
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {ticket.status !== 'closed' && (
          <div className="flex items-center gap-2 border-t border-[#1e1e2d] pt-4">
            <button className="p-2 hover:bg-[#1e1e2d] rounded-xl"><Paperclip className="w-5 h-5 text-gray-400" /></button>
            <input type="text" placeholder="Type your reply..." value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 bg-[#1e1e2d] border border-[#2a2a3d] rounded-xl px-4 py-2.5 text-white" />
            <Button onClick={sendMessage} loading={sending} icon={<Send className="w-4 h-4" />} />
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => updateStatus('resolved')} className="flex-1">Mark Resolved</Button>
          <Button variant="ghost" onClick={() => updateStatus('closed')} className="flex-1">Close Ticket</Button>
        </div>
      </div>
    </Modal>
  );
};
