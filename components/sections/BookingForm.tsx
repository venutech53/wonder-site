"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import {
  booking,
  hotDeskSeatTypes,
  packageTiers,
  poweredBy,
  spaces,
  tierPrice,
} from "@/lib/content";
import {
  bookingKey,
  colomboToday,
  freeUnits,
  isClosedDay,
  maxMomentHours,
  offered,
  type DayAvailability,
} from "@/lib/booking-rules";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { BookingImagePanel } from "@/components/ui/BookingImagePanel";
import { paperTexture } from "@/lib/texture";

type CartItem = {
  id: string;
  spaceKey: string;
  date: string;
  tier: string;
  hours: number;
  startTime?: string;
  seatTypeKey?: string;
  seats?: number;
  price: number;
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fieldLabelClass() {
  return "mb-2 block text-xs font-medium uppercase tracking-[0.08em] text-muted";
}

function describeTier(tier: string, hours: number, startTime?: string) {
  const info = packageTiers.find((t) => t.value === tier);
  if (!info) return "—";
  if (tier === "moment") return `Moment (${hours}h from ${startTime})`;
  return info.short;
}

type BookingFormProps = {
  initialSpace?: string;
};

export function BookingForm({ initialSpace }: BookingFormProps) {
  const reduceMotion = useReducedMotion();

  const [space, setSpace] = useState(initialSpace ?? "");
  const [date, setDate] = useState("");
  const [seatType, setSeatType] = useState("");
  const [seats, setSeats] = useState(1);
  const [tier, setTier] = useState("");
  const [hourlyStart, setHourlyStart] = useState(booking.hourlyStartTimes[0]);
  const [momentHours, setMomentHours] = useState(1);
  // Clip only while the Moment panel height-animates; otherwise the start-time dropdown is cut off.
  const [clipMomentPanel, setClipMomentPanel] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  // Set once Book Now is pressed: the selection is held until the booking engine's sign-up takes over.
  const [held, setHeld] = useState<CartItem[] | null>(null);
  const [availability, setAvailability] = useState<Record<string, DayAvailability | "error">>({});

  const selectedSpace = spaces.items.find((s) => s.key === space) ?? null;
  const isHotDesk = space === "hot-desks";

  const dateEnabled = Boolean(space);
  const seatTypeInfo = hotDeskSeatTypes.find((t) => t.value === seatType) ?? null;
  const seatsEnabled = isHotDesk && Boolean(seatType);
  const tierEnabled = Boolean(date) && (!isHotDesk || (Boolean(seatType) && seats > 0));
  const isMoment = tier === "moment";

  useEffect(() => {
    if (isMoment) setClipMomentPanel(true);
  }, [isMoment]);

  // Live availability for the chosen date. Unknown (loading or failed) never blocks: the server re-checks.
  useEffect(() => {
    if (!date || availability[date]) return;
    const controller = new AbortController();
    fetch(`/api/availability?date=${date}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { spaces: DayAvailability }) => setAvailability((a) => ({ ...a, [date]: data.spaces })))
      .catch(() => {
        if (!controller.signal.aborted) setAvailability((a) => ({ ...a, [date]: "error" }));
      });
    return () => controller.abort();
  }, [date, availability]);

  const day = date ? availability[date] : undefined;
  const availabilityKnown = day !== undefined && day !== "error";
  const spaceAvailability =
    availabilityKnown && space && (!isHotDesk || seatType) ? day[bookingKey(space, seatType || undefined)] : undefined;
  const neededUnits = isHotDesk ? seats : 1;
  const cartForSpace = cart.filter(
    (c) => c.date === date && c.spaceKey === space && (c.seatTypeKey ?? "") === (isHotDesk ? seatType : "")
  );

  // Infinity = not known yet.
  const freeFor = (t: string) => {
    if (!availabilityKnown || !space || (isHotDesk && !seatType)) return Infinity;
    if (!spaceAvailability) return 0;
    return freeUnits(
      spaceAvailability,
      { tier: t, startTime: hourlyStart, hours: momentHours, seats: neededUnits },
      cartForSpace
    );
  };

  const tierFree = tier ? freeFor(tier) : Infinity;
  const tierAvailable = tierFree >= neededUnits;
  const hours = isMoment ? momentHours : (packageTiers.find((t) => t.value === tier)?.hours ?? 0);
  const unitPrice = space ? tierPrice(space, tier, momentHours) : 0;
  const currentTotal = unitPrice * (isHotDesk ? seats : 1);

  const currentValid = Boolean(
    space && date && tier && (!isHotDesk || (seatType && seats > 0)) && tierAvailable
  );

  const grandTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price, 0) + (currentValid ? currentTotal : 0),
    [cart, currentValid, currentTotal]
  );
  const canConfirm = cart.length > 0 || currentValid;

  const packageOptions = packageTiers.map((t) => {
    const free = freeFor(t.value);
    if (t.value === "moment") {
      // Hourly availability depends on start time + duration, shown inside the Moment panel instead.
      const unavailable = Number.isFinite(free) && (!spaceAvailability || !offered(spaceAvailability, "moment"));
      return { value: t.value, label: unavailable ? `${t.label} — ${booking.optionUnavailable}` : t.label, disabled: unavailable };
    }
    if (free >= neededUnits) return { value: t.value, label: t.label, disabled: false };
    const reason = !spaceAvailability || !offered(spaceAvailability, t.value)
      ? booking.optionUnavailable
      : free > 0
        ? booking.optionOnlyFree.replace("{count}", String(free))
        : booking.optionFullyBooked;
    return { value: t.value, label: `${t.label} — ${reason}`, disabled: true };
  });

  const maxSeats = seatTypeInfo
    ? Math.max(1, Math.min(seatTypeInfo.maxSeats, tier && Number.isFinite(tierFree) ? tierFree : seatTypeInfo.maxSeats))
    : 1;
  const momentMaxHours = maxMomentHours(hourlyStart);

  const handleSpaceChange = (value: string) => {
    setSpace(value);
    setDate("");
    setSeatType("");
    setSeats(1);
    setTier("");
    setMomentHours(1);
    setHourlyStart(booking.hourlyStartTimes[0]);
  };

  const handleSeatTypeChange = (value: string) => {
    setSeatType(value);
    setSeats(1);
  };

  const handleTierChange = (value: string) => {
    setTier(value);
    if (value !== "moment") setMomentHours(1);
  };

  const handleStartChange = (value: string) => {
    setHourlyStart(value);
    setMomentHours((h) => Math.max(1, Math.min(h, maxMomentHours(value))));
  };

  const buildCartItem = (): CartItem | null => {
    if (!currentValid) return null;
    return {
      id: crypto.randomUUID(),
      spaceKey: space,
      date,
      tier,
      hours,
      startTime: isMoment ? hourlyStart : undefined,
      seatTypeKey: isHotDesk ? seatType : undefined,
      seats: isHotDesk ? seats : undefined,
      price: currentTotal,
    };
  };

  const resetSelection = () => {
    setDate("");
    setSeatType("");
    setSeats(1);
    setTier("");
    setMomentHours(1);
    setHourlyStart(booking.hourlyStartTimes[0]);
  };

  const handleAddAnother = () => {
    const item = buildCartItem();
    if (!item) return;
    setCart((c) => [...c, item]);
    resetSelection();
  };

  const handleRemoveCartItem = (id: string) => {
    setCart((c) => c.filter((item) => item.id !== id));
  };

  const handleConfirm = () => {
    const item = buildCartItem();
    const finalCart = item ? [...cart, item] : cart;
    if (finalCart.length === 0) return;
    setHeld(finalCart);
  };

  const heldTotal = held ? held.reduce((sum, i) => sum + i.price, 0) : 0;

  const currentParts = [
    selectedSpace?.nav,
    seatTypeInfo ? `${seatTypeInfo.label}, ${seats} seat${seats > 1 ? "s" : ""}` : null,
    date ? formatDate(date) : null,
    tier ? describeTier(tier, hours, hourlyStart) : null,
  ].filter(Boolean);

  const itemTitle = (item: CartItem) => {
    const name = spaces.items.find((s) => s.key === item.spaceKey)?.nav;
    const seat = hotDeskSeatTypes.find((t) => t.value === item.seatTypeKey)?.label;
    return seat ? `${name} · ${seat}` : name;
  };
  const itemDetail = (item: CartItem) =>
    [
      item.seats ? `${item.seats} seat${item.seats > 1 ? "s" : ""}` : null,
      formatDate(item.date),
      describeTier(item.tier, item.hours, item.startTime),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <section data-header-text="ink" style={paperTexture("#f2f0e4")} className="pt-[106px]">
      <div className="flex flex-col lg:flex-row">
        {/* Image: above the form on mobile, sticky on the right on desktop */}
        <BookingImagePanel
          spaceKey={space}
          seatTypeKey={seatType}
          className="h-[40vh] min-h-[260px] lg:sticky lg:top-[106px] lg:order-last lg:h-[calc(100dvh-106px)] lg:min-h-0 lg:flex-1 lg:self-start"
        />

        <div className="px-6 py-12 md:px-10 lg:w-[48%] lg:shrink-0 lg:py-16 lg:pr-14 xl:w-[44%]">
          <div className="max-w-[520px]">
            <Eyebrow>{booking.eyebrow}</Eyebrow>
            <h1 className="mt-4 text-[32px] font-bold uppercase leading-[1.1] text-ink md:text-[40px]">
              {booking.heading}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{booking.intro}</p>

            {held ? (
              <motion.div
                key="review"
                initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-12 flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-ink">{booking.reviewTitle}</h2>
                  <p className="mt-2 text-base leading-relaxed text-muted">{booking.reviewBody}</p>
                </div>

                <ul className="flex flex-col border-t border-ink/10">
                  {held.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-4 border-b border-ink/10 py-4">
                      <div>
                        <p className="text-sm font-bold text-ink">{itemTitle(item)}</p>
                        <p className="mt-0.5 text-sm text-muted">{itemDetail(item)}</p>
                      </div>
                      <span className="whitespace-nowrap text-sm font-bold text-ink">
                        LKR {Math.round(item.price).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between text-lg font-bold text-ink">
                  <span>{held.length > 1 ? booking.grandTotalLabel : booking.bookingTotalLabel}</span>
                  <span>LKR {Math.round(heldTotal).toLocaleString()}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Button disabled className="shrink-0">
                    {booking.reviewContinueLabel}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setHeld(null)}
                    className="text-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    {booking.reviewBackLabel}
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-muted-light">{booking.reviewSoonNote}</p>
              </motion.div>
            ) : (
              <div className="mt-12 flex flex-col">
                <div className="mb-3">
                  <label className={fieldLabelClass()} htmlFor="booking-space">
                    {booking.spaceLabel}
                  </label>
                  <CustomSelect
                    id="booking-space"
                    value={space}
                    onChange={handleSpaceChange}
                    placeholder={booking.spacePlaceholder}
                    options={spaces.items.map((s) => ({ value: s.key, label: s.nav }))}
                  />
                </div>

                {selectedSpace && !isHotDesk && (
                  <p className="mb-7 text-xs text-muted">
                    {selectedSpace.capacity === 1
                      ? "This space seats 1 person."
                      : `This space accommodates up to ${selectedSpace.capacity} people.`}
                  </p>
                )}

                {isHotDesk && (
                  <div className="mb-7 mt-4">
                    <label className={fieldLabelClass()} htmlFor="booking-seat-type">
                      {booking.seatTypeLabel}
                    </label>
                    <CustomSelect
                      id="booking-seat-type"
                      value={seatType}
                      onChange={handleSeatTypeChange}
                      placeholder={booking.seatTypePlaceholder}
                      options={hotDeskSeatTypes.map((t) => ({ value: t.value, label: t.label }))}
                    />

                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-3 border border-ink/15 px-2.5 py-1.5">
                        <button
                          type="button"
                          disabled={!seatsEnabled || seats <= 1}
                          onClick={() => setSeats((s) => Math.max(1, s - 1))}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-base leading-none transition-colors hover:border-olive disabled:pointer-events-none disabled:opacity-30"
                          aria-label="Decrease seats"
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center text-base font-bold text-ink">{seats}</span>
                        <button
                          type="button"
                          disabled={!seatsEnabled || seats >= maxSeats}
                          onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-base leading-none transition-colors hover:border-olive disabled:pointer-events-none disabled:opacity-30"
                          aria-label="Increase seats"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-muted-light">
                        {seatTypeInfo
                          ? `Up to ${seatTypeInfo.maxSeats} seats (${seatTypeInfo.label}).`
                          : booking.seatTypeHintEmpty}
                        {seatTypeInfo && tier && !isMoment && Number.isFinite(tierFree)
                          ? ` ${booking.seatsFree.replace("{count}", String(tierFree))}.`
                          : ""}
                        {seatTypeInfo?.wholeTable && seats === seatTypeInfo.maxSeats
                          ? ` ${booking.wholeTableHint.replace("{count}", String(seats))}`
                          : ""}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-7">
                  <label className={fieldLabelClass()} htmlFor="booking-date">
                    Date
                  </label>
                  <DatePicker
                    id="booking-date"
                    value={date}
                    onChange={setDate}
                    min={colomboToday()}
                    isDateDisabled={isClosedDay}
                    placeholder={dateEnabled ? "Select a date" : "Choose a space first"}
                  />
                </div>

                <div className="mb-7">
                  <label className={fieldLabelClass()} htmlFor="booking-package">
                    {booking.packageLabel}
                  </label>
                  <CustomSelect
                    id="booking-package"
                    disabled={!tierEnabled}
                    value={tier}
                    onChange={handleTierChange}
                    placeholder={booking.packagePlaceholder}
                    options={packageOptions}
                  />

                  <AnimatePresence>
                    {isMoment && (
                      <motion.div
                        initial={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        onAnimationStart={() => setClipMomentPanel(true)}
                        onAnimationComplete={() => setClipMomentPanel(false)}
                        className={clipMomentPanel ? "overflow-hidden" : undefined}
                      >
                        <div className="mt-4 flex gap-4 border border-ink/15 bg-cream-2 p-4">
                          <div className="flex-1">
                            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-muted">
                              Start Time
                            </label>
                            <CustomSelect
                              value={hourlyStart}
                              onChange={handleStartChange}
                              placeholder="Start time"
                              options={booking.hourlyStartTimes.map((t) => ({ value: t, label: t }))}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-muted">
                              Duration
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                disabled={momentHours <= 1}
                                onClick={() => setMomentHours((h) => Math.max(1, h - 1))}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-base leading-none transition-colors hover:border-olive disabled:pointer-events-none disabled:opacity-30"
                                aria-label="Decrease hours"
                              >
                                −
                              </button>
                              <span className="text-sm">
                                {momentHours} hour{momentHours > 1 ? "s" : ""}
                              </span>
                              <button
                                type="button"
                                disabled={momentHours >= momentMaxHours}
                                onClick={() => setMomentHours((h) => Math.min(momentMaxHours, h + 1))}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-base leading-none transition-colors hover:border-olive disabled:pointer-events-none disabled:opacity-30"
                                aria-label="Increase hours"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        {!tierAvailable && (
                          <p className="mt-2 text-xs text-muted">{booking.momentUnavailable}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <hr className="mb-8 border-t border-ink/10" />

                {/* Booking summary as text, with Book Now */}
                <div aria-live="polite">
                  <Eyebrow className="mb-4">{booking.summaryTitle}</Eyebrow>

                  {cart.length > 0 && (
                    <ul className="mb-4 flex flex-col">
                      {cart.map((item) => (
                        <li key={item.id} className="flex items-start justify-between gap-3 border-b border-ink/10 py-3">
                          <div>
                            <p className="text-sm font-bold text-ink">{itemTitle(item)}</p>
                            <p className="mt-0.5 text-sm text-muted">{itemDetail(item)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="whitespace-nowrap text-sm font-bold text-ink">
                              LKR {Math.round(item.price).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(item.id)}
                              aria-label="Remove booking"
                              className="text-muted transition-colors hover:text-ink"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {currentParts.length > 0 ? (
                    <p className="text-base leading-relaxed text-ink">{currentParts.join(" · ")}</p>
                  ) : (
                    cart.length === 0 && <p className="text-sm leading-relaxed text-muted">{booking.summaryEmpty}</p>
                  )}

                  {currentValid && (
                    <div className="mt-3 flex justify-between text-base font-bold text-ink">
                      <span>{booking.bookingTotalLabel}</span>
                      <span>LKR {Math.round(currentTotal).toLocaleString()}</span>
                    </div>
                  )}

                  {cart.length > 0 && (
                    <div className="mt-4 flex justify-between border-t border-ink/15 pt-4 text-lg font-bold text-ink">
                      <span>{booking.grandTotalLabel}</span>
                      <span>LKR {Math.round(grandTotal).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button onClick={handleConfirm} disabled={!canConfirm} className="shrink-0">
                      {booking.confirmLabel}
                    </Button>
                    <Button variant="outline" onClick={handleAddAnother} disabled={!currentValid} className="shrink-0">
                      {booking.addAnotherLabel}
                    </Button>
                  </div>

                  <p className="mt-6 text-[11px] uppercase tracking-[0.08em] text-muted-light">
                    {poweredBy.prefix}
                    <a
                      href={poweredBy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-2 transition-colors hover:text-olive hover:underline"
                    >
                      {poweredBy.name}
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
