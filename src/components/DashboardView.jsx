import React, { useMemo } from 'react';
import { getDaysSinceDate } from '../services/schedulerEngine';

export default function DashboardView({
  schedules,
  members,
  onNavigate,
  onOpenReassign,
  onContactMember,
  onOpenScheduleExport
}) {
  // Compute key stats
  const nextSchedule = useMemo(() => {
    return schedules.find(s => s.status === 'Upcoming') || schedules[0] || null;
  }, [schedules]);

  const activeMembersCount = useMemo(() => {
    return members.filter(m => m.active).length;
  }, [members]);

  const notRecentlyAssignedCount = useMemo(() => {
    return members.filter(m => getDaysSinceDate(m.lastAssignedDate) >= 30).length;
  }, [members]);

  // Aggregate assignments in upcoming/current schedules
  const assignmentMetrics = useMemo(() => {
    let pendingCount = 0;
    let declinedCount = 0;
    let reassignmentRequiredCount = 0;
    let confirmedCount = 0;
    let totalAssignmentsThisMonth = 0;
    let totalAssignmentsThisWeek = 0;

    schedules.forEach(sch => {
      (sch.timeSlots || []).forEach(slot => {
        if (slot.assignedMemberId) {
          totalAssignmentsThisMonth++;
          totalAssignmentsThisWeek++;
        }
        if (slot.status === 'Pending Confirmation') pendingCount++;
        if (slot.status === 'Declined') {
          declinedCount++;
          reassignmentRequiredCount++;
        }
        if (slot.status === 'Confirmed') confirmedCount++;
      });
    });

    return {
      pendingCount,
      declinedCount,
      reassignmentRequiredCount,
      confirmedCount,
      totalAssignmentsThisMonth,
      totalAssignmentsThisWeek
    };
  }, [schedules]);

  // Assignments Requiring Action list
  const requiringActionList = useMemo(() => {
    const list = [];
    schedules.forEach(sch => {
      (sch.timeSlots || []).forEach(slot => {
        if (slot.status === 'Declined' || slot.status === 'Pending Confirmation') {
          const member = members.find(m => m.id === slot.assignedMemberId);
          list.push({
            schedule: sch,
            slot,
            member,
            status: slot.status,
            declineReason: slot.declineReason || 'Schedule conflict'
          });
        }
      });
    });
    return list;
  }, [schedules, members]);

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      
      {/* Top Alert Banner if any declines exist */}
      {assignmentMetrics.declinedCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <i className="ti ti-alert-triangle text-lg"></i>
            </div>
            <div>
              <h3 className="text-xs font-bold text-rose-900">
                Action Required: {assignmentMetrics.declinedCount} Declined Assignment{assignmentMetrics.declinedCount > 1 ? 's' : ''}
              </h3>
              <p className="text-[11px] text-rose-700 mt-0.5">
                One or more church members cannot serve for their assigned prayer slots and require replacement.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const firstDeclined = requiringActionList.find(i => i.status === 'Declined');
              if (firstDeclined) {
                onOpenReassign(firstDeclined.schedule, firstDeclined.slot, firstDeclined.member);
              } else {
                onNavigate('half-night-prayer');
              }
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 flex items-center gap-1.5"
          >
            <i className="ti ti-user-exclamation"></i>
            <span>Reassign Now</span>
          </button>
        </div>
      )}

      {/* BENTO GRID - MAIN DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Bento Item 1: Featured Hero Card (Spans 2 columns) */}
        <div className="md:col-span-2 bg-charcoal text-ivory p-6 rounded-3xl border border-sand/30 shadow-card flex flex-col justify-between relative overflow-hidden min-h-[160px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold">
                  Upcoming Half Night Prayer
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                  Scheduled
                </span>
              </div>
              
              <h2 className="text-2xl font-display font-bold text-ivory pt-1">
                {nextSchedule?.formattedDate || 'Saturday Session'}
              </h2>
              
              <p className="text-xs text-sand/80 font-medium">
                {nextSchedule?.startTime} – {nextSchedule?.endTime}
              </p>
            </div>

            <img
              src="/church-logo.jpg"
              alt="Bethesda AG Church Logo"
              className="w-14 h-14 object-contain rounded-xl shrink-0"
            />
          </div>

          <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-sand/20">
            <button
              onClick={() => onNavigate('half-night-prayer')}
              className="bg-gold hover:bg-gold-dark text-charcoal text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <i className="ti ti-calendar-event text-sm"></i>
              <span>View Full Schedule</span>
            </button>
            <button
              onClick={onOpenScheduleExport}
              className="bg-ivory/10 hover:bg-ivory/20 text-ivory text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border border-sand/20 flex items-center gap-1.5"
            >
              <i className="ti ti-download text-sm"></i>
              <span>Export Card</span>
            </button>
          </div>
        </div>

        {/* Bento Item 2: This Week's Duty */}
        <div className="bg-white p-5 rounded-3xl border border-sand shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">
              This Week's Duty
            </span>
            <div className="w-9 h-9 rounded-xl bg-cream text-charcoal flex items-center justify-center border border-sand">
              <i className="ti ti-clock-hour-4 text-lg"></i>
            </div>
          </div>
          <div className="pt-3">
            <span className="text-3xl font-display font-bold text-charcoal block">
              {assignmentMetrics.totalAssignmentsThisWeek}
            </span>
            <span className="text-xs text-muted-text mt-0.5 block">
              Scheduled slots
            </span>
          </div>
        </div>

        {/* Bento Item 3: Active Servants */}
        <div className="bg-white p-5 rounded-3xl border border-sand shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">
              Active Servants
            </span>
            <div className="w-9 h-9 rounded-xl bg-gold/15 text-gold-dark flex items-center justify-center border border-gold/30">
              <i className="ti ti-users text-lg"></i>
            </div>
          </div>
          <div className="pt-3">
            <span className="text-3xl font-display font-bold text-charcoal block">
              {activeMembersCount}
            </span>
            <span className="text-xs text-muted-text mt-0.5 block">
              Registered church roster
            </span>
          </div>
        </div>

        {/* Bento Item 4: Pending Confirmations */}
        <div className="bg-white p-5 rounded-3xl border border-sand shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Pending Confirmations
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <i className="ti ti-hourglass-empty text-lg"></i>
            </div>
          </div>
          <div className="pt-3">
            <span className="text-3xl font-display font-bold text-amber-700 block">
              {assignmentMetrics.pendingCount}
            </span>
            <span className="text-xs text-muted-text mt-0.5 block">
              Awaiting WhatsApp reply
            </span>
          </div>
        </div>

        {/* Bento Item 5: Declined Assignments */}
        <div className="bg-white p-5 rounded-3xl border border-sand shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              Declined Assignments
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <i className="ti ti-user-x text-lg"></i>
            </div>
          </div>
          <div className="pt-3">
            <span className="text-3xl font-display font-bold text-rose-600 block">
              {assignmentMetrics.declinedCount}
            </span>
            <span className="text-xs text-rose-600 font-medium mt-0.5 block">
              Member cannot serve
            </span>
          </div>
        </div>

        {/* Bento Item 6: Reassignments Needed */}
        <div className="bg-white p-5 rounded-3xl border border-sand shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              Reassignments Needed
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <i className="ti ti-replace text-lg"></i>
            </div>
          </div>
          <div className="pt-3">
            <span className="text-3xl font-display font-bold text-rose-600 block">
              {assignmentMetrics.reassignmentRequiredCount}
            </span>
            <span className="text-xs text-muted-text mt-0.5 block">
              Slots needing replacement
            </span>
          </div>
        </div>

        {/* Bento Item 7: Rotation Rotation Index */}
        <div className="bg-white p-5 rounded-3xl border border-sand shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">
              Fair Rotation Index
            </span>
            <div className="w-9 h-9 rounded-xl bg-gold/15 text-gold-dark flex items-center justify-center border border-gold/30">
              <i className="ti ti-user-search text-lg"></i>
            </div>
          </div>
          <div className="pt-3">
            <span className="text-3xl font-display font-bold text-gold-dark block">
              {notRecentlyAssignedCount}
            </span>
            <span className="text-xs text-muted-text mt-0.5 block">
              Not assigned in ≥30 days
            </span>
          </div>
        </div>

      </div>

      {/* BENTO GRID ROW 2: Triage List & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Triage List (Spans 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-sand shadow-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-sand/60 flex items-center justify-between bg-cream/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold-dark flex items-center justify-center border border-gold/30">
                  <i className="ti ti-clock-edit text-base"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-charcoal">Assignments Requiring Action</h3>
                  <p className="text-[11px] text-muted-text">Manage pending replies and replacement reassignments.</p>
                </div>
              </div>

              <span className="text-xs font-semibold text-muted-text">
                {requiringActionList.length} item{requiringActionList.length === 1 ? '' : 's'}
              </span>
            </div>

            {requiringActionList.length === 0 ? (
              <div className="p-10 text-center text-muted-text text-xs space-y-1">
                <i className="ti ti-circle-check text-3xl text-emerald-600 mb-1 block"></i>
                <p className="font-bold text-charcoal">All assignments confirmed & ready!</p>
                <p className="text-muted-text">No pending declines or unconfirmed schedules require action.</p>
              </div>
            ) : (
              <div className="divide-y divide-sand/40 max-h-[280px] overflow-y-auto">
                {requiringActionList.map((item, idx) => (
                  <div key={idx} className="p-4 hover:bg-cream/30 flex items-center justify-between gap-3 transition-all text-xs">
                    
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          item.status === 'Declined'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {item.status === 'Declined' ? 'Declined' : 'Pending'}
                        </span>
                        <span className="font-bold text-charcoal whitespace-nowrap">
                          {item.slot.startTime} – {item.slot.endTime}
                        </span>
                        <span className="text-muted-text truncate font-medium">
                          • {item.slot.topic}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-text flex items-center gap-2">
                        <span>Member: <strong className="text-charcoal">{item.member?.fullName || 'Unassigned'}</strong></span>
                        {item.status === 'Declined' && (
                          <span className="text-rose-600 font-medium truncate">
                            ({item.declineReason})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onOpenReassign(item.schedule, item.slot, item.member)}
                        className="px-3 py-1.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                      >
                        <i className="ti ti-user-search text-xs"></i>
                        <span>Reassign</span>
                      </button>

                      {item.member && (
                        <button
                          onClick={() => onContactMember(item.member)}
                          className="w-8 h-8 rounded-xl border border-sand hover:bg-cream text-emerald-700 flex items-center justify-center transition-all"
                          title="Contact via WhatsApp"
                        >
                          <i className="ti ti-brand-whatsapp text-sm"></i>
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-cream/40 border-t border-sand/60 text-center">
            <button
              onClick={() => onNavigate('half-night-prayer')}
              className="text-xs font-bold text-gold-dark hover:text-charcoal transition-colors inline-flex items-center gap-1"
            >
              <span>Go to Full Schedule View</span>
              <i className="ti ti-arrow-right text-xs"></i>
            </button>
          </div>
        </div>

        {/* Quick Actions Bento Card */}
        <div className="bg-white p-5 rounded-3xl border border-sand shadow-card space-y-3.5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-charcoal flex items-center gap-2">
              <i className="ti ti-bolt text-gold"></i>
              <span>Quick Administrative Shortcuts</span>
            </h3>
            <p className="text-xs text-muted-text mt-0.5">Frequent tools for church prayer hosting.</p>
          </div>
          
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('half-night-prayer')}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-sand hover:border-gold hover:bg-cream/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 group-hover:bg-gold text-gold-dark group-hover:text-charcoal flex items-center justify-center transition-colors">
                  <i className="ti ti-plus text-sm"></i>
                </div>
                <span className="text-xs font-bold text-charcoal">Create New Schedule</span>
              </div>
              <i className="ti ti-chevron-right text-xs text-muted-text group-hover:text-gold-dark"></i>
            </button>

            <button
              onClick={() => onNavigate('members')}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-sand hover:border-gold hover:bg-cream/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 group-hover:bg-gold text-gold-dark group-hover:text-charcoal flex items-center justify-center transition-colors">
                  <i className="ti ti-user-plus text-sm"></i>
                </div>
                <span className="text-xs font-bold text-charcoal">Register Church Member</span>
              </div>
              <i className="ti ti-chevron-right text-xs text-muted-text group-hover:text-gold-dark"></i>
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-sand hover:border-gold hover:bg-cream/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 group-hover:bg-gold text-gold-dark group-hover:text-charcoal flex items-center justify-center transition-colors">
                  <i className="ti ti-chart-bar text-sm"></i>
                </div>
                <span className="text-xs font-bold text-charcoal">Participation Analytics</span>
              </div>
              <i className="ti ti-chevron-right text-xs text-muted-text group-hover:text-gold-dark"></i>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-sand hover:border-gold hover:bg-cream/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 group-hover:bg-gold text-gold-dark group-hover:text-charcoal flex items-center justify-center transition-colors">
                  <i className="ti ti-file-text text-sm"></i>
                </div>
                <span className="text-xs font-bold text-charcoal">Export Church Reports</span>
              </div>
              <i className="ti ti-chevron-right text-xs text-muted-text group-hover:text-gold-dark"></i>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
