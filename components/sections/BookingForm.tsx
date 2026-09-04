"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import {
  booking,
  hotDeskSeatTypes,
  packageTiers,
  poweredBy,
  SPACE_PRICING,
  spaces,
} from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { CustomSelect } from "@/components/ui/CustomSelect";
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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
  return info.label.split(" — ")[0];
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const selectedSpace = spaces.items.find((s) => s.key === space) ?? null;
  const isHotDesk = space === "hot-desks";
  const pricing = space ? SPACE_PRICING[space] : undefined;

  const dateEnabled = Boolean(space);
  const seatTypeInfo = hotDeskSeatTypes.find((t) => t.value === seatType) ?? null;
  const seatTypeEnabled = isHotDesk && Boolean(date);
  const seatsEnabled = isHotDesk && Boolean(seatType);
  const tierEnabled = isHotDesk ? Boolean(seatType) && seats > 0 : Boolean(date);
  const isMoment = tier === "moment";

  const hours = isMoment ? momentHours : tier === "cycle" ? 5 : tier === "sojourn" ? 10 : 0;
  const unitPrice = pricing
    ? tier === "moment"
      ? pricing.moment * momentHours
      : tier === "cycle"
        ? pricing.cycle
        : tier === "sojourn"
          ? pricing.sojourn
          : 0
    : 0;
  const currentTotal = unitPrice * (isHotDesk ? seats : 1);

  const currentValid = Boolean(space && date && tier && (!isHotDesk || (seatType && seats > 0)));

  const grandTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price, 0) + (currentValid ? currentTotal : 0),
    [cart, currentValid, currentTotal]
  );
  const canConfirm = cart.length > 0 || currentValid;

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
    setCart(finalCart);
    setConfirmed(true);
  };

  return (
    <section data-header-text="ink" style={paperTexture("#f2f0e4")} className="py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6 md:px-10">
        <Eyebrow>{booking.eyebrow}</Eyebrow>
        <h1 className="mt-4 text-[32px] font-bold uppercase leading-[1.1] text-ink md:text-[40px]">
          {booking.heading}
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{booking.intro}</p>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,480px)_320px] lg:gap-16">
          {/* Form column */}
          <div className="flex flex-col">
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
              <p className="mb-7 text-xs text-muted-light">
                {selectedSpace.capacity === 1
                  ? "This space seats 1 person."
                  : `This space accommodates up to ${selectedSpace.capacity} people.`}
              </p>
            )}

            <div className="mb-7">
              <label className={fieldLabelClass()} htmlFor="booking-date">
                Date
              </label>
              <DatePicker
                id="booking-date"
                value={date}
                onChange={setDate}
                min={todayISO()}
                placeholder={dateEnabled ? "Select a date" : "Choose a space first"}
              />
            </div>

            {isHotDesk && (
              <div className="mb-7">
                <label className={fieldLabelClass()} htmlFor="booking-seat-type">
                  {booking.seatTypeLabel}
                </label>
                <CustomSelect
                  id="booking-seat-type"
                  disabled={!seatTypeEnabled}
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
                    <span className="min-w-[1.5rem] text-center text-base font-bold text-ink">
                      {seats}
                    </span>
                    <button
                      type="button"
                      disabled={!seatsEnabled || seats >= (seatTypeInfo?.maxSeats ?? 1)}
                      onClick={() =>
                        setSeats((s) => Math.min(seatTypeInfo?.maxSeats ?? 1, s + 1))
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-base leading-none transition-colors hover:border-olive disabled:pointer-events-none disabled:opacity-30"
                      aria-label="Increase seats"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-muted-light">
                    {seatTypeInfo
                      ? `Up to ${seatTypeInfo.maxSeats} seat${seatTypeInfo.maxSeats > 1 ? "s" : ""} at this ${seatTypeInfo.label.toLowerCase()}.`
                      : booking.seatTypeHintEmpty}
                  </span>
                </div>
              </div>
            )}

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
                options={packageTiers.map((t) => ({ value: t.value, label: t.label }))}
              />

              <AnimatePresence>
                {isMoment && (
                  <motion.div
                    initial={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex gap-4 border border-ink/15 bg-cream-2 p-4">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-muted">
                          Start Time
                        </label>
                        <CustomSelect
                          value={hourlyStart}
                          onChange={setHourlyStart}
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
                            onClick={() => setMomentHours((h) => Math.max(1, h - 1))}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-base leading-none transition-colors hover:border-olive"
                            aria-label="Decrease hours"
                          >
                            −
                          </button>
                          <span className="text-sm">
                            {momentHours} hour{momentHours > 1 ? "s" : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMomentHours((h) => Math.min(12, h + 1))}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-base leading-none transition-colors hover:border-olive"
                            aria-label="Increase hours"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <hr className="my-8 border-t border-ink/8" />

            <div>
              <label className={fieldLabelClass()}>Your Details</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-ink/15 bg-cream px-3 py-2.5 text-sm text-ink"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-ink/15 bg-cream px-3 py-2.5 text-sm text-ink"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-ink/15 bg-cream px-3 py-2.5 text-sm text-ink sm:col-span-2"
                />
              </div>
            </div>
          </div>

          {/* Sticky summary sidebar */}
          <div className="border border-ink/15 bg-cream-2 p-6 lg:sticky lg:top-[130px] lg:h-fit">
            <AnimatePresence mode="wait">
              {confirmed ? (
                <motion.div
                  key="confirmed"
                  initial={reduceMotion ? undefined : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3"
                >
                  <Eyebrow>{booking.confirmedTitle}</Eyebrow>
                  <p className="text-sm leading-relaxed text-muted">{booking.confirmedBody}</p>
                  <p className="text-sm text-muted">
                    {cart.length} booking{cart.length > 1 ? "s" : ""} · LKR{" "}
                    {Math.round(cart.reduce((sum, i) => sum + i.price, 0)).toLocaleString()}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="summary"
                  initial={reduceMotion ? undefined : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Eyebrow className="mb-4">{booking.summaryTitle}</Eyebrow>

                  {cart.length > 0 && (
                    <div className="mb-4 flex flex-col gap-3">
                      {cart.map((item) => {
                        const itemSpace = spaces.items.find((s) => s.key === item.spaceKey);
                        return (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 border-b border-ink/8 pb-3 text-sm"
                          >
                            <div>
                              <div className="font-bold text-ink">{itemSpace?.nav}</div>
                              <div className="text-xs text-muted">
                                {formatDate(item.date)} · {describeTier(item.tier, item.hours, item.startTime)}
                                {item.seats ? ` · ${item.seats} seats` : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="whitespace-nowrap font-bold text-ink">
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
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-between border-b border-ink/8 py-2.5 text-sm">
                    <span className="text-muted">Space</span>
                    <span className="font-bold text-ink">{selectedSpace?.nav ?? "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-ink/8 py-2.5 text-sm">
                    <span className="text-muted">Date</span>
                    <span className="font-bold text-ink">{date ? formatDate(date) : "—"}</span>
                  </div>
                  {isHotDesk && (
                    <div className="flex justify-between border-b border-ink/8 py-2.5 text-sm">
                      <span className="text-muted">Seats</span>
                      <span className="font-bold text-ink">
                        {seatTypeInfo ? `${seats} · ${seatTypeInfo.label}` : "—"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-ink/8 py-2.5 text-sm">
                    <span className="text-muted">Package</span>
                    <span className="font-bold text-ink">
                      {tier ? describeTier(tier, hours, hourlyStart) : "—"}
                    </span>
                  </div>

                  <div className="mt-3.5 flex justify-between text-base font-bold text-ink">
                    <span>{booking.bookingTotalLabel}</span>
                    <span>LKR {Math.round(currentValid ? currentTotal : 0).toLocaleString()}</span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleAddAnother}
                    disabled={!currentValid}
                    className="mt-4 w-full"
                  >
                    {booking.addAnotherLabel}
                  </Button>

                  {cart.length > 0 && (
                    <div className="mt-4 flex justify-between border-t border-ink/15 pt-4 text-lg font-bold text-ink">
                      <span>{booking.grandTotalLabel}</span>
                      <span>LKR {Math.round(grandTotal).toLocaleString()}</span>
                    </div>
                  )}

                  <Button onClick={handleConfirm} disabled={!canConfirm} className="mt-5 w-full">
                    {booking.confirmLabel}
                  </Button>
                  <p className="mt-3 text-center text-[11px] uppercase tracking-[0.08em] text-muted-light">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
