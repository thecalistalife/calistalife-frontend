-- Enhanced Supabase schema for TheCalista (Quality-Focused Fashion Platform)
-- This includes all quality-focused features and database enhancements
-- Run in Supabase SQL editor after the base schema.sql

-- ===============================================
-- QUALITY-FOCUSED PRODUCT ENHANCEMENTS
-- ===============================================

-- Add quality-focused columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fabric_composition jsonb DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thread_count integer;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fabric_weight numeric; -- weight per yard/meter
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS durability_score integer CHECK (durability_score >= 1 AND durability_score <= 10);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stretch_level varchar(20); -- 'none', 'low', 'medium', 'high', 'four-way'
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions jsonb DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quality_grade varchar(10) CHECK (quality_grade IN ('premium', 'standard', 'basic'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sustainability_rating varchar(10) CHECK (sustainability_rating IN ('A+', 'A', 'B+', 'B', 'C+', 'C'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS breathability_rating integer CHECK (breathability_rating >= 1 AND breathability_rating <= 5);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fabric_origin varchar(100);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS manufacturing_location varchar(100);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'; -- GOTS, OEKO-TEX, etc.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fit_type varchar(20); -- 'slim', 'regular', 'relaxed', 'oversized'
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seasonal_collection varchar(50);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lifestyle_tags jsonb DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS recommended_for jsonb DEFAULT '[]'; -- occasions/activities

-- Product sizing information
CREATE TABLE IF NOT EXISTS public.product_sizing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size varchar(10) NOT NULL,
  chest_measurement numeric,
  waist_measurement numeric,
  hip_measurement numeric,
  length_measurement numeric,
  sleeve_length numeric,
  shoulder_width numeric,
  inseam_length numeric,
  fit_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enhanced color information
CREATE TABLE IF NOT EXISTS public.product_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_name varchar(50) NOT NULL,
  hex_code varchar(7),
  pantone_code varchar(20),
  color_family varchar(30),
  season varchar(20),
  availability boolean DEFAULT true,
  additional_images text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fabric and material details
CREATE TABLE IF NOT EXISTS public.product_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_type varchar(50) NOT NULL, -- 'cotton', 'polyester', 'wool', etc.
  percentage numeric NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  origin varchar(100),
  properties jsonb DEFAULT '{}', -- moisture-wicking, anti-odor, etc.
  certifications jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================
-- ADVANCED REVIEW SYSTEM ENHANCEMENTS
-- ===============================================

-- Add review moderation features
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS moderation_status varchar(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS moderated_at timestamptz;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS language_detected varchar(10) DEFAULT 'en';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS sentiment_score numeric CHECK (sentiment_score >= -1 AND sentiment_score <= 1);

-- Review categories for better organization
CREATE TABLE IF NOT EXISTS public.review_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(50) NOT NULL UNIQUE,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Link reviews to categories
CREATE TABLE IF NOT EXISTS public.review_category_links (
  review_id uuid NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.review_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (review_id, category_id)
);

-- Review analytics
CREATE TABLE IF NOT EXISTS public.review_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  review_count_total integer DEFAULT 0,
  review_count_5_star integer DEFAULT 0,
  review_count_4_star integer DEFAULT 0,
  review_count_3_star integer DEFAULT 0,
  review_count_2_star integer DEFAULT 0,
  review_count_1_star integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  verified_reviews_count integer DEFAULT 0,
  reviews_with_photos_count integer DEFAULT 0,
  last_review_date timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================
-- CUSTOMER ENGAGEMENT FEATURES
-- ===============================================

-- Recently viewed products
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  session_id varchar(100), -- for anonymous users
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  view_duration integer DEFAULT 0, -- seconds spent viewing
  UNIQUE(user_id, product_id)
);

-- Product recommendations
CREATE TABLE IF NOT EXISTS public.product_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommended_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommendation_type varchar(30) NOT NULL, -- 'similar', 'frequently_bought_together', 'trending'
  score numeric DEFAULT 0,
  reason text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, recommended_product_id, recommendation_type)
);

-- Customer styling inspiration
CREATE TABLE IF NOT EXISTS public.style_inspiration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  description text,
  image_url text NOT NULL,
  tags jsonb DEFAULT '[]',
  season varchar(20),
  occasion varchar(50),
  style_type varchar(30),
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Link products to styling inspiration
CREATE TABLE IF NOT EXISTS public.style_product_links (
  style_id uuid NOT NULL REFERENCES public.style_inspiration(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (style_id, product_id)
);

-- ===============================================
-- ADVANCED CATEGORY SYSTEM
-- ===============================================

-- Enhanced category attributes
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS category_type varchar(30) DEFAULT 'product'; -- 'product', 'style', 'occasion'
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS gender_target varchar(20); -- 'men', 'women', 'unisex', 'kids'
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS age_group varchar(20); -- 'adult', 'teen', 'kids', 'baby'
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seasonality jsonb DEFAULT '[]'; -- ['spring', 'summer', 'fall', 'winter']
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS formality_level varchar(20); -- 'casual', 'business', 'formal', 'athletic'
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS fit_characteristics jsonb DEFAULT '{}';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS size_guide_url text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS care_guide_url text;

-- Category attributes for filtering
CREATE TABLE IF NOT EXISTS public.category_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  attribute_name varchar(50) NOT NULL,
  attribute_type varchar(20) NOT NULL CHECK (attribute_type IN ('text', 'number', 'boolean', 'select', 'multiselect')),
  possible_values jsonb DEFAULT '[]',
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================
-- ADVANCED EMAIL SYSTEM
-- ===============================================

-- Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  subject varchar(200) NOT NULL,
  html_content text NOT NULL,
  text_content text,
  template_type varchar(50) NOT NULL, -- 'order_confirmation', 'review_request', 'marketing', etc.
  variables jsonb DEFAULT '[]', -- available template variables
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Email campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  target_audience jsonb DEFAULT '{}', -- criteria for targeting
  schedule_type varchar(20) DEFAULT 'immediate', -- 'immediate', 'scheduled', 'recurring'
  scheduled_at timestamptz,
  status varchar(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'cancelled'
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Email logs for tracking
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  email_address varchar(255) NOT NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  subject varchar(200),
  status varchar(20) DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'bounced', 'failed'
  provider varchar(50), -- 'sendgrid', 'mailgun', 'nodemailer'
  provider_message_id varchar(200),
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================================
-- SEO AND MARKETING FEATURES
-- ===============================================

-- SEO metadata for products
CREATE TABLE IF NOT EXISTS public.product_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  meta_title varchar(60),
  meta_description varchar(160),
  meta_keywords jsonb DEFAULT '[]',
  canonical_url text,
  schema_markup jsonb DEFAULT '{}',
  social_image_url text,
  robots_directives varchar(100) DEFAULT 'index,follow',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Blog/content system for SEO
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  slug varchar(200) NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  featured_image text,
  author_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  category varchar(50),
  tags jsonb DEFAULT '[]',
  status varchar(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at timestamptz,
  meta_title varchar(60),
  meta_description varchar(160),
  view_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Link blog posts to products
CREATE TABLE IF NOT EXISTS public.blog_product_links (
  blog_post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, product_id)
);

-- ===============================================
-- PERFORMANCE OPTIMIZATION TABLES
-- ===============================================

-- Product search index for better performance
CREATE TABLE IF NOT EXISTS public.product_search_index (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  search_vector tsvector,
  keywords text,
  category_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id)
);

-- Create search index
CREATE INDEX IF NOT EXISTS product_search_vector_idx ON public.product_search_index USING GIN(search_vector);

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

-- Product indexes
CREATE INDEX IF NOT EXISTS products_quality_grade_idx ON public.products(quality_grade);
CREATE INDEX IF NOT EXISTS products_sustainability_rating_idx ON public.products(sustainability_rating);
CREATE INDEX IF NOT EXISTS products_fabric_composition_idx ON public.products USING GIN(fabric_composition);
CREATE INDEX IF NOT EXISTS products_seasonal_collection_idx ON public.products(seasonal_collection);
CREATE INDEX IF NOT EXISTS products_fit_type_idx ON public.products(fit_type);

-- Review indexes
CREATE INDEX IF NOT EXISTS product_reviews_moderation_status_idx ON public.product_reviews(moderation_status);
CREATE INDEX IF NOT EXISTS product_reviews_sentiment_score_idx ON public.product_reviews(sentiment_score);
CREATE INDEX IF NOT EXISTS product_reviews_language_idx ON public.product_reviews(language_detected);

-- Recently viewed indexes
CREATE INDEX IF NOT EXISTS recently_viewed_user_id_idx ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS recently_viewed_session_id_idx ON public.recently_viewed(session_id);
CREATE INDEX IF NOT EXISTS recently_viewed_viewed_at_idx ON public.recently_viewed(viewed_at DESC);

-- Recommendation indexes
CREATE INDEX IF NOT EXISTS product_recommendations_product_id_idx ON public.product_recommendations(product_id);
CREATE INDEX IF NOT EXISTS product_recommendations_type_score_idx ON public.product_recommendations(recommendation_type, score DESC);

-- Category indexes
CREATE INDEX IF NOT EXISTS categories_category_type_idx ON public.categories(category_type);
CREATE INDEX IF NOT EXISTS categories_gender_target_idx ON public.categories(gender_target);
CREATE INDEX IF NOT EXISTS categories_formality_level_idx ON public.categories(formality_level);

-- ===============================================
-- FUNCTIONS AND TRIGGERS
-- ===============================================

-- Function to update product search index
CREATE OR REPLACE FUNCTION update_product_search_index()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.product_search_index (product_id, search_vector, keywords, category_path, updated_at)
  VALUES (
    NEW.id,
    to_tsvector('english', 
      COALESCE(NEW.name, '') || ' ' ||
      COALESCE(NEW.description, '') || ' ' ||
      COALESCE(NEW.brand, '') || ' ' ||
      COALESCE(NEW.category, '') || ' ' ||
      COALESCE(array_to_string(NEW.tags, ' '), '')
    ),
    COALESCE(NEW.name, '') || ',' || COALESCE(NEW.brand, '') || ',' || array_to_string(COALESCE(NEW.tags, '{}'), ','),
    COALESCE(NEW.category, ''),
    NOW()
  )
  ON CONFLICT (product_id) DO UPDATE SET
    search_vector = EXCLUDED.search_vector,
    keywords = EXCLUDED.keywords,
    category_path = EXCLUDED.category_path,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product search index
DROP TRIGGER IF EXISTS trigger_update_product_search_index ON public.products;
CREATE TRIGGER trigger_update_product_search_index
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_index();

-- Function to update review analytics
CREATE OR REPLACE FUNCTION update_review_analytics()
RETURNS TRIGGER AS $$
DECLARE
  p_id uuid;
BEGIN
  -- Get product_id from the review
  IF TG_OP = 'DELETE' THEN
    p_id := OLD.product_id;
  ELSE
    p_id := NEW.product_id;
  END IF;

  -- Update analytics
  INSERT INTO public.review_analytics (
    product_id,
    review_count_total,
    review_count_5_star,
    review_count_4_star,
    review_count_3_star,
    review_count_2_star,
    review_count_1_star,
    average_rating,
    verified_reviews_count,
    reviews_with_photos_count,
    last_review_date,
    updated_at
  )
  SELECT
    p_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 1),
    COALESCE(AVG(rating), 0),
    COUNT(*) FILTER (WHERE verified_purchase = true),
    COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM public.review_images WHERE review_id = product_reviews.id)),
    MAX(created_at),
    NOW()
  FROM public.product_reviews
  WHERE product_id = p_id AND is_approved = true
  ON CONFLICT (product_id) DO UPDATE SET
    review_count_total = EXCLUDED.review_count_total,
    review_count_5_star = EXCLUDED.review_count_5_star,
    review_count_4_star = EXCLUDED.review_count_4_star,
    review_count_3_star = EXCLUDED.review_count_3_star,
    review_count_2_star = EXCLUDED.review_count_2_star,
    review_count_1_star = EXCLUDED.review_count_1_star,
    average_rating = EXCLUDED.average_rating,
    verified_reviews_count = EXCLUDED.verified_reviews_count,
    reviews_with_photos_count = EXCLUDED.reviews_with_photos_count,
    last_review_date = EXCLUDED.last_review_date,
    updated_at = EXCLUDED.updated_at;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for review analytics
DROP TRIGGER IF EXISTS trigger_update_review_analytics ON public.product_reviews;
CREATE TRIGGER trigger_update_review_analytics
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_review_analytics();

-- ===============================================
-- SAMPLE DATA FOR REVIEW CATEGORIES
-- ===============================================

INSERT INTO public.review_categories (name, description, sort_order) VALUES
('Fit & Sizing', 'Reviews focusing on how the product fits', 1),
('Quality & Durability', 'Reviews about product quality and longevity', 2),
('Style & Appearance', 'Reviews about the look and style of the product', 3),
('Comfort', 'Reviews about how comfortable the product is', 4),
('Value for Money', 'Reviews about pricing and value proposition', 5),
('Customer Service', 'Reviews mentioning customer service experience', 6)
ON CONFLICT (name) DO NOTHING;

-- ===============================================
-- SAMPLE EMAIL TEMPLATES
-- ===============================================

INSERT INTO public.email_templates (name, subject, html_content, text_content, template_type, variables) VALUES
(
  'review_request',
  'How was your recent purchase from CalistaLife?',
  '<html><body><h2>Hi {{customer_name}}!</h2><p>We hope you''re loving your recent purchase of {{product_name}}. Your feedback helps us improve and helps other customers make informed decisions.</p><p><a href="{{review_link}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Write a Review</a></p><p>As a thank you, you''ll get 5% off your next order when you submit your review.</p><p>Best regards,<br>The CalistaLife Team</p></body></html>',
  'Hi {{customer_name}}! We hope you''re loving your recent purchase of {{product_name}}. Please leave a review at {{review_link}} and get 5% off your next order. Thanks! - CalistaLife Team',
  'review_request',
  '["customer_name", "product_name", "review_link", "order_number"]'
),
(
  'order_confirmation_enhanced',
  'Your CalistaLife order #{{order_number}} is confirmed!',
  '<html><body><h2>Thank you for your order!</h2><p>Hi {{customer_name}}, your order #{{order_number}} has been confirmed and we''re preparing it for shipment.</p><div style="border: 1px solid #eee; padding: 20px; margin: 20px 0;"><h3>Order Summary</h3>{{order_items}}<p><strong>Total: {{total_amount}}</strong></p></div><p>We''ll send you another email once your order ships with tracking information.</p><p>Questions? Reply to this email or contact us at support@calistalife.com</p></body></html>',
  'Thank you for your order #{{order_number}}! We''ll send tracking info once it ships. Contact support@calistalife.com with questions.',
  'order_confirmation',
  '["customer_name", "order_number", "order_items", "total_amount", "shipping_address"]'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  updated_at = NOW();

-- ===============================================
-- RLS POLICIES FOR NEW TABLES
-- ===============================================

-- Enable RLS on new tables
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_inspiration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "public_read_recommendations" ON public.product_recommendations FOR SELECT USING (true);
CREATE POLICY "public_read_style_inspiration" ON public.style_inspiration FOR SELECT USING (true);
CREATE POLICY "public_read_blog_posts" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "public_read_review_analytics" ON public.review_analytics FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "users_own_recently_viewed" ON public.recently_viewed FOR ALL USING (
  (auth.role() = 'anon') OR (user_id = auth.uid())
);

-- ===============================================
-- COMPLETE!
-- ===============================================

-- Insert initial data to ensure the enhanced schema works
INSERT INTO public.review_analytics (product_id, review_count_total, average_rating, updated_at)
SELECT id, 0, 0, NOW() FROM public.products
ON CONFLICT (product_id) DO NOTHING;

SELECT 'Enhanced schema installation complete! 🎉' as status;