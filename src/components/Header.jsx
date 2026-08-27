import React from 'react';
import { CHURCH_NAME } from '../types/constants';

export default function Header({
  activeTab,
  onQuickAction,
  adminUser,
  pendingActionsCount = 0,
  onToggleSidebar
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Half Night Prayer Management';
      case 'half-night-prayer':
        return 'Half Night Prayer Schedule';
      case 'members':
        return 'Church Members Directory';
      case 'analytics':
        return 'Participation & Assignment Analytics';
      case 'notifications':
        return 'WhatsApp Notifications & Reminders';
      case 'reports':
        return 'Prayer & Participation Reports';
      case 'settings':
        return 'System & Reminder Settings';
      default:
        return 'Half Night Prayer';
    }
  };

  return (
    <header className="h-20 bg-ivory border-b border-sand/70 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden w-9 h-9 rounded-xl border border-sand bg-cream text-charcoal hover:bg-sand/40 flex items-center justify-center transition-colors"
          >
            <i className="ti ti-menu-2 text-lg"></i>
          </button>
        )}
        <div className="flex items-center gap-3">
          <img
            src="/church-logo.jpg"
            alt="Bethesda AG Church Logo"
            className="w-10 h-10 object-contain rounded-lg shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-gold-dark">
                ELOHIM SHAMA
              </span>
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">
                · {CHURCH_NAME}
              </span>
            </div>
            <h1 className="text-xl font-display font-bold tracking-tight text-charcoal mt-0.5">
              {getTabTitle()}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick actions depending on tab */}
        {activeTab === 'half-night-prayer' && (
          <button
            onClick={() => onQuickAction('export-schedule')}
            className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-charcoal font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
          >
            <i className="ti ti-download text-sm"></i>
            <span>Export Card</span>
          </button>
        )}

        {activeTab === 'members' && (
          <button
            onClick={() => onQuickAction('add-member')}
            className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-charcoal font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
          >
            <i className="ti ti-user-plus text-sm"></i>
            <span>Add Member</span>
          </button>
        )}

        <div className="w-px h-7 bg-sand/80 mx-1"></div>

        {/* Authenticated Admin Badge */}
        <div className="flex items-center gap-3 bg-cream/90 border border-sand pl-2 pr-3 py-1.5 rounded-xl shadow-xs">
          <img
            src="/church-logo.jpg"
            alt="Admin Logo"
            className="w-8 h-8 object-contain rounded-md"
          />
          <div className="text-left leading-tight">
            <span className="text-xs font-bold text-charcoal block">
              {(adminUser?.name || 'Administrator').replace(/Pastor\s*\/\s*/g, '')}
            </span>
            <span className="text-[10px] text-muted-text font-medium block">
              Host / Admin Access
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
