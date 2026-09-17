export const poweredBy = {
  prefix: "Powered by ",
  name: "Venu Technologies",
  url: "https://about.venu.lk/",
};

export const nav = [
  { label: "Spaces", href: "/spaces" },
  { label: "Why Wonder", href: "/#why-us" },
  { label: "Location", href: "/#find-us" },
  { label: "Contact", href: "/#find-us" },
];

export const hero = {
  eyebrow: "Colombo 05 · Co-working",
  // Working headline. Alternates below are a one-line swap if needed.
  headline: "Your Productive Space Starts Here.",
  // headline: "Space to Think. Room to Grow.",
  // headline: "A Quieter Way to Work.",
  cta: "Book Now",
  image: "/images/hero-bg-woman.jpg",
};

export const scrollStatement = {
  tags: ["Work", "Connect", "Grow"],
  line: "Work is not forced here. It unfolds. A grounded space in the heart of Colombo, built for people who value focus over speed and clarity over chaos.",
};

export const spaces = {
  eyebrow: "Wonder · Colombo 05",
  heading: "Our Spaces",
  footnote: "Every space is bookable by the hour, half day, or full day — come find the setup that fits.",
  items: [
    {
      key: "hot-desks",
      nav: "Hot Desks",
      eyebrow: "01 · Hot Desks",
      heading: "Come As You Are",
      body: "Flexible, day-to-day seating with good light and good coffee. No fixed desk, no fixed hours — just a place to sit down and work.",
      image: "/images/offer-hotdesk.jpg",
      galleryImages: ["/images/offer-hotdesk.jpg", "/images/whyus-slide-1.jpg"],
      capacity: null, // seat count chosen per booking instead of a fixed capacity
      amenities: [
        "High-speed Wi-Fi throughout",
        "Power at every seat",
        "Unlimited filter coffee & tea",
        "Lockers available on request",
      ],
    },
    {
      key: "solo-pods",
      nav: "Solo Pods",
      eyebrow: "02 · Solo Pods",
      heading: "Room to Focus",
      body: "A quiet, enclosed pod built for calls and deep work — step in, close the door, and get the hour done.",
      image: "/images/offer-private.jpg",
      galleryImages: ["/images/offer-private.jpg", "/images/whyus-slide-4.jpg"],
      capacity: 1,
      amenities: [
        "Soundproofed for calls",
        "Adjustable desk & lighting",
        "Wi-Fi + HDMI connection",
        "Seats 1",
      ],
    },
    {
      key: "board-room",
      nav: "Board Room",
      eyebrow: "03 · Board Room",
      heading: "Space to Decide",
      body: "A considered room for the conversations that matter, set with the same care as the rest of the house.",
      image: "/images/offer-meeting.jpg",
      galleryImages: ["/images/offer-meeting.jpg", "/images/whyus-slide-6.jpg"],
      capacity: 8,
      amenities: [
        "Seats up to 8",
        "4K display & video conferencing",
        "Whiteboard wall",
        "Still & sparkling water",
      ],
    },
    {
      key: "conversation-room",
      nav: "Conversation Room",
      eyebrow: "04 · Conversation Room",
      heading: "Space to Gather",
      body: "A relaxed lounge setting for pitches, workshops, and client conversations that don't need a boardroom.",
      image: "/images/whyus-slide-2.jpg",
      galleryImages: ["/images/whyus-slide-2.jpg", "/images/whyus-slide-5.jpg"],
      capacity: 8,
      amenities: [
        "Seats up to 8",
        "Lounge seating",
        "Wi-Fi + display",
        "Tea & coffee service",
      ],
    },
  ],
};

// Shared pricing tiers across every space. "Moment" is priced per hour (see
// SPACE_PRICING.moment as a rate); "Cycle" (morning or evening slot) and "Sojourn"
// are flat prices for their fixed blocks. Times must match the Venu packages
// (see PACKAGE_NAMES in lib/booking-rules.ts).
export const packageTiers = [
  { value: "moment", label: "Moment — Hourly", short: "Moment", hours: 0 },
  { value: "cycle-morning", label: "Cycle — Morning, 9am–2pm (5 hrs)", short: "Cycle · Morning", hours: 5 },
  { value: "cycle-evening", label: "Cycle — Evening, 2pm–7pm (5 hrs)", short: "Cycle · Evening", hours: 5 },
  { value: "sojourn", label: "Sojourn — Full-Day, 9am–7pm (10 hrs)", short: "Sojourn", hours: 10 },
];

// Placeholder pricing (LKR) per space. Hot Desks figures come from the rate
// card; everything else is a placeholder until real pricing is set.
// moment = per-hour rate, cycle/sojourn = flat price for that fixed block.
export const SPACE_PRICING: Record<string, { moment: number; cycle: number; sojourn: number }> = {
  "hot-desks": { moment: 500, cycle: 2000, sojourn: 3500 },
  "solo-pods": { moment: 700, cycle: 2800, sojourn: 4800 },
  "board-room": { moment: 1500, cycle: 6000, sojourn: 10000 },
  "conversation-room": { moment: 1200, cycle: 4800, sojourn: 8000 },
};

// Price of one unit (seat or room). The server sends the cart total as expected_total so
// venu-admin prices that drift from these figures are rejected instead of silently charged.
export function tierPrice(spaceKey: string, tier: string, hours: number) {
  const pricing = SPACE_PRICING[spaceKey];
  if (!pricing) return 0;
  if (tier === "moment") return pricing.moment * hours;
  if (tier === "cycle-morning" || tier === "cycle-evening") return pricing.cycle;
  if (tier === "sojourn") return pricing.sojourn;
  return 0;
}

// wholeTable: choosing every seat books the table itself as ONE booking (Venu: whole_space on the table).
export const hotDeskSeatTypes = [
  { value: "six-seater", label: "6-Seater Table", maxSeats: 6, wholeTable: true },
  { value: "four-seater", label: "4-Seater Table", maxSeats: 4, wholeTable: true },
  { value: "individual", label: "Individual Desk", maxSeats: 10, wholeTable: false },
];

export const whyUs = {
  eyebrow: "Why Choose Wonder",
  heading: "Why Us?",
  intro: "Growth happens naturally when the environment allows it. This is what we've built ours around.",
  items: [
    {
      icon: "leaf",
      title: "Calm by Design",
      body: "A dependable, unhurried environment, every day.",
    },
    {
      icon: "users",
      title: "A Considered Community",
      body: "A culture of focus, not performance.",
    },
    {
      icon: "map-pin",
      title: "Central, Easy to Reach",
      body: "Park Road, Colombo 05 — close to where you already work.",
    },
    {
      icon: "refresh-cw",
      title: "Flexible, on Your Terms",
      body: "Day passes to private offices, month to month.",
    },
  ],
  slides: [
    "/images/whyus-slide-1.jpg",
    "/images/whyus-slide-2.jpg",
    "/images/whyus-slide-3.jpg",
    "/images/whyus-slide-4.jpg",
    "/images/whyus-slide-5.jpg",
    "/images/whyus-slide-6.jpg",
  ],
};

export const findUs = {
  headingLines: ["Find Us @", "250 Park Rd,", "Colombo 05"],
  script: "Good coffee. Better ideas.",
  support: "Drop by, take a tour, or just come work for the day — we're easy to find and easier to settle into.",
  address: "250 Park Rd, Colombo 00500",
  hours: "9am–7pm, Mon–Sat",
  email: "hello@wonder.lk",
  phone: "+94 11 2 500 286",
  cta: "Get Directions",
  images: {
    large: "/images/findus-large.jpg",
    small1: "/images/findus-small-1.jpg",
    small2: "/images/findus-small-2.jpg",
  },
};


export const footer = {
  image: "/images/findus-large.jpg",
  script: "Work in Wonder",
  address: "250 Park Rd, Colombo 00500",
  email: "hello@wonder.lk",
  phone: "+94 11 2 500 286",
  ctaBody: "Come see the space for yourself. We'll show you around, no obligation.",
  ctaButton: "Book Now",
  copyright: "© 2026 Wonder Pvt Ltd · Reg. No PV 00324453269",
  site: "workinwonder.com",
};

export const booking = {
  eyebrow: "Wonder · Colombo 05",
  heading: "Book Your Space",
  intro: "Choose a space, a date, and how long you're staying. Add another booking any time — one visit, every space you need.",
  spaceLabel: "Space",
  spacePlaceholder: "Choose a space",
  seatTypeLabel: "Seat Type",
  seatTypePlaceholder: "Choose a seat type",
  seatTypeHintEmpty: "Choose a seat type first",
  packageLabel: "Package",
  packagePlaceholder: "Choose a package",
  // Open 9am–7pm (CLOSING_HOUR in lib/booking-rules.ts); the last hourly start is 6 PM.
  hourlyStartTimes: [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM",
    "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
  ],
  addAnotherLabel: "Add Another Booking",
  summaryTitle: "Your Bookings",
  bookingTotalLabel: "Booking Total",
  grandTotalLabel: "Grand Total",
  confirmLabel: "Book Now",
  submittingLabel: "Booking…",
  confirmedTitle: "Booking Confirmed",
  confirmedBody: "Your space is reserved. We've emailed the confirmation to {email}.",
  refLabel: "Booking ref",
  // Payment gateway pending (client is choosing a provider): bookings are confirmed now and paid at Wonder.
  paymentPendingNote: "Payment is settled at Wonder on arrival — online payment is coming soon.",
  momentUnavailable: "Not available at this time — try another start time or duration.",
  seatsFree: "{count} free for this package",
  wholeTableHint: "All {count} seats — the whole table, in one booking.",
  optionFullyBooked: "Fully booked",
  optionOnlyFree: "Only {count} free",
  optionUnavailable: "Unavailable",
  errors: {
    name: "Please enter your full name.",
    email: "Please enter a valid email address.",
    phone: "Please enter a valid phone number.",
    date: "Choose an upcoming date — Wonder is closed on Sundays.",
    invalid: "Something in your booking isn't valid. Please review it and try again.",
    notBookable: "{item} isn't available for that package or time. Nothing was booked.",
    taken: "{item} is no longer available{left}. Nothing was booked — please adjust and try again.",
    priceChanged: "Prices have changed since you opened this page. Nothing was booked — please refresh and try again.",
    rateLimited: "Too many booking attempts — please try again in a minute.",
    unreachable: "We couldn't reach the booking system. Nothing was booked — please try again.",
  },
  gallery: [
    { src: "/images/offer-hotdesk.jpg", alt: "Hot desk seating at Wonder", size: "large" as const },
    { src: "/images/offer-private.jpg", alt: "A solo pod at Wonder", size: "small" as const },
    { src: "/images/offer-meeting.jpg", alt: "The board room at Wonder", size: "small" as const },
    { src: "/images/whyus-slide-2.jpg", alt: "The conversation room at Wonder", size: "large" as const },
    { src: "/images/findus-large.jpg", alt: "Interior corner at Wonder", size: "small" as const },
    { src: "/images/whyus-slide-3.jpg", alt: "A workspace detail at Wonder", size: "small" as const },
  ],
};
