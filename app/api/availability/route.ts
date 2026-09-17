import { booking } from "@/lib/content";
import { isBookableDate, toDayAvailability } from "@/lib/booking-rules";
import { getAvailability } from "@/lib/venu";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!isBookableDate(date)) {
    return Response.json({ error: booking.errors.date }, { status: 400 });
  }

  try {
    const spaces = toDayAvailability(await getAvailability(date));
    return Response.json({ date, spaces }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/availability]", err);
    return Response.json({ error: booking.errors.unreachable }, { status: 502 });
  }
}
