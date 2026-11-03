create extension if not exists pgcrypto;

create table admin_users(id uuid primary key references auth.users(id) on delete cascade, email text not null, role text not null default 'admin', created_at timestamptz not null default now());
create table customers(id uuid primary key default gen_random_uuid(), first_name text not null, last_name text not null, phone text not null, email text, created_at timestamptz not null default now());
create index on customers(phone);
create table routes(id uuid primary key default gen_random_uuid(), departure_city text not null, arrival_city text not null, estimated_duration text, is_active boolean not null default true, unique(departure_city,arrival_city), check(departure_city<>arrival_city));
create table vehicles(id uuid primary key default gen_random_uuid(), registration text not null unique, brand text, model text, type text default 'Minibus', capacity int not null check(capacity>0), status text not null default 'disponible');
create table trips(id uuid primary key default gen_random_uuid(), route_id uuid not null references routes(id), vehicle_id uuid references vehicles(id), departure_time timestamptz not null, arrival_time timestamptz, price int not null check(price>=0), total_seats int not null check(total_seats>0), available_seats int not null, status text not null default 'programme' check(status in ('programme','en_cours','termine','annule')), check(available_seats between 0 and total_seats));
create index on trips(departure_time);
create table reservations(id uuid primary key default gen_random_uuid(), customer_id uuid not null references customers(id), trip_id uuid not null references trips(id), booking_reference text not null unique, seats int not null check(seats>0), total_amount int not null, reservation_status text not null default 'en_attente' check(reservation_status in ('en_attente','confirmee','refusee','annulee','terminee')), expires_at timestamptz, note text, created_at timestamptz not null default now());
create index on reservations(trip_id);
create table payments(id uuid primary key default gen_random_uuid(), reservation_id uuid not null references reservations(id) on delete cascade, payment_method text not null check(payment_method in ('wave','orange_money')), amount int not null, transaction_reference text, payment_status text not null default 'en_attente' check(payment_status in ('en_attente','paye','echoue','rembourse')), paid_at timestamptz, created_at timestamptz not null default now());
create table activity_logs(id uuid primary key default gen_random_uuid(), admin_id uuid, action text not null, description text, created_at timestamptz not null default now());
create table app_settings(key text primary key, value text not null);
insert into app_settings values('reservation_validity_minutes','30');

create function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from admin_users where id=auth.uid()) $$;

alter table admin_users enable row level security; alter table customers enable row level security; alter table routes enable row level security; alter table vehicles enable row level security; alter table trips enable row level security; alter table reservations enable row level security; alter table payments enable row level security; alter table activity_logs enable row level security; alter table app_settings enable row level security;
do $$ declare t text; begin foreach t in array array['admin_users','customers','routes','vehicles','trips','reservations','payments','activity_logs','app_settings'] loop
 execute format('create policy admin_all on %I for all using(is_admin()) with check(is_admin())',t); end loop; end $$;
create policy public_routes on routes for select using(is_active);
create policy public_trips on trips for select using(status='programme');
create policy public_vehicles on vehicles for select using(true);

create function expire_reservations() returns void language plpgsql security definer set search_path=public as $$
declare r record;
begin
 for r in select id,trip_id,seats from reservations where reservation_status='en_attente' and expires_at<now() and not exists(select 1 from payments p where p.reservation_id=reservations.id and p.payment_status='paye') for update skip locked loop
  update reservations set reservation_status='annulee' where id=r.id;
  update trips set available_seats=available_seats+r.seats where id=r.trip_id;
  update payments set payment_status='echoue' where reservation_id=r.id and payment_status='en_attente';
 end loop;
end $$;

create function create_reservation(p_trip uuid,p_first text,p_last text,p_phone text,p_email text,p_seats int,p_note text,p_method text) returns text language plpgsql security definer set search_path=public as $$
declare t trips%rowtype; c uuid; ref text; rid uuid;
begin
 perform expire_reservations();
 if p_seats<1 or p_seats>10 or length(trim(p_phone))<8 or length(trim(p_first))<1 or length(trim(p_last))<1 then raise exception 'Données invalides'; end if;
 select * into t from trips where id=p_trip for update;
 if not found or t.status<>'programme' or t.departure_time<=now() then raise exception 'Voyage indisponible'; end if;
 if t.available_seats<p_seats then raise exception 'Places insuffisantes'; end if;
 select id into c from customers where phone=trim(p_phone) and lower(first_name)=lower(trim(p_first)) and lower(last_name)=lower(trim(p_last)) limit 1;
 if c is null then insert into customers(first_name,last_name,phone,email) values(trim(p_first),trim(p_last),trim(p_phone),nullif(trim(p_email),'')) returning id into c; end if;
 update trips set available_seats=available_seats-p_seats where id=p_trip;
 ref:='KV-'||upper(encode(gen_random_bytes(4),'hex'));
 insert into reservations(customer_id,trip_id,booking_reference,seats,total_amount,expires_at,note)
  values(c,p_trip,ref,p_seats,t.price*p_seats,now()+make_interval(mins=>coalesce((select value::int from app_settings where key='reservation_validity_minutes'),30)),left(p_note,500)) returning id into rid;
 insert into payments(reservation_id,payment_method,amount) values(rid,p_method,t.price*p_seats);
 return ref;
end $$;

create function lookup_reservation(p_ref text,p_phone text) returns json language sql security definer set search_path=public as $$
 select json_build_object('reference',r.booking_reference,'name',c.first_name||' '||c.last_name,'seats',r.seats,'total',r.total_amount,'status',r.reservation_status,'expires_at',r.expires_at,'departure',ro.departure_city,'arrival',ro.arrival_city,'departure_time',t.departure_time,'payment_status',p.payment_status,'payment_method',p.payment_method)
 from reservations r join customers c on c.id=r.customer_id join trips t on t.id=r.trip_id join routes ro on ro.id=t.route_id left join payments p on p.reservation_id=r.id
 where r.booking_reference=upper(trim(p_ref)) and c.phone=trim(p_phone) limit 1 $$;

create function admin_set_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$
declare r reservations%rowtype;
begin
 if not is_admin() then raise exception 'Accès refusé'; end if;
 select * into r from reservations where id=p_id for update;
 if not found then raise exception 'Introuvable'; end if;
 if r.reservation_status in('refusee','annulee','terminee') then raise exception 'Statut final'; end if;
 if p_status='confirmee' and not exists(select 1 from payments where reservation_id=p_id and payment_status='paye') then raise exception 'Paiement non vérifié'; end if;
 if p_status in('refusee','annulee') then update trips set available_seats=available_seats+r.seats where id=r.trip_id; end if;
 update reservations set reservation_status=p_status where id=p_id;
 insert into activity_logs(admin_id,action,description) values(auth.uid(),'reservation_'||p_status,r.booking_reference);
end $$;

create function admin_set_payment(p_reservation uuid,p_status text,p_tx text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not is_admin() then raise exception 'Accès refusé'; end if;
 update payments set payment_status=p_status,transaction_reference=p_tx,paid_at=case when p_status='paye' then now() else paid_at end where reservation_id=p_reservation;
 insert into activity_logs(admin_id,action,description) values(auth.uid(),'paiement_'||p_status,p_reservation::text||' '||coalesce(p_tx,''));
end $$;
