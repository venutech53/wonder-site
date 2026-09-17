import { booking, hotDeskSeatTypes, packageTiers, spaces, tierPrice } from "@/lib/content";
import {
  bookingKey,
  customerError,
  isBookableDate,
  labelToMinutes,
  maxMomentHours,
  PACKAGE_NAMES,
  toDayAvailability,
  toHHMM,
} from "@/lib/booking-rules";
import { createBookings, getAvailability, VenuError, type VenuBatchItem } from "@/lib/venu";

type CartItem = {
  spaceKey: string;
  date: string;
  tier: string;
  hours: number;
  startTime?: string;
  seatTypeKey?: string;
  seats?: number;
};

const fail = (error: string, status: number, itemIndex?: number) =>
  Response.json({ error, itemIndex }, { status });

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

// Returns the index of the first invalid cart item, or -1 when every item is valid.
function invalidItemIndex(cart: CartItem[]) {
  return cart.findIndex((item) => {
    if (!isObject(item) || !spaces.items.some((s) => s.key === item.spaceKey)) return true;
    if (!packageTiers.some((t) => t.value === item.tier)) return true;
    if (item.spaceKey === "hot-desks") {
      const seatType = hotDeskSeatTypes.find((t) => t.value === item.seatTypeKey);
      if (!seatType || !Number.isInteger(item.seats) || item.seats! < 1 || item.seats! > seatType.maxSeats) return true;
    } else if (item.seatTypeKey !== undefined || (item.seats !== undefined && item.seats !== 1)) {
      return true;
    }
    if (item.tier === "moment") {
      if (typeof item.startTime !== "string" || !booking.hourlyStartTimes.includes(item.startTime)) return true;
      if (!Number.isInteger(item.hours) || item.hours < 1 || item.hours > maxMomentHours(item.startTime)) return true;
    }
    return false;
  });
}

function describeItem(item: CartItem) {
  const space = spaces.items.find((s) => s.key === item.spaceKey)?.nav ?? "Your booking";
  const seatType = hotDeskSeatTypes.find((t) => t.value === item.seatTypeKey)?.label;
  const date = new Date(`${item.date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${seatType ? `${space} (${seatType})` : space} on ${date}`;
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isObject(body) || !isObject(body.customer) || !Array.isArray(body.cart)) {
    return fail(booking.errors.invalid, 400);
  }

  const customer = {
    name: String(body.customer.name ?? ""),
    email: String(body.customer.email ?? ""),
    phone: String(body.customer.phone ?? ""),
  };
  const detailsError = customerError(customer);
  if (detailsError) return fail(booking.errors[detailsError], 400);

  const cart = body.cart as CartItem[];
  if (cart.length < 1 || cart.length > 10) return fail(booking.errors.invalid, 400);
  const badIndex = invalidItemIndex(cart);
  if (badIndex !== -1) return fail(booking.errors.invalid, 400, badIndex);
  const pastIndex = cart.findIndex((item) => !isBookableDate(item.date));
  if (pastIndex !== -1) return fail(booking.errors.date, 400, pastIndex);

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || crypto.randomUUID();
  if (idempotencyKey.length > 100) return fail(booking.errors.invalid, 400);

  try {
    // Resolve site options to Venu space ids for each booking date.
    const dates = [...new Set(cart.map((item) => item.date))];
    const days = new Map(
      await Promise.all(dates.map(async (d) => [d, toDayAvailability(await getAvailability(d))] as const))
    );

    const items: VenuBatchItem[] = [];
    for (const [i, item] of cart.entries()) {
      const space = days.get(item.date)?.[bookingKey(item.spaceKey, item.seatTypeKey)];
      if (!space) return fail(booking.errors.notBookable.replace("{item}", describeItem(item)), 422, i);
      // Every seat of a table → one booking on the table itself.
      const seatType = hotDeskSeatTypes.find((t) => t.value === item.seatTypeKey);
      const wholeTable = Boolean(seatType?.wholeTable && item.seats === seatType.maxSeats);
      const base = wholeTable
        ? { space_id: space.spaceId, booking_date: item.date, seats: 1, whole_space: true }
        : { space_id: space.spaceId, booking_date: item.date, seats: item.seats ?? 1 };
      if (item.tier === "moment") {
        const start = labelToMinutes(item.startTime!);
        items.push({ ...base, start_time: toHHMM(start), end_time: toHHMM(start + item.hours * 60) });
      } else {
        items.push({ ...base, package_name: PACKAGE_NAMES[item.tier] });
      }
    }

    const expectedTotal = cart.reduce(
      (sum, item) => sum + tierPrice(item.spaceKey, item.tier, item.hours) * (item.seats ?? 1),
      0
    );

    const result = await createBookings(
      {
        // Payment gateway pending (client is choosing a provider). Until then bookings are pay-at-venue:
        // "cash" is confirmed immediately (emails + slot held) and shows as unpaid in venu-admin.
        // When the gateway lands: send "online", redirect to payment, then call payments-confirm from its webhook.
        payment_method: "cash",
        customer: { name: customer.name.trim(), email: customer.email.trim(), contact: customer.phone.trim() },
        notes: "Booked online via workinwonder.com",
        expected_total: expectedTotal,
        items,
      },
      idempotencyKey
    );

    return Response.json(
      {
        total: result.total_price,
        bookings: result.bookings.map((b) => ({ id: b.id, ref: b.id.slice(0, 8).toUpperCase() })),
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof VenuError) {
      const index = err.itemIndex;
      const item = index !== undefined && cart[index] ? describeItem(cart[index]) : "One of your bookings";
      if (err.status === 409 && /idempotency-key/i.test(err.message)) {
        console.error("[api/bookings] idempotency key reused with a different cart");
        return fail(booking.errors.invalid, 409);
      }
      if (err.status === 409) {
        const unit = cart[index ?? -1]?.spaceKey === "hot-desks" ? "seat" : "space";
        const left = err.available ? ` — only ${err.available} ${unit}${err.available > 1 ? "s" : ""} left` : "";
        return fail(booking.errors.taken.replace("{item}", item).replace("{left}", left), 409, index);
      }
      if (err.status === 422 && /price mismatch/i.test(err.message)) {
        console.error("[api/bookings] price mismatch between site and venu-admin:", err.message);
        return fail(booking.errors.priceChanged, 422);
      }
      if (err.status === 422) return fail(booking.errors.notBookable.replace("{item}", item), 422, index);
      if (err.status === 429) return fail(booking.errors.rateLimited, 429);
    }
    console.error("[api/bookings]", err);
    return fail(booking.errors.unreachable, 502);
  }
}
