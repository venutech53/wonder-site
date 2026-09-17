-- Wonder Park Road catalog setup (Venu project cxwvtfbkltrpkhkcregy). Idempotent: safe to re-run.
-- Source of truth for names/times/prices: wonder-site lib/content.ts + lib/booking-rules.ts.
--
-- Opening hours (space_schedules, every Wonder space): Mon–Sat 09:00–19:00, Sunday closed.
-- Bookable units (every seat, pod, standalone room) get, Mon–Sat:
--   Cycle Morning 09:00–14:00 · Cycle Evening 14:00–19:00 · Sojourn 09:00–19:00 · hourly (Moment)
-- The 6-seater and 4-seater tables also get the same packages at table price (seat price × seats),
-- so a whole table is ONE booking (venu-api item whole_space: true).
-- Superseded packages (Half Day*, Full Day, placeholder "Cycle") are deactivated, not deleted.
-- Pod and room prices are placeholders until Wonder sets real pricing.

create temp table wonder_prices (kind text primary key, hourly numeric, cycle numeric, sojourn numeric) on commit drop;
insert into wonder_prices values
  ('seat',          500,  2000,  3500),
  ('table6',       3000, 12000, 21000), -- whole 6-seater = 6 seats
  ('table4',       2000,  8000, 14000), -- whole 4-seater = 4 seats
  ('pod',           700,  2800,  4800),
  ('board',        1500,  6000, 10000),
  ('conversation', 1200,  4800,  8000);

-- 1. Spaces that don't exist yet: Solo Pods (2 pods), Board Room, Conversation Room (the meeting room)
insert into public.spaces (venue_id, name, description, icon, booking_mode, booking_type, offers_packages, offers_hourly,
                           price_per_hour, minimum_booking_minutes, is_public, currency)
select '8071a4c8-6e54-4ec0-9f2a-12ab8ffaa3f0', n.name, n.description, 'square', n.mode::public.booking_mode, 'packages', true, n.hourly,
       n.price, 60, true, 'LKR'
from (values
  ('Solo Pods', 'A quiet, enclosed pod built for calls and deep work.', 'inherit', false, null::numeric),
  ('Board Room', 'A considered room for the conversations that matter. Seats up to 8.', 'independent', true, 1500),
  ('Conversation Room', 'A relaxed lounge setting for pitches, workshops, and client conversations. Seats up to 8.', 'independent', true, 1200)
) as n(name, description, mode, hourly, price)
where not exists (
  select 1 from public.spaces s
  where s.venue_id = '8071a4c8-6e54-4ec0-9f2a-12ab8ffaa3f0' and s.main_space_id is null and s.name = n.name
);

-- Child units: 2 pods, 10 window seats (Individual Desk)
insert into public.spaces (venue_id, main_space_id, name, icon, booking_mode, booking_type, offers_packages, offers_hourly,
                           price_per_hour, is_public, currency)
select parent.venue_id, parent.id, n.name, 'square', 'adaptive', 'packages', true, true, n.price, true, 'LKR'
from public.spaces parent
join (
  select 'Solo Pods' as parent_name, 'Pod #' || i as name, 700 as price from generate_series(1, 2) as i
  union all
  select 'Window Seats', 'Seat #' || i, 500 from generate_series(1, 10) as i
) as n on n.parent_name = parent.name
where parent.venue_id = '8071a4c8-6e54-4ec0-9f2a-12ab8ffaa3f0' and parent.main_space_id is null
  and not exists (select 1 from public.spaces c where c.main_space_id = parent.id and c.name = n.name);

-- 2. Every Wonder space, its price kind, and whether it is sold (has packages + hourly rate)
create temp table wonder_units on commit drop as
select s.id,
       k.kind,
       (k.kind in ('table6', 'table4')
         or s.main_space_id is not null
         or not exists (select 1 from public.spaces c where c.main_space_id = s.id)) as sellable
from public.spaces s
left join public.spaces p on p.id = s.main_space_id
cross join lateral (
  select case
    when s.main_space_id is null and s.name = 'Six Seater' then 'table6'
    when s.main_space_id is null and s.name = 'Four Seater' then 'table4'
    when coalesce(p.name, s.name) = 'Solo Pods' then 'pod'
    when coalesce(p.name, s.name) = 'Board Room' then 'board'
    when coalesce(p.name, s.name) = 'Conversation Room' then 'conversation'
    else 'seat'
  end as kind
) as k
where s.venue_id = '8071a4c8-6e54-4ec0-9f2a-12ab8ffaa3f0'
  and coalesce(p.name, s.name) in ('Four Seater', 'Six Seater', 'Window Seats', 'Solo Pods', 'Board Room', 'Conversation Room');

-- 3. Opening hours before enabling hourly (so venu-admin's seed-from-packages trigger doesn't invent its own)
insert into public.space_schedules (space_id, day_of_week, is_open, open_time, close_time)
select u.id, d, d <> 0, case when d <> 0 then time '09:00' end, case when d <> 0 then time '19:00' end
from wonder_units u cross join generate_series(0, 6) as d
on conflict (space_id, day_of_week) do update
set is_open = excluded.is_open, open_time = excluded.open_time, close_time = excluded.close_time;

-- 4. Packages: retire superseded ones, then upsert Cycle Morning / Cycle Evening / Sojourn
update public.space_packages set is_active = false
where space_id in (select id from wonder_units)
  and name not in ('Cycle Morning', 'Cycle Evening', 'Sojourn')
  and is_active;

with defs as (
  select u.id as space_id, d.name, d.start_time, d.end_time, d.sort_order,
         case d.tier when 'cycle' then pr.cycle else pr.sojourn end as price
  from wonder_units u
  join wonder_prices pr on pr.kind = u.kind
  cross join (values
    ('Cycle Morning', time '09:00', time '14:00', 'cycle', 10),
    ('Cycle Evening', time '14:00', time '19:00', 'cycle', 11),
    ('Sojourn',       time '09:00', time '19:00', 'sojourn', 12)
  ) as d(name, start_time, end_time, tier, sort_order)
  where u.sellable
), updated as (
  update public.space_packages p
  set start_time = d.start_time, end_time = d.end_time, price = d.price, currency = 'LKR',
      days_of_week = array[1,2,3,4,5,6], is_active = true, sort_order = d.sort_order
  from defs d
  where p.space_id = d.space_id and p.name = d.name
  returning p.space_id, p.name
)
insert into public.space_packages (space_id, name, start_time, end_time, price, currency, days_of_week, is_active, sort_order)
select d.space_id, d.name, d.start_time, d.end_time, d.price, 'LKR', array[1,2,3,4,5,6], true, d.sort_order
from defs d
where not exists (select 1 from updated x where x.space_id = d.space_id and x.name = d.name);

-- 5. Hourly (Moment) rate
update public.spaces s
set offers_hourly = true, price_per_hour = pr.hourly
from wonder_units u
join wonder_prices pr on pr.kind = u.kind
where s.id = u.id and u.sellable
  and (not s.offers_hourly or s.price_per_hour is distinct from pr.hourly);

-- Verification
select coalesce(p.name, s.name) as space,
       count(distinct s.id) filter (where s.main_space_id is not null) as child_units,
       string_agg(distinct case when s.main_space_id is null then 'whole' else 'unit' end || ' ' || coalesce(s.price_per_hour::int::text, '-'), ', ')
         filter (where u.sellable) as hourly,
       string_agg(distinct case when s.main_space_id is null then 'whole ' else '' end || pk.name || ' '
         || to_char(pk.start_time, 'HH24:MI') || '-' || to_char(pk.end_time, 'HH24:MI') || ' ' || pk.price::int, ' | ')
         filter (where pk.is_active) as active_packages,
       string_agg(distinct to_char(sc.open_time, 'HH24:MI') || '-' || to_char(sc.close_time, 'HH24:MI'), ',') filter (where sc.is_open) as open_hours,
       count(distinct sc.id) filter (where not sc.is_open) as closed_days
from wonder_units u
join public.spaces s on s.id = u.id
left join public.spaces p on p.id = s.main_space_id
left join public.space_packages pk on pk.space_id = s.id
left join public.space_schedules sc on sc.space_id = s.id
group by coalesce(p.name, s.name)
order by 1;
