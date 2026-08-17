import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority, UserRole } from '../../types';
import { 
  Headphones, Search, Filter, Plus, MessageSquare, Send, CheckCircle2, 
  Clock, AlertTriangle, User, Shield, Lock, ChevronRight, XCircle 
} from 'lucide-react';

interface SupportViewProps {
  tickets: Ticket[];
  currentRole: UserRole;
  onCreateTicket: (ticket: Partial<Ticket>) => Promise<void>;
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  onAddMessage: (ticketId: string, message: { senderName: string; senderRole: 'user' | 'driver' | 'support_agent' | 'system'; content: string; isInternalNote?: boolean }) => Promise<void>;
}

const priorityConfig: Record<TicketPriority, { label: string; bg: string; text: string }> = {
  low: { label: 'Low', bg: 'bg-slate-500/20', text: 'text-slate-300' },
  medium: { label: 'Medium', bg: 'bg-blue-500/20', text: 'text-blue-300' },
  high: { label: 'High', bg: 'bg-amber-500/20', text: 'text-amber-300' },
  urgent: { label: 'Urgent', bg: 'bg-rose-500/20', text: 'text-rose-300' }
};

const statusConfig: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  open: { label: 'Open', bg: 'bg-rose-500/20', text: 'text-rose-300' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-500/20', text: 'text-amber-300' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  closed: { label: 'Closed', bg: 'bg-slate-500/20', text: 'text-slate-400' }
};

export const SupportView: React.FC<SupportViewProps> = ({
  tickets,
  currentRole,
  onCreateTicket,
  onUpdateTicket,
  onAddMessage
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({
    subject: '',
    userType: 'driver',
    userName: '',
    userContact: '',
    priority: 'medium',
    category: 'other',
    assignedTo: 'Support Desk'
  });

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessageText.trim()) return;

    await onAddMessage(selectedTicket.id, {
      senderName: isInternalNote ? 'Support Staff (Internal Note)' : 'AT Support Agent',
      senderRole: 'support_agent',
      content: newMessageText.trim(),
      isInternalNote
    });

    // Update local selected ticket
    const updatedMessages = [
      ...selectedTicket.messages,
      {
        id: `msg-${Date.now()}`,
        senderName: isInternalNote ? 'Support Staff (Internal Note)' : 'AT Support Agent',
        senderRole: 'support_agent' as const,
        content: newMessageText.trim(),
        timestamp: new Date().toISOString(),
        isInternalNote
      }
    ];

    setSelectedTicket({
      ...selectedTicket,
      messages: updatedMessages,
      status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status
    });

    setNewMessageText('');
    setIsInternalNote(false);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    await onUpdateTicket(ticketId, { status: newStatus });
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.userName) return;
    await onCreateTicket(newTicket);
    setIsAddModalOpen(false);
    setNewTicket({
      subject: '',
      userType: 'driver',
      userName: '',
      userContact: '',
      priority: 'medium',
      category: 'other',
      assignedTo: 'Support Desk'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Helpdesk & Support Operations</h2>
            <span className="px-2 py-0.5 text-xs bg-rose-500/20 text-rose-400 rounded-full font-medium border border-rose-500/30">
              {filteredTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Driver inquiries, MTA delay investigations, rider assistance & internal support messaging
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticket #, user, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/90 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 placeholder-slate-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open (Открыт)</option>
            <option value="in_progress">In Progress (В работе)</option>
            <option value="resolved">Resolved (Решён)</option>
            <option value="closed">Closed (Закрыт)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm shadow-sky-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/60 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Ticket # & Priority</th>
                <th className="px-4 py-3.5">Subject & Category</th>
                <th className="px-4 py-3.5">Requestor</th>
                <th className="px-4 py-3.5">Assigned Agent</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Last Message</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Headphones className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No tickets found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const pr = priorityConfig[ticket.priority];
                  const st = statusConfig[ticket.status];
                  const lastMsg = ticket.messages[ticket.messages.length - 1];

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-white font-semibold group-hover:text-sky-300">
                          {ticket.ticketNumber}
                        </div>
                        <div className="mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pr.bg} ${pr.text}`}>
                            {pr.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-[260px]">
                        <div className="font-semibold text-white truncate">{ticket.subject}</div>
                        <div className="text-[11px] text-slate-400 capitalize mt-0.5">
                          Category: {ticket.category.replace('_', ' ')}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-200 flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                            ticket.userType === 'driver' ? 'bg-emerald-500/20 text-emerald-300' :
                            ticket.userType === 'broker' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-sky-500/20 text-sky-300'
                          }`}>
                            {ticket.userType}
                          </span>
                          <span>{ticket.userName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{ticket.userContact}</div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        {ticket.assignedTo || 'Unassigned'}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-[180px]">
                        <div className="text-[11px] text-slate-400 truncate">
                          {lastMsg ? lastMsg.content : 'No messages'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {ticket.messages.length} messages
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET DETAILS & INTERACTIVE CHAT DRAWER */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
          <div className="bg-slate-900 border-l sm:border border-slate-800 w-full max-w-2xl h-full sm:h-[92vh] sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right">
            {/* Header */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-sky-400 font-bold">{selectedTicket.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[selectedTicket.status].bg} ${statusConfig[selectedTicket.status].text}`}>
                    {statusConfig[selectedTicket.status].label}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityConfig[selectedTicket.priority].bg} ${priorityConfig[selectedTicket.priority].text}`}>
                    {priorityConfig[selectedTicket.priority].label} Priority
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedTicket.subject}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Requestor: <strong className="text-slate-200">{selectedTicket.userName}</strong> ({selectedTicket.userType}) • {selectedTicket.userContact}
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Change Status:</span>
              <div className="flex space-x-1.5">
                {(['open', 'in_progress', 'resolved', 'closed'] as TicketStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedTicket.id, st)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                      selectedTicket.status === st
                        ? 'bg-sky-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
              {selectedTicket.messages.map((msg) => {
                const isAgent = msg.senderRole === 'support_agent';
                const isInternal = msg.isInternalNote;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      {isInternal && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                      <span className="font-semibold text-slate-300">{msg.senderName}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                        isInternal
                          ? 'bg-amber-950/40 text-amber-200 border border-amber-800/60'
                          : isAgent
                          ? 'bg-sky-600 text-white rounded-tr-xs'
                          : 'bg-slate-800 text-slate-200 rounded-tl-xs border border-slate-700/80'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-800/90 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2 text-xs">
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-400 hover:text-white">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-0"
                  />
                  <span className={isInternalNote ? 'text-amber-400 font-semibold' : ''}>
                    Internal staff note (Hidden from customer)
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={isInternalNote ? 'Type internal staff note...' : 'Type response to customer...'}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-900 text-white text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className={`p-2.5 rounded-xl font-semibold transition-all ${
                    isInternalNote
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Headphones className="w-5 h-5 text-sky-400" />
                Open Support Ticket
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Subject / Issue Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passenger pickup delay on Queens Blvd"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">User Type</label>
                  <select
                    value={newTicket.userType}
                    onChange={(e) => setNewTicket({ ...newTicket, userType: e.target.value as any })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  >
                    <option value="driver">Driver</option>
                    <option value="passenger">Passenger</option>
                    <option value="broker">MTA Broker</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Requestor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Carlos Ramirez"
                    value={newTicket.userName}
                    onChange={(e) => setNewTicket({ ...newTicket, userName: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Contact (Phone/Email)</label>
                  <input
                    type="text"
                    placeholder="+1 (718) 555-0142"
                    value={newTicket.userContact}
                    onChange={(e) => setNewTicket({ ...newTicket, userContact: e.target.value })}
                    className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Category</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                  className="w-full p-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                >
                  <option value="mta_dispatch">MTA Paratransit Dispatch</option>
                  <option value="fare_dispute">Fare Dispute / Toll</option>
                  <option value="trip_delay">Trip Delay</option>
                  <option value="vehicle_condition">Vehicle Condition / WAV</option>
                  <option value="app_issue">Driver / Rider App Issue</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg"
                >
                  Open Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
