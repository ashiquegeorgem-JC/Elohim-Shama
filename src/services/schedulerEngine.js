// ==========================================
// SCHEDULER ENGINE & FAIR ASSIGNMENT LOGIC
// ==========================================

/**
 * Calculates start and end ISO strings handling midnight transitions in Asia/Kolkata.
 * E.g., Date: 2026-08-29, Start: 10:00 PM, End: 12:30 AM (crosses midnight into 2026-08-30).
 */
export const calculateDateTimes = (dateStr, startTimeStr, endTimeStr) => {
  if (!dateStr) return { startDateTime: null, endDateTime: null };

  const parseTimeTo24h = (time12h) => {
    if (!time12h) return { hours: 22, minutes: 0 };
    const parts = time12h.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!parts) return { hours: 22, minutes: 0 };
    let hours = parseInt(parts[1], 10);
    const minutes = parseInt(parts[2], 10);
    const period = parts[3].toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  };

  const start = parseTimeTo24h(startTimeStr);
  const end = parseTimeTo24h(endTimeStr);

  const startDate = new Date(`${dateStr}T00:00:00+05:30`);
  startDate.setHours(start.hours, start.minutes, 0, 0);

  const endDate = new Date(`${dateStr}T00:00:00+05:30`);
  endDate.setHours(end.hours, end.minutes, 0, 0);

  // If end time is earlier or equal to start time (e.g. 12:30 AM is hours=0 vs 10:00 PM hours=22), add 1 day
  if (endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }

  return {
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    timezone: 'Asia/Kolkata'
  };
};

/**
 * Calculate days between a past date and a reference date (default: today or 2026-08-24)
 */
export const getDaysSinceDate = (dateStr, referenceDate = '2026-08-24') => {
  if (!dateStr) return 999;
  const ref = new Date(referenceDate);
  const past = new Date(dateStr);
  const diffTime = Math.abs(ref - past);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Fair Assignment Recommendation Algorithm.
 * Returns members ranked by priority for a given time slot / schedule.
 */
export const getRecommendedMembers = ({
  members,
  currentSchedule,
  currentSlotId,
  searchQuery = '',
  ministryFilter = 'all'
}) => {
  if (!Array.isArray(members)) return [];

  const assignedMemberIdsInSameSchedule = (currentSchedule?.timeSlots || [])
    .filter(slot => slot.id !== currentSlotId && slot.assignedMemberId)
    .map(slot => slot.assignedMemberId);

  const filtered = members.filter(m => {
    if (!m.active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.fullName.toLowerCase().includes(q);
      const matchMin = (m.ministry || '').toLowerCase().includes(q);
      const matchPhone = (m.phone || '').includes(q);
      if (!matchName && !matchMin && !matchPhone) return false;
    }
    if (ministryFilter !== 'all' && m.ministry !== ministryFilter) {
      return false;
    }
    return true;
  });

  return filtered.map(member => {
    const daysSinceLast = getDaysSinceDate(member.lastAssignedDate);
    const isAlreadyAssignedInSession = assignedMemberIdsInSameSchedule.includes(member.id);
    const assignmentsThisMonth = member.totalAssignments % 3; // normalized metric

    let recommendationScore = 100;
    const reasons = [];
    const flags = [];

    // 1. Availability check
    if (member.availability === 'Unavailable') {
      recommendationScore -= 80;
      flags.push('Unavailable');
    } else if (member.availability === 'Out of Station') {
      recommendationScore -= 70;
      flags.push('Out of Station');
    } else if (member.availability === 'Busy') {
      recommendationScore -= 40;
      flags.push('Busy');
    } else {
      reasons.push('Available for service');
    }

    // 2. Same session duplicate assignment check
    if (isAlreadyAssignedInSession) {
      recommendationScore -= 50;
      flags.push('Already assigned to another slot in tonight’s schedule');
    }

    // 3. Fairness: Prioritize members who haven't served recently
    if (daysSinceLast >= 30) {
      recommendationScore += 30;
      reasons.push(`Last assigned ${daysSinceLast} days ago`);
    } else if (daysSinceLast >= 20) {
      recommendationScore += 15;
      reasons.push(`Last assigned ${daysSinceLast} days ago`);
    } else if (daysSinceLast < 7) {
      recommendationScore -= 15;
      flags.push(`Recently assigned (${daysSinceLast} days ago)`);
    }

    // 4. Low monthly workload bonus
    if (assignmentsThisMonth <= 1) {
      recommendationScore += 10;
      reasons.push(`${assignmentsThisMonth} assignment this month`);
    }

    return {
      ...member,
      daysSinceLast,
      assignmentsThisMonth,
      recommendationScore,
      isAlreadyAssignedInSession,
      reasons,
      flags
    };
  }).sort((a, b) => b.recommendationScore - a.recommendationScore);
};

/**
 * Checks for assignment conflicts and returns warning message if any exist.
 */
export const detectAssignmentConflict = (member, currentSchedule, currentSlotId) => {
  if (!member) return null;

  const conflicts = [];

  // Check availability
  if (member.availability !== 'Available') {
    conflicts.push(`${member.fullName} is currently marked as "${member.availability}".`);
  }

  // Check active status
  if (!member.active) {
    conflicts.push(`${member.fullName} is marked as Inactive.`);
  }

  // Check for same schedule overlapping assignment
  if (currentSchedule && Array.isArray(currentSchedule.timeSlots)) {
    const existingSlot = currentSchedule.timeSlots.find(
      s => s.id !== currentSlotId && s.assignedMemberId === member.id
    );
    if (existingSlot) {
      conflicts.push(
        `${member.fullName} is already assigned from ${existingSlot.startTime} – ${existingSlot.endTime} (${existingSlot.topic}).`
      );
    }
  }

  if (conflicts.length > 0) {
    return {
      hasConflict: true,
      messages: conflicts
    };
  }

  return { hasConflict: false, messages: [] };
};
