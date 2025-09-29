import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@/utils/supabase';
import { logger } from '@/utils/logger';

const normalizeIp = (raw: string | undefined): string | null => {
  if (!raw) return null;
  const ip = raw.startsWith('::ffff:') ? raw.slice(7) : raw;
  return ip === '::1' ? '127.0.0.1' : ip;
};

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params as any;
    // Get counts and average
    const { data: rows, error } = await supabaseAdmin
      .from('product_reviews')
      .select('rating, verified_purchase')
      .eq('product_id', productId)
      .eq('is_approved', true);
    if (error) throw error;

    const total = rows?.length || 0;
    const counts: Record<number, number> = {1:0,2:0,3:0,4:0,5:0};
    let sum = 0, verified = 0;
    for (const r of (rows || [])) {
      const rate = Number((r as any).rating);
      if (counts[rate] !== undefined) counts[rate] += 1;
      sum += rate;
      if ((r as any).verified_purchase) verified += 1;
    }
    const average = total ? +(sum / total).toFixed(2) : 0;

    res.status(200).json({ success: true, data: { total, average, counts, verified } });
  } catch (err) { 
    next(err); 
  }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params as any;
    
    // Validate productId is a valid UUID
    if (!productId || typeof productId !== 'string') {
      logger.warn({ productId, type: typeof productId }, 'Invalid productId provided to getReviews');
      res.status(400).json({ success: false, message: 'Valid product ID required' });
      return;
    }
    
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    
    logger.info({ productId, page, limit: req.query.limit }, 'Getting reviews for product');
    const limit = Math.min(1000, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
    const sort = (req.query.sort as string) || 'newest';
    const photosOnly = String(req.query.photosOnly || '').toLowerCase() === 'true';
    const verifiedOnly = String(req.query.verifiedOnly || '').toLowerCase() === 'true';
    const minRating = req.query.minRating ? parseInt(req.query.minRating as string, 10) : undefined;
    const fit = (req.query.fit as string) || undefined;

    let query = supabaseAdmin
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true);
    if (verifiedOnly) query = query.eq('verified_purchase', true);
    if (minRating) query = query.gte('rating', minRating);
    if (fit) query = query.eq('fit_feedback', fit);

    // Sorting
    if (sort === 'helpful') {
      query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data: reviews, error } = await query.range(from, to);
    if (error) throw error;

    const ids = (reviews || []).map(r => r.id);

    // Load images and responses
    const [imgs, resps] = await Promise.all([
      ids.length ? supabaseAdmin.from('review_images').select('*').in('review_id', ids).order('sort_order', { ascending: true }) : { data: [], error: null },
      ids.length ? supabaseAdmin.from('review_responses').select('*').in('review_id', ids).order('created_at', { ascending: true }) : { data: [], error: null },
    ]);

    const imgMap = new Map<string, any[]>();
    for (const im of (imgs as any).data || []) {
      const k = im.review_id; if (!imgMap.has(k)) imgMap.set(k, []); imgMap.get(k)!.push(im);
    }
    const respMap = new Map<string, any[]>();
    for (const rp of (resps as any).data || []) {
      const k = rp.review_id; if (!respMap.has(k)) respMap.set(k, []); respMap.get(k)!.push(rp);
    }

    let filtered = reviews || [];
    if (photosOnly) filtered = filtered.filter(r => (imgMap.get(r.id) || []).length > 0);

    const enriched = filtered.map(r => ({ ...r, images: imgMap.get(r.id) || [], responses: respMap.get(r.id) || [] }));

    res.status(200).json({ success: true, data: enriched, page, limit });
  } catch (err) { 
    next(err); 
  }
};

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user || null;
    const {
      productId,
      rating,
      reviewTitle,
      reviewText,
      reviewerName,
      reviewerEmail,
      sizePurchased,
      colorPurchased,
      fitFeedback,
      qualityRating,
      comfortRating,
      styleRating,
      imageUrls
    } = req.body as any;

    // Basic spam guard: limit too frequent submissions per IP could be added here

    // Verified purchase: check orders -> order_items
    let verified = false;
    try {
      if (user?.id || user?._id) {
        const userId = user._id || user.id;
        const { data: items, error } = await supabaseAdmin
          .from('order_items')
          .select('order_id, product_id, orders(user_id, payment_status, order_status)')
          .eq('product_id', productId);
        if (!error && items) {
          verified = items.some((it: any) => it.orders && it.orders.user_id === userId && ((it.orders.payment_status === 'paid') || (it.orders.order_status && it.orders.order_status !== 'cancelled')));
        }
      }
    } catch {}

    const insertRow = {
      product_id: productId,
      user_id: user ? (user._id || user.id) : null,
      reviewer_name: reviewerName,
      reviewer_email: reviewerEmail,
      rating,
      review_title: reviewTitle || null,
      review_text: reviewText,
      verified_purchase: verified,
      size_purchased: sizePurchased || null,
      color_purchased: colorPurchased || null,
      fit_feedback: fitFeedback || null,
      quality_rating: qualityRating || null,
      comfort_rating: comfortRating || null,
      style_rating: styleRating || null
    } as any;

    const { data, error } = await supabaseAdmin
      .from('product_reviews')
      .insert(insertRow)
      .select('*')
      .single();
    if (error) throw error;

    // Attach images if provided
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length) {
      const rows = imageUrls.slice(0,4).map((url: string, idx: number)=> ({ review_id: (data as any).id, image_url: url, sort_order: idx }))
      await supabaseAdmin.from('review_images').insert(rows);
    }

    res.status(200).json({ success: true, message: 'Review submitted', data });
  } catch (err) { next(err); }
};

export const uploadReviewImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) { res.status(400).json({ success: false, message: 'No images uploaded' }); return; }

    const { supabaseAdmin: sb } = await import('@/utils/supabase');
    const bucket = 'reviews';

    const results: string[] = [];
    for (const f of files) {
      const ext = f.originalname.split('.').pop() || 'jpg';
      const path = `rev/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await sb.storage.from(bucket).upload(path, f.buffer, { contentType: f.mimetype, upsert: false });
      if (upErr) throw upErr;
      const { data } = sb.storage.from(bucket).getPublicUrl(path);
      results.push(data.publicUrl);
    }

    res.status(200).json({ success: true, data: { urls: results } });
  } catch (err) { next(err); }
};

export const voteHelpfulness = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user || null;
    const { reviewId, isHelpful } = req.body as any;

    const rawIp = (req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '') as string;
    const user_ip = normalizeIp(rawIp);

    // Try insert helpfulness
    const payload: any = { review_id: reviewId, is_helpful: !!isHelpful };
    if (user?.id || user?._id) payload.user_id = user._id || user.id;
    if (!payload.user_id && user_ip) payload.user_ip = user_ip;

    // First try insert; if conflict, update
    let { error: insErr } = await supabaseAdmin.from('review_helpfulness').insert(payload);
    if (insErr) {
      // Conflict: update existing record
      const match: any = { review_id: reviewId };
      if (payload.user_id) match.user_id = payload.user_id; else match.user_ip = payload.user_ip;
      const { error: updErr } = await supabaseAdmin.from('review_helpfulness').update({ is_helpful: payload.is_helpful }).match(match);
      if (updErr) throw updErr;
    }

    // Recompute helpful/unhelpful counts
    const { data: votes, error: vErr } = await supabaseAdmin.from('review_helpfulness').select('is_helpful').eq('review_id', reviewId);
    if (vErr) throw vErr;
    const helpful = (votes || []).filter(v => (v as any).is_helpful).length;
    const unhelpful = (votes || []).length - helpful;
    const { error: upR } = await supabaseAdmin.from('product_reviews').update({ helpful_count: helpful, unhelpful_count: unhelpful }).eq('id', reviewId);
    if (upR) throw upR;

    res.status(200).json({ success: true, data: { helpful, unhelpful } });
  } catch (err) { next(err); }
};