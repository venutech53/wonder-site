// Booking rules shared by the booking form (client) and the /api routes (server).
// Kept import-free so `node scripts/booking-rules-check.mjs` can run it directly.

export const VENU_TIMEZONE = "Asia/Colombo";
export const CLOSING_HOUR = 19; // Wonder is open 9am–7pm: every booking must end by 7:00 PM
export const CLOSED_WEEKDAYS = [0]; // Sunday
export const MAX_MOMENT_HOURS = 12;

// Site option → Venu space name. venu-admin must use these exact names (case-insensitive).
export const VENU_SPACE_NAMES: Record<string, string> = {
  "hot-desks:six-seater": "Six Seater",
  "hot-desks:four-seater": "Four Seater",
  "hot-desks:individual": "Window Seats",
  "solo-pods": "Solo Pods",
  "board-room": "Board Room",
  "conversation-room": "Conversation Room",
};

// Site tier → Venu package name on every bookable unit. "moment" is hourly (price_per_hour).
export const PACKAGE_NAMES: Record<string, string> = {
  "cycle-morning": "Cycle Morning", // 09:00–14:00
  "cycle-evening": "Cycle Evening", // 14:00–19:00
  sojourn: "Sojourn", // 09:00–19:00
};

export type TimeRange = [number, number]; // minutes since midnight, venue local time
export type Unit = {
  busy: TimeRange[];
  packages: Record<string, TimeRange>;
  hourly: boolean;
  hours: TimeRange | "closed" | null; // opening hours that day; null = no schedule configured
};
export type SpaceAvailability = { spaceId: string; parentBusy: TimeRange[]; units: Unit[] };
export type DayAvailability = Record<string, SpaceAvailability>;
export type CartLike = { tier: string; startTime?: string; hours: number; seats?: number };

type VenuRange = { start_time: string; end_time: string };
export type VenuSpace = {
  id: string;
  name: string;
  parent_id: string | null;
  price_per_hour: number | null;
  packages: (VenuRange & { id: string; name: string; price: number })[];
  schedule: { is_open: boolean; open_time: string; close_time: string } | null;
  busy: VenuRange[];
};
export type VenuAvailability = { date: string; timezone: string; spaces: VenuSpace[] };

export const bookingKey = (spaceKey: string, seatTypeKey?: string) =>
  seatTypeKey ? `${spaceKey}:${seatTypeKey}` : spaceKey;

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// "8:00 AM" → 480
export function labelToMinutes(label: string) {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(label);
  if (!m) return NaN;
  return ((Number(m[1]) % 12) + (m[3] === "PM" ? 12 : 0)) * 60 + Number(m[2]);
}

export const maxMomentHours = (startLabel: string) =>
  Math.max(0, Math.min(MAX_MOMENT_HOURS, Math.floor((CLOSING_HOUR * 60 - labelToMinutes(startLabel)) / 60)));

const overlaps = (a: TimeRange, b: TimeRange) => a[0] < b[1] && a[1] > b[0];

function windowFor(unit: Unit, item: CartLike): TimeRange | null {
  if (item.tier !== "moment") return unit.packages[item.tier] ?? null;
  if (!unit.hourly || !item.startTime || unit.hours === "closed") return null;
  const start = labelToMinutes(item.startTime);
  const window: TimeRange = [start, start + item.hours * 60];
  if (unit.hours && (window[0] < unit.hours[0] || window[1] > unit.hours[1])) return null;
  return window;
}

export function offered(space: SpaceAvailability, tier: string) {
  return tier === "moment"
    ? space.units.some((u) => u.hourly && u.hours !== "closed")
    : space.units.some((u) => tier in u.packages);
}

// Units free for `item`, minus units already claimed by overlapping items in the cart.
// ponytail: counts cart claims against one representative window; the server re-checks atomically.
export function freeUnits(space: SpaceAvailability, item: CartLike, cart: CartLike[] = []) {
  const firstWindow = (c: CartLike) =>
    space.units.map((u) => windowFor(u, c)).find((w): w is TimeRange => w !== null);

  const free = space.units.filter((u) => {
    const w = windowFor(u, item);
    return w !== null && ![...space.parentBusy, ...u.busy].some((b) => overlaps(b, w));
  }).length;

  const window = firstWindow(item);
  const claimed = window
    ? cart
        .filter((c) => {
          const w = firstWindow(c);
          return w !== undefined && overlaps(w, window);
        })
        .reduce((n, c) => n + (c.seats ?? 1), 0)
    : 0;

  return Math.max(0, free - claimed);
}

// venu-api spaces-availability response → per site option.
export function toDayAvailability(venu: VenuAvailability): DayAvailability {
  const range = (r: VenuRange): TimeRange => [toMinutes(r.start_time), toMinutes(r.end_time)];
  const hoursOf = (schedule: VenuSpace["schedule"]): Unit["hours"] =>
    schedule ? (schedule.is_open ? [toMinutes(schedule.open_time), toMinutes(schedule.close_time)] : "closed") : null;
  // A unit's own schedule wins, else its parent's (same rule as rpc_create_bookings_batch).
  const unitOf = (s: VenuSpace, parent: VenuSpace): Unit => ({
    busy: s.busy.map(range),
    hourly: (s.price_per_hour ?? 0) > 0,
    hours: hoursOf(s.schedule ?? parent.schedule),
    packages: Object.fromEntries(
      Object.entries(PACKAGE_NAMES).flatMap(([tier, name]) => {
        const p = s.packages.find((pkg) => pkg.name.toLowerCase() === name.toLowerCase());
        return p ? [[tier, range(p)]] : [];
      })
    ),
  });

  const day: DayAvailability = {};
  for (const [key, name] of Object.entries(VENU_SPACE_NAMES)) {
    const space = venu.spaces.find((s) => !s.parent_id && s.name.toLowerCase() === name.toLowerCase());
    if (!space) continue;
    const children = venu.spaces.filter((s) => s.parent_id === space.id);
    day[key] = {
      spaceId: space.id,
      parentBusy: children.length ? space.busy.map(range) : [],
      units: (children.length ? children : [space]).map((unit) => unitOf(unit, space)),
    };
  }
  return day;
}

export const colomboToday = () => new Date().toLocaleDateString("en-CA", { timeZone: VENU_TIMEZONE });

export const isClosedDay = (iso: string) => CLOSED_WEEKDAYS.includes(new Date(`${iso}T00:00:00Z`).getUTCDay());

export function isBookableDate(iso: string, today = colomboToday()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso && iso >= today && !isClosedDay(iso);
}

export function customerError(c: { name: string; email: string; phone: string }): "name" | "email" | "phone" | null {
  const name = c.name.trim();
  if (name.length < 2 || name.length > 100) return "name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()) || c.email.length > 254) return "email";
  const digits = c.phone.replace(/\D/g, "");
  if (!/^\+?[\d\s()-]+$/.test(c.phone.trim()) || digits.length < 7 || digits.length > 15) return "phone";
  return null;
}
