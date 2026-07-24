/**
 * HOTEL CONFIG — edit this file for each new hotel client.
 * This is the ONLY file you should need to touch to onboard a new hotel.
 * Everything the chatbot knows and does for this specific hotel lives here.
 */

module.exports = {
  // ---- Branding (shown in the widget) ----
  hotelName: "Solane House",
  greeting: "Good evening — welcome to Solane House, here in whichever language works best for you. Ask me anything, check live availability, or book direct and skip the OTA fees.",
  primaryColor: "#122129",   // widget header / bubble background
  accentColor: "#C9A66B",    // buttons / highlights

  // Link to the hotel's real booking engine — the widget's "Book direct" button sends guests here.
  bookingUrl: "https://www.solanehouse.com/book",
  // ---- Which websites are allowed to load this widget ----
  // Add every domain the hotel will embed this on. Use "*" only while testing locally.
  allowedOrigins: [
    "https://www.solanehouse.com"
    // "https://www.solanehouse.com"
  ],

  // ---- Optional: get a notification when the bot escalates to a human ----
  // Create a free Slack "Incoming Webhook" and paste the URL here, or leave blank to skip.
  slackWebhookUrl: "",

  // ---- The knowledge base ----
  // Only what's written here is ever told to guests. Be exact — wrong info here becomes
  // a guest complaint. Update this any time the hotel's rates or policies change.
  knowledgeBase: `
SOLANE HOUSE — HOTEL KNOWLEDGE BASE (only source of truth for factual answers)

ROOMS & RATES
- Harbor Room: Queen bed, harbor-facing, from $248/night, sleeps 2.
- Garden Suite: King bed + sofa bed, courtyard-facing, from $339/night, sleeps 3-4.
- Rooftop Loft: King bed, private terrace, from $415/night, sleeps 2.
- Rates shown are base rate, exclude 12% occupancy tax and $18/night resort fee (covers wifi, gym, pool towels).

CHECK-IN / CHECK-OUT
- Check-in from 3:00 PM, check-out by 11:00 AM.
- Early check-in / late check-out subject to availability, $35 fee if confirmed in advance.
- Photo ID and credit card required at check-in.

CANCELLATION POLICY
- Free cancellation up to 48 hours before arrival.
- Cancellations inside 48 hours are charged one night's rate.
- No-shows are charged the full stay.

AMENITIES
- Rooftop pool (7am-9pm), 24-hour gym, on-site spa (book via front desk, 48hr notice recommended).
- Free wifi throughout. Valet parking $42/night; self-park garage two blocks away, $22/night.
- Breakfast not included in base rate; available a la carte in the lobby cafe 7-11am, or add a breakfast package at booking ($24/person/night).
- Pet-friendly rooms available (dogs under 40lbs), $60 one-time pet fee, must be requested at booking.
- Cribs and rollaway beds available on request, free of charge, subject to availability.
- Accessible rooms (roll-in shower, ADA-compliant) available — request at booking, limited inventory.

GROUP BOOKINGS
- Reservations of 5+ rooms are handled by the events team directly, not standard booking.

ESCALATE TO STAFF (do not attempt to resolve yourself) when the guest:
- Reports a medical emergency, safety issue, or anything urgent/in-progress — escalate immediately, don't try to answer.
- Requests a refund, disputes a charge, or has a complaint about their stay (noise, cleanliness, service).
- Wants a group booking of 5+ rooms, or a wedding/event inquiry.
- Reports a lost item, a room issue during their stay (AC, lock, etc.), or an accessibility need beyond what's listed.
- Asks something not covered above, or you're not confident the knowledge base answers it accurately.
`
};
