import "server-only";
import type { VenuAvailability } from "@/lib/booking-rules";

// Server-only client for venu-api (Supabase Edge Functions). Credentials never reach the browser.

export class VenuError extends Error {
  status: number;
  itemIndex?: number;
  available?: number;

  constructor(status: number, message: string, itemIndex?: number, available?: number) {
    super(message);
    this.status = status;
    this.itemIndex = itemIndex;
    this.available = available;
  }
}

export type VenuBatchItem = {
  space_id: string;
  booking_date: string;
  seats: number;
  whole_space?: boolean;
} & ({ package_name: string } | { start_time: string; end_time: string });

export type VenuBatchRequest = {
  payment_method: "cash" | "online";
  customer: { name: string; email: string; contact: string };
  notes: string;
  expected_total: number;
  items: VenuBatchItem[];
};

export type VenuBatchResult = {
  total_price: number;
  bookings: {
    id: string;
    item_index: number;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: "pending" | "confirmed";
    payment_status: "pending" | "paid";
    total_price: number;
  }[];
};

function baseUrl() {
  const url = process.env.VENU_API_URL;
  if (!url) throw new VenuError(500, "VENU_API_URL is not set");
  return url.replace(/\/$/, "");
}

let token: { value: string; expiresAt: number } | null = null;
let tokenRequest: Promise<string> | null = null;

// auth-token is rate limited (5/min per client), so cache the 1h token and share one in-flight request.
function getToken(): Promise<string> {
  if (token && token.expiresAt - 60_000 > Date.now()) return Promise.resolve(token.value);
  tokenRequest ??= (async () => {
    try {
      const res = await fetch(`${baseUrl()}/auth-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.VENU_CLIENT_ID,
          client_secret: process.env.VENU_CLIENT_SECRET,
        }),
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || typeof body.access_token !== "string") {
        throw new VenuError(res.status, body.error ?? "venu-api authentication failed");
      }
      token = { value: body.access_token, expiresAt: Date.now() + Number(body.expires_in ?? 3600) * 1000 };
      return token.value;
    } finally {
      tokenRequest = null;
    }
  })();
  return tokenRequest;
}

async function venuFetch<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const res = await fetch(`${baseUrl()}/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...init.headers,
      Authorization: `Bearer ${await getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401 && !retried) {
    token = null; // expired or rotated signing secret: re-authenticate once
    return venuFetch<T>(path, init, true);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new VenuError(res.status, body.error ?? `venu-api responded ${res.status}`, body.item_index, body.available);
  }
  return body as T;
}

export const getAvailability = (date: string) =>
  venuFetch<VenuAvailability>(`spaces-availability?date=${encodeURIComponent(date)}`);

export const createBookings = (payload: VenuBatchRequest, idempotencyKey: string) =>
  venuFetch<VenuBatchResult>("bookings-batch-create", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Idempotency-Key": idempotencyKey },
  });
