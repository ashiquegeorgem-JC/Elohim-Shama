import React, { useState } from 'react';
import { whatsappService } from '../services/whatsappService';

export default function NotificationsView({
  notifications,
  onAddNotification,
  members,
  schedules,
  onShowToast
}) {
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredNotifications = notifications.filter(notif => {
    if (filterType !== 'all' && notif.type !== filterType) return false;
    if (filterStatus !== 'all' && notif.status !== filterStatus) return false;
    return true;
  });

  // Handle Resend Notification — Dynamically pulls live schedule data
  const handleResend = (notif) => {
    const member = members.find(m => m.id === notif.memberId);
    const rawNumber = member ? (member.whatsappNumber || member.phone) : notif.phone;

    if (!rawNumber || !whatsappService.normalizePhoneNumber(rawNumber)) {
      onShowToast("WhatsApp number not available. Please add the member's phone number first.", 'error');
      return;
    }

    // Lookup live schedule & slot to ensure latest edited date, topic, start/end time
    const liveSchedule = schedules.find(s => s.date === notif.scheduleDate || s.formattedDate === notif.scheduleDate) || schedules[0];
    const liveSlot = liveSchedule?.timeSlots.find(sl => sl.assignedMemberId === notif.memberId || sl.topic === notif.topic);

    const dateVal = liveSchedule ? (liveSchedule.formattedDate || liveSchedule.date) : notif.scheduleDate;
    const nameVal = member?.fullName || notif.memberName;
    const topicVal = liveSlot ? (liveSlot.topic + (liveSlot.subTopic ? ` (${liveSlot.subTopic})` : '')) : notif.topic;
    const timeVal = liveSlot ? `${liveSlot.startTime} - ${liveSlot.endTime}` : notif.slotTime;

    let msg = '';
    if (notif.type === '24-Hour Reminder') {
      msg = whatsappService.generate24HourReminderMessage({
        name: nameVal,
        topic: topicVal,
        assignedTime: timeVal,
        date: dateVal
      });
    } else if (notif.type === '10-Minute Reminder') {
      msg = whatsappService.generate10MinuteReminderMessage({
        name: nameVal,
        topic: topicVal,
        assignedTime: timeVal
      });
    } else if (notif.type === '5-Minute Reminder') {
      msg = whatsappService.generate5MinuteReminderMessage({
        name: nameVal,
        topic: topicVal,
        assignedTime: timeVal
      });
    } else {
      msg = whatsappService.generateAssignmentMessage({
        name: nameVal,
        topic: topicVal,
        assignedTime: timeVal,
        date: dateVal,
        bibleReading: liveSlot?.bibleReading || ''
      });
    }

    const link = whatsappService.createWhatsAppLink(rawNumber, msg, member || { fullName: notif.memberName, id: notif.memberId });
    if (!link) {
      onShowToast("WhatsApp number not available. Please add the member's phone number first.", 'error');
      return;
    }

    window.open(link, '_blank');

    onAddNotification({
      memberId: notif.memberId,
      memberName: nameVal,
      phone: rawNumber,
      type: notif.type,
      scheduleDate: dateVal,
      slotTime: timeVal,
      topic: topicVal,
      status: 'Sent'
    });

    onShowToast(`Resent ${notif.type} notification to ${nameVal}`);
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      
      {/* Control / Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-sand shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold font-display text-charcoal">WhatsApp Notification & Reminder Log</h2>
          <p className="text-xs text-muted-text">Complete audit trail of all assignment notifications, 24-hr reminders, and 10-min alerts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-semibold text-charcoal outline-none focus:border-gold"
          >
            <option value="all">All Notification Types</option>
            <option value="Assignment">Assignment</option>
            <option value="24-Hour Reminder">24-Hour Reminder</option>
            <option value="10-Minute Reminder">10-Minute Reminder</option>
            <option value="5-Minute Reminder">5-Minute Reminder</option>
            <option value="Reassignment">Reassignment Notice</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-semibold text-charcoal outline-none focus:border-gold"
          >
            <option value="all">All Delivery Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Sent">Sent</option>
            <option value="Delivered">Delivered</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-2xl border border-sand shadow-card overflow-hidden">
        
        <div className="p-6 border-b border-sand/60 flex items-center justify-between bg-cream/50">
          <h3 className="text-sm font-bold font-display text-charcoal">Broadcast & Dispatch Records</h3>
          <span className="text-xs text-muted-text font-semibold">{filteredNotifications.length} entries</span>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-muted-text text-xs">
            <i className="ti ti-bell-off text-2xl text-sand mb-2 block"></i>
            No notifications found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cream/30 text-gold-dark font-bold uppercase tracking-wider text-[10px] border-b border-sand">
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-6 py-3.5">Schedule Date & Slot</th>
                  <th className="px-6 py-3.5">Prayer Topic</th>
                  <th className="px-6 py-3.5">Notification Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {filteredNotifications.map(notif => {
                  const memberObj = members.find(m => m.id === notif.memberId || m.fullName === notif.memberName);
                  const displayPhone = memberObj ? (memberObj.phone || memberObj.whatsappNumber) : notif.phone;
                  return (
                  <tr key={notif.id} className="hover:bg-cream/30">
                    {/* Member */}
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-charcoal block">{notif.memberName}</span>
                      <span className="text-[10px] text-muted-text font-mono block">{displayPhone}</span>
                    </td>

                    {/* Schedule Date & Time */}
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-charcoal block">{notif.scheduleDate}</span>
                      <span className="text-[10px] text-muted-text font-medium block">{notif.slotTime}</span>
                    </td>

                    {/* Topic */}
                    <td className="px-6 py-3.5 text-muted-text max-w-xs truncate">
                      {notif.topic}
                    </td>

                    {/* Type */}
                    <td className="px-6 py-3.5">
                      <span className="bg-gold/15 text-gold-dark border border-gold/30 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                        {notif.type}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        notif.status === 'Delivered' || notif.status === 'Sent'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : notif.status === 'Scheduled'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : notif.status === 'Cancelled'
                          ? 'bg-sand/60 text-charcoal border-sand'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {notif.status}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-3.5 text-muted-text font-mono text-[11px]">
                      {notif.timestamp}
                    </td>

                    {/* Action: Resend */}
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleResend(notif)}
                        className="px-2.5 py-1 rounded-lg border border-sand hover:border-gold hover:text-gold-dark text-muted-text text-xs font-semibold inline-flex items-center gap-1 transition-all"
                      >
                        <i className="ti ti-rotate-clockwise text-xs"></i>
                        <span>Resend</span>
                      </button>
                    </td>
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
