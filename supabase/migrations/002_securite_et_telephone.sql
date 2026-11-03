-- 002 : normalisation des téléphones, anti-abus, correctif paiement, vehicles
-- À exécuter dans Supabase > SQL Editor APRÈS 001_init.sql.

-- ─────────────────────────────────────────────────────────────
-- 1. Normalisation des numéros : toujours +221XXXXXXXXX
--    (doit rester cohérent avec src/utils/phone.ts)
-- ─────────────────────────────────────────────────────────────
create or replace function normalize_phone(p text) returns text language plpgsql immutable as $$
declare d text := regexp_replace(coalesce(p,''),'[^0-9+]','','g');
begin
 if left(d,2)='00' then d := '+'||substr(d,3); end if;
 if left(d,1)='+' then return '+'||regexp_replace(substr(d,2),'\D','','g'); end if;
 d := regexp_replace(d,'\D','','g');
 if left(d,3)='221' and length(d)=12 then return '+'||d; end if;
 if length(d)=9 then return '+221'||d; end if;
 return d;
end $$;

-- Met à jour les clients existants
update customers set phone = normalize_phone(phone) where phone <> normalize_phone(phone);

-- ─────────────────────────────────────────────────────────────
-- 2. Journal d'événements pour limiter les abus (rate limiting)
-- ─────────────────────────────────────────────────────────────
create table if not exists rate_events(
  id bigint generated always as identity primary key,
  kind text not null,
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_events_idx on rate_events(kind, key, at);
alter table rate_events enable row level security;
drop policy if exists admin_all on rate_events;
create policy admin_all on rate_events for all using(is_admin()) with check(is_admin());

-- Adresse IP du client telle que transmise par l'API Supabase ('unknown' si absente)
create or replace function client_ip() returns text language sql stable as $$
 select coalesce(
   nullif(trim(split_part(coalesce((nullif(current_setting('request.headers', true), '')::json)->>'x-forwarded-for', ''), ',', 1)), ''),
   'unknown')
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. create_reservation : téléphone normalisé + limites anti-blocage de places
--    - max 3 réservations en attente par numéro
--    - max 10 demandes par heure et par adresse IP
-- ─────────────────────────────────────────────────────────────
create or replace function create_reservation(p_trip uuid,p_first text,p_last text,p_phone text,p_email text,p_seats int,p_note text,p_method text) returns text language plpgsql security definer set search_path=public as $$
declare t trips%rowtype; c uuid; ref text; rid uuid; ph text := normalize_phone(p_phone); ip text := client_ip();
begin
 perform expire_reservations();
 delete from rate_events where at < now() - interval '1 day';

 if p_seats<1 or p_seats>10 or length(trim(p_first))<1 or length(trim(p_last))<1 then raise exception 'Données invalides'; end if;
 if ph !~ '^\+2217[05678][0-9]{7}$' then raise exception 'Numéro de téléphone invalide'; end if;
 if p_method not in ('wave','orange_money') then raise exception 'Moyen de paiement invalide'; end if;

 if ip <> 'unknown' and (select count(*) from rate_events where kind='reserve' and key=ip and at > now() - interval '1 hour') >= 10 then
   raise exception 'Trop de demandes. Réessayez plus tard.';
 end if;
 if (select count(*) from reservations r join customers cu on cu.id=r.customer_id
      where cu.phone=ph and r.reservation_status='en_attente' and r.expires_at>now()) >= 3 then
   raise exception 'Vous avez déjà 3 réservations en attente. Payez-les ou attendez leur expiration.';
 end if;

 select * into t from trips where id=p_trip for update;
 if not found or t.status<>'programme' or t.departure_time<=now() then raise exception 'Voyage indisponible'; end if;
 if t.available_seats<p_seats then raise exception 'Places insuffisantes'; end if;

 select id into c from customers where phone=ph and lower(first_name)=lower(trim(p_first)) and lower(last_name)=lower(trim(p_last)) limit 1;
 if c is null then insert into customers(first_name,last_name,phone,email) values(trim(p_first),trim(p_last),ph,nullif(trim(p_email),'')) returning id into c; end if;

 update trips set available_seats=available_seats-p_seats where id=p_trip;
 ref:='KV-'||upper(encode(gen_random_bytes(4),'hex'));
 insert into reservations(customer_id,trip_id,booking_reference,seats,total_amount,expires_at,note)
  values(c,p_trip,ref,p_seats,t.price*p_seats,now()+make_interval(mins=>coalesce((select value::int from app_settings where key='reservation_validity_minutes'),30)),left(p_note,500)) returning id into rid;
 insert into payments(reservation_id,payment_method,amount) values(rid,p_method,t.price*p_seats);

 if ip <> 'unknown' then insert into rate_events(kind,key) values('reserve',ip); end if;
 return ref;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 4. lookup_reservation : téléphone normalisé + blocage après 10 échecs / 15 min / IP
-- ─────────────────────────────────────────────────────────────
create or replace function lookup_reservation(p_ref text,p_phone text) returns json language plpgsql security definer set search_path=public as $$
declare ph text := normalize_phone(p_phone); ip text := client_ip(); res json;
begin
 if ip <> 'unknown' and (select count(*) from rate_events where kind='lookup_fail' and key=ip and at > now() - interval '15 minutes') >= 10 then
   raise exception 'Trop de tentatives. Réessayez dans quelques minutes.';
 end if;

 select json_build_object('reference',r.booking_reference,'name',c.first_name||' '||c.last_name,'seats',r.seats,'total',r.total_amount,'status',r.reservation_status,'expires_at',r.expires_at,'departure',ro.departure_city,'arrival',ro.arrival_city,'departure_time',t.departure_time,'payment_status',p.payment_status,'payment_method',p.payment_method)
 into res
 from reservations r join customers c on c.id=r.customer_id join trips t on t.id=r.trip_id join routes ro on ro.id=t.route_id left join payments p on p.reservation_id=r.id
 where r.booking_reference=upper(trim(p_ref)) and c.phone=ph limit 1;

 if res is null and ip <> 'unknown' then insert into rate_events(kind,key) values('lookup_fail',ip); end if;
 return res;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 5. admin_set_payment : plus de paiement sur une réservation annulée/expirée,
--    référence de transaction obligatoire et non réutilisable
-- ─────────────────────────────────────────────────────────────
create or replace function admin_set_payment(p_reservation uuid,p_status text,p_tx text) returns void language plpgsql security definer set search_path=public as $$
declare r reservations%rowtype; tx text := nullif(trim(coalesce(p_tx,'')),'');
begin
 if not is_admin() then raise exception 'Accès refusé'; end if;
 if p_status not in ('en_attente','paye','echoue','rembourse') then raise exception 'Statut de paiement invalide'; end if;

 select * into r from reservations where id=p_reservation for update;
 if not found then raise exception 'Réservation introuvable'; end if;

 if p_status='paye' then
   if r.reservation_status in ('annulee','refusee') then
     raise exception 'Réservation annulée ou expirée : les places ont été libérées. Recréez la réservation ou remboursez le client.';
   end if;
   if tx is null then raise exception 'Référence de transaction obligatoire'; end if;
   if exists(select 1 from payments where transaction_reference=tx and payment_status='paye' and reservation_id<>p_reservation) then
     raise exception 'Cette référence de transaction est déjà utilisée pour une autre réservation';
   end if;
 end if;

 update payments set payment_status=p_status,
   transaction_reference=coalesce(tx, transaction_reference),
   paid_at=case when p_status='paye' then coalesce(paid_at, now()) else paid_at end
 where reservation_id=p_reservation;
 insert into activity_logs(admin_id,action,description) values(auth.uid(),'paiement_'||p_status,r.booking_reference||' '||coalesce(tx,''));
end $$;

-- ─────────────────────────────────────────────────────────────
-- 6. vehicles : le public ne voit plus les immatriculations
--    (seules les colonnes utiles à la recherche restent lisibles)
-- ─────────────────────────────────────────────────────────────
revoke select on vehicles from anon;
grant select (id, brand, model, type, capacity) on vehicles to anon;
