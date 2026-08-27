import React, { useState } from 'react';
import { exportService } from '../services/exportService';
import { CHURCH_NAME, APP_NAME } from '../types/constants';

export default function ReportsView({
  schedules,
  members,
  notifications,
  history,
  onShowToast
}) {
  const [reportType, setReportType] = useState('weekly_hnp');

  const handleExportCSV = () => {
    if (reportType === 'weekly_hnp' || reportType === 'monthly_hnp') {
      const headers = ['Schedule Date', 'Time Slot', 'Prayer Topic', 'Assigned Member', 'Status'];
      const rows = [];
      schedules.forEach(sch => {
        (sch.timeSlots || []).forEach(slot => {
          const mem = members.find(m => m.id === slot.assignedMemberId);
          rows.push([
            sch.formattedDate || sch.date,
            `${slot.startTime} - ${slot.endTime}`,
            slot.topic,
            mem ? mem.fullName : 'Not Assigned',
            slot.status
          ]);
        });
      });
      exportService.downloadCSV(headers, rows, `Bethesda_AG_Church_${reportType}_Report`);
      onShowToast('CSV Report downloaded');
    } else if (reportType === 'member_participation') {
      const headers = ['Member Name', 'Availability', 'Last Assigned', 'Total Assignments', 'Confirmed', 'Declined'];
      const rows = members.map(m => [
        m.fullName,
        m.availability,
        m.lastAssignedDate || 'N/A',
        m.totalAssignments || 0,
        m.confirmedAssignments || 0,
        m.declinedAssignments || 0
      ]);
      exportService.downloadCSV(headers, rows, 'Bethesda_AG_Church_Member_Participation_Report');
      onShowToast('CSV Report downloaded');
    } else if (reportType === 'notifications') {
      const headers = ['Member', 'Phone', 'Notification Type', 'Schedule Date', 'Time Slot', 'Status', 'Timestamp'];
      const rows = notifications.map(n => [
        n.memberName,
        n.phone,
        n.type,
        n.scheduleDate,
        n.slotTime,
        n.status,
        n.timestamp
      ]);
      exportService.downloadCSV(headers, rows, 'Bethesda_AG_Church_Notifications_Report');
      onShowToast('CSV Report downloaded');
    } else if (reportType === 'reassignments') {
      const headers = ['Schedule Date', 'Time Slot', 'Prayer Topic', 'Original Member', 'New Member', 'Decline Reason', 'Timestamp'];
      const rows = [];
      history.forEach(h => {
        const declineEvent = h.events.find(e => e.type === 'Declined');
        const reassignEvent = h.events.find(e => e.type === 'Reassigned');
        if (declineEvent && reassignEvent) {
          rows.push([
            h.scheduleDate,
            h.slotTime,
            h.topic,
            reassignEvent.originalMemberName,
            reassignEvent.newMemberName,
            declineEvent.reason || 'N/A',
            reassignEvent.timestamp
          ]);
        }
      });
      exportService.downloadCSV(headers, rows, 'Bethesda_AG_Church_Reassignment_Audit_Report');
      onShowToast('CSV Report downloaded');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      
      {/* 1. MAIN REPORT DOCUMENT PREVIEW SHEET (TOP OF PAGE) */}
      <div className="bg-white rounded-2xl border border-sand shadow-card p-8 space-y-6">
        
        {/* Document Header */}
        <div className="border-b border-sand/60 pb-6 text-center space-y-2">
          <img
            src="/church-logo.jpg"
            alt="Bethesda AG Church Logo"
            className="w-20 h-20 rounded-xl object-contain mx-auto border border-sand p-0.5 shadow-xs"
          />
          <h3 className="text-xl font-display font-bold uppercase tracking-widest text-charcoal">
            {CHURCH_NAME}
          </h3>
          <h4 className="text-base font-bold text-gold-dark uppercase tracking-wider">
            {reportType === 'weekly_hnp' && 'Weekly Half Night Prayer Report'}
            {reportType === 'monthly_hnp' && 'Monthly Half Night Prayer Report'}
            {reportType === 'member_participation' && 'Member Participation & Duty Rotation Report'}
            {reportType === 'assignment_history' && 'Assignment Timeline & Audit Trail Report'}
            {reportType === 'notifications' && 'WhatsApp Communications & Reminders Report'}
            {reportType === 'reassignments' && 'Reassignment & Decline Audit Report'}
          </h4>
          <p className="text-xs text-muted-text font-medium">
            Generated on {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} via {APP_NAME}
          </p>
        </div>

        {/* Dynamic Report Content Tables */}
        {(reportType === 'weekly_hnp' || reportType === 'monthly_hnp') && (
          <div className="space-y-6">
            {schedules.map(sch => (
              <div key={sch.id} className="border border-sand rounded-xl overflow-hidden">
                <div className="bg-cream px-5 py-3.5 border-b border-sand flex justify-between items-center text-sm font-bold text-charcoal">
                  <span>{sch.formattedDate || sch.date}</span>
                  <span className="text-gold-dark">{sch.startTime} – {sch.endTime}</span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-cream/40 text-gold-dark font-bold uppercase text-xs border-b border-sand/60">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap">Time</th>
                      <th className="p-3.5">Topic</th>
                      <th className="p-3.5 whitespace-nowrap">Assigned Servant</th>
                      <th className="p-3.5 text-right whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/40">
                    {sch.timeSlots.map(slot => {
                      const mem = members.find(m => m.id === slot.assignedMemberId);
                      return (
                        <tr key={slot.id} className="hover:bg-cream/20">
                          <td className="p-3.5 font-bold text-charcoal whitespace-nowrap">{slot.startTime} – {slot.endTime}</td>
                          <td className="p-3.5 font-medium text-charcoal">{slot.topic}</td>
                          <td className="p-3.5 font-bold text-charcoal whitespace-nowrap">{mem ? mem.fullName : 'Unassigned'}</td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-cream text-gold-dark border border-sand/60 whitespace-nowrap">
                              {slot.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {reportType === 'member_participation' && (
          <div className="border border-sand rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-gold-dark font-bold uppercase text-xs border-b border-sand">
                <tr>
                  <th className="p-4">Member Name</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Last Assigned</th>
                  <th className="p-4 text-center">Confirmed</th>
                  <th className="p-4 text-center">Declined</th>
                  <th className="p-4 text-right">Total Assignments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {members.map(mem => (
                  <tr key={mem.id} className="hover:bg-cream/30">
                    <td className="p-4 font-bold text-charcoal">{mem.fullName}</td>
                    <td className="p-4 text-muted-text font-medium">{mem.availability}</td>
                    <td className="p-4 font-mono text-muted-text">{mem.lastAssignedDate}</td>
                    <td className="p-4 text-center text-emerald-800 font-bold">{mem.confirmedAssignments || 0}</td>
                    <td className="p-4 text-center text-rose-700 font-bold">{mem.declinedAssignments || 0}</td>
                    <td className="p-4 text-right font-bold text-charcoal">{mem.totalAssignments || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'assignment_history' && (
          <div className="space-y-4">
            {history.map(item => (
              <div key={item.id} className="p-4 rounded-xl border border-sand bg-cream/30 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-charcoal">
                  <span>{item.scheduleDate} ({item.slotTime})</span>
                  <span className="text-muted-text font-normal">{item.topic}</span>
                </div>
                <div className="border-l-2 border-gold pl-3 space-y-1.5 text-xs">
                  {item.events.map((ev, i) => (
                    <div key={i} className="text-muted-text">
                      <span className="font-semibold text-charcoal">[{ev.timestamp}]</span> — {ev.type}
                      {ev.memberName && `: ${ev.memberName}`}
                      {ev.reason && ` (Reason: ${ev.reason})`}
                      {ev.newMemberName && ` → Reassigned to ${ev.newMemberName}`}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {reportType === 'notifications' && (
          <div className="border border-sand rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-gold-dark font-bold uppercase text-xs border-b border-sand">
                <tr>
                  <th className="p-4">Member</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Schedule Date & Slot</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {notifications.map(notif => (
                  <tr key={notif.id} className="hover:bg-cream/30">
                    <td className="p-4 font-bold text-charcoal">{notif.memberName}</td>
                    <td className="p-4 text-muted-text font-medium">{notif.type}</td>
                    <td className="p-4 text-muted-text font-medium">{notif.scheduleDate} ({notif.slotTime})</td>
                    <td className="p-4 font-semibold text-emerald-800">{notif.status}</td>
                    <td className="p-4 text-right font-mono text-muted-text">{notif.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'reassignments' && (
          <div className="border border-sand rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-gold-dark font-bold uppercase text-xs border-b border-sand">
                <tr>
                  <th className="p-4">Schedule Date & Slot</th>
                  <th className="p-4">Prayer Topic</th>
                  <th className="p-4">Original Member</th>
                  <th className="p-4">Decline Reason</th>
                  <th className="p-4">Reassigned Member</th>
                  <th className="p-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {history.map(h => {
                  const declineEvent = h.events.find(e => e.type === 'Declined');
                  const reassignEvent = h.events.find(e => e.type === 'Reassigned');
                  if (!declineEvent || !reassignEvent) return null;
                  return (
                    <tr key={h.id} className="hover:bg-cream/30">
                      <td className="p-4 font-semibold text-charcoal">{h.scheduleDate} ({h.slotTime})</td>
                      <td className="p-4 text-muted-text font-medium">{h.topic}</td>
                      <td className="p-4 font-bold text-rose-700">{reassignEvent.originalMemberName}</td>
                      <td className="p-4 text-muted-text font-medium">{declineEvent.reason || 'Unavailable'}</td>
                      <td className="p-4 font-bold text-emerald-800">{reassignEvent.newMemberName}</td>
                      <td className="p-4 text-right font-mono text-muted-text">{reassignEvent.timestamp}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* 2. REPORT CONTROLS CARD (TITLE ON TOP, CONTROLS IN A SINGLE LINE BELOW: DROPDOWN -> PRINT/PDF -> EXPORT CSV) */}
      <div className="bg-white p-6 rounded-2xl border border-sand shadow-card space-y-4 print:hidden">
        {/* Top: Title & Description */}
        <div className="border-b border-sand/60 pb-3">
          <h2 className="text-base font-bold font-display text-charcoal">Church Administrative Report Controls</h2>
          <p className="text-sm text-muted-text mt-0.5">Switch report view or export formatted CSV spreadsheets and printable PDFs.</p>
        </div>

        {/* Bottom Row: 1. Dropdown Select -> 2. Print / PDF -> 3. Export CSV */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="bg-cream border border-sand rounded-xl px-4 py-2.5 text-sm font-bold text-charcoal outline-none focus:border-gold cursor-pointer flex-1 min-w-[240px]"
          >
            <option value="weekly_hnp">Weekly Half Night Prayer Report</option>
            <option value="monthly_hnp">Monthly Half Night Prayer Report</option>
            <option value="member_participation">Member Participation Report</option>
            <option value="assignment_history">Assignment History & Timeline Report</option>
            <option value="notifications">Notification & Reminder Report</option>
            <option value="reassignments">Reassignment Audit Report</option>
          </select>

          <button
            onClick={handlePrint}
            className="bg-gold hover:bg-gold-dark text-charcoal px-5 py-2.5 rounded-xl text-sm font-bold shadow-xs flex items-center gap-2 transition-all whitespace-nowrap shrink-0"
          >
            <i className="ti ti-printer text-base"></i>
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-charcoal hover:bg-charcoal/85 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xs flex items-center gap-2 transition-all whitespace-nowrap shrink-0"
          >
            <i className="ti ti-file-spreadsheet text-base"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

    </div>
  );
}
