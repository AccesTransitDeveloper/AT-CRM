import React, { useState, useEffect } from 'react';
import { Employee, EmployeeInvitation, EmployeeLoginAuditLog, UserRole } from '../../types';
import { useTranslation } from '../../lib/i18n';
import { safeFetchJson } from '../../lib/api';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Filter, 
  Link2, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Activity,
  Sparkles,
  Smartphone,
  Info,
  MapPin,
  Compass,
  Radio
} from 'lucide-react';
import { InviteEmployeeModal } from './InviteEmployeeModal';
import { SelfRegistrationModal } from './SelfRegistrationModal';
import { EmployeeLiveMap } from './EmployeeLiveMap';

interface EmployeesViewProps {
  currentRole: UserRole;
  onOpenSelfRegisterWithToken?: (token: string) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  currentRole,
  onOpenSelfRegisterWithToken
}) => {
  const { t } = useTranslation();

  // State
  const [activeTab, setActiveTab] = useState<'directory' | 'invitations' | 'audit' | 'map'>('directory');
  const [focusedEmployeeIdOnMap, setFocusedEmployeeIdOnMap] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invitations, setInvitations] = useState<EmployeeInvitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<EmployeeLoginAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selfRegisterToken, setSelfRegisterToken] = useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [empRes, invRes, audRes] = await Promise.all([
        safeFetchJson<Employee[]>('/api/employees?role=admin'),
        safeFetchJson<EmployeeInvitation[]>('/api/employees/invitations'),
        safeFetchJson<EmployeeLoginAuditLog[]>('/api/auth/login-audit')
      ]);

      if (empRes.ok && Array.isArray(empRes.data)) {
        setEmployees(empRes.data);
      } else {
        // Fallback from localStorage or initial defaults
        try {
          const localEmps = JSON.parse(localStorage.getItem('at_employees') || '[]');
          if (localEmps.length > 0) setEmployees(localEmps);
        } catch (e) {
          console.error(e);
        }
      }

      if (invRes.ok && Array.isArray(invRes.data)) {
        setInvitations(invRes.data);
      } else {
        try {
          const localInvs = JSON.parse(localStorage.getItem('at_employee_invites') || '[]');
          if (localInvs.length > 0) setInvitations(localInvs);
        } catch (e) {
          console.error(e);
        }
      }

      if (audRes.ok && Array.isArray(audRes.data)) {
        setAuditLogs(audRes.data);
      }
    } catch (err) {
      console.error('Failed to load employees data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Actions
  const handleToggleStatus = async (employee: Employee) => {
    const newStatus = employee.status === 'blocked' ? 'active' : 'blocked';
    try {
      const res = await fetch(`/api/employees/${employee.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setEmployees(prev => prev.map(e => e.id === employee.id ? { ...e, status: newStatus } : e));
        showToast(`Status updated for ${employee.fullName}: ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      alert('Failed to update employee status');
    }
  };

  const handleResetFace = async (employee: Employee) => {
    if (!window.confirm(`Reset Face ID for ${employee.fullName}? All existing biometric embedding vectors will be purged from the database, requiring the employee to re-enroll upon next login.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/employees/${employee.id}/reset-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: 'Elena Rostova (Admin)' })
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(prev => prev.map(e => e.id === employee.id ? data.employee : e));
        showToast(`Face ID reset for ${employee.fullName}. Biometric embeddings purged.`);
      }
    } catch (err) {
      alert('Failed to reset Face ID');
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!window.confirm(`${t('employees.deleteConfirm')}\n\nEmployee: ${employee.fullName} (${employee.email})`)) {
      return;
    }
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEmployees(prev => prev.filter(e => e.id !== employee.id));
        showToast(`Employee ${employee.fullName} deleted. Biometric data purged.`);
      }
    } catch (err) {
      alert('Failed to delete employee');
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to revoke this 48-hour invitation link?')) {
      return;
    }
    try {
      const res = await fetch(`/api/employees/invitations/${invitationId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: 'Elena Rostova (Admin)' })
      });
      if (res.ok) {
        setInvitations(prev => prev.map(inv => inv.id === invitationId ? { ...inv, status: 'revoked' } : inv));
        showToast('Invitation link revoked successfully.');
      }
    } catch (err) {
      alert('Failed to revoke invitation');
    }
  };

  const handleCopyLink = (token: string, invId: string) => {
    const origin = window.location.origin;
    const url = `${origin}?invite=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedTokenId(invId);
    showToast(t('employees.linkCopied'));
    setTimeout(() => setCopiedTokenId(null), 3000);
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const totalEmployeesCount = employees.length;
  const activeEmployeesCount = employees.filter(e => e.status === 'active').length;
  const faceEnrolledCount = employees.filter(e => e.faceEnrolled).length;
  const pendingInvitesCount = invitations.filter(i => i.status === 'pending').length;

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrator', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    dispatcher: { label: 'Dispatcher', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    driver_manager: { label: 'Driver Manager', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    support: { label: 'Support Operator', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    finance: { label: 'Finance Manager', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900/90 text-white border border-emerald-500 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl backdrop-blur shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {t('employees.adminOnlyBadge')}
            </span>
            <span className="text-xs text-slate-400">Accessible Transit CRM</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>{t('employees.title')}</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl">
            {t('employees.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('employees.inviteBtn')}</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('employees.statsTotal')}</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{totalEmployeesCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Staff members registered</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('employees.statsActive')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{activeEmployeesCount}</p>
          <p className="text-[10px] text-emerald-500/80 mt-0.5">Active login access</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('employees.statsFaceEnrolled')}</span>
            <Camera className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{faceEnrolledCount}</p>
          <p className="text-[10px] text-indigo-400/80 mt-0.5">Biometric embeddings</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('employees.statsPendingInvites')}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendingInvitesCount}</p>
          <p className="text-[10px] text-amber-400/80 mt-0.5">48-hour single-use links</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'directory'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('employees.tabEmployees')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {employees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'invitations'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>{t('employees.tabInvitations')}</span>
            {pendingInvitesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {pendingInvitesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t('employees.tabAudit')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => {
              setFocusedEmployeeIdOnMap(null);
              setActiveTab('map');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'map'
                ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </div>
            <span>Live Map (Карта сотрудников)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              Admin
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY TABLE */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff name, email, phone..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="driver_manager">Driver Manager</option>
                <option value="support">Support Operator</option>
                <option value="finance">Finance Manager</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="blocked">Blocked</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">{t('employees.thEmployee')}</th>
                    <th className="px-4 py-3.5">{t('employees.thRole')}</th>
                    <th className="px-4 py-3.5">{t('employees.thStatus')}</th>
                    <th className="px-4 py-3.5">Геолокация</th>
                    <th className="px-4 py-3.5">{t('employees.thFaceId')}</th>
                    <th className="px-4 py-3.5">{t('employees.thRegistered')}</th>
                    <th className="px-4 py-3.5">{t('employees.thLastLogin')}</th>
                    <th className="px-4 py-3.5 text-right">{t('employees.thActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">
                        No employees found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const roleConfig = roleLabels[emp.role] || { label: emp.role, color: 'bg-slate-800 text-slate-300' };

                      return (
                        <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Employee Info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 shrink-0">
                                {emp.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{emp.fullName}</p>
                                <p className="text-[11px] text-slate-400">{emp.email}</p>
                                <p className="text-[10px] text-slate-500">{emp.phone}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${roleConfig.color}`}>
                              {roleConfig.label}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {emp.status === 'active' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            )}
                            {emp.status === 'invited' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Invited
                              </span>
                            )}
                            {emp.status === 'blocked' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Blocked
                              </span>
                            )}
                            {emp.status === 'suspended' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-300">
                                Suspended
                              </span>
                            )}
                          </td>

                          {/* Live Geolocation */}
                          <td className="px-4 py-3">
                            {emp.currentLocation ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setFocusedEmployeeIdOnMap(emp.id);
                                  setActiveTab('map');
                                }}
                                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                                title="Показать на Live Map"
                              >
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                <span className="truncate max-w-[110px]">
                                  {emp.currentLocation.boroughOrArea || 'Live NYC'}
                                </span>
                                <Compass className="w-3 h-3 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ) : emp.locationConsent === false || emp.locationRevokedAt ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400/90 border border-amber-500/20">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                Location Unavailable
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                Offline
                              </span>
                            )}
                          </td>

                          {/* Face ID Status */}
                          <td className="px-4 py-3">
                            {emp.faceEnrolled ? (
                              <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span className="font-medium">Active (Enrolled)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                <Clock className="w-4 h-4 shrink-0 text-slate-500" />
                                <span>Not Set Up</span>
                              </div>
                            )}
                            {emp.failedFaceAttempts && emp.failedFaceAttempts > 0 ? (
                              <p className="text-[10px] text-amber-400 mt-0.5">
                                Failed tries: {emp.failedFaceAttempts}/3
                              </p>
                            ) : null}
                          </td>

                          {/* Registered */}
                          <td className="px-4 py-3 text-slate-400 text-[11px]">
                            {new Date(emp.registeredAt).toLocaleDateString()}
                          </td>

                          {/* Last Login */}
                          <td className="px-4 py-3 text-slate-400 text-[11px]">
                            {emp.lastLoginAt ? (
                              <div>
                                <p>{new Date(emp.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-[10px] text-slate-500">{new Date(emp.lastLoginAt).toLocaleDateString()}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500">Never</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Re-enroll Face ID button */}
                              <button
                                type="button"
                                onClick={() => handleResetFace(emp)}
                                className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Reset & Re-enroll Face ID (purges vector embedding)"
                              >
                                <Camera className="w-4 h-4" />
                              </button>

                              {/* Block / Unblock */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(emp)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  emp.status === 'blocked'
                                    ? 'text-emerald-400 hover:bg-emerald-950/50'
                                    : 'text-amber-400 hover:bg-amber-950/50'
                                }`}
                                title={emp.status === 'blocked' ? 'Unblock user' : 'Block user'}
                              >
                                {emp.status === 'blocked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>

                              {/* Delete Employee */}
                              <button
                                type="button"
                                onClick={() => handleDeleteEmployee(emp)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition-colors"
                                title="Delete employee & erase biometrics"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE INVITATIONS (48H TTL) */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <h3 className="text-sm font-semibold text-white">
              {t('employees.invitationsTitle')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('employees.invitationsSubtitle')}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">{t('employees.thLink')}</th>
                    <th className="px-4 py-3.5">{t('employees.thTarget')}</th>
                    <th className="px-4 py-3.5">{t('employees.thRoleAssigned')}</th>
                    <th className="px-4 py-3.5">{t('employees.thExpiresIn')}</th>
                    <th className="px-4 py-3.5">{t('employees.thFirstSeenIp')}</th>
                    <th className="px-4 py-3.5">{t('employees.thInvStatus')}</th>
                    <th className="px-4 py-3.5 text-right">{t('employees.thActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No invitations generated yet. Click "Invite Employee" to generate a 48h single-use token.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => {
                      const isExpired = new Date(inv.expiresAt) < new Date();
                      const roleConfig = roleLabels[inv.role] || { label: inv.role, color: 'bg-slate-800 text-slate-300' };

                      return (
                        <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Token & Copy Link */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-emerald-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                {inv.token}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(inv.token, inv.id)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                title={t('employees.copyLink')}
                              >
                                {copiedTokenId === inv.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Target Person */}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-white">{inv.targetFullName || 'Open Invite'}</p>
                            <p className="text-[11px] text-slate-400">{inv.targetEmail || 'No email specified'}</p>
                          </td>

                          {/* Role Assigned */}
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${roleConfig.color}`}>
                              {roleConfig.label}
                            </span>
                          </td>

                          {/* Expiration */}
                          <td className="px-4 py-3 text-slate-300">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{new Date(inv.expiresAt).toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-500">48-hour validity TTL</p>
                          </td>

                          {/* Device IP Anti-Takeover Check */}
                          <td className="px-4 py-3">
                            {inv.firstSeenIp ? (
                              <div>
                                <span className="font-mono text-[11px] text-sky-400 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-500/30">
                                  {inv.firstSeenIp}
                                </span>
                                <p className="text-[10px] text-emerald-400 mt-0.5">Initial Device Logged</p>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">
                                {t('employees.ipNotOpenedYet')}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {inv.status === 'pending' && !isExpired && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {t('employees.statusPending')}
                              </span>
                            )}
                            {inv.status === 'used' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                {t('employees.statusUsed')}
                              </span>
                            )}
                            {inv.status === 'revoked' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                {t('employees.statusRevoked')}
                              </span>
                            )}
                            {(inv.status === 'expired' || isExpired) && inv.status !== 'used' && inv.status !== 'revoked' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                {t('employees.statusExpired')}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {inv.status === 'pending' && !isExpired && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSelfRegisterToken(inv.token)}
                                    className="px-2.5 py-1 bg-sky-600/80 hover:bg-sky-500 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                                    title="Test onboarding using this token"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Test</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRevokeInvitation(inv.id)}
                                    className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 text-rose-300 rounded-lg text-[11px] font-semibold transition-colors"
                                  >
                                    {t('employees.revokeBtn')}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BIOMETRIC & LOGIN AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Biometric & Access Audit Trail (Zero Raw Photo Storage)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Compliant biometric logging: only mathematical vector similarities and security verification timestamps are retained.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>AWS Rekognition / Azure Face API</span>
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">Employee Name</th>
                    <th className="px-4 py-3.5">Auth Method</th>
                    <th className="px-4 py-3.5">IP Address</th>
                    <th className="px-4 py-3.5">Biometric Confidence</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No authentication logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">
                          {log.employeeName}
                        </td>
                        <td className="px-4 py-3">
                          {log.method === 'face' ? (
                            <span className="flex items-center gap-1 text-indigo-400">
                              <Camera className="w-3.5 h-3.5" /> Face ID
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Lock className="w-3.5 h-3.5" /> Password Backup
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                          {log.ip}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-400 font-bold">
                          {log.confidence ? `${Math.round(log.confidence * 100)}%` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {log.status === 'success' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Granted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE MAP */}
      {activeTab === 'map' && (
        currentRole === 'admin' ? (
          <EmployeeLiveMap 
            currentRole={currentRole}
            focusedEmployeeId={focusedEmployeeIdOnMap}
          />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Доступ к Live Map ограничен (RBAC Security)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Согласно регламенту конфиденциальности труда Accessible Transit (v2.1), мониторинг оперативной геолокации сотрудников доступен только учётным записям с правами <span className="text-rose-400 font-semibold">Administrator</span>.
              </p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
              Ваша текущая роль: <span className="font-mono text-sky-400 font-semibold capitalize">{currentRole}</span>. Для просмотра карты переключите роль на <strong>Administrator</strong> в верхней панели CRM.
            </div>
          </div>
        )
      )}

      {/* Invite Modal */}
      <InviteEmployeeModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvitationCreated={(inv) => {
          setInvitations(prev => [inv, ...prev]);
        }}
        onTestRegister={(token) => {
          setSelfRegisterToken(token);
        }}
      />

      {/* Self-Registration Test Modal */}
      <SelfRegistrationModal
        isOpen={!!selfRegisterToken}
        token={selfRegisterToken}
        onClose={() => setSelfRegisterToken(null)}
        onRegistrationComplete={(emp) => {
          setEmployees(prev => [emp, ...prev]);
          fetchData();
        }}
      />
    </div>
  );
};
