import { Request, Response, NextFunction } from 'express';
// Defer Mongo models import to runtime only when needed to avoid unnecessary Mongoose initialization
import { AuthRequest, ApiResponse, IProduct, ProductQuery, SortOption } from '@/types';
import { supabase } from '@/utils/supabase';

// Get all products with filtering, sorting, and pagination
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      collection,
      brand,
      minPrice,
      maxPrice,
      sizes,
      colors,
      inStock,
      sortBy = 'featured'
    }: ProductQuery = req.query;

    const useSupabase = process.env.USE_SUPABASE_PRODUCTS === 'true';

    // Calculate pagination
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    if (useSupabase) {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (category) query = query.eq('category', category);
      if (collection) query = query.eq('collection', collection);
      if (brand) query = query.eq('brand', brand);
      if (minPrice) query = query.gte('price', Number(minPrice));
      if (maxPrice) query = query.lte('price', Number(maxPrice));
      if (sizes) {
        const arr = Array.isArray(sizes) ? sizes : [sizes];
        // assuming sizes is text[] column
        query = query.overlaps('sizes', arr as string[]);
      }
      if (colors) {
        const arr = Array.isArray(colors) ? colors : [colors];
        query = query.overlaps('colors', arr as string[]);
      }
      if ((inStock as any) === 'true' || inStock === true) query = query.eq('inStock', true);

      switch (sortBy) {
        case 'newest': query = query.order('createdAt', { ascending: false }); break;
        case 'price-low': query = query.order('price', { ascending: true }); break;
        case 'price-high': query = query.order('price', { ascending: false }); break;
        case 'name': query = query.order('name', { ascending: true }); break;
        case 'rating': query = query.order('rating', { ascending: false }); break;
        case 'featured':
        default:
          query = query.order('isFeatured', { ascending: false }).order('isBestSeller', { ascending: false }).order('isNew', { ascending: false }).order('rating', { ascending: false });
      }

      query = query.range(from, to);
      const { data, error, count } = await query;
      if (error) throw error;

      const response: ApiResponse<any[]> = {
        success: true,
        message: 'Products retrieved successfully',
        data: data ?? [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count ?? 0,
          pages: Math.ceil((count ?? 0) / limitNum)
        }
      };
      res.status(200).json(response);
      return;
    }

    // Fallback to MongoDB
    const { Product, Collection } = await import('@/models');
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (category) filter.category = category;
    if (collection) filter.collection = collection;
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (sizes) {
      const sizeArray = Array.isArray(sizes) ? sizes : [sizes];
      filter.sizes = { $in: sizeArray };
    }
    if (colors) {
      const colorArray = Array.isArray(colors) ? colors : [colors];
      filter.colors = { $in: colorArray };
    }
    if ((inStock as any) === 'true' || inStock === true) filter.inStock = true;

    let sort: any = {};
    switch (sortBy) {
      case 'newest': sort = { createdAt: -1 }; break;
      case 'price-low': sort = { price: 1 }; break;
      case 'price-high': sort = { price: -1 }; break;
      case 'name': sort = { name: 1 }; break;
      case 'rating': sort = { rating: -1 }; break;
      case 'featured':
      default: sort = { isFeatured: -1, isBestSeller: -1, isNew: -1, rating: -1 }; break;
    }

    const skip = (pageNum - 1) * limitNum;
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter)
    ]);

    const response: ApiResponse<IProduct[]> = {
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get single product by ID or slug
export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const useSupabase = process.env.USE_SUPABASE_PRODUCTS === 'true';

    if (useSupabase) {
      // Try ID then slug
      let { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error && error.code !== 'PGRST116') throw error; // ignore not found here
      if (!data) {
        const bySlug = await supabase.from('products').select('*').eq('slug', id).single();
        if (bySlug.error) throw bySlug.error;
        data = bySlug.data;
      }
      if (!data) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      const response: ApiResponse<any> = { success: true, message: 'Product retrieved successfully', data };
      res.status(200).json(response);
      return;
    }

    // Fallback Mongo
    const { Product } = await import('@/models');
    let product = await Product.findById(id);
    if (!product) {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const response: ApiResponse<IProduct> = { success: true, message: 'Product retrieved successfully', data: product };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get featured products
export const getFeaturedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 8 } = req.query;

    if (process.env.USE_SUPABASE_PRODUCTS === 'true') {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('isFeatured', true)
        .order('createdAt', { ascending: false })
        .limit(parseInt(limit.toString()));
      if (error) throw error;
      const response: ApiResponse<any[]> = { success: true, message: 'Featured products retrieved successfully', data: data ?? [] };
      res.status(200).json(response);
      return;
    }

    const { Product } = await import('@/models');
    const products = await Product.find({ isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit.toString()))
      .lean();

    const response: ApiResponse<IProduct[]> = {
      success: true,
      message: 'Featured products retrieved successfully',
      data: products
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get new arrivals
export const getNewArrivals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 8 } = req.query;

    if (process.env.USE_SUPABASE_PRODUCTS === 'true') {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('isNew', true)
        .order('createdAt', { ascending: false })
        .limit(parseInt(limit.toString()));
      if (error) throw error;
      const response: ApiResponse<any[]> = { success: true, message: 'New arrivals retrieved successfully', data: data ?? [] };
      res.status(200).json(response);
      return;
    }

    const { Product } = await import('@/models');
    const products = await Product.find({ isNew: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit.toString()))
      .lean();

    const response: ApiResponse<IProduct[]> = {
      success: true,
      message: 'New arrivals retrieved successfully',
      data: products
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get best sellers
export const getBestSellers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 8 } = req.query;

    if (process.env.USE_SUPABASE_PRODUCTS === 'true') {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('isBestSeller', true)
        .order('rating', { ascending: false })
        .order('reviews', { ascending: false })
        .limit(parseInt(limit.toString()));
      if (error) throw error;
      const response: ApiResponse<any[]> = { success: true, message: 'Best sellers retrieved successfully', data: data ?? [] };
      res.status(200).json(response);
      return;
    }

    const { Product } = await import('@/models');
    const products = await Product.find({ isBestSeller: true })
      .sort({ rating: -1, reviews: -1 })
      .limit(parseInt(limit.toString()))
      .lean();

    const response: ApiResponse<IProduct[]> = {
      success: true,
      message: 'Best sellers retrieved successfully',
      data: products
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get products by category
export const getProductsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12, sortBy = 'featured' } = req.query;

    if (process.env.USE_SUPABASE_PRODUCTS === 'true') {
      let query = supabase.from('products').select('*', { count: 'exact' }).eq('category', category);
      switch (sortBy) {
        case 'newest': query = query.order('createdAt', { ascending: false }); break;
        case 'price-low': query = query.order('price', { ascending: true }); break;
        case 'price-high': query = query.order('price', { ascending: false }); break;
        case 'name': query = query.order('name', { ascending: true }); break;
        default: query = query.order('isFeatured', { ascending: false }).order('isBestSeller', { ascending: false }).order('rating', { ascending: false });
      }
      const pageNum = parseInt(page.toString());
      const limitNum = parseInt(limit.toString());
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;
      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      const response: ApiResponse<any[]> = {
        success: true,
        message: `Products in category '${category}' retrieved successfully`,
        data: data ?? [],
        pagination: { page: pageNum, limit: limitNum, total: count ?? 0, pages: Math.ceil((count ?? 0)/limitNum) }
      };
      res.status(200).json(response);
      return;
    }

    let sort: any = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'name':
        sort = { name: 1 };
        break;
      default:
        sort = { isFeatured: -1, isBestSeller: -1, rating: -1 };
        break;
    }

    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    const { Product } = await import('@/models');
    const [products, total] = await Promise.all([
      Product.find({ category })
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments({ category })
    ]);

    const response: ApiResponse<IProduct[]> = {
      success: true,
      message: `Products in category '${category}' retrieved successfully`,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get all collections
export const getCollections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_SUPABASE_PRODUCTS === 'true') {
      const { data, error } = await supabase.from('collections').select('*').eq('isActive', true).order('sortOrder', { ascending: true }).order('createdAt', { ascending: false });
      if (error) throw error;
      // Fetch counts per collection
      const results = await Promise.all((data ?? []).map(async (c: any) => {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('collection', c.name);
        return { ...c, productCount: count ?? 0 };
      }));
      const response: ApiResponse = { success: true, message: 'Collections retrieved successfully', data: results };
      res.status(200).json(response);
      return;
    }

    const { Collection } = await import('@/models');
    const collections = await Collection.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    // Get product counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const { Product } = await import('@/models');
        const productCount = await Product.countDocuments({ 
          collection: collection.name 
        });
        return { ...collection, productCount };
      })
    );

    const response: ApiResponse = {
      success: true,
      message: 'Collections retrieved successfully',
      data: collectionsWithCounts
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get filter options (categories, brands, sizes, colors, price range)
export const getFilterOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_SUPABASE_PRODUCTS === 'true') {
      const [cats, brands, sizesArr, colorsArr, minMax] = await Promise.all([
        supabase.from('products').select('category'),
        supabase.from('products').select('brand'),
        supabase.from('products').select('sizes'),
        supabase.from('products').select('colors'),
        supabase.from('products').select('min(price),max(price)')
      ]);
      const categories = Array.from(new Set((cats.data ?? []).map((r: any) => r.category))).filter(Boolean).sort();
      const brandList = Array.from(new Set((brands.data ?? []).map((r: any) => r.brand))).filter(Boolean).sort();
      const sizes = Array.from(new Set((sizesArr.data ?? []).flatMap((r: any) => r.sizes || []))).sort();
      const colors = Array.from(new Set((colorsArr.data ?? []).flatMap((r: any) => r.colors || []))).sort();
      const priceRangeRow: any = (minMax.data ?? [])[0] || {};
      const priceRange: [number, number] = [priceRangeRow.min ?? 0, priceRangeRow.max ?? 1000];

      const colRes = await supabase.from('collections').select('name,slug').eq('isActive', true).order('sortOrder', { ascending: true });
      const collections = (colRes.data ?? []).map((c: any) => ({ name: c.name, slug: c.slug }));

      const filterOptions = { categories, collections, brands: brandList, sizes, colors, priceRange };
      const response: ApiResponse = { success: true, message: 'Filter options retrieved successfully', data: filterOptions };
      res.status(200).json(response);
      return;
    }

    const { Product, Collection } = await import('@/models');
    const [categories, brands, sizes, colors, priceRange] = await Promise.all([
      Product.distinct('category'),
      Product.distinct('brand'),
      Product.distinct('sizes'),
      Product.distinct('colors'),
      Product.aggregate([
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        }
      ])
    ]);

    const collections = await Collection.find({ isActive: true }, 'name slug')
      .sort({ sortOrder: 1 })
      .lean();

    const filterOptions = {
      categories: categories.sort(),
      collections: collections.map(c => ({ name: c.name, slug: c.slug })),
      brands: brands.sort(),
      sizes: sizes.flat().filter((size, index, array) => array.indexOf(size) === index).sort(),
      colors: colors.flat().filter((color, index, array) => array.indexOf(color) === index).sort(),
      priceRange: priceRange[0] ? [priceRange[0].minPrice, priceRange[0].maxPrice] : [0, 1000]
    };

    const response: ApiResponse = {
      success: true,
      message: 'Filter options retrieved successfully',
      data: filterOptions
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Search suggestions
export const getSearchSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      res.status(200).json({ success: true, message: 'Search suggestions retrieved successfully', data: [] });
      return;
    }

    if (process.env.USE_SUPABASE_PRODUCTS === 'true') {
      const { data, error } = await supabase
        .from('products')
        .select('name,slug,price,images,category')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(5);
      if (error) throw error;
      res.status(200).json({ success: true, message: 'Search suggestions retrieved successfully', data: data ?? [] });
      return;
    }

    const { Product } = await import('@/models');
    const products = await Product.find(
      { $text: { $search: q } },
      { name: 1, slug: 1, price: 1, images: 1, category: 1 }
    )
      .limit(5)
      .lean();

    const response: ApiResponse = {
      success: true,
      message: 'Search suggestions retrieved successfully',
      data: products
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
