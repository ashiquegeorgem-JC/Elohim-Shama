import { generateSeedMembers, syncVerifiedMembers, VERIFIED_MEMBER_CONTACTS, INITIAL_SCHEDULES, CHURCH_NAME } from '../types/constants';

const STORAGE_KEYS = {
  MEMBERS: 'bethesda_hnp_members',
  SCHEDULES: 'bethesda_hnp_schedules',
  NOTIFICATIONS: 'bethesda_hnp_notifications',
  ASSIGNMENT_HISTORY: 'bethesda_hnp_assignment_history',
  SETTINGS: 'bethesda_hnp_settings',
  AUTH_ADMIN: 'bethesda_hnp_admin_session'
};

// Initial notifications seed for demonstration
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    memberId: 'mem-10', // Bro. Aaron
    memberName: 'Bro. Aaron',
    phone: '',
    type: 'Assignment', // Assignment | 24-Hour Reminder | 10-Minute Reminder | 5-Minute Reminder | Reassignment
    scheduleDate: '2026-08-29',
    slotTime: '10:40 PM – 11:00 PM',
    topic: 'Praise and Worship',
    status: 'Sent', // Scheduled | Sent | Delivered | Failed | Cancelled
    timestamp: '2026-08-24 10:30 AM',
    channel: 'WhatsApp'
  }
];

// Initial assignment timeline history seed
const INITIAL_HISTORY = [
  {
    id: 'hist-1',
    scheduleId: 'hnp-2026-08-29',
    slotId: 'slot-20260829-1',
    scheduleDate: '2026-08-29',
    slotTime: '10:00 PM – 10:20 PM',
    topic: 'Prayer points in Intercession WhatsApp group and prayer for sick people',
    events: [
      {
        type: 'Assigned',
        memberId: 'mem-80',
        memberName: 'Sis. Rani',
        timestamp: '2026-08-20 09:00 AM',
        actor: 'Admin'
      },
      {
        type: 'Declined',
        memberId: 'mem-80',
        memberName: 'Sis. Rani',
        timestamp: '2026-08-21 02:15 PM',
        reason: 'Work / College',
        notes: 'Has an evening college examination prep schedule'
      },
      {
        type: 'Reassigned',
        originalMemberName: 'Sis. Rani',
        newMemberId: 'mem-50',
        newMemberName: 'Sis. Airina',
        timestamp: '2026-08-21 03:00 PM',
        actor: 'Admin'
      },
      {
        type: 'Confirmed',
        memberId: 'mem-50',
        memberName: 'Sis. Airina',
        timestamp: '2026-08-21 03:15 PM'
      }
    ]
  }
];

const DEFAULT_SETTINGS = {
  churchName: CHURCH_NAME,
  timezone: 'Asia/Kolkata',
  reminders: {
    reminder24h: true,
    reminder10m: true,
    reminder5m: false
  },
  whatsappConfig: {
    provider: 'WhatsApp Business Cloud API',
    phoneNumberId: '109283749283741',
    businessAccountId: 'WABA_BETHESDA_01',
    autoSendOnAssign: true
  }
};

// ──────────────────────────────────────────────────────────────────
// MIGRATION: Purge old synthetic seed phones ONLY.
//
// The old seed generated phone numbers with:
//   let phoneBase = 9845010000;
//   phone = `+91 ${phoneBase++}`
// producing: +91 9845010000, +91 9845010001, ... +91 9845010300 etc.
//
// Digit string for these is exactly 10 digits starting with "9845010"
// (or 12 digits starting with "919845010" with country code).
//
// SAFETY RULES — a member's phone is ONLY cleared if ALL THREE are true:
//   1. The digits exactly match the seed pattern (^9845010\d{3}$ or ^919845010\d{3}$)
//   2. The member does NOT have userCustomized === true
//   3. The phone is NOT in the VERIFIED_MEMBER_CONTACTS list (real verified number)
// ──────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────
// WHITELIST ENFORCEMENT: Only approved phone numbers are allowed to remain.
// If a member's phone number is not in VERIFIED_MEMBER_CONTACTS
// and has not been customized by the user, set phone & whatsappNumber to "".
// Member name, ID, availability, history, and assignments remain intact.
// ──────────────────────────────────────────────────────────────────
const _approvedDigitsSet = new Set();
(VERIFIED_MEMBER_CONTACTS || []).forEach(v => {
  const digits = (v.phone || '').replace(/\D/g, '');
  if (digits) {
    _approvedDigitsSet.add(digits);
    if (digits.length === 10) _approvedDigitsSet.add(`91${digits}`);
    if (digits.length === 12 && digits.startsWith('91')) _approvedDigitsSet.add(digits.slice(2));
  }
});

const enforceApprovedPhoneNumbers = (membersList) => {
  let clearedCount = 0;
  const cleaned = membersList.map(m => {
    // Keep user-customized edits
    if (m.userCustomized) return m;

    const digits = (m.phone || '').replace(/\D/g, '');
    if (!digits) return { ...m, phone: '', whatsappNumber: '' };

    // Check if phone matches the approved whitelist
    if (_approvedDigitsSet.has(digits)) {
      return m;
    }

    // Phone is not in approved list — clear it
    clearedCount++;
    return { ...m, phone: '', whatsappNumber: '' };
  });

  if (clearedCount > 0) {
    console.log(`[Database Cleanup] Cleared ${clearedCount} unapproved/dummy phone numbers. Member records preserved.`);
  }
  return cleaned;
};

export const storageService = {
  // Members
  getMembers: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      let membersList;
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 50) membersList = parsed;
      }
      if (!membersList) {
        // Fresh seed: generate, sync verified contacts, then strip any non-whitelisted numbers
        membersList = enforceApprovedPhoneNumbers(syncVerifiedMembers(generateSeedMembers()));
      } else {
        // Existing: first sync verified contacts (sets real numbers),
        // then strip any unapproved phone numbers while preserving members
        membersList = enforceApprovedPhoneNumbers(syncVerifiedMembers(membersList));
      }
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(membersList));
      return membersList;
    } catch {
      const fallback = enforceApprovedPhoneNumbers(syncVerifiedMembers(generateSeedMembers()));
      return fallback;
    }
  },

  saveMembers: (members) => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  },

  // Schedules (Half Night Prayers)
  getSchedules: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
      return INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  },

  saveSchedules: (schedules) => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  },

  // Notifications
  getNotifications: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications: (notifs) => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  addNotification: (notification) => {
    const list = storageService.getNotifications();
    const newEntry = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      status: 'Sent',
      channel: 'WhatsApp',
      ...notification
    };
    const updated = [newEntry, ...list];
    storageService.saveNotifications(updated);
    return newEntry;
  },

  // Assignment Timeline History
  getAssignmentHistory: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSIGNMENT_HISTORY);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENT_HISTORY, JSON.stringify(INITIAL_HISTORY));
      return INITIAL_HISTORY;
    } catch {
      return INITIAL_HISTORY;
    }
  },

  saveAssignmentHistory: (history) => {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENT_HISTORY, JSON.stringify(history));
  },

  recordHistoryEvent: (scheduleId, slotId, scheduleDate, slotTime, topic, eventData) => {
    const historyList = storageService.getAssignmentHistory();
    let slotHistory = historyList.find(h => h.scheduleId === scheduleId && h.slotId === slotId);

    const newEvent = {
      ...eventData,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    if (slotHistory) {
      slotHistory.events.push(newEvent);
    } else {
      slotHistory = {
        id: `hist-${Date.now()}`,
        scheduleId,
        slotId,
        scheduleDate,
        slotTime,
        topic,
        events: [newEvent]
      };
      historyList.unshift(slotHistory);
    }

    storageService.saveAssignmentHistory(historyList);
  },

  // Settings
  getSettings: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Admin Auth Session
  getAdminSession: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_ADMIN);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setAdminSession: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_ADMIN, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_ADMIN);
    }
  },

  // Reset entire database to default Bethesda AG Church seed data
  resetAll: () => {
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENT_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    
    // Repopulate
    const members = generateSeedMembers();
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENT_HISTORY, JSON.stringify(INITIAL_HISTORY));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return { members, schedules: INITIAL_SCHEDULES, notifications: INITIAL_NOTIFICATIONS };
  }
};
