export const isBookingType = type => ['demo', 'visit'].includes((type || '').toLowerCase());

// Tells staff whether the lead's WhatsApp booking confirmation went out (addFollowup response).
export const notifyBookingWhatsApp = (toast, data) => {
  const wa = data?.whatsapp;
  if (!wa || wa.status === 'duplicate') return;
  if (wa.sent) toast.success('Booking confirmation sent to the lead on WhatsApp.');
  else toast.error(`WhatsApp confirmation not sent: ${wa.error || 'unknown error'}`);
};
