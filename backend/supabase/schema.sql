-- Supabase schema for TheCalista (idempotent)
-- Run in Supabase SQL editor.

-- Users table (custom auth)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text,
  role text not null default 'customer',
  avatar text,
  phone text,
  email_verified boolean not null default false,
  google_id text,
  refresh_token_hash text,
  refresh_token_expires timestamptz,
  password_reset_token text,
  password_reset_expires timestamptz,
  email_verification_token text,
  email_verification_expires timestamptz,
  addresses jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products table should already exist. Minimal shape (only if you don't have it):
-- create table if not exists public.products (
--   id uuid primary key default gen_random_uuid(),
--   name text not null,
--   slug text unique not null,
--   brand text,
--   price numeric not null,
--   images text[] default '{}',
--   description text,
--   category text,
--   collection text,
--   sizes text[] default '{}',
--   colors text[] default '{}',
--   tags text[] default '{}',
--   inStock boolean default true,
--   stockQuantity int default 0,
--   rating numeric default 0,
--   reviews int default 0,
--   isNew boolean default false,
--   isBestSeller boolean default false,
--   isOnSale boolean default false,
--   isFeatured boolean default false,
--   createdAt timestamptz default now()
-- );

-- Create collections table if not exists
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image text,
  isActive boolean not null default true,
  sortOrder int not null default 0,
  createdAt timestamptz not null default now()
);

-- Create products table if not exists
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  brand text,
  price numeric not null default 0,
  images text[] not null default '{}',
  description text,
  category text,
  collection text,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  tags text[] not null default '{}',
  "inStock" boolean not null default true,
  "stockQuantity" int not null default 0,
  rating numeric not null default 0,
  reviews int not null default 0,
  "isNew" boolean not null default false,
  "isBestSeller" boolean not null default false,
  "isOnSale" boolean not null default false,
  "isFeatured" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

-- RLS policies for collections/products (public readable)
alter table public.collections enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='collections' and policyname='public read collections'
  ) then
    create policy "public read collections" on public.collections for select using (true);
  end if;
end $$;

alter table public.products enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='public read products'
  ) then
    create policy "public read products" on public.products for select using (true);
  end if;
end $$;

-- Carts
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id text not null,
  size text not null,
  color text not null,
  quantity int not null check (quantity > 0),
  price numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists cart_items_cart_idx on public.cart_items(cart_id);

-- Wishlists
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

-- Orders (skeleton)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_number text not null unique,
  subtotal numeric not null default 0,
  shipping_cost numeric not null default 0,
  tax numeric not null default 0,
  total_amount numeric not null default 0,
  payment_method text,
  payment_status text default 'pending',
  order_status text default 'pending',
  shipping_address jsonb,
  billing_address jsonb,
  notes text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);

-- Add Razorpay columns if running on an existing DB
alter table public.orders add column if not exists razorpay_order_id text;
alter table public.orders add column if not exists razorpay_payment_id text;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  image text,
  size text,
  color text,
  quantity int not null,
  price numeric not null,
  total numeric not null,
  created_at timestamptz not null default now()
);

-- RLS policies (basic)
alter table public.users enable row level security;
create policy if not exists "users_self_select" on public.users for select using (auth.role() = 'anon' or true);
-- For backend service role, we bypass RLS using service key.

-- =====================
-- Admin schema
-- =====================
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null default 'viewer', -- master, product_manager, order_manager, support, marketing, viewer
  two_factor_enabled boolean not null default false,
  two_factor_secret text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_activity timestamptz not null default now(),
  ip text,
  user_agent text
);

create table if not exists public.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text,
  ip text,
  success boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.admin_users(id) on delete set null,
  action text not null,
  path text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
