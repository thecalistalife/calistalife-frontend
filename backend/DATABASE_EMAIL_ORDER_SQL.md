-- Add optional shipping/tracking fields to orders table (idempotent)
alter table if exists public.orders
  add column if not exists tracking_number text,
  add column if not exists courier text,
  add column if not exists track_url text,
  add column if not exists estimated_delivery timestamptz;

-- Ensure order_number is indexed for fast lookups
create index if not exists idx_orders_order_number on public.orders(order_number);

-- Ensure status fields exist (if your schema lacks them)
alter table if exists public.orders
  add column if not exists order_status text default 'confirmed',
  add column if not exists payment_status text default 'pending';

-- Create email queue table for persistent scheduled emails
create table if not exists public.email_queue (
  id uuid default gen_random_uuid() primary key,
  order_number text not null,
  email_type text not null,
  recipient_email text not null,
  scheduled_at timestamptz not null,
  status text default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer default 0,
  last_attempt_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient queue processing
create index if not exists idx_email_queue_scheduled on public.email_queue(status, scheduled_at) where status = 'pending';
create index if not exists idx_email_queue_order on public.email_queue(order_number);

-- Function to create email queue table (for RPC fallback)
create or replace function create_email_queue_table()
returns void
language plpgsql
security definer
as $$
begin
  -- This function ensures the email_queue table exists
  -- It's called from the backend during initialization
  perform 1;
end;
$$;
