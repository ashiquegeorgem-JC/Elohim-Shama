// ==========================================
// WHATSAPP NOTIFICATION SERVICE
// ==========================================

export const whatsappService = {
  /**
   * Single source of truth generator for Assignment WhatsApp message
   */
  generateAssignmentWhatsAppMessage: ({ date, memberName, name, topic, startTime, endTime, assignedTime, bibleReading }) => {
    const dateVal = date || 'Date not selected';
    const nameVal = memberName || name || 'Not assigned yet';
    const topicVal = topic || 'Not assigned yet';
    const timeVal = assignedTime || ((startTime && endTime) ? `${startTime} - ${endTime}` : (startTime || 'Not assigned yet'));

    let msg = `Praise the Lord!\n\n` +
      `You have been assigned a schedule for the upcoming Mid Night Prayer, which will be held on ${dateVal}.\n\n` +
      `Your schedule is:\n\n` +
      `Name: ${nameVal}\n` +
      `Topic: ${topicVal}\n` +
      `Time: ${timeVal}\n`;

    if (bibleReading && bibleReading.trim()) {
      msg += `Bible Reading: ${bibleReading}\n`;
    }

    msg += `\nPlease be prepared and join 10 minutes prior to your assigned time.\n\n` +
      `Thank you, and God bless you.`;

    return msg;
  },

  generateAssignmentMessage: (params) => {
    return whatsappService.generateAssignmentWhatsAppMessage(params);
  },

  /**
   * Generates 24-Hour Reminder message (Section 31)
   */
  generate24HourReminderMessage: ({ name, topic, assignedTime, date }) => {
    return `Praise the Lord!\n\n` +
      `This is a reminder that you have a Mid Night Prayer schedule tomorrow.\n\n` +
      `Date: ${date}\n` +
      `Time: ${assignedTime}\n\n` +
      `Name: ${name}\n` +
      `Topic: ${topic}\n\n` +
      `Please be prepared.\n\n` +
      `God bless you.`;
  },

  /**
   * Generates 10-Minute Reminder message (Section 32)
   */
  generate10MinuteReminderMessage: ({ name, topic, assignedTime }) => {
    return `Praise the Lord!\n\n` +
      `Your Mid Night Prayer schedule will begin in 10 minutes.\n\n` +
      `Time: ${assignedTime}\n\n` +
      `Name: ${name}\n` +
      `Topic: ${topic}\n\n` +
      `Please be ready.\n\n` +
      `God bless you.`;
  },

  /**
   * Generates 5-Minute Reminder message (Section 33)
   */
  generate5MinuteReminderMessage: ({ name, topic, assignedTime }) => {
    return `Praise the Lord!\n\n` +
      `Your Mid Night Prayer schedule will begin in 5 minutes.\n\n` +
      `Time: ${assignedTime}\n\n` +
      `Name: ${name}\n` +
      `Topic: ${topic}\n\n` +
      `Please be ready.\n\n` +
      `God bless you.`;
  },

  /**
   * Generates Reassignment message to original member (Section 26)
   */
  generateOriginalMemberReassignedMessage: ({ date, time }) => {
    return `Praise the Lord!\n\n` +
      `Your Mid Night Prayer assignment for ${date} at ${time} has been reassigned.\n\n` +
      `Thank you for informing us.\n\n` +
      `God bless you.`;
  },

  /**
   * Normalizes a phone number to standard format (e.g. 919876543210 for India)
   */
  normalizePhoneNumber: (phone) => {
    if (!phone || typeof phone !== 'string') return null;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) return null;

    // Normalization rules for India:
    // 10 digits (e.g. 9876543210) -> prepend 91
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    // 11 digits starting with 0 (e.g. 09876543210) -> strip 0 and prepend 91
    else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = `91${cleanPhone.slice(1)}`;
    }

    if (cleanPhone.length < 10) return null;
    return cleanPhone;
  },

  /**
   * Creates a prefilled WhatsApp link for opening WhatsApp Web or App.
   * Can accept raw phone string or member object as first param.
   */
  createWhatsAppLink: (phoneOrMember, message, memberMeta = null) => {
    let phoneStr = '';
    let member = memberMeta;

    if (typeof phoneOrMember === 'object' && phoneOrMember !== null) {
      member = phoneOrMember;
      phoneStr = member.whatsappNumber || member.phone || '';
    } else if (typeof phoneOrMember === 'string') {
      phoneStr = phoneOrMember;
    }

    const cleanPhone = whatsappService.normalizePhoneNumber(phoneStr);
    if (!cleanPhone) {
      console.warn('[WhatsApp Link Warning] Missing or invalid phone number:', { phoneOrMember, member });
      return null;
    }

    const encoded = encodeURIComponent(message || '');
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;

    console.log(`[WhatsApp Link] Selected member: ${member?.fullName || member?.name || 'Member'} | Member ID: ${member?.id || 'N/A'} | WhatsApp number from database: ${phoneStr} | Generated WhatsApp URL: ${url}`);

    return url;
  },

  /**
   * Dispatches through WhatsApp API/link using the selected member's actual WhatsApp number
   */
  sendWhatsAppNotification: async ({ member, schedule, slot, type = 'Assignment' }) => {
    if (!member) {
      return { success: false, error: "WhatsApp number not available. Please add the member's phone number first." };
    }

    const rawPhone = member.whatsappNumber || member.phone;
    const cleanPhone = whatsappService.normalizePhoneNumber(rawPhone);

    if (!cleanPhone) {
      return { success: false, error: "WhatsApp number not available. Please add the member's phone number first." };
    }

    const slotTime = `${slot.startTime} - ${slot.endTime}`;
    let message = '';

    if (type === 'Assignment') {
      message = whatsappService.generateAssignmentMessage({
        name: member.fullName,
        topic: slot.topic + (slot.subTopic ? ` (${slot.subTopic})` : ''),
        assignedTime: slotTime,
        date: schedule.formattedDate || schedule.date,
        bibleReading: slot.bibleReading
      });
    } else if (type === '24-Hour Reminder') {
      message = whatsappService.generate24HourReminderMessage({
        name: member.fullName,
        topic: slot.topic,
        assignedTime: slotTime,
        date: schedule.formattedDate || schedule.date
      });
    } else if (type === '10-Minute Reminder') {
      message = whatsappService.generate10MinuteReminderMessage({
        name: member.fullName,
        topic: slot.topic,
        assignedTime: slotTime
      });
    } else if (type === '5-Minute Reminder') {
      message = whatsappService.generate5MinuteReminderMessage({
        name: member.fullName,
        topic: slot.topic,
        assignedTime: slotTime
      });
    } else if (type === 'Reassignment Notice') {
      message = whatsappService.generateOriginalMemberReassignedMessage({
        date: schedule.formattedDate || schedule.date,
        time: slotTime
      });
    }

    const whatsappUrl = whatsappService.createWhatsAppLink(cleanPhone, message, member);

    return {
      success: true,
      messageId: `wamid_${Date.now()}`,
      phone: rawPhone,
      cleanPhone,
      content: message,
      whatsappUrl,
      type
    };
  }
};
