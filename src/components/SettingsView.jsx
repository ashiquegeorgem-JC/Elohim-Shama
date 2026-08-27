import React, { useState } from 'react';
import { CHURCH_NAME, APP_NAME, TIMEZONE } from '../types/constants';

export default function SettingsView({
  settings,
  onSaveSettings,
  onResetDatabase,
  schedules,
  members,
  notifications,
  history,
  onShowToast
}) {
  const [reminders, setReminders] = useState(settings?.reminders || {
    reminder24h: true,
    reminder10m: true,
    reminder5m: false
  });

  const [whatsappConfig, setWhatsappConfig] = useState(settings?.whatsappConfig || {
    provider: 'WhatsApp Business Cloud API',
    phoneNumberId: '109283749283741',
    businessAccountId: 'WABA_BETHESDA_01',
    autoSendOnAssign: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      reminders,
      whatsappConfig
    });
    onShowToast('System settings updated');
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({
        church: CHURCH_NAME,
        exportedAt: new Date().toISOString(),
        schedules,
        members,
        notifications,
        history,
        settings
      }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Bethesda_AG_Church_ElohimShama_Backup_${new Date().toISOString().split('T')[0]}.json`);
    downloadAnchor.click();
    onShowToast('Database JSON backup downloaded');
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      
      {/* System Information Header */}
      <div className="bg-white p-6 rounded-2xl border border-sand shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold border border-gold/30">
            <i className="ti ti-building-church text-xl"></i>
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-charcoal">{CHURCH_NAME}</h2>
            <p className="text-xs text-muted-text">{APP_NAME} — Half Night Prayer Management System</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-sand/60 text-xs">
          <div>
            <span className="text-[10px] font-bold text-gold-dark block uppercase tracking-wider mb-0.5">Primary Timezone</span>
            <span className="font-semibold text-charcoal">{TIMEZONE} (IST)</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gold-dark block uppercase tracking-wider mb-0.5">Access Level</span>
            <span className="font-semibold text-emerald-800">Administrator Only</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gold-dark block uppercase tracking-wider mb-0.5">System Version</span>
            <span className="font-semibold text-charcoal">2.0.0 (Production Stable)</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 30: Automated Reminders Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-sand shadow-card space-y-4 text-xs">
          <div className="border-b border-sand/60 pb-3">
            <h3 className="text-sm font-bold font-display text-charcoal flex items-center gap-2">
              <i className="ti ti-clock text-gold"></i>
              <span>Automated WhatsApp Reminder Intervals</span>
            </h3>
            <p className="text-xs text-muted-text mt-0.5">
              Configure which scheduled WhatsApp reminders are automatically created for confirmed prayer servants.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-sand hover:bg-cream/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={reminders.reminder24h}
                onChange={(e) => setReminders(prev => ({ ...prev, reminder24h: e.target.checked }))}
                className="mt-0.5 rounded accent-gold w-4 h-4"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-charcoal block">24-Hour Reminder (Section 31)</span>
                <span className="text-[11px] text-muted-text block">
                  Dispatched 24 hours prior to the Half Night Prayer session reminding the assigned servant of their scheduled time.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-sand hover:bg-cream/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={reminders.reminder10m}
                onChange={(e) => setReminders(prev => ({ ...prev, reminder10m: e.target.checked }))}
                className="mt-0.5 rounded accent-gold w-4 h-4"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-charcoal block">10-Minute Reminder (Section 32)</span>
                <span className="text-[11px] text-muted-text block">
                  Dispatched 10 minutes before the specific time slot begins alerting the servant to be ready.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-sand hover:bg-cream/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={reminders.reminder5m}
                onChange={(e) => setReminders(prev => ({ ...prev, reminder5m: e.target.checked }))}
                className="mt-0.5 rounded accent-gold w-4 h-4"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-charcoal block">5-Minute Reminder (Optional - Section 33)</span>
                <span className="text-[11px] text-muted-text block">
                  Urgent 5-minute alert before the designated prayer topic goes live.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* WhatsApp Business API Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-sand shadow-card space-y-4 text-xs">
          <div className="border-b border-sand/60 pb-3">
            <h3 className="text-sm font-bold font-display text-charcoal flex items-center gap-2">
              <i className="ti ti-brand-whatsapp text-emerald-600"></i>
              <span>WhatsApp Business Platform Integration</span>
            </h3>
            <p className="text-xs text-muted-text mt-0.5">
              Official WhatsApp Business Cloud API parameters. Compliant with Meta Business platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gold-dark block mb-1 uppercase tracking-wider">Integration Provider</label>
              <input
                type="text"
                disabled
                value={whatsappConfig.provider}
                className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-semibold text-muted-text outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gold-dark block mb-1 uppercase tracking-wider">WhatsApp Business Account ID</label>
              <input
                type="text"
                value={whatsappConfig.businessAccountId}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-mono outline-none focus:bg-white focus:border-gold transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-gold hover:bg-gold-dark text-charcoal font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-all"
            >
              Save Configuration Settings
            </button>
          </div>
        </div>

      </form>

      {/* Database Maintenance & Backups */}
      <div className="bg-white p-6 rounded-2xl border border-sand shadow-card space-y-5 text-xs">
        <div className="border-b border-sand/60 pb-3">
          <h3 className="text-sm font-bold font-display text-charcoal">Database Administration & Reset</h3>
          <p className="text-xs text-muted-text mt-0.5">Export records or restore initial church defaults.</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-cream border border-sand">
          <div className="space-y-0.5">
            <span className="font-bold text-charcoal block">Export Full System JSON</span>
            <span className="text-[11px] text-muted-text block">Download an archival copy of all rosters, schedules, and notifications.</span>
          </div>
          <button
            type="button"
            onClick={handleExportJSON}
            className="bg-charcoal hover:bg-charcoal/80 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shrink-0"
          >
            Export JSON
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-rose-50/60 border border-rose-200">
          <div className="space-y-0.5">
            <span className="font-bold text-rose-900 block">Restore Default Bethesda AG Church Seeds</span>
            <span className="text-[11px] text-rose-700/80 block">Resets all schedules and rosters to official church seed templates.</span>
          </div>
          <button
            type="button"
            onClick={onResetDatabase}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all shrink-0"
          >
            Restore Defaults
          </button>
        </div>
      </div>

    </div>
  );
}
