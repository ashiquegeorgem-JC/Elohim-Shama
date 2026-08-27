import React, { forwardRef } from 'react';
import { CHURCH_NAME } from '../types/constants';

const ScheduleExportCard = forwardRef(({ schedule, members }, ref) => {
  if (!schedule) return null;

  const slots = schedule.timeSlots || [];

  return (
    <div
      ref={ref}
      style={{ width: '1080px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="bg-white text-charcoal font-sans p-12 relative overflow-hidden box-border shadow-2xl border border-sand"
    >
      {/* Decorative Gold Top & Bottom Bars */}
      <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-gold-dark via-gold to-gold-dark"></div>
      <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-r from-gold-dark via-gold to-gold-dark"></div>

      {/* Background Watermark */}
      <div style={{ color: '#C5A05910' }} className="absolute top-8 right-8 pointer-events-none">
        <svg width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75">
          <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h1M9 13h1M9 17h1" />
        </svg>
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 pb-6" style={{ borderBottom: '2px solid #EAE4D9' }}>
          <img
            src="/church-logo.jpg"
            alt="Bethesda AG Church Logo"
            className="w-24 h-24 rounded-2xl object-contain mx-auto mb-2 p-1 bg-white border border-sand shadow-sm"
          />

          <h2
            style={{ fontFamily: "'Times New Roman MT', 'Times New Roman', serif", letterSpacing: '0.15em', color: '#1C252B' }}
            className="text-2xl font-bold uppercase"
          >
            {CHURCH_NAME}
          </h2>

          <div
            className="inline-block text-sm font-black uppercase tracking-widest px-6 py-1.5 rounded-full shadow-sm"
            style={{ backgroundColor: '#1C252B', color: '#F7F4EC' }}
          >
            Half Night Prayer Schedule
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 font-semibold text-base" style={{ color: '#1C252B' }}>
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{schedule.formattedDate || schedule.date}</span>
            </div>

            <span style={{ color: '#EAE4D9' }}>|</span>

            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{schedule.startTime} – {schedule.endTime}</span>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #EAE4D9' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#1C252B', color: '#F7F4EC' }} className="text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6 w-36 text-center">Time</th>
                <th className="py-4 px-6 w-56">Assigned Servant</th>
                <th className="py-4 px-6">Prayer Topic & Focus</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: '#EAE4D9' }}>
              {slots.map((slot, index) => {
                const assignedMember = members?.find(m => m.id === slot.assignedMemberId);
                const isEven = index % 2 === 0;

                return (
                  <tr key={slot.id} style={{ backgroundColor: isEven ? '#FFFFFF' : '#FCFAF5' }}>
                    {/* Time Slot */}
                    <td className="py-4 px-6 text-center font-bold whitespace-nowrap align-top">
                      <span
                        className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: '#FDF8EE', color: '#9E7B35', border: '1px solid #C5A05940' }}
                      >
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </td>

                    {/* Assigned Member */}
                    <td className="py-4 px-6 align-top">
                      <span className={`font-bold block text-sm ${assignedMember ? '' : 'italic'}`} style={{ color: assignedMember ? '#1C252B' : '#8B7D6B' }}>
                        {assignedMember ? assignedMember.fullName : 'Not Assigned'}
                      </span>
                    </td>

                    {/* Topic */}
                    <td className="py-4 px-6 align-top">
                      <div className="space-y-1">
                        <span className="font-bold block leading-snug" style={{ color: '#1C252B' }}>
                          {slot.topic}
                        </span>
                        {slot.subTopic && (
                          <span className="text-xs font-semibold block" style={{ color: '#9E7B35' }}>
                            {slot.subTopic}
                          </span>
                        )}
                        {slot.notes && (
                          <span className="text-[11px] block" style={{ color: '#8B7D6B' }}>
                            {slot.notes}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="text-lg italic font-bold tracking-wide" style={{ fontFamily: "'Times New Roman MT', 'Times New Roman', serif", color: '#9E7B35' }}>
            God Bless You
          </p>
          <p className="text-xs font-medium mt-1 uppercase tracking-widest" style={{ color: '#8B7D6B' }}>
            {CHURCH_NAME} Half Night Prayer Fellowship
          </p>
        </div>

      </div>
    </div>
  );
});

export default ScheduleExportCard;
