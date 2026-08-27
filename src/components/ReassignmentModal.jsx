import React, { useState, useMemo } from 'react';
import { getRecommendedMembers, detectAssignmentConflict } from '../services/schedulerEngine';

export default function ReassignmentModal({
  isOpen,
  schedule,
  slot,
  originalMember,
  members,
  onConfirmReassignment,
  onClose
}) {
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [overrideConflict, setOverrideConflict] = useState(false);

  const recommendations = useMemo(() => {
    if (!isOpen || !schedule || !slot) return [];
    return getRecommendedMembers({
      members,
      currentSchedule: schedule,
      currentSlotId: slot.id,
      searchQuery
    }).filter(m => m.id !== originalMember?.id);
  }, [isOpen, schedule, slot, members, searchQuery, originalMember]);

  const selectedNewMember = useMemo(() => {
    return members.find(m => m.id === selectedReplacementId) || null;
  }, [members, selectedReplacementId]);

  const conflict = useMemo(() => {
    if (!selectedNewMember) return null;
    return detectAssignmentConflict(selectedNewMember, schedule, slot?.id);
  }, [selectedNewMember, schedule, slot]);

  if (!isOpen || !schedule || !slot) return null;

  const handleConfirm = () => {
    if (!selectedNewMember) return;
    if (conflict?.hasConflict && !overrideConflict) return;

    onConfirmReassignment({
      scheduleId: schedule.id,
      slotId: slot.id,
      originalMember,
      newMember: selectedNewMember
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-charcoal/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-sand overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand/60 flex items-center justify-between bg-cream/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <i className="ti ti-user-x text-lg"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-charcoal">Reassign Half Night Prayer Assignment</h3>
              <p className="text-[11px] text-muted-text">Select an available replacement and automatically trigger WhatsApp updates.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-muted-text hover:text-charcoal hover:bg-sand/40 flex items-center justify-center transition-all"
          >
            <i className="ti ti-x"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
          
          {/* Section 21: Decline Alert Detail */}
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                Original Assignment Declined
              </span>
              <span className="text-[10px] font-semibold text-rose-600">
                {schedule.formattedDate || schedule.date}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-muted-text block">Declined Member</span>
                <span className="font-bold text-charcoal">{originalMember?.fullName || 'Not Assigned'}</span>
              </div>

              <div>
                <span className="text-[10px] text-muted-text block">Time Slot</span>
                <span className="font-bold text-charcoal">{slot.startTime} – {slot.endTime}</span>
              </div>

              <div>
                <span className="text-[10px] text-muted-text block">Reason Provided</span>
                <span className="font-bold text-rose-700">{slot.declineReason || 'Unavailable / Personal Commitment'}</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-muted-text block">Prayer Topic</span>
              <span className="font-semibold text-charcoal">{slot.topic}</span>
            </div>
          </div>

          {/* Section 24: Side-by-Side Comparison Preview */}
          <div className="bg-cream p-4 rounded-xl border border-sand">
            <h4 className="text-[10px] font-bold text-gold-dark uppercase tracking-wider mb-3">
              Reassignment Summary Preview
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3.5 rounded-lg border border-sand space-y-1">
                <span className="text-[10px] font-bold text-rose-600 block">Original Member</span>
                <p className="font-bold text-charcoal text-sm">{originalMember?.fullName || 'None'}</p>
                <p className="text-muted-text text-[11px]">{slot.startTime} – {slot.endTime}</p>
                <p className="text-[10px] text-muted-text">Will receive reassignment cancellation notice</p>
              </div>

              <div className={`p-3.5 rounded-lg border space-y-1 ${
                selectedNewMember
                  ? 'bg-gold/10 border-gold/40'
                  : 'bg-white border-dashed border-sand'
              }`}>
                <span className="text-[10px] font-bold text-gold-dark block">New Replacement Member</span>
                <p className="font-bold text-charcoal text-sm">
                  {selectedNewMember?.fullName || 'Select from list below...'}
                </p>
                <p className="text-muted-text text-[11px]">{slot.startTime} – {slot.endTime}</p>
                <p className="text-[10px] text-gold-dark font-medium">
                  {selectedNewMember ? 'Will receive new WhatsApp assignment notification' : 'No replacement selected'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 23: Fair Recommendations List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-charcoal">Recommended Available Members</h4>
                <p className="text-[10px] text-muted-text">
                  Ranked by fairness algorithm • Showing all {recommendations.length} eligible members
                </p>
              </div>

              <div className="w-52">
                <input
                  type="text"
                  placeholder="Search replacement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-cream border border-sand rounded-lg px-3 py-1 text-xs focus:bg-white focus:border-gold outline-none transition-colors"
                />
              </div>
            </div>

            <div className="border border-sand rounded-xl max-h-80 overflow-y-auto divide-y divide-sand/40">
              {recommendations.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-text">
                  No eligible members found matching your search.
                </div>
              ) : (
                recommendations.map(member => {
                  const isSelected = selectedReplacementId === member.id;
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedReplacementId(member.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gold/10 border-l-4 border-gold'
                          : 'hover:bg-cream bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-charcoal text-xs">{member.fullName}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-[10px] text-muted-text">
                          <span>Last assigned: <strong className="text-charcoal">{member.daysSinceLast} days ago</strong></span>
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

                        <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected ? 'bg-gold border-gold text-charcoal' : 'border-sand'
                        }`}>
                          {isSelected && <i className="ti ti-check text-xs"></i>}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Conflict Alert Warning if present */}
          {conflict?.hasConflict && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <i className="ti ti-alert-circle text-amber-600 text-base"></i>
                <span>Scheduling Warning / Conflict Detected</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-1">
                {conflict.messages.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={overrideConflict}
                  onChange={(e) => setOverrideConflict(e.target.checked)}
                  className="rounded accent-amber-600"
                />
                <span className="text-xs font-semibold text-amber-900">Administrator Override Confirmed</span>
              </label>
            </div>
          )}

          {/* Section 25 Automation Notice */}
          <div className="bg-cream border border-sand rounded-xl p-3 text-[11px] text-muted-text space-y-1">
            <span className="font-bold text-charcoal block">Automatic Reassignment Actions:</span>
            <p>1. Cancel original member's reminders & send courtesy cancellation notice.</p>
            <p>2. Allocate new member & dispatch official WhatsApp assignment message.</p>
            <p>3. Schedule 24-hr and 10-min automatic reminders for new assignee.</p>
            <p>4. Append complete audit timeline to the assignment history.</p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-cream/50 border-t border-sand/60 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-sand text-charcoal hover:bg-cream text-xs font-semibold transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedNewMember || (conflict?.hasConflict && !overrideConflict)}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal text-xs font-bold shadow-sm transition-all disabled:opacity-40 flex items-center gap-2"
          >
            <i className="ti ti-check"></i>
            <span>Confirm Reassignment</span>
          </button>
        </div>

      </div>
    </div>
  );
}
