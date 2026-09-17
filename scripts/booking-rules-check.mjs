// Run: node scripts/booking-rules-check.mjs   (Node >= 22.18 strips the TypeScript types)
import assert from "node:assert/strict";
import {
  customerError,
  freeUnits,
  isBookableDate,
  labelToMinutes,
  maxMomentHours,
  toDayAvailability,
} from "../lib/booking-rules.ts";

const pkg = (name, start_time, end_time) => ({ id: name, name, start_time, end_time, price: 1 });
const seat = (id, busy = []) => ({
  id,
  name: id,
  parent_id: "table",
  price_per_hour: 500,
  packages: [pkg("Cycle Morning", "09:00:00", "14:00:00"), pkg("Cycle Evening", "14:00:00", "19:00:00"), pkg("Sojourn", "09:00:00", "19:00:00")],
  schedule: null,
  busy,
});

const day = toDayAvailability({
  date: "2026-10-26",
  timezone: "Asia/Colombo",
  spaces: [
    { id: "table", name: "Six Seater", parent_id: null, price_per_hour: null, packages: [], schedule: { is_open: true, open_time: "09:00:00", close_time: "19:00:00" }, busy: [] },
    seat("s1", [{ start_time: "09:00:00", end_time: "14:00:00" }]),
    seat("s2"),
    seat("s3", [{ start_time: "15:00:00", end_time: "16:00:00" }]),
    { id: "room", name: "Board Room", parent_id: null, price_per_hour: 1500, packages: [], schedule: null, busy: [{ start_time: "10:00:00", end_time: "12:00:00" }] },
  ],
});

const table = day["hot-desks:six-seater"];
assert.equal(table.units.length, 3);
// s1 is busy during the morning Cycle, s3 only 15:00–16:00
assert.equal(freeUnits(table, { tier: "cycle-morning", hours: 5 }), 2);
assert.equal(freeUnits(table, { tier: "cycle-evening", hours: 5 }), 2); // s1 free again at 14:00 (back-to-back, no overlap)
assert.equal(freeUnits(table, { tier: "sojourn", hours: 10 }), 1);
// cart already holds 1 seat of an overlapping Cycle booking; a morning cart item doesn't touch the evening slot
assert.equal(freeUnits(table, { tier: "cycle-morning", hours: 5 }, [{ tier: "cycle-morning", hours: 5, seats: 1 }]), 1);
assert.equal(freeUnits(table, { tier: "cycle-evening", hours: 5 }, [{ tier: "cycle-morning", hours: 5, seats: 1 }]), 2);
assert.equal(freeUnits(table, { tier: "sojourn", hours: 10 }, [{ tier: "cycle-evening", hours: 5, seats: 1 }]), 0);
// hourly outside the 09:00–19:00 schedule is not offered
assert.equal(freeUnits(table, { tier: "moment", startTime: "8:00 AM", hours: 1 }), 0);
assert.equal(freeUnits(table, { tier: "moment", startTime: "6:00 PM", hours: 2 }), 0);
assert.equal(freeUnits(table, { tier: "moment", startTime: "6:00 PM", hours: 1 }), 3);
assert.equal(freeUnits(table, { tier: "moment", startTime: "4:00 PM", hours: 2 }), 3);

const room = day["board-room"];
assert.equal(freeUnits(room, { tier: "moment", startTime: "11:00 AM", hours: 1 }), 0);
assert.equal(freeUnits(room, { tier: "moment", startTime: "12:00 PM", hours: 2 }), 1);
assert.equal(freeUnits(room, { tier: "cycle-morning", hours: 5 }), 0); // no Cycle package on the room
assert.equal(day["solo-pods"], undefined); // not configured in Venu

assert.equal(labelToMinutes("12:00 PM"), 720);
assert.equal(labelToMinutes("8:00 AM"), 480);
assert.equal(maxMomentHours("6:00 PM"), 1); // closes 7 PM
assert.equal(maxMomentHours("9:00 AM"), 10);

assert.equal(isBookableDate("2026-10-26", "2026-09-16"), true); // Monday
assert.equal(isBookableDate("2026-10-25", "2026-09-16"), false); // Sunday
assert.equal(isBookableDate("2026-09-15", "2026-09-16"), false); // past
assert.equal(isBookableDate("2026-02-30", "2026-01-01"), false); // not a real date

assert.equal(customerError({ name: "Ada Lovelace", email: "ada@example.com", phone: "+94 77 123 4567" }), null);
assert.equal(customerError({ name: "A", email: "ada@example.com", phone: "0771234567" }), "name");
assert.equal(customerError({ name: "Ada", email: "ada@", phone: "0771234567" }), "email");
assert.equal(customerError({ name: "Ada", email: "ada@example.com", phone: "12ab" }), "phone");

console.log("booking-rules checks passed");
