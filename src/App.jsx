import React, { useState, useEffect, useRef, useMemo } from 'react';
import { storageService } from './services/storageService';
import { exportService } from './services/exportService';
import { CHURCH_NAME, APP_NAME } from './types/constants';

// Views
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import HalfNightPrayerView from './components/HalfNightPrayerView';
import MembersView from './components/MembersView';
import AnalyticsView from './components/AnalyticsView';
import NotificationsView from './components/NotificationsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';

// Modals & Card Export
import ReassignmentModal from './components/ReassignmentModal';
import ContactMemberModal from './components/ContactMemberModal';
import ScheduleExportCard from './components/ScheduleExportCard';

export default function App() {
  // Authentication session state (Admin-only)
  const [adminUser, setAdminUser] = useState(() => storageService.getAdminSession());

  // Main Persistent States
  const [schedules, setSchedules] = useState(() => storageService.getSchedules());
  const [members, setMembers] = useState(() => storageService.getMembers());
  const [notifications, setNotifications] = useState(() => storageService.getNotifications());
  const [history, setHistory] = useState(() => storageService.getAssignmentHistory());
  const [settings, setSettings] = useState(() => storageService.getSettings());

  // Persistence Effects
  useEffect(() => { storageService.saveSchedules(schedules); }, [schedules]);
  useEffect(() => { storageService.saveMembers(members); }, [members]);
  useEffect(() => { storageService.saveNotifications(notifications); }, [notifications]);
  useEffect(() => { storageService.saveAssignmentHistory(history); }, [history]);
  useEffect(() => { storageService.saveSettings(settings); }, [settings]);

  // Active Tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Reassignment Modal State
  const [reassignModalState, setReassignModalState] = useState({
    isOpen: false,
    schedule: null,
    slot: null,
    originalMember: null
  });

  // Contact Member Modal State
  const [contactMemberState, setContactMemberState] = useState({
    isOpen: false,
    member: null
  });

  // Export Schedule Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportingSchedule, setExportingSchedule] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const exportCardRef = useRef(null);

  // Auth Handlers
  const handleLoginSuccess = (user) => {
    storageService.setAdminSession(user);
    setAdminUser(user);
    showToast(`Welcome, ${user.name}`);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out from the church management console?')) {
      storageService.setAdminSession(null);
      setAdminUser(null);
      showToast('Signed out successfully');
    }
  };

  // Reassignment Handler
  const handleOpenReassign = (schedule, slot, originalMember) => {
    setReassignModalState({
      isOpen: true,
      schedule,
      slot,
      originalMember
    });
  };

  const handleConfirmReassignment = ({ scheduleId, slotId, originalMember, newMember }) => {
    const targetSchedule = schedules.find(s => s.id === scheduleId);
    const targetSlot = targetSchedule?.timeSlots.find(sl => sl.id === slotId);

    if (!targetSchedule || !targetSlot) return;

    // 1. Update Schedule Slot with new Member
    setSchedules(prev => prev.map(s => {
      if (s.id === scheduleId) {
        return {
          ...s,
          timeSlots: s.timeSlots.map(sl => {
            if (sl.id === slotId) {
              return {
                ...sl,
                assignedMemberId: newMember.id,
                status: 'Pending Confirmation',
                reassignedFrom: originalMember?.fullName,
                reassignedAt: new Date().toISOString()
              };
            }
            return sl;
          })
        };
      }
      return s;
    }));

    // 2. Cancel original member's reminders & log cancellation notice in notifications
    if (originalMember) {
      storageService.addNotification({
        memberId: originalMember.id,
        memberName: originalMember.fullName,
        phone: originalMember.phone,
        type: 'Reassignment Notice',
        scheduleDate: targetSchedule.formattedDate || targetSchedule.date,
        slotTime: `${targetSlot.startTime} – ${targetSlot.endTime}`,
        topic: targetSlot.topic,
        status: 'Sent'
      });
    }

    // 3. Create new reminder schedule & send WhatsApp notification to new member
    const newNotif = storageService.addNotification({
      memberId: newMember.id,
      memberName: newMember.fullName,
      phone: newMember.phone,
      type: 'Assignment',
      scheduleDate: targetSchedule.formattedDate || targetSchedule.date,
      slotTime: `${targetSlot.startTime} – ${targetSlot.endTime}`,
      topic: targetSlot.topic,
      status: 'Sent'
    });
    setNotifications(prev => [newNotif, ...prev]);

    // 4. Record complete audit timeline in assignment history
    storageService.recordHistoryEvent(
      scheduleId,
      slotId,
      targetSchedule.formattedDate || targetSchedule.date,
      `${targetSlot.startTime} – ${targetSlot.endTime}`,
      targetSlot.topic,
      {
        type: 'Reassigned',
        originalMemberName: originalMember?.fullName || 'Unassigned',
        newMemberId: newMember.id,
        newMemberName: newMember.fullName,
        actor: 'Admin'
      }
    );
    setHistory(storageService.getAssignmentHistory());

    showToast(`Reassigned ${targetSlot.startTime} to ${newMember.fullName}`, 'success');
  };

  // Contact Member Handler
  const handleOpenContact = (member, schedule = null, slot = null) => {
    const latestMember = members.find(m => (m.id && m.id === member?.id) || m.fullName === member?.fullName) || member;
    setContactMemberState({
      isOpen: true,
      member: latestMember,
      schedule,
      slot
    });
  };

  // Export Schedule Card Handler
  const handleOpenExport = (sch = null) => {
    const target = sch || schedules[0] || null;
    setExportingSchedule(target);
    setIsExportModalOpen(true);
  };

  const handleDownloadImage = async (format = 'png') => {
    if (!exportCardRef.current) return;
    setExportLoading(true);
    try {
      if (format === 'png') {
        await exportService.downloadPNG(exportCardRef.current, `Bethesda_AG_Church_Mid_Night_Prayer_${exportingSchedule?.date || 'Schedule'}`);
        showToast('PNG image downloaded successfully');
      } else if (format === 'jpg') {
        await exportService.downloadJPG(exportCardRef.current, `Bethesda_AG_Church_Mid_Night_Prayer_${exportingSchedule?.date || 'Schedule'}`);
        showToast('JPG image downloaded successfully');
      } else if (format === 'pdf') {
        await exportService.downloadPDF(exportCardRef.current, `Bethesda_AG_Church_Mid_Night_Prayer_${exportingSchedule?.date || 'Schedule'}`);
        showToast('PDF document downloaded successfully');
      } else if (format === 'copy') {
        await exportService.copyImageToClipboard(exportCardRef.current);
        showToast('Schedule card copied to clipboard!');
      }
    } catch (err) {
      console.error(err);
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Reset database handler
  const handleResetDatabase = () => {
    if (confirm('Are you sure you want to reset all data back to Bethesda AG Church factory seed data? This cannot be undone.')) {
      const resetData = storageService.resetAll();
      setMembers(resetData.members);
      setSchedules(resetData.schedules);
      setNotifications(resetData.notifications);
      setHistory(storageService.getAssignmentHistory());
      showToast('Database reset to official church seeds');
    }
  };

  // Count pending actions for header badge
  const pendingActionsCount = useMemo(() => {
    let count = 0;
    schedules.forEach(s => {
      (s.timeSlots || []).forEach(slot => {
        if (slot.status === 'Declined' || slot.status === 'Pending Confirmation') count++;
      });
    });
    return count;
  }, [schedules]);

  // If not logged in, render Admin Login screen
  if (!adminUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        onLogout={handleLogout}
        notificationsCount={notifications.filter(n => n.status === 'Scheduled').length}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Header */}
        <Header
          activeTab={activeTab}
          adminUser={adminUser}
          pendingActionsCount={pendingActionsCount}
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          onQuickAction={(action) => {
            if (action === 'export-schedule') handleOpenExport();
            if (action === 'add-member') setActiveTab('members');
          }}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              schedules={schedules}
              members={members}
              onNavigate={setActiveTab}
              onOpenReassign={handleOpenReassign}
              onContactMember={handleOpenContact}
              onOpenScheduleExport={() => handleOpenExport()}
            />
          )}

          {activeTab === 'half-night-prayer' && (
            <HalfNightPrayerView
              schedules={schedules}
              setSchedules={setSchedules}
              members={members}
              setMembers={setMembers}
              notifications={notifications}
              setNotifications={setNotifications}
              setHistory={setHistory}
              onOpenReassign={handleOpenReassign}
              onContactMember={handleOpenContact}
              onOpenExport={() => handleOpenExport()}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'members' && (
            <MembersView
              members={members}
              setMembers={setMembers}
              onContactMember={handleOpenContact}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              schedules={schedules}
              members={members}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onAddNotification={(notif) => {
                const added = storageService.addNotification(notif);
                setNotifications(prev => [added, ...prev]);
              }}
              members={members}
              schedules={schedules}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              schedules={schedules}
              members={members}
              notifications={notifications}
              history={history}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={setSettings}
              onResetDatabase={handleResetDatabase}
              schedules={schedules}
              members={members}
              notifications={notifications}
              history={history}
              onShowToast={showToast}
            />
          )}

        </main>
      </div>

      {/* REASSIGNMENT MODAL */}
      <ReassignmentModal
        isOpen={reassignModalState.isOpen}
        schedule={reassignModalState.schedule}
        slot={reassignModalState.slot}
        originalMember={reassignModalState.originalMember}
        members={members}
        onConfirmReassignment={handleConfirmReassignment}
        onClose={() => setReassignModalState({ isOpen: false, schedule: null, slot: null, originalMember: null })}
      />

      {/* CONTACT MEMBER MODAL */}
      <ContactMemberModal
        isOpen={contactMemberState.isOpen}
        member={contactMemberState.member}
        schedule={contactMemberState.schedule}
        slot={contactMemberState.slot}
        schedules={schedules}
        onClose={() => setContactMemberState({ isOpen: false, member: null, schedule: null, slot: null })}
        onShowToast={showToast}
      />

      {/* EXPORT SCHEDULE MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <i className="ti ti-photo-share text-lg"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Download High-Resolution Schedule Card</h3>
                  <p className="text-[11px] text-slate-400">1080px resolution card formatted for WhatsApp, church groups, and social displays.</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <i className="ti ti-x"></i>
              </button>
            </div>

            {/* Preview Card Viewport */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center flex-1">
              <div className="transform scale-[0.65] origin-top border border-slate-300 shadow-xl rounded-2xl overflow-hidden">
                <ScheduleExportCard
                  ref={exportCardRef}
                  schedule={exportingSchedule || schedules[0]}
                  members={members}
                />
              </div>
            </div>

            {/* Export Actions Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  disabled={exportLoading}
                  onClick={() => handleDownloadImage('png')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <i className="ti ti-file-download"></i>
                  <span>Download PNG</span>
                </button>

                <button
                  disabled={exportLoading}
                  onClick={() => handleDownloadImage('jpg')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <i className="ti ti-photo"></i>
                  <span>Download JPG</span>
                </button>

                <button
                  disabled={exportLoading}
                  onClick={() => handleDownloadImage('pdf')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <i className="ti ti-file-text"></i>
                  <span>Download PDF</span>
                </button>

                <button
                  disabled={exportLoading}
                  onClick={() => handleDownloadImage('copy')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <i className="ti ti-copy"></i>
                  <span>Copy Image</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION POPUP */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-950/90 border-rose-800 text-rose-200'
            : toast.type === 'warning'
            ? 'bg-amber-950/90 border-amber-800 text-amber-200'
            : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          <i className={
            toast.type === 'error' ? 'ti ti-alert-triangle text-rose-400 text-base' :
            toast.type === 'warning' ? 'ti ti-alert-circle text-amber-400 text-base' :
            'ti ti-circle-check text-emerald-400 text-base'
          }></i>
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
