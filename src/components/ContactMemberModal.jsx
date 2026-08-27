import React, { useState, useEffect } from 'react';
import { whatsappService } from '../services/whatsappService';

export default function ContactMemberModal({ isOpen, member, schedule, slot, schedules, onClose, onShowToast }) {
  const [customMsg, setCustomMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !member) return;

    // Resolve schedule & slot dynamically if not passed directly
    const targetSchedule = schedule || (schedules && schedules.find(s => s.timeSlots && s.timeSlots.some(sl => sl.assignedMemberId === member.id))) || (schedules && schedules[0]) || null;
    const targetSlot = slot || (targetSchedule && targetSchedule.timeSlots && targetSchedule.timeSlots.find(sl => sl.assignedMemberId === member.id)) || null;

    const generated = whatsappService.generateAssignmentWhatsAppMessage({
      date: targetSchedule ? (targetSchedule.formattedDate || targetSchedule.date) : null,
      memberName: member.fullName,
      topic: targetSlot ? (targetSlot.topic + (targetSlot.subTopic ? ` (${targetSlot.subTopic})` : '')) : null,
      startTime: targetSlot?.startTime,
      endTime: targetSlot?.endTime,
      bibleReading: targetSlot?.bibleReading
    });

    setCustomMsg(generated);
  }, [isOpen, member, schedule, slot, schedules]);

  if (!isOpen || !member) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(member.phone || member.whatsappNumber);
    setCopied(true);
    if (onShowToast) onShowToast(`Copied ${member.fullName}'s number to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const rawPhone = member.whatsappNumber || member.phone;

    // ── MEMBER WHATSAPP DEBUG ──────────────────────────────────────────────
    console.group('[MEMBER WHATSAPP DEBUG]');
    console.log('Member ID:           ', member.id);
    console.log('Member Name:         ', member.fullName);
    console.log('Stored phone:        ', member.phone);
    console.log('Stored whatsappNumber:', member.whatsappNumber);
    console.log('Number Used:         ', rawPhone);
    // ──────────────────────────────────────────────────────────────────────

    if (!rawPhone || !whatsappService.normalizePhoneNumber(rawPhone)) {
      console.log('Generated URL:        [NONE — number missing or invalid]');
      console.groupEnd();
      if (onShowToast) onShowToast("WhatsApp number not available. Please add the member's phone number first.", 'error');
      return;
    }
    const link = whatsappService.createWhatsAppLink(rawPhone, customMsg, member);
    console.log('Generated URL:       ', link);
    console.groupEnd();
    if (!link) {
      if (onShowToast) onShowToast("WhatsApp number not available. Please add the member's phone number first.", 'error');
      return;
    }
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-charcoal/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-sand overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand/60 flex items-center justify-between bg-cream/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <i className="ti ti-phone-call text-lg"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-charcoal">Contact Member</h3>
              <p className="text-[11px] text-muted-text">Live WhatsApp message preview, voice call, or copy contact info.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-muted-text hover:text-charcoal hover:bg-sand/40 flex items-center justify-center transition-all"
          >
            <i className="ti ti-x"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          
          {/* Member Card Summary */}
          <div className="bg-cream p-4 rounded-xl border border-sand flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-charcoal text-sm block">{member.fullName}</span>
              <span className="text-muted-text font-mono text-[11px] block">{member.phone || 'Phone Not Added'}</span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
              member.availability === 'Available'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {member.availability}
            </span>
          </div>

          {/* WhatsApp Custom Text / Live Dynamic Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-gold-dark uppercase tracking-wider block">
                Live WhatsApp Message Preview
              </label>
              <span className="text-[10px] text-muted-text font-medium">Editable before sending</span>
            </div>
            <textarea
              rows="9"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full bg-cream border border-sand rounded-xl p-3 text-xs text-charcoal outline-none focus:bg-white focus:border-gold font-sans leading-relaxed transition-colors whitespace-pre-wrap"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* 1. WhatsApp Button */}
            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <i className="ti ti-brand-whatsapp text-lg"></i>
              <span>Send WhatsApp Message</span>
            </button>

            {/* 2. Direct Voice Call */}
            <a
              href={`tel:${member.phone}`}
              className="w-full bg-charcoal hover:bg-charcoal/80 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all block text-center"
            >
              <i className="ti ti-phone text-base"></i>
              <span>Call via Phone ({member.phone})</span>
            </a>

            {/* 3. Copy Phone Number */}
            <button
              onClick={handleCopyPhone}
              className="w-full border border-sand hover:bg-cream hover:border-gold text-charcoal font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <i className={copied ? "ti ti-check text-emerald-600" : "ti ti-copy"}></i>
              <span>{copied ? "Number Copied!" : "Copy Phone Number"}</span>
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-cream/50 border-t border-sand/60 text-center">
          <p className="text-[10px] text-muted-text">
            Confidential: Member contact details are restricted to authenticated church administration.
          </p>
        </div>

      </div>
    </div>
  );
}
