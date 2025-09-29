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
  originalPrice numeric,
  sku text,
  images text[] not null default '{}',
  description text,
  category text,
  collection text,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  tags text[] not null default '{}',
  status text not null default 'active',
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

-- Add admin-friendly fields if table already existed
alter table public.products add column if not exists originalPrice numeric;
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists status text default 'active';

-- Product images table for media management
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id);

-- Product variants table for size/color/material SKUs
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text,
  color text,
  material text,
  sku text unique,
  stock_quantity int not null default 0,
  price_adjustment numeric not null default 0,
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists product_variants_product_idx on public.product_variants(product_id);

-- =====================
-- Categories
-- =====================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int default 0,
  is_active boolean default true,
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists categories_parent_idx on public.categories(parent_id);

create table if not exists public.product_categories (
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);
create index if not exists product_categories_product_idx on public.product_categories(product_id);
create index if not exists product_categories_category_idx on public.product_categories(category_id);

-- =====================
-- Collections (extend existing)
-- =====================
alter table public.collections add column if not exists banner_url text;
alter table public.collections add column if not exists is_featured boolean default false;
alter table public.collections add column if not exists is_active boolean default true;
alter table public.collections add column if not exists sort_order int default 0;
alter table public.collections add column if not exists start_date timestamptz;
alter table public.collections add column if not exists end_date timestamptz;
alter table public.collections add column if not exists seo_title text;
alter table public.collections add column if not exists seo_description text;
alter table public.collections add column if not exists updated_at timestamptz default now();

create table if not exists public.product_collections (
  product_id uuid references public.products(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete cascade,
  sort_order int default 0,
  primary key (product_id, collection_id)
);
create index if not exists product_collections_product_idx on public.product_collections(product_id);
create index if not exists product_collections_collection_idx on public.product_collections(collection_id);

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

-- =====================
-- Reviews system
-- =====================
-- Customer reviews table
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  reviewer_name varchar not null,
  reviewer_email varchar not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_title varchar(200),
  review_text text not null,
  verified_purchase boolean default false,
  helpful_count integer default 0,
  unhelpful_count integer default 0,
  is_approved boolean default true,
  size_purchased varchar,
  color_purchased varchar,
  fit_feedback varchar, -- 'too_small', 'perfect', 'too_large'
  quality_rating integer check (quality_rating >= 1 and quality_rating <= 5),
  comfort_rating integer check (comfort_rating >= 1 and comfort_rating <= 5),
  style_rating integer check (style_rating >= 1 and style_rating <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Review images table
create table if not exists public.review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  image_url varchar not null,
  image_alt varchar,
  image_type varchar default 'customer_photo', -- 'customer_photo', 'fit_photo', 'quality_photo'
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

-- Review helpfulness tracking
create table if not exists public.review_helpfulness (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  user_ip varchar,
  is_helpful boolean not null, -- true for helpful, false for unhelpful
  created_at timestamptz not null default now(),
  unique(review_id, user_id),
  unique(review_id, user_ip)
);

-- Review responses (admin responses to reviews)
create table if not exists public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  responder_name varchar not null default 'CalistaLife Team',
  response_text text not null,
  is_official boolean default true,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists product_reviews_product_id_idx on public.product_reviews(product_id);
create index if not exists product_reviews_rating_idx on public.product_reviews(rating);
create index if not exists product_reviews_created_at_idx on public.product_reviews(created_at desc);
create index if not exists product_reviews_verified_purchase_idx on public.product_reviews(verified_purchase);
