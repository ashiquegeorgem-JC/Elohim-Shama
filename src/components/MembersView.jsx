import React, { useState, useMemo } from 'react';
import { getDaysSinceDate } from '../services/schedulerEngine';

export default function MembersView({
  members,
  setMembers,
  onContactMember,
  onShowToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [ministryFilter, setMinistryFilter] = useState('all');
  const [editingMember, setEditingMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    whatsappNumber: '',
    availability: 'Available',
    ministry: 'Intercession & Prayer',
    notes: '',
    active: true
  });

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (availabilityFilter !== 'all' && m.availability !== availabilityFilter) {
        return false;
      }
      if (ministryFilter !== 'all' && m.ministry !== ministryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.fullName.toLowerCase().includes(q);
        const matchMinistry = (m.ministry || '').toLowerCase().includes(q);
        const matchPhone = (m.phone || '').includes(q);
        if (!matchName && !matchMinistry && !matchPhone) return false;
      }
      return true;
    });
  }, [members, searchQuery, availabilityFilter, ministryFilter]);

  const uniqueMinistries = useMemo(() => {
    const set = new Set();
    members.forEach(m => { if (m.ministry) set.add(m.ministry); });
    return Array.from(set);
  }, [members]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      fullName: '',
      phone: '+91 ',
      whatsappNumber: '+91 ',
      availability: 'Available',
      ministry: 'Intercession & Prayer',
      notes: '',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mem) => {
    setEditingMember(mem);
    setFormData({
      fullName: mem.fullName,
      phone: mem.phone,
      whatsappNumber: mem.whatsappNumber || mem.phone,
      availability: mem.availability || 'Available',
      ministry: mem.ministry || '',
      notes: mem.notes || '',
      active: mem.active !== false
    });
    setIsModalOpen(true);
  };

  const handleSaveMember = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    const payload = {
      ...formData,
      whatsappNumber: formData.whatsappNumber || formData.phone,
      userCustomized: true
    };

    if (editingMember) {
      setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, ...payload } : m));
      onShowToast(`Updated details for ${formData.fullName}`);
    } else {
      const newMember = {
        id: `mem-${Date.now()}`,
        ...payload,
        whatsappEnabled: true,
        whatsappOptIn: true,
        lastAssignedDate: new Date().toISOString().split('T')[0],
        totalAssignments: 0,
        confirmedAssignments: 0,
        declinedAssignments: 0,
        completedAssignments: 0,
        missedAssignments: 0,
        participationHistory: []
      };
      setMembers(prev => [newMember, ...prev]);
      onShowToast(`Registered ${newMember.fullName} to church roster`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteMember = (memberId) => {
    if (!confirm('Are you sure you want to remove this member from the roster?')) return;
    setMembers(prev => prev.filter(m => m.id !== memberId));
    onShowToast('Member record removed');
  };

  const handleToggleAvailability = (memberId, nextStatus) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, availability: nextStatus } : m));
    onShowToast(`Updated status to ${nextStatus}`);
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      
      {/* Control Bar: Search & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-sand shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-72">
            <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text text-xs"></i>
            <input
              type="text"
              placeholder="Search member name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cream border border-sand rounded-xl pl-9 pr-4 py-2 text-xs text-charcoal outline-none focus:bg-white focus:border-gold transition-all"
            />
          </div>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-semibold text-charcoal outline-none focus:border-gold"
          >
            <option value="all">All Availability Statuses</option>
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="Out of Station">Out of Station</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-gold hover:bg-gold-dark text-charcoal px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all shrink-0"
        >
          <i className="ti ti-user-plus text-sm"></i>
          <span>Add New Member</span>
        </button>

      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-sand shadow-card overflow-hidden">
        
        <div className="p-6 border-b border-sand/60 flex items-center justify-between bg-cream/50">
          <div>
            <h3 className="text-sm font-bold font-display text-charcoal">Bethesda AG Church Member Roster</h3>
            <p className="text-xs text-muted-text">Total {filteredMembers.length} members matching current filter</p>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-muted-text text-xs">
            No members found matching your search. Click "Add New Member" to register.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cream/40 border-b border-sand text-gold-dark font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-3.5">Member Name</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Availability</th>
                  <th className="px-5 py-3.5">Last Assigned</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {filteredMembers.map(member => {
                  const daysAgo = getDaysSinceDate(member.lastAssignedDate);
                  const isLongAgo = daysAgo >= 30;

                  return (
                    <tr key={member.id} className="hover:bg-cream/30 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gold/15 text-charcoal flex items-center justify-center font-bold text-xs border border-gold/30 shrink-0">
                            {member.fullName.replace(/(Bro\.|Sis\.|Pas\.)/g, '').trim().charAt(0)}
                          </div>
                          <span className="font-bold text-charcoal text-xs whitespace-nowrap">
                            {member.fullName}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3 text-charcoal font-mono text-[11px] whitespace-nowrap">
                        {member.phone ? (
                          member.phone
                        ) : (
                          <span className="text-muted-text/70 italic font-sans">Not Added</span>
                        )}
                      </td>

                      {/* Availability Switch */}
                      <td className="px-5 py-3">
                        <select
                          value={member.availability}
                          onChange={(e) => handleToggleAvailability(member.id, e.target.value)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer whitespace-nowrap ${
                            member.availability === 'Available'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : member.availability === 'Busy'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : member.availability === 'Out of Station'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <option value="Available">Available</option>
                          <option value="Busy">Busy</option>
                          <option value="Out of Station">Out of Station</option>
                          <option value="Unavailable">Unavailable</option>
                        </select>
                      </td>

                      {/* Last Assigned */}
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold whitespace-nowrap ${isLongAgo ? 'text-gold-dark font-bold' : 'text-charcoal'}`}>
                          {daysAgo}d ago · {member.lastAssignedDate || 'None'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onContactMember(member)}
                            title="Contact via WhatsApp"
                            className="w-7 h-7 rounded-lg text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition-all"
                          >
                            <i className="ti ti-brand-whatsapp text-base"></i>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(member)}
                            title="Edit Member"
                            className="w-7 h-7 rounded-lg text-muted-text hover:text-gold-dark hover:bg-cream flex items-center justify-center transition-all"
                          >
                            <i className="ti ti-edit text-base"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            title="Remove Member"
                            className="w-7 h-7 rounded-lg text-muted-text hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all"
                          >
                            <i className="ti ti-trash text-base"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ADD / EDIT MEMBER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-sand animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-charcoal">
                {editingMember ? 'Edit Member Profile' : 'Register Church Member'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-text hover:text-charcoal">
                <i className="ti ti-x"></i>
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-text block mb-1">Full Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sis. Airina or Bro. Aaron"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-bold text-charcoal outline-none focus:bg-white focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-text block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-mono outline-none focus:bg-white focus:border-gold text-charcoal"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-text block mb-1">Availability Status</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-gold text-charcoal"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Out of Station">Out of Station</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-text block mb-1">Administrative Notes</label>
                <textarea
                  rows="2"
                  placeholder="Additional pastoral or scheduling notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-cream border border-sand rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-gold resize-none text-charcoal"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-sand/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-sand text-muted-text hover:bg-cream text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal text-xs font-bold shadow-xs"
                >
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
