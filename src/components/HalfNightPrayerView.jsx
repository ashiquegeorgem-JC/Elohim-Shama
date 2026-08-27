import React, { useState, useMemo } from 'react';
import { DEFAULT_HNP_TIME_SLOTS, DECLINE_REASONS } from '../types/constants';
import { calculateDateTimes, getRecommendedMembers, detectAssignmentConflict } from '../services/schedulerEngine';
import { whatsappService } from '../services/whatsappService';
import { storageService } from '../services/storageService';

export default function HalfNightPrayerView({
  schedules,
  setSchedules,
  members,
  setMembers,
  notifications,
  setNotifications,
  setHistory,
  onOpenReassign,
  onContactMember,
  onOpenExport,
  onShowToast
}) {
  const [selectedScheduleId, setSelectedScheduleId] = useState(
    schedules.length > 0 ? schedules[0].id : null
  );

  // Active Schedule
  const currentSchedule = useMemo(() => {
    return schedules.find(s => s.id === selectedScheduleId) || schedules[0] || null;
  }, [schedules, selectedScheduleId]);

  // Drawer / Modal states
  const [activeAssignSlotId, setActiveAssignSlotId] = useState(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isInlineAddMemberOpen, setIsInlineAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberMinistry, setNewMemberMinistry] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  
  // Bible Selector state
  const [isBibleModalOpen, setIsBibleModalOpen] = useState(false);
  const [targetSlotIdForBible, setTargetSlotIdForBible] = useState(null);

  // Decline simulation modal state
  const [declineModalSlotId, setDeclineModalSlotId] = useState(null);
  const [declineReason, setDeclineReason] = useState(DECLINE_REASONS[0]);
  const [declineOtherText, setDeclineOtherText] = useState('');

  // Editing Slot inline
  const [editingSlotId, setEditingSlotId] = useState(null);

  // Clear Assignment Modal States
  const [clearSingleModal, setClearSingleModal] = useState({ isOpen: false, slot: null, member: null });
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Schedule Meta Form (Date & Times)
  const [isEditingScheduleMeta, setIsEditingScheduleMeta] = useState(false);
  const [scheduleMetaDate, setScheduleMetaDate] = useState(currentSchedule?.date || '2026-08-29');
  const [scheduleMetaStart, setScheduleMetaStart] = useState(currentSchedule?.startTime || '10:00 PM');
  const [scheduleMetaEnd, setScheduleMetaEnd] = useState(currentSchedule?.endTime || '12:30 AM');

  // Currently active slot for assigning
  const activeSlot = useMemo(() => {
    if (!currentSchedule || !activeAssignSlotId) return null;
    return currentSchedule.timeSlots.find(s => s.id === activeAssignSlotId) || null;
  }, [currentSchedule, activeAssignSlotId]);

  // Fair recommendations for active slot
  const recommendations = useMemo(() => {
    if (!activeSlot || !currentSchedule) return [];
    return getRecommendedMembers({
      members,
      currentSchedule,
      currentSlotId: activeSlot.id,
      searchQuery: memberSearchQuery
    });
  }, [activeSlot, currentSchedule, members, memberSearchQuery]);

  // --- ACTIONS ---

  // Create a new Half Night Prayer Schedule from default template
  const handleCreateNewSchedule = () => {
    const today = new Date();
    // Default to upcoming Saturday
    const nextSat = new Date();
    nextSat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
    const dateStr = nextSat.toISOString().split('T')[0];

    const { startDateTime, endDateTime } = calculateDateTimes(dateStr, '10:00 PM', '12:30 AM');

    const newSchedule = {
      id: `hnp-${Date.now()}`,
      title: 'Half Night Prayer',
      programType: 'half_night_prayer',
      date: dateStr,
      formattedDate: nextSat.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      startTime: '10:00 PM',
      endTime: '12:30 AM',
      startDateTime,
      endDateTime,
      timezone: 'Asia/Kolkata',
      status: 'Upcoming',
      timeSlots: DEFAULT_HNP_TIME_SLOTS.map((slot, i) => ({
        ...slot,
        id: `slot-${Date.now()}-${i + 1}`,
        assignedMemberId: null,
        status: 'Pending Confirmation'
      }))
    };

    setSchedules(prev => [newSchedule, ...prev]);
    setSelectedScheduleId(newSchedule.id);
    onShowToast('New Half Night Prayer schedule initialized from official template');
  };

  // Save updated date/times for schedule
  const handleSaveScheduleMeta = () => {
    const { startDateTime, endDateTime } = calculateDateTimes(scheduleMetaDate, scheduleMetaStart, scheduleMetaEnd);
    const dateObj = new Date(scheduleMetaDate);
    const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    setSchedules(prev => prev.map(s => {
      if (s.id === currentSchedule.id) {
        return {
          ...s,
          date: scheduleMetaDate,
          formattedDate: formatted,
          startTime: scheduleMetaStart,
          endTime: scheduleMetaEnd,
          startDateTime,
          endDateTime
        };
      }
      return s;
    }));

    setIsEditingScheduleMeta(false);
    onShowToast('Schedule date and timings updated');
  };

  // Add a new empty time slot
  const handleAddTimeSlot = () => {
    if (!currentSchedule) return;
    const newSlot = {
      id: `slot-${Date.now()}`,
      startTime: '12:30 AM',
      endTime: '12:45 AM',
      durationMinutes: 15,
      topic: 'Additional Intercession Block',
      subTopic: '',
      bibleReading: '',
      notes: '',
      pptRequired: false,
      additionalInstructions: '',
      assignedMemberId: null,
      status: 'Pending Confirmation'
    };

    setSchedules(prev => prev.map(s => {
      if (s.id === currentSchedule.id) {
        return { ...s, timeSlots: [...s.timeSlots, newSlot] };
      }
      return s;
    }));
    onShowToast('Time slot added to schedule');
  };

  // Delete a time slot
  const handleDeleteSlot = (slotId) => {
    if (!confirm('Are you sure you want to remove this time slot from the schedule?')) return;
    setSchedules(prev => prev.map(s => {
      if (s.id === currentSchedule.id) {
        return { ...s, timeSlots: s.timeSlots.filter(sl => sl.id !== slotId) };
      }
      return s;
    }));
    onShowToast('Time slot removed');
  };

  // Duplicate a time slot
  const handleDuplicateSlot = (slot) => {
    const duplicated = {
      ...slot,
      id: `slot-${Date.now()}`,
      assignedMemberId: null,
      status: 'Pending Confirmation'
    };
    setSchedules(prev => prev.map(s => {
      if (s.id === currentSchedule.id) {
        const idx = s.timeSlots.findIndex(sl => sl.id === slot.id);
        const copy = [...s.timeSlots];
        copy.splice(idx + 1, 0, duplicated);
        return { ...s, timeSlots: copy };
      }
      return s;
    }));
    onShowToast('Time slot duplicated');
  };

  // Move Slot Up/Down
  const handleMoveSlot = (slotId, direction) => {
    setSchedules(prev => prev.map(s => {
      if (s.id === currentSchedule.id) {
        const slots = [...s.timeSlots];
        const idx = slots.findIndex(sl => sl.id === slotId);
        if (idx === -1) return s;
        if (direction === 'up' && idx > 0) {
          const temp = slots[idx];
          slots[idx] = slots[idx - 1];
          slots[idx - 1] = temp;
        } else if (direction === 'down' && idx < slots.length - 1) {
          const temp = slots[idx];
          slots[idx] = slots[idx + 1];
          slots[idx + 1] = temp;
        }
        return { ...s, timeSlots: slots };
      }
      return s;
    }));
  };

  // Update specific slot field
  const handleUpdateSlotField = (slotId, fields) => {
    setSchedules(prev => prev.map(s => {
      if (s.id === currentSchedule.id) {
        return {
          ...s,
          timeSlots: s.timeSlots.map(sl => sl.id === slotId ? { ...sl, ...fields } : sl)
        };
      }
      return s;
    }));
  };

  // Assign member to slot
  const handleAssignMemberToSlot = (slotId, member) => {
    const conflict = detectAssignmentConflict(member, currentSchedule, slotId);
    if (conflict.hasConflict && member.availability !== 'Available') {
      if (!confirm(`Warning: ${conflict.messages.join('\n')}\n\nDo you want to proceed with assignment override?`)) {
        return;
      }
    }

    handleUpdateSlotField(slotId, {
      assignedMemberId: member.id,
      status: 'Pending Confirmation'
    });

    setActiveAssignSlotId(null);
    onShowToast(`Assigned ${member.fullName} to time slot`);
  };

  // Inline Quick Add Member
  const handleInlineAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const cleanPhone = newMemberPhone.trim();

    const newMem = {
      id: `mem-${Date.now()}`,
      fullName: newMemberName.trim(),
      phone: cleanPhone,
      whatsappNumber: cleanPhone,
      whatsappEnabled: true,
      whatsappOptIn: true,
      active: true,
      availability: 'Available',
      ministry: newMemberMinistry.trim() || 'Intercession',
      notes: 'Added via scheduler',
      lastAssignedDate: new Date().toISOString().split('T')[0],
      totalAssignments: 1,
      confirmedAssignments: 0,
      declinedAssignments: 0,
      completedAssignments: 0,
      missedAssignments: 0,
      participationHistory: []
    };

    setMembers(prev => [newMem, ...prev]);
    setIsInlineAddMemberOpen(false);
    setNewMemberName('');
    setNewMemberMinistry('');
    setNewMemberPhone('');

    if (activeSlot) {
      handleAssignMemberToSlot(activeSlot.id, newMem);
    }
    onShowToast(`Added and assigned ${newMem.fullName}`);
  };

  // Send WhatsApp assignment message (opens dynamic preview modal)
  const handleSendWhatsApp = (slot) => {
    const member = members.find(m => m.id === slot.assignedMemberId);
    if (!member) {
      onShowToast('Please assign a member before sending WhatsApp notification', 'warning');
      return;
    }

    const rawNumber = member.whatsappNumber || member.phone;
    if (!rawNumber || !whatsappService.normalizePhoneNumber(rawNumber)) {
      onShowToast("WhatsApp number not available. Please add the member's phone number first.", 'error');
      return;
    }

    onContactMember(member, currentSchedule, slot);
  };

  // Member Simulation: Confirm
  const handleSimulateConfirm = (slotId) => {
    handleUpdateSlotField(slotId, {
      status: 'Confirmed',
      confirmedAt: new Date().toISOString()
    });
    onShowToast('Member response recorded: CONFIRMED', 'success');
  };

  // Member Simulation: Cannot Serve / Decline
  const handleSimulateDecline = (e) => {
    e.preventDefault();
    if (!declineModalSlotId) return;

    const reason = declineReason === 'Other' && declineOtherText.trim()
      ? `Other: ${declineOtherText.trim()}`
      : declineReason;

    handleUpdateSlotField(declineModalSlotId, {
      status: 'Declined',
      declineReason: reason,
      declinedAt: new Date().toISOString()
    });

    setDeclineModalSlotId(null);
    setDeclineOtherText('');
    onShowToast('Member response recorded: CANNOT SERVE (Declined)', 'error');
  };

  // Clear single assignment handler
  const handleConfirmClearSingle = () => {
    const { slot, member } = clearSingleModal;
    if (!slot || !member || !currentSchedule) return;

    // 1. Clear assignedMemberId while preserving time, topic, bibleReading, notes, pptRequirement, order
    setSchedules(prev => prev.map(s => {
      if (s.id === currentSchedule.id) {
        return {
          ...s,
          timeSlots: s.timeSlots.map(sl => sl.id === slot.id ? {
            ...sl,
            assignedMemberId: null,
            status: 'Pending Confirmation',
            confirmedAt: null,
            declineReason: null
          } : sl)
        };
      }
      return s;
    }));

    // 2. Record timeline history event
    storageService.recordHistoryEvent(
      currentSchedule.id,
      slot.id,
      currentSchedule.formattedDate || currentSchedule.date,
      `${slot.startTime} - ${slot.endTime}`,
      slot.topic,
      {
        type: 'Cleared',
        originalMemberName: member.fullName,
        actor: 'Admin',
        notes: 'Assignment cleared by Administrator'
      }
    );
    if (setHistory) setHistory(storageService.getAssignmentHistory());

    // 3. Cancel pending notifications for this member & schedule date
    if (setNotifications) {
      setNotifications(prev => prev.map(n => {
        if (n.memberId === member.id && (n.scheduleDate === currentSchedule.date || n.scheduleDate === currentSchedule.formattedDate) && n.status === 'Scheduled') {
          return { ...n, status: 'Cancelled' };
        }
        return n;
      }));
    }
    const currentNotifs = storageService.getNotifications();
    const updatedNotifs = currentNotifs.map(n => {
      if (n.memberId === member.id && (n.scheduleDate === currentSchedule.date || n.scheduleDate === currentSchedule.formattedDate) && n.status === 'Scheduled') {
        return { ...n, status: 'Cancelled' };
      }
      return n;
    });
    storageService.saveNotifications(updatedNotifs);

    setClearSingleModal({ isOpen: false, slot: null, member: null });
    onShowToast(`Cleared assignment for ${member.fullName}`);
  };

  // Clear all assignments handler for current schedule
  const handleConfirmClearAll = () => {
    if (!currentSchedule) return;

    let clearedCount = 0;
    const scheduleDate = currentSchedule.formattedDate || currentSchedule.date;

    // Record audit history for each assigned slot before clearing
    currentSchedule.timeSlots.forEach(slot => {
      if (slot.assignedMemberId) {
        const mem = members.find(m => m.id === slot.assignedMemberId);
        if (mem) {
          clearedCount++;
          storageService.recordHistoryEvent(
            currentSchedule.id,
            slot.id,
            scheduleDate,
            `${slot.startTime} - ${slot.endTime}`,
            slot.topic,
            {
              type: 'Cleared',
              originalMemberName: mem.fullName,
              actor: 'Admin',
              notes: 'Batch cleared all assignments'
            }
          );
        }
      }
    });

    if (setHistory) setHistory(storageService.getAssignmentHistory());

    // 1. Clear assignedMemberId from all slots in current schedule
    setSchedules(prev => prev.map(s => {
      if (s.id === currentSchedule.id) {
        return {
          ...s,
          timeSlots: s.timeSlots.map(sl => ({
            ...sl,
            assignedMemberId: null,
            status: 'Pending Confirmation',
            confirmedAt: null,
            declineReason: null
          }))
        };
      }
      return s;
    }));

    // 2. Cancel all pending notifications for this schedule date
    if (setNotifications) {
      setNotifications(prev => prev.map(n => {
        if ((n.scheduleDate === currentSchedule.date || n.scheduleDate === currentSchedule.formattedDate) && n.status === 'Scheduled') {
          return { ...n, status: 'Cancelled' };
        }
        return n;
      }));
    }
    const currentNotifs = storageService.getNotifications();
    const updatedNotifs = currentNotifs.map(n => {
      if ((n.scheduleDate === currentSchedule.date || n.scheduleDate === currentSchedule.formattedDate) && n.status === 'Scheduled') {
        return { ...n, status: 'Cancelled' };
      }
      return n;
    });
    storageService.saveNotifications(updatedNotifs);

    setIsClearAllModalOpen(false);
    onShowToast(`Cleared all member assignments for this schedule (${clearedCount} cleared)`);
  };

  // Mark completion status post prayer session
  const handleMarkCompletion = (slotId, status) => {
    handleUpdateSlotField(slotId, { status });
    onShowToast(`Marked slot status as ${status}`);
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      
      {/* Schedule Selector & Meta Bar */}
      <div className="bg-white p-6 rounded-2xl border border-sand shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider block mb-1">
              Select Schedule
            </span>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="bg-cream border border-sand rounded-xl px-3.5 py-2 text-xs font-bold text-charcoal outline-none focus:border-gold min-w-56"
            >
              {schedules.map(sch => (
                <option key={sch.id} value={sch.id}>
                  {sch.formattedDate || sch.date} ({sch.startTime} – {sch.endTime})
                </option>
              ))}
            </select>
          </div>

          {currentSchedule && (
            <div className="pt-4 md:pt-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-display font-bold text-charcoal">
                  {currentSchedule.formattedDate || currentSchedule.date}
                </span>
                <span className="bg-gold/15 text-gold-dark text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-gold/30">
                  {currentSchedule.timezone}
                </span>
              </div>
              <p className="text-xs text-muted-text font-medium">
                Timings: <strong className="text-charcoal">{currentSchedule.startTime} – {currentSchedule.endTime}</strong> (Crosses Midnight)
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setScheduleMetaDate(currentSchedule?.date || '2026-08-29');
              setScheduleMetaStart(currentSchedule?.startTime || '10:00 PM');
              setScheduleMetaEnd(currentSchedule?.endTime || '12:30 AM');
              setIsEditingScheduleMeta(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-sand hover:bg-cream text-charcoal text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <i className="ti ti-edit"></i>
            <span>Edit Date & Timings</span>
          </button>

          <button
            onClick={handleCreateNewSchedule}
            className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <i className="ti ti-plus"></i>
            <span>New Schedule</span>
          </button>

          <button
            onClick={onOpenExport}
            className="px-4 py-2 rounded-xl bg-charcoal hover:bg-charcoal/90 text-ivory text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <i className="ti ti-photo"></i>
            <span>Export Card</span>
          </button>
        </div>
      </div>

      {/* Main Schedule Time Slot Builder List */}
      <div className="bg-white rounded-2xl border border-sand shadow-card overflow-hidden">
        
        {/* Table / List Header */}
        <div className="p-6 border-b border-sand/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-cream/50">
          <div>
            <h3 className="text-sm font-bold font-display text-charcoal flex items-center gap-2">
              <i className="ti ti-list-details text-gold"></i>
              <span>Midnight Prayer Time Slots & Duty Assignments</span>
            </h3>
            <p className="text-xs text-muted-text mt-0.5">
              Manage topics, Bible readings, member allocations, and WhatsApp communications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              title="Remove all assigned members from this schedule"
              className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <i className="ti ti-user-minus"></i>
              <span>Clear All Assignments</span>
            </button>

            <button
              onClick={handleAddTimeSlot}
              className="bg-white border border-sand hover:border-gold hover:text-gold-dark text-charcoal px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <i className="ti ti-plus"></i>
              <span>Add Time Slot</span>
            </button>
          </div>
        </div>

        {/* Slots List */}
        {!currentSchedule || currentSchedule.timeSlots.length === 0 ? (
          <div className="p-12 text-center text-muted-text text-xs">
            No time slots in this schedule. Click "Add Time Slot" to start configuring prayer points.
          </div>
        ) : (
          <div className="divide-y divide-sand/40">
            {currentSchedule.timeSlots.map((slot, index, arr) => {
              const assignedMember = members.find(m => m.id === slot.assignedMemberId);
              const isEditing = editingSlotId === slot.id;

              return (
                <div key={slot.id} className="p-6 hover:bg-cream/30 transition-colors space-y-4">
                  
                  {/* Slot Header Row: Time Badge, Status, Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-cream text-charcoal font-bold text-xs flex items-center justify-center border border-sand">
                        {index + 1}
                      </span>

                      <span className="bg-gold/15 text-charcoal border border-gold/40 font-extrabold text-xs px-3 py-1 rounded-xl whitespace-nowrap">
                        {slot.startTime} – {slot.endTime} ({slot.durationMinutes || 20}m)
                      </span>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                        slot.status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : slot.status === 'Declined'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : slot.status === 'Completed'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : slot.status === 'Missed'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {slot.status}
                      </span>

                      {slot.pptRequired && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                          PPT Required
                        </span>
                      )}
                    </div>

                    {/* Slot Action Menu: Reorder, Duplicate, Delete */}
                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveSlot(slot.id, 'up')}
                        title="Move Up"
                        className="w-7 h-7 rounded-lg text-muted-text hover:text-charcoal hover:bg-cream flex items-center justify-center disabled:opacity-20"
                      >
                        <i className="ti ti-arrow-up"></i>
                      </button>

                      <button
                        disabled={index === arr.length - 1}
                        onClick={() => handleMoveSlot(slot.id, 'down')}
                        title="Move Down"
                        className="w-7 h-7 rounded-lg text-muted-text hover:text-charcoal hover:bg-cream flex items-center justify-center disabled:opacity-20"
                      >
                        <i className="ti ti-arrow-down"></i>
                      </button>

                      <button
                        onClick={() => setEditingSlotId(isEditing ? null : slot.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isEditing ? 'bg-gold text-charcoal' : 'text-muted-text hover:text-gold-dark hover:bg-cream'
                        }`}
                      >
                        <i className="ti ti-edit"></i>
                      </button>

                      <button
                        onClick={() => handleDuplicateSlot(slot)}
                        title="Duplicate Slot"
                        className="w-7 h-7 rounded-lg text-muted-text hover:text-gold-dark hover:bg-cream flex items-center justify-center"
                      >
                        <i className="ti ti-copy"></i>
                      </button>

                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        title="Delete Slot"
                        className="w-7 h-7 rounded-lg text-muted-text hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </div>
                  </div>

                  {/* Slot Details Body */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left: Topic, Scripture, Notes */}
                    <div className="lg:col-span-7 space-y-2">
                      {isEditing ? (
                        <div className="space-y-3 bg-cream/70 p-4 rounded-2xl border border-sand">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-muted-text block mb-1">Start Time</label>
                              <input
                                type="text"
                                value={slot.startTime}
                                onChange={(e) => handleUpdateSlotField(slot.id, { startTime: e.target.value })}
                                className="w-full bg-white border border-sand rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-gold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-text block mb-1">End Time</label>
                              <input
                                type="text"
                                value={slot.endTime}
                                onChange={(e) => handleUpdateSlotField(slot.id, { endTime: e.target.value })}
                                className="w-full bg-white border border-sand rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-gold"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-muted-text block mb-1">Prayer Topic</label>
                            <input
                              type="text"
                              value={slot.topic}
                              onChange={(e) => handleUpdateSlotField(slot.id, { topic: e.target.value })}
                              className="w-full bg-white border border-sand rounded-xl px-2.5 py-1.5 text-xs font-bold text-charcoal outline-none focus:border-gold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-muted-text block mb-1">Sub-topic (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. Prayer Is the Key"
                              value={slot.subTopic || ''}
                              onChange={(e) => handleUpdateSlotField(slot.id, { subTopic: e.target.value })}
                              className="w-full bg-white border border-sand rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-gold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-muted-text block mb-1">Notes / Instructions</label>
                            <textarea
                              rows="2"
                              value={slot.notes || ''}
                              onChange={(e) => handleUpdateSlotField(slot.id, { notes: e.target.value })}
                              className="w-full bg-white border border-sand rounded-xl p-2 text-xs outline-none resize-none focus:border-gold"
                            ></textarea>
                          </div>

                          <div className="flex items-center gap-3 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={slot.pptRequired || false}
                                onChange={(e) => handleUpdateSlotField(slot.id, { pptRequired: e.target.checked })}
                                className="rounded text-gold focus:ring-gold"
                              />
                              <span className="text-xs font-semibold text-charcoal">Mark PPT Required</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-bold text-charcoal leading-snug">
                            {slot.topic}
                          </h4>
                          
                          {slot.subTopic && (
                            <p className="text-xs font-semibold text-gold-dark">
                              Sub-topic: {slot.subTopic}
                            </p>
                          )}

                          {slot.notes && (
                            <p className="text-xs text-muted-text">
                              {slot.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Assigned Member & Action Buttons */}
                    <div className="lg:col-span-5 bg-cream/50 p-4 rounded-2xl border border-sand space-y-3">
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">
                          Assigned Servant
                        </span>

                        {assignedMember && (
                          <button
                            onClick={() => onContactMember(assignedMember)}
                            className="text-emerald-800 hover:text-emerald-900 text-[11px] font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
                          >
                            <i className="ti ti-brand-whatsapp text-emerald-600"></i>
                            <span>Contact</span>
                          </button>
                        )}
                      </div>

                      {assignedMember ? (
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-sand">
                          <div className="space-y-0.5">
                            <span className="font-bold text-charcoal text-xs block">
                              {assignedMember.fullName}
                            </span>
                            <span className="text-[11px] text-muted-text font-mono block">
                              {assignedMember.phone}
                            </span>
                          </div>

                          <button
                            onClick={() => setActiveAssignSlotId(slot.id)}
                            className="text-xs text-gold-dark hover:text-charcoal font-bold underline underline-offset-2"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveAssignSlotId(slot.id)}
                          className="w-full bg-white hover:bg-cream border border-dashed border-sand hover:border-gold text-gold-dark font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <i className="ti ti-user-plus text-base"></i>
                          <span>Assign Church Member</span>
                        </button>
                      )}

                      {/* Communication & Response Triggers */}
                      <div className="pt-2 border-t border-sand/60 flex flex-wrap items-center gap-2">
                        {/* 1. Send WhatsApp Notification */}
                        <button
                          disabled={!assignedMember}
                          onClick={() => handleSendWhatsApp(slot)}
                          className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
                        >
                          <i className="ti ti-brand-whatsapp text-sm"></i>
                          <span>Send WhatsApp</span>
                        </button>

                        {/* Clear Individual Assignment Button */}
                        {assignedMember && (
                          <button
                            onClick={() => setClearSingleModal({ isOpen: true, slot, member: assignedMember })}
                            title={`Clear ${assignedMember.fullName} from this assignment`}
                            className="bg-white hover:bg-rose-50 border border-sand hover:border-rose-300 text-rose-700 font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0"
                          >
                            <i className="ti ti-user-minus text-sm"></i>
                            <span>Clear Assignment</span>
                          </button>
                        )}

                        {/* 2. Response simulation buttons */}
                        {assignedMember && slot.status === 'Pending Confirmation' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSimulateConfirm(slot.id)}
                              title="Simulate Member Confirmation"
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] px-2.5 py-1.5 rounded-xl transition-all"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setDeclineModalSlotId(slot.id);
                              }}
                              title="Simulate Cannot Serve"
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] px-2.5 py-1.5 rounded-xl transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {/* 3. Reassign Trigger if declined */}
                        {slot.status === 'Declined' && (
                          <button
                            onClick={() => onOpenReassign(currentSchedule, slot, assignedMember)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all"
                          >
                            <i className="ti ti-user-x"></i>
                            <span>Reassign</span>
                          </button>
                        )}

                        {/* 4. Mark Completed / Missed */}
                        {(slot.status === 'Confirmed' || slot.status === 'Completed' || slot.status === 'Missed') && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMarkCompletion(slot.id, 'Completed')}
                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
                                slot.status === 'Completed'
                                  ? 'bg-charcoal text-ivory border-charcoal'
                                  : 'bg-white text-charcoal border-sand hover:bg-cream'
                              }`}
                            >
                              Completed
                            </button>
                            <button
                              onClick={() => handleMarkCompletion(slot.id, 'Missed')}
                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
                                slot.status === 'Missed'
                                  ? 'bg-rose-700 text-white border-rose-700'
                                  : 'bg-white text-muted-text border-sand hover:bg-cream'
                              }`}
                            >
                              Missed
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MEMBER ASSIGNMENT DRAWER */}
      {activeAssignSlotId && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex justify-end z-50 p-0">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-sand animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-sand/60 flex items-center justify-between bg-cream/50">
              <div>
                <h3 className="text-sm font-bold font-display text-charcoal">Assign Church Member</h3>
                <p className="text-[11px] text-muted-text">
                  {activeSlot?.startTime} – {activeSlot?.endTime} ({activeSlot?.topic})
                </p>
              </div>
              <button
                onClick={() => setActiveAssignSlotId(null)}
                className="w-8 h-8 rounded-xl text-muted-text hover:text-charcoal hover:bg-cream flex items-center justify-center transition-colors"
              >
                <i className="ti ti-x text-lg"></i>
              </button>
            </div>

            {/* Search & Inline Add */}
            <div className="p-6 border-b border-sand/60 space-y-3 bg-white">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-text text-xs"></i>
                  <input
                    type="text"
                    placeholder="Search member name..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full bg-cream border border-sand rounded-xl pl-9 pr-3 py-2 text-xs text-charcoal outline-none focus:bg-white focus:border-gold"
                  />
                </div>
                <button
                  onClick={() => setIsInlineAddMemberOpen(true)}
                  className="bg-gold hover:bg-gold-dark text-charcoal text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shrink-0 shadow-xs transition-all"
                >
                  <i className="ti ti-user-plus"></i>
                  <span>+ Add New</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-text">
                <span>Fair Recommendation Engine</span>
                <span className="font-bold text-gold-dark">{recommendations.length} available</span>
              </div>
            </div>

            {/* Member Recommendations List */}
            <div className="flex-1 overflow-y-auto p-6 divide-y divide-sand/40 space-y-1">
              {recommendations.length === 0 ? (
                <div className="py-12 text-center text-muted-text text-xs">
                  No members matching search query. Click "+ Add New" to register them now.
                </div>
              ) : (
                recommendations.map(member => (
                  <div
                    key={member.id}
                    onClick={() => handleAssignMemberToSlot(activeSlot.id, member)}
                    className="py-3 px-3 rounded-xl hover:bg-cream cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal text-xs group-hover:text-gold-dark">
                          {member.fullName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-muted-text">
                        <span>Last assigned: <strong className="text-charcoal">{member.daysSinceLast}d ago</strong></span>
                        <span>This month: <strong className="text-charcoal">{member.assignmentsThisMonth}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        member.availability === 'Available'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {member.availability}
                      </span>
                      <button className="w-7 h-7 rounded-lg bg-gold text-charcoal flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="ti ti-check text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-cream/50 border-t border-sand flex justify-end">
              <button
                onClick={() => setActiveAssignSlotId(null)}
                className="px-4 py-2 rounded-xl border border-sand text-charcoal hover:bg-cream text-xs font-semibold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* INLINE ADD MEMBER MODAL */}
      {isInlineAddMemberOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-sand animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-charcoal">Add New Church Member</h3>
              <button onClick={() => setIsInlineAddMemberOpen(false)} className="text-muted-text hover:text-charcoal">
                <i className="ti ti-x"></i>
              </button>
            </div>

            <form onSubmit={handleInlineAddMember} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-text block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sis. Ruth"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-gold font-semibold text-charcoal"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-text block mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-gold font-mono text-charcoal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInlineAddMemberOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-sand text-muted-text hover:bg-cream text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal text-xs font-bold shadow-xs"
                >
                  Save & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SCHEDULE DATE & TIMINGS MODAL */}
      {isEditingScheduleMeta && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-sand animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-charcoal">Schedule Date & Midnight Timings</h3>
              <button onClick={() => setIsEditingScheduleMeta(false)} className="text-muted-text hover:text-charcoal">
                <i className="ti ti-x"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-text block mb-1">Date</label>
                <input
                  type="date"
                  value={scheduleMetaDate}
                  onChange={(e) => setScheduleMetaDate(e.target.value)}
                  className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-bold text-charcoal outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-text block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={scheduleMetaStart}
                    onChange={(e) => setScheduleMetaStart(e.target.value)}
                    placeholder="10:00 PM"
                    className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-bold text-charcoal outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-text block mb-1">End Time</label>
                  <input
                    type="text"
                    value={scheduleMetaEnd}
                    onChange={(e) => setScheduleMetaEnd(e.target.value)}
                    placeholder="12:30 AM"
                    className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-bold text-charcoal outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="bg-cream p-3.5 rounded-2xl border border-sand text-[11px] text-charcoal space-y-1">
                <span className="font-bold text-gold-dark block">Midnight Transition Note:</span>
                <p className="text-muted-text">
                  Schedules starting at {scheduleMetaStart} and finishing at {scheduleMetaEnd} automatically calculate date progression past midnight in Asia/Kolkata timezone.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingScheduleMeta(false)}
                  className="px-3.5 py-2 rounded-xl border border-sand text-muted-text hover:bg-cream text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveScheduleMeta}
                  className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal text-xs font-bold shadow-xs"
                >
                  Update Timings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* DECLINE REASON SIMULATOR MODAL */}
      {declineModalSlotId && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-sand animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-charcoal">Record Cannot Serve Reason</h3>
              <button onClick={() => setDeclineModalSlotId(null)} className="text-muted-text hover:text-charcoal">
                <i className="ti ti-x"></i>
              </button>
            </div>

            <form onSubmit={handleSimulateDecline} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-text block mb-1.5">Reason for Declining</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-gold text-charcoal"
                >
                  {DECLINE_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {declineReason === 'Other' && (
                <div>
                  <label className="text-[10px] font-bold text-muted-text block mb-1">Specify Details</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reason details..."
                    value={declineOtherText}
                    onChange={(e) => setDeclineOtherText(e.target.value)}
                    className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs outline-none focus:border-gold text-charcoal"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeclineModalSlotId(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-sand text-muted-text hover:bg-cream text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  Save Decline Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAR SINGLE ASSIGNMENT MODAL */}
      {clearSingleModal.isOpen && clearSingleModal.member && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-sand animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                <i className="ti ti-user-minus text-xl"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-charcoal">Remove {clearSingleModal.member.fullName} from this assignment?</h3>
                <p className="text-xs text-muted-text mt-0.5 leading-relaxed">
                  This will remove the assigned member from this time slot. The time slot, topic, Bible reading, and schedule details will remain unchanged for new assignment.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-sand/60">
              <button
                type="button"
                onClick={() => setClearSingleModal({ isOpen: false, slot: null, member: null })}
                className="px-4 py-2 rounded-xl border border-sand text-charcoal hover:bg-cream text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearSingle}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Clear Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL ASSIGNMENTS MODAL */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-sand animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                <i className="ti ti-user-x text-xl"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-charcoal">Clear All Assignments?</h3>
                <p className="text-xs text-muted-text mt-0.5 leading-relaxed">
                  This will remove all currently assigned members from this Half Night Prayer schedule. Your time slots, topics and schedule information will remain.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-sand/60">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-sand text-charcoal hover:bg-cream text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Clear All Assignments
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
