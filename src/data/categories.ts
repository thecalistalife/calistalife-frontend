// Comprehensive clothing categories for CalistaLife.com
// This includes all clothing types with detailed attributes for quality-focused fashion

export interface CategoryAttribute {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  possibleValues?: string[];
  required?: boolean;
  displayOrder?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  categoryType: 'product' | 'style' | 'occasion';
  genderTarget: 'men' | 'women' | 'unisex' | 'kids';
  ageGroup: 'adult' | 'teen' | 'kids' | 'baby';
  seasonality: string[];
  formalityLevel: 'casual' | 'business' | 'formal' | 'athletic';
  fitCharacteristics: Record<string, any>;
  sizeGuideUrl?: string;
  careGuideUrl?: string;
  attributes: CategoryAttribute[];
  isActive: boolean;
  sortOrder: number;
}

export const clothingCategories: Category[] = [
  // TOP LEVEL CATEGORIES
  {
    id: 'tops',
    name: 'Tops',
    slug: 'tops',
    description: 'All types of tops including t-shirts, blouses, shirts, and more',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall', 'winter'],
    formalityLevel: 'casual',
    fitCharacteristics: { breathable: true, layerable: true },
    attributes: [
      { name: 'neckline', type: 'select', possibleValues: ['crew', 'v-neck', 'scoop', 'mock', 'turtleneck'], displayOrder: 1 },
      { name: 'sleeve_length', type: 'select', possibleValues: ['sleeveless', 'short', 'three-quarter', 'long'], displayOrder: 2 },
    ],
    isActive: true,
    sortOrder: 1,
  },

  // T-SHIRTS & CASUAL TOPS
  {
    id: 'tshirts',
    name: 'T-Shirts',
    slug: 't-shirts',
    description: 'Premium quality t-shirts with superior comfort and durability',
    parentId: 'tops',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall'],
    formalityLevel: 'casual',
    fitCharacteristics: { 
      comfortable: true, 
      breathable: true, 
      easyToStyle: true,
      idealFits: ['slim', 'regular', 'oversized']
    },
    attributes: [
      { name: 'fit_type', type: 'select', possibleValues: ['slim', 'regular', 'oversized', 'cropped'], required: true, displayOrder: 1 },
      { name: 'neckline', type: 'select', possibleValues: ['crew neck', 'v-neck', 'henley', 'scoop neck'], required: true, displayOrder: 2 },
      { name: 'fabric_weight', type: 'select', possibleValues: ['lightweight', 'midweight', 'heavyweight'], displayOrder: 3 },
      { name: 'print_type', type: 'select', possibleValues: ['solid', 'graphic', 'text', 'pattern', 'stripe'], displayOrder: 4 },
    ],
    isActive: true,
    sortOrder: 2,
  },

  {
    id: 'tank-tops',
    name: 'Tank Tops',
    slug: 'tank-tops',
    description: 'Comfortable sleeveless tops perfect for layering or summer wear',
    parentId: 'tops',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer'],
    formalityLevel: 'casual',
    fitCharacteristics: { breathable: true, layerable: true, activewearFriendly: true },
    attributes: [
      { name: 'strap_style', type: 'select', possibleValues: ['regular', 'racerback', 'spaghetti', 'halter'], displayOrder: 1 },
      { name: 'fit_type', type: 'select', possibleValues: ['fitted', 'relaxed', 'cropped'], displayOrder: 2 },
    ],
    isActive: true,
    sortOrder: 3,
  },

  // HOODIES & SWEATWEAR
  {
    id: 'hoodies',
    name: 'Hoodies & Sweatshirts',
    slug: 'hoodies-sweatshirts',
    description: 'Premium hoodies and sweatshirts with superior fabric quality and comfort',
    parentId: 'tops',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['fall', 'winter', 'spring'],
    formalityLevel: 'casual',
    fitCharacteristics: { 
      warm: true, 
      comfortable: true, 
      durable: true,
      idealFits: ['regular', 'oversized']
    },
    attributes: [
      { name: 'hoodie_type', type: 'select', possibleValues: ['pullover', 'zip-up', 'cropped', 'oversized'], required: true, displayOrder: 1 },
      { name: 'fabric_type', type: 'select', possibleValues: ['french terry', 'brushed fleece', 'sherpa lined', 'cotton blend'], displayOrder: 2 },
      { name: 'weight', type: 'select', possibleValues: ['lightweight', 'midweight', 'heavyweight'], displayOrder: 3 },
      { name: 'features', type: 'multiselect', possibleValues: ['kangaroo pocket', 'drawstring hood', 'thumb holes', 'side pockets'], displayOrder: 4 },
    ],
    isActive: true,
    sortOrder: 4,
  },

  // DENIM
  {
    id: 'jeans',
    name: 'Jeans & Denim',
    slug: 'jeans-denim',
    description: 'Premium denim with exceptional quality, fit, and durability',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall', 'winter'],
    formalityLevel: 'casual',
    fitCharacteristics: { 
      durable: true, 
      versatile: true, 
      timeless: true,
      qualityConstruction: true
    },
    attributes: [
      { name: 'fit_cut', type: 'select', possibleValues: ['skinny', 'slim', 'straight', 'relaxed', 'wide leg', 'bootcut', 'boyfriend'], required: true, displayOrder: 1 },
      { name: 'rise', type: 'select', possibleValues: ['low rise', 'mid rise', 'high rise', 'super high rise'], displayOrder: 2 },
      { name: 'wash', type: 'select', possibleValues: ['raw', 'light wash', 'medium wash', 'dark wash', 'black', 'white'], displayOrder: 3 },
      { name: 'denim_weight', type: 'select', possibleValues: ['12oz light', '14oz medium', '16oz heavy', '21oz extra heavy'], displayOrder: 4 },
      { name: 'features', type: 'multiselect', possibleValues: ['selvedge', 'stretch', 'distressed', 'raw hem', 'vintage style'], displayOrder: 5 },
      { name: 'inseam_length', type: 'select', possibleValues: ['28"', '30"', '32"', '34"', '36"'], displayOrder: 6 },
    ],
    isActive: true,
    sortOrder: 5,
  },

  // FORMAL WEAR
  {
    id: 'formal-wear',
    name: 'Formal Wear',
    slug: 'formal-wear',
    description: 'Professional and formal clothing with premium quality construction',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall', 'winter'],
    formalityLevel: 'formal',
    fitCharacteristics: { 
      professional: true, 
      tailored: true, 
      sophisticated: true,
      qualityConstruction: true
    },
    attributes: [
      { name: 'garment_type', type: 'select', possibleValues: ['dress shirt', 'blazer', 'suit jacket', 'dress pants', 'formal dress'], displayOrder: 1 },
      { name: 'fabric_type', type: 'select', possibleValues: ['cotton', 'wool', 'linen', 'silk', 'polyester blend'], displayOrder: 2 },
      { name: 'construction', type: 'select', possibleValues: ['machine made', 'half canvas', 'full canvas'], displayOrder: 3 },
    ],
    isActive: true,
    sortOrder: 6,
  },

  {
    id: 'dress-shirts',
    name: 'Dress Shirts',
    slug: 'dress-shirts',
    description: 'Professional dress shirts with superior fabric and construction',
    parentId: 'formal-wear',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall', 'winter'],
    formalityLevel: 'business',
    fitCharacteristics: { professional: true, breathable: true, ironable: true },
    attributes: [
      { name: 'collar_style', type: 'select', possibleValues: ['point', 'spread', 'button-down', 'wing', 'band'], displayOrder: 1 },
      { name: 'cuff_style', type: 'select', possibleValues: ['button', 'french', 'convertible'], displayOrder: 2 },
      { name: 'fabric_weave', type: 'select', possibleValues: ['poplin', 'oxford', 'twill', 'herringbone'], displayOrder: 3 },
    ],
    isActive: true,
    sortOrder: 7,
  },

  {
    id: 'blazers',
    name: 'Blazers & Suit Jackets',
    slug: 'blazers-suits',
    description: 'Premium blazers and suit jackets with exceptional tailoring',
    parentId: 'formal-wear',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'fall', 'winter'],
    formalityLevel: 'formal',
    fitCharacteristics: { tailored: true, structured: true, versatile: true },
    attributes: [
      { name: 'style', type: 'select', possibleValues: ['single breasted', 'double breasted', 'unstructured', 'three-piece'], displayOrder: 1 },
      { name: 'lapel_style', type: 'select', possibleValues: ['notched', 'peak', 'shawl'], displayOrder: 2 },
      { name: 'button_count', type: 'select', possibleValues: ['1 button', '2 button', '3 button'], displayOrder: 3 },
    ],
    isActive: true,
    sortOrder: 8,
  },

  // DRESSES
  {
    id: 'dresses',
    name: 'Dresses',
    slug: 'dresses',
    description: 'Beautiful dresses for every occasion with premium fabrics and construction',
    categoryType: 'product',
    genderTarget: 'women',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall', 'winter'],
    formalityLevel: 'casual',
    fitCharacteristics: { 
      feminine: true, 
      versatile: true, 
      comfortable: true,
      variousOccasions: true
    },
    attributes: [
      { name: 'dress_length', type: 'select', possibleValues: ['mini', 'knee-length', 'midi', 'maxi', 'floor-length'], required: true, displayOrder: 1 },
      { name: 'dress_style', type: 'select', possibleValues: ['bodycon', 'a-line', 'shift', 'wrap', 'fit-and-flare', 'sheath'], displayOrder: 2 },
      { name: 'sleeve_style', type: 'select', possibleValues: ['sleeveless', 'short sleeve', 'long sleeve', 'three-quarter', 'off-shoulder'], displayOrder: 3 },
      { name: 'occasion', type: 'select', possibleValues: ['casual', 'work', 'cocktail', 'formal', 'wedding guest', 'date night'], displayOrder: 4 },
      { name: 'neckline', type: 'select', possibleValues: ['crew', 'v-neck', 'scoop', 'square', 'off-shoulder', 'halter'], displayOrder: 5 },
    ],
    isActive: true,
    sortOrder: 9,
  },

  // ACTIVEWEAR
  {
    id: 'activewear',
    name: 'Activewear',
    slug: 'activewear',
    description: 'High-performance activewear with moisture-wicking and comfort features',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall', 'winter'],
    formalityLevel: 'athletic',
    fitCharacteristics: { 
      moistureWicking: true, 
      stretchable: true, 
      breathable: true,
      performanceFocused: true
    },
    attributes: [
      { name: 'activity_type', type: 'multiselect', possibleValues: ['yoga', 'running', 'gym', 'cycling', 'swimming', 'general fitness'], displayOrder: 1 },
      { name: 'garment_type', type: 'select', possibleValues: ['sports bra', 'workout top', 'leggings', 'shorts', 'joggers', 'hoodie'], displayOrder: 2 },
      { name: 'performance_features', type: 'multiselect', possibleValues: ['moisture-wicking', 'four-way stretch', 'anti-odor', 'quick-dry', 'UV protection'], displayOrder: 3 },
      { name: 'compression_level', type: 'select', possibleValues: ['none', 'light', 'medium', 'high'], displayOrder: 4 },
    ],
    isActive: true,
    sortOrder: 10,
  },

  {
    id: 'leggings',
    name: 'Leggings & Yoga Pants',
    slug: 'leggings-yoga-pants',
    description: 'Premium leggings with four-way stretch and comfort technology',
    parentId: 'activewear',
    categoryType: 'product',
    genderTarget: 'women',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall', 'winter'],
    formalityLevel: 'athletic',
    fitCharacteristics: { stretchy: true, comfortable: true, versatile: true },
    attributes: [
      { name: 'length', type: 'select', possibleValues: ['full length', 'capri', '7/8 length', 'shorts'], displayOrder: 1 },
      { name: 'waistband_style', type: 'select', possibleValues: ['high waist', 'mid waist', 'low waist'], displayOrder: 2 },
      { name: 'seam_style', type: 'select', possibleValues: ['flat seam', 'side seam', 'seamless'], displayOrder: 3 },
    ],
    isActive: true,
    sortOrder: 11,
  },

  // OUTERWEAR
  {
    id: 'outerwear',
    name: 'Outerwear & Jackets',
    slug: 'outerwear-jackets',
    description: 'Premium outerwear with weather protection and style',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['fall', 'winter', 'spring'],
    formalityLevel: 'casual',
    fitCharacteristics: { 
      protective: true, 
      durable: true, 
      weatherResistant: true,
      layerable: true
    },
    attributes: [
      { name: 'jacket_type', type: 'select', possibleValues: ['bomber', 'denim', 'leather', 'puffer', 'trench', 'pea coat', 'wool coat'], required: true, displayOrder: 1 },
      { name: 'season', type: 'select', possibleValues: ['spring', 'fall', 'winter', 'all-season'], displayOrder: 2 },
      { name: 'features', type: 'multiselect', possibleValues: ['waterproof', 'windproof', 'insulated', 'breathable', 'packable'], displayOrder: 3 },
      { name: 'closure_type', type: 'select', possibleValues: ['zipper', 'button', 'snap', 'toggle'], displayOrder: 4 },
      { name: 'hood', type: 'boolean', displayOrder: 5 },
    ],
    isActive: true,
    sortOrder: 12,
  },

  // ACCESSORIES
  {
    id: 'accessories',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Premium accessories to complete your look',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall', 'winter'],
    formalityLevel: 'casual',
    fitCharacteristics: { versatile: true, stylish: true, functional: true },
    attributes: [
      { name: 'accessory_type', type: 'select', possibleValues: ['hat', 'scarf', 'belt', 'bag', 'jewelry', 'sunglasses'], required: true, displayOrder: 1 },
      { name: 'material', type: 'select', possibleValues: ['leather', 'canvas', 'knit', 'metal', 'fabric', 'plastic'], displayOrder: 2 },
      { name: 'style', type: 'select', possibleValues: ['casual', 'formal', 'statement', 'minimalist', 'vintage'], displayOrder: 3 },
    ],
    isActive: true,
    sortOrder: 13,
  },

  // PANTS & BOTTOMS (other than jeans)
  {
    id: 'pants-bottoms',
    name: 'Pants & Bottoms',
    slug: 'pants-bottoms',
    description: 'Premium pants and bottoms for various occasions',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer', 'fall', 'winter'],
    formalityLevel: 'business',
    fitCharacteristics: { versatile: true, comfortable: true, professional: true },
    attributes: [
      { name: 'pant_type', type: 'select', possibleValues: ['chinos', 'dress pants', 'joggers', 'cargo pants', 'wide leg', 'culottes'], required: true, displayOrder: 1 },
      { name: 'fit', type: 'select', possibleValues: ['slim', 'straight', 'relaxed', 'wide'], displayOrder: 2 },
      { name: 'rise', type: 'select', possibleValues: ['low rise', 'mid rise', 'high rise'], displayOrder: 3 },
      { name: 'length', type: 'select', possibleValues: ['full length', 'cropped', 'ankle length'], displayOrder: 4 },
    ],
    isActive: true,
    sortOrder: 14,
  },

  // SHORTS
  {
    id: 'shorts',
    name: 'Shorts',
    slug: 'shorts',
    description: 'Comfortable shorts for warm weather and active wear',
    categoryType: 'product',
    genderTarget: 'unisex',
    ageGroup: 'adult',
    seasonality: ['spring', 'summer'],
    formalityLevel: 'casual',
    fitCharacteristics: { comfortable: true, breathable: true, versatile: true },
    attributes: [
      { name: 'short_type', type: 'select', possibleValues: ['athletic', 'denim', 'chino', 'cargo', 'board shorts', 'bike shorts'], displayOrder: 1 },
      { name: 'length', type: 'select', possibleValues: ['2"', '4"', '6"', '8"', '10"', '12"'], displayOrder: 2 },
      { name: 'rise', type: 'select', possibleValues: ['low rise', 'mid rise', 'high rise'], displayOrder: 3 },
    ],
    isActive: true,
    sortOrder: 15,
  },
];

// Helper functions
export const getCategoryById = (id: string): Category | undefined => {
  return clothingCategories.find(cat => cat.id === id);
};

export const getCategoriesByParent = (parentId?: string): Category[] => {
  return clothingCategories.filter(cat => cat.parentId === parentId);
};

export const getTopLevelCategories = (): Category[] => {
  return clothingCategories.filter(cat => !cat.parentId);
};

export const getCategoriesByGender = (gender: 'men' | 'women' | 'unisex' | 'kids'): Category[] => {
  return clothingCategories.filter(cat => cat.genderTarget === gender || cat.genderTarget === 'unisex');
};

export const getCategoriesBySeason = (season: string): Category[] => {
  return clothingCategories.filter(cat => cat.seasonality.includes(season));
};

export const getCategoriesByFormality = (formality: 'casual' | 'business' | 'formal' | 'athletic'): Category[] => {
  return clothingCategories.filter(cat => cat.formalityLevel === formality);
};