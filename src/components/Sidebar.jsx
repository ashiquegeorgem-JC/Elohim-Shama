import React from 'react';
import { CHURCH_NAME, APP_NAME } from '../types/constants';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  notificationsCount = 0,
  isMobileOpen = false,
  onCloseMobile
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
    { id: 'half-night-prayer', label: 'Half Night Prayer', icon: 'ti-moon-stars' },
    { id: 'members', label: 'Members', icon: 'ti-users' },
    { id: 'analytics', label: 'Analytics', icon: 'ti-chart-bar' },
    { id: 'notifications', label: 'Notifications', icon: 'ti-bell', badge: notificationsCount },
    { id: 'reports', label: 'Reports', icon: 'ti-file-analytics' },
    { id: 'settings', label: 'Settings', icon: 'ti-settings' }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-xs"
        ></div>
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-charcoal text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-sand/30 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Official Church Branding Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-sand/20 bg-charcoal/90">
            <div className="flex items-center gap-3">
              <img
                src="/church-logo.jpg"
                alt="Bethesda AG Church Logo"
                className="w-10 h-10 object-contain rounded-lg shrink-0"
              />
              <div className="min-w-0">
                <span className="font-display font-extrabold text-base tracking-wide text-ivory block truncate leading-tight">
                  ELOHIM SHAMA
                </span>
                <span className="text-[10px] text-gold font-bold tracking-[0.15em] uppercase block truncate mt-0.5">
                  BETHESDA AG CHURCH
                </span>
              </div>
            </div>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden text-slate-400 hover:text-ivory"
              >
                <i className="ti ti-x"></i>
              </button>
            )}
          </div>

          {/* Section Label */}
          <div className="px-6 pt-5 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold/80 block">
              PRAYER ADMINISTRATION
            </span>
          </div>

          {/* Main Navigation Items */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gold text-charcoal font-bold shadow-md shadow-gold/20'
                      : 'hover:bg-sand/10 hover:text-ivory text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`ti ${item.icon} text-base ${isActive ? 'text-charcoal' : 'text-gold/70'}`}></i>
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-charcoal text-gold' : 'bg-gold/20 text-gold'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Details and Logout */}
        <div className="p-4 border-t border-sand/20 bg-charcoal/80 space-y-3">
          <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
            <span>Schedule System</span>
            <span className="text-gold font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block animate-pulse"></span>
              Midnight Prayer
            </span>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all"
          >
            <i className="ti ti-logout text-base"></i>
            <span>Sign Out (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
}
