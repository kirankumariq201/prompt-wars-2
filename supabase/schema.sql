create table merchants(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 city text not null,
 reliability numeric(5,4) not null default .80,
 is_online boolean not null default true,
 created_at timestamptz not null default now()
);
create table skus(
 id uuid primary key default gen_random_uuid(),
 canonical_name text not null unique,
 category text,
 barcode text
);
create table merchant_skus(
 merchant_id uuid references merchants(id) on delete cascade,
 sku_id uuid references skus(id) on delete cascade,
 merchant_name text not null,
 on_hand integer not null default 0,
 confidence numeric(5,4) not null default 0,
 last_synced_at timestamptz,
 sync_interval_hours numeric(8,2) not null default 8,
 recent_fulfilled integer not null default 0,
 recent_failed integer not null default 0,
 primary key(merchant_id,sku_id)
);
create table inventory_events(
 id bigint generated always as identity primary key,
 merchant_id uuid references merchants(id),
 sku_id uuid references skus(id),
 event_type text not null check(event_type in('SYNC','SOLD_OUT','RESTOCK','VERIFY')),
 quantity integer,
 source text not null default 'merchant_pwa',
 created_at timestamptz not null default now()
);
create table orders(
 id uuid primary key default gen_random_uuid(),
 customer_id uuid,
 status text not null,
 total_amount numeric(10,2) not null,
 promised_minutes integer,
 assigned_store_count integer,
 created_at timestamptz not null default now()
);
create table order_items(
 order_id uuid references orders(id) on delete cascade,
 sku_id uuid references skus(id),
 merchant_id uuid references merchants(id),
 quantity integer not null,
 fulfillment_status text not null default 'PENDING',
 primary key(order_id,sku_id,merchant_id)
);
create table delivery_telemetry(
 id bigint generated always as identity primary key,
 order_id uuid references orders(id) on delete cascade,
 event_type text not null,
 eta_minutes integer,
 actual_minutes integer,
 created_at timestamptz not null default now()
);
create table merchant_sla_profiles(
 merchant_id uuid primary key references merchants(id) on delete cascade,
 prep_p50 integer not null default 8,
 prep_p90 integer not null default 12,
 courier_p50 integer not null default 10,
 courier_p90 integer not null default 15,
 buffer_minutes integer not null default 4,
 updated_at timestamptz not null default now()
);
create index merchant_skus_confidence_idx on merchant_skus(confidence);
create index inventory_events_created_idx on inventory_events(created_at desc);
create index delivery_telemetry_order_idx on delivery_telemetry(order_id);