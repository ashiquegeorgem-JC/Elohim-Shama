import React, { useState, useMemo } from 'react';
import { getDaysSinceDate } from '../services/schedulerEngine';

export default function AnalyticsView({ schedules, members }) {
  const [timeRange, setTimeRange] = useState('monthly'); // weekly | monthly
  const [notAssignedFilterDays, setNotAssignedFilterDays] = useState(30); // 30 | 60 | 90

  // Calculate Half Night Prayer specific metrics
  const metrics = useMemo(() => {
    let totalAssignments = 0;
    let confirmed = 0;
    let declined = 0;
    let reassigned = 0;
    let completed = 0;
    let missed = 0;
    let pending = 0;

    schedules.forEach(sch => {
      (sch.timeSlots || []).forEach(slot => {
        if (slot.assignedMemberId) {
          totalAssignments++;
          if (slot.status === 'Confirmed') confirmed++;
          if (slot.status === 'Declined') declined++;
          if (slot.status === 'Reassigned') reassigned++;
          if (slot.status === 'Completed') completed++;
          if (slot.status === 'Missed') missed++;
          if (slot.status === 'Pending Confirmation') pending++;
        }
      });
    });

    // Participation Rate formula: (Confirmed + Completed) / (Total Valid Assigned)
    const participationRate = totalAssignments > 0
      ? Math.round(((confirmed + completed) / totalAssignments) * 100)
      : 100;

    return {
      totalAssignments,
      confirmed,
      declined,
      reassigned,
      completed,
      missed,
      pending,
      participationRate
    };
  }, [schedules]);

  // Member Participation Leaderboard
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => (b.totalAssignments || 0) - (a.totalAssignments || 0));
  }, [members]);

  const mostActiveMembers = useMemo(() => sortedMembers.slice(0, 6), [sortedMembers]);
  const leastActiveMembers = useMemo(() => {
    return [...members]
      .filter(m => m.active)
      .sort((a, b) => (a.totalAssignments || 0) - (b.totalAssignments || 0))
      .slice(0, 6);
  }, [members]);

  // Section 39: Not Recently Assigned members (30, 60, 90 days filter)
  const notRecentlyAssignedList = useMemo(() => {
    return members
      .filter(m => {
        if (!m.active) return false;
        const days = getDaysSinceDate(m.lastAssignedDate);
        return days >= notAssignedFilterDays;
      })
      .sort((a, b) => getDaysSinceDate(b.lastAssignedDate) - getDaysSinceDate(a.lastAssignedDate));
  }, [members, notAssignedFilterDays]);

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      
      {/* Top Range Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-sand shadow-card">
        <div>
          <h2 className="text-sm font-bold font-display text-charcoal">Half Night Prayer Analytics & Participation</h2>
          <p className="text-xs text-muted-text">Real-time breakdown of midnight prayer scheduling, attendance, and member distribution.</p>
        </div>

        <div className="flex items-center bg-cream p-1 rounded-xl border border-sand">
          <button
            onClick={() => setTimeRange('weekly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === 'weekly' ? 'bg-gold text-charcoal shadow-xs' : 'text-muted-text hover:text-charcoal'
            }`}
          >
            Weekly View
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === 'monthly' ? 'bg-gold text-charcoal shadow-xs' : 'text-muted-text hover:text-charcoal'
            }`}
          >
            Monthly View
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Participation Rate */}
        <div className="bg-white p-5 rounded-2xl border border-sand shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider block">Participation Rate</span>
            <span className="text-3xl font-display font-bold text-gold-dark block">{metrics.participationRate}%</span>
            <span className="text-xs text-muted-text block">Attendance & fulfillment</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gold/15 text-gold flex items-center justify-center border border-gold/30">
            <i className="ti ti-chart-pie text-2xl"></i>
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-white p-5 rounded-2xl border border-sand shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Confirmed Slots</span>
            <span className="text-3xl font-display font-bold text-emerald-700 block">{metrics.confirmed + metrics.completed}</span>
            <span className="text-xs text-muted-text block">Accepted invitations</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <i className="ti ti-check-check text-2xl"></i>
          </div>
        </div>

        {/* Declined */}
        <div className="bg-white p-5 rounded-2xl border border-sand shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Declined Slots</span>
            <span className="text-3xl font-display font-bold text-rose-600 block">{metrics.declined}</span>
            <span className="text-xs text-muted-text block">Cannot serve notices</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <i className="ti ti-user-x text-2xl"></i>
          </div>
        </div>

        {/* Total Duty Assignments */}
        <div className="bg-white p-5 rounded-2xl border border-sand shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Total Scheduled</span>
            <span className="text-3xl font-display font-bold text-charcoal block">{metrics.totalAssignments}</span>
            <span className="text-xs text-muted-text block">{metrics.pending} pending reply</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cream text-charcoal flex items-center justify-center border border-sand">
            <i className="ti ti-calendar-stats text-2xl"></i>
          </div>
        </div>

      </div>

      {/* SVG Charts: Status Breakdown & Most Active Servants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Status Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-sand shadow-card space-y-4">
          <h3 className="text-sm font-bold font-display text-charcoal flex items-center gap-2">
            <i className="ti ti-chart-bar text-gold"></i>
            <span>Half Night Prayer Assignment Status Distribution</span>
          </h3>

          <div className="p-4 bg-cream/50 rounded-2xl border border-sand">
            <div className="space-y-3">
              {[
                { label: 'Confirmed / Ready', count: metrics.confirmed, color: '#10b981' },
                { label: 'Pending WhatsApp Reply', count: metrics.pending, color: '#d97706' },
                { label: 'Declined (Reassigned)', count: metrics.declined, color: '#e11d48' },
                { label: 'Completed Past Sessions', count: metrics.completed, color: '#C5A059' },
                { label: 'Missed Assignments', count: metrics.missed, color: '#64748b' }
              ].map(bar => {
                const total = Math.max(metrics.totalAssignments, 1);
                const percent = Math.round((bar.count / total) * 100);

                return (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-charcoal">{bar.label}</span>
                      <span className="text-charcoal font-mono font-bold">{bar.count} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-sand/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percent, 4)}%`, backgroundColor: bar.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-muted-text text-center">Note: Declined slots are distinguished from missed slots in church records.</p>
        </div>

        {/* Most Active Servants */}
        <div className="bg-white p-6 rounded-2xl border border-sand shadow-card space-y-4">
          <h3 className="text-sm font-bold font-display text-charcoal flex items-center gap-2">
            <i className="ti ti-trophy text-gold"></i>
            <span>Most Active Servants</span>
          </h3>

          <div className="divide-y divide-sand/40">
            {mostActiveMembers.map((m, idx) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-gold text-charcoal' : idx === 1 ? 'bg-cream text-charcoal border border-sand' : 'bg-sand/40 text-charcoal'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="font-bold text-charcoal text-xs block">{m.fullName}</span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-gold-dark text-xs block">{m.totalAssignments || 0} assignments</span>
                  <span className="text-[10px] text-emerald-800 font-semibold block">{m.confirmedAssignments || 0} confirmed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Section 39: Not Recently Assigned */}
      <div className="bg-white rounded-2xl border border-sand shadow-card overflow-hidden">
        <div className="p-6 border-b border-sand/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-cream/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-display text-charcoal">Members Not Recently Assigned</h3>
              <span className="bg-gold/15 text-gold-dark text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-gold/30">
                Fair Scheduling Metric
              </span>
            </div>
            <p className="text-xs text-muted-text mt-0.5">
              Identify church members who have not been scheduled recently to maintain fair rotation.
            </p>
          </div>

          {/* 30, 60, 90 days filters */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-sand">
            {[30, 60, 90].map(days => (
              <button
                key={days}
                onClick={() => setNotAssignedFilterDays(days)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  notAssignedFilterDays === days
                    ? 'bg-gold text-charcoal shadow-xs'
                    : 'text-muted-text hover:bg-cream'
                }`}
              >
                ≥ {days} Days
              </button>
            ))}
          </div>
        </div>

        {notRecentlyAssignedList.length === 0 ? (
          <div className="p-12 text-center text-muted-text text-xs">
            <i className="ti ti-circle-check text-2xl text-emerald-600 mb-1 block"></i>
            All active church members have been assigned within the selected {notAssignedFilterDays}-day window.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cream/30 text-gold-dark font-bold uppercase tracking-wider text-[10px] border-b border-sand">
                  <th className="px-6 py-3.5">Member Name</th>
                  <th className="px-6 py-3.5">Availability</th>
                  <th className="px-6 py-3.5">Last Assigned Date</th>
                  <th className="px-6 py-3.5">Days Since Last Assigned</th>
                  <th className="px-6 py-3.5 text-right">Lifetime Assignments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {notRecentlyAssignedList.slice(0, 15).map(mem => {
                  const daysAgo = getDaysSinceDate(mem.lastAssignedDate);
                  return (
                    <tr key={mem.id} className="hover:bg-cream/30">
                      <td className="px-6 py-3.5 font-bold text-charcoal whitespace-nowrap">{mem.fullName}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                          mem.availability === 'Available'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : mem.availability === 'Busy'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : mem.availability === 'Out of Station'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {mem.availability}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-muted-text whitespace-nowrap">{mem.lastAssignedDate || 'No record'}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-gold-dark">{daysAgo} days ago</span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-charcoal whitespace-nowrap">{mem.totalAssignments || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
