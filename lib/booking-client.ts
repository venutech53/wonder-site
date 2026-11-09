// Client-side submit for /api/bookings. Not wired to the UI yet: the booking engine's
// sign-up supplies the customer, then calls this with the held cart.
import { booking } from "@/lib/content";

export type SubmitCartItem = {
  spaceKey: string;
  date: string;
  tier: string;
  hours: number;
  startTime?: string;
  seatTypeKey?: string;
  seats?: number;
};

export type SubmitCustomer = { name: string; email: string; phone: string };

export type SubmitResult =
  | { ok: true; refs: string[] }
  | { ok: false; error: string; conflict: boolean };

// Same cart + customer → same Idempotency-Key, so retries never double book.
let lastSubmit: { payload: string; key: string } | null = null;

export async function submitBookings(cart: SubmitCartItem[], customer: SubmitCustomer): Promise<SubmitResult> {
  const payload = JSON.stringify({
    customer,
    cart: cart.map(({ spaceKey, date, tier, hours, startTime, seatTypeKey, seats }) => ({
      spaceKey,
      date,
      tier,
      hours,
      startTime,
      seatTypeKey,
      seats,
    })),
  });
  if (lastSubmit?.payload !== payload) lastSubmit = { payload, key: crypto.randomUUID() };

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": lastSubmit.key },
      body: payload,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ?? booking.errors.unreachable, conflict: res.status === 409 };
    }
    return { ok: true, refs: data.bookings.map((b: { ref: string }) => b.ref) };
  } catch {
    return { ok: false, error: booking.errors.unreachable, conflict: false };
  }
}
