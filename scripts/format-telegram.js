const CHAT_ID = $json.chatId || $json.chat_id || '<PUT_USER_CHAT_ID>'; // e.g. from Telegram Trigger or hardcode
const tz = 'Asia/Kolkata';
const MAX_OFFERS =$input.first().json.meta.count ; // change if you want more/less
const offers = Array.isArray($json?.data) ? $json.data : [];

// ---------- helpers ----------
const fmtDT = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: tz }).format(d);
    const time = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz }).format(d);
    return `${date}, ${time} IST`;
  } catch { return iso; }
};

// Telegram MarkdownV2 escaping
const esc = (s = '') => String(s).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');

// Build per-offer text
function buildText(offer) {
  const offerId = offer.id || '';
  const seats = offer.numberOfBookableSeats ?? 'N/A';
  const lastTicket = offer.lastTicketingDateTime || offer.lastTicketingDate || '—';
  const price = offer.price || {};
  const total = price.total ?? price.grandTotal ?? 'N/A';
  const currency = price.currency || '';
  const base = price.base ?? '';
  const itin = offer.itineraries?.[0] || {};
  const duration = itin.duration || '';
  const segs = itin.segments || [];
  const first = segs[0] || {};
  const dep = first.departure || {};
  const arr = first.arrival || {};
  const carrier = first.carrierCode || offer.validatingAirlineCodes?.[0] || '';
  const flightNo = first.number || '';
  const stops = first.numberOfStops ?? 0;

  // fare/bags (first traveler, first seg)
  const tp0 = offer.travelerPricings?.[0] || {};
  const fd0 = tp0.fareDetailsBySegment?.[0] || {};
  const cabin = fd0.cabin || '';
  const branded = fd0.brandedFareLabel || fd0.brandedFare || '';
  let checked = 'N/A';
  if (fd0.includedCheckedBags?.weight) {
    checked = `${fd0.includedCheckedBags.weight}${fd0.includedCheckedBags.weightUnit || ''}`;
  } else if (fd0.includedCheckedBags?.quantity) {
    checked = `${fd0.includedCheckedBags.quantity}pc`;
  }
  const amenities = (fd0.amenities || []).map(a => a?.description).filter(Boolean).join(', ') || '—';

  // multi-segment line (if any)
  const segLines = segs.map((s, idx) => {
    const d = s.departure || {}, a = s.arrival || {};
    return `S${idx+1}: ${esc(d.iataCode || '')} → ${esc(a.iataCode || '')}  (${esc(fmtDT(d.at))} → ${esc(fmtDT(a.at))})`;
  }).join('\n');

  return [
    `Flight #${esc(offerId)} — *${esc(carrier)} ${esc(flightNo)}*`,
    `Route: \`${esc(dep.iataCode || '')}${dep.terminal ? esc(' (T' + dep.terminal + ')') : ''} ➜ ${esc(arr.iataCode || '')}${arr.terminal ? esc(' (T' + arr.terminal + ')') : ''}\``,
    `Date / Time: *${esc(fmtDT(dep.at))} ➜ ${esc(fmtDT(arr.at))}*`,
    `Duration: *${esc(duration)}* • Stops: *${esc(stops)}*`,
    `Class: *${esc(cabin)}* (${esc(branded)}) • Seats: *${esc(seats)}*`,
    segs.length > 1 ? `\n${segLines}` : ``,
    ``,
    `*Price:* \`${esc(total)} ${esc(currency)}\` (base \`${esc(base)}\`)`,
    `Baggage: Checked *${esc(checked)}*`,
    `Amenities: ${esc(amenities)}`,
    ``,
    `_Validity / Ticketing_: Last ticketing date *${esc(lastTicket)}*`
  ].filter(Boolean).join('\n');
}

// ---------- build output ----------
const picked = offers.slice(0, MAX_OFFERS); // or sort by cheapest before slicing

if (!picked.length) {
  return [{ json: { chat_id: CHAT_ID, text: 'No flight offers found.', parse_mode: 'MarkdownV2' }}];
}

return picked.map(offer => {
  const text = buildText(offer);
  const reply_markup = {
    inline_keyboard: [
      [
        { text: 'Book this flight', url: `https://your-booking.link/book?offerId=${encodeURIComponent(offer.id)}` },
        { text: 'More details', callback_data: `details|${offer.id}` }
      ]
    ]
  };
  return { json: { chat_id: CHAT_ID, text, parse_mode: 'MarkdownV2', reply_markup } };
});
