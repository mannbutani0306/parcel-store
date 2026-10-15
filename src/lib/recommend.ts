import { Product, PRODUCTS } from '../data/products';
import { Order, SEEDED_ORDERS } from '../data/orders';

export type EngineId = 'smart' | 'popular';

export interface ScoredProduct {
  product: Product;
  score: number; // 0 to 1
  matchPercentage: number; // 0 to 100
  reason: string;
}

export type Scored = ScoredProduct;

export interface UserBehaviourSnapshot {
  views: string[];
  cartAdds: string[];
  purchases: string[];
  wishlist?: string[];
}

export interface RecommendContext {
  userId?: string;
  currentProductId?: string;
  category?: string;
  limit?: number;
  excludeIds?: string[];
  behaviour?: UserBehaviourSnapshot;
  orders?: Order[];
  allProducts?: Product[];
  contextType?:
    | 'home-picked'
    | 'goes-well-with'
    | 'others-also-bought'
    | 'cart-forgot'
    | 'order-next-up';
}

export interface Recommender {
  id: EngineId;
  name: string;
  description: string;
  recommend: (ctx: RecommendContext) => ScoredProduct[];
}

// ----------------------------------------------------
// SEEDED CO-PURCHASE RELATIONS
// ----------------------------------------------------
const SEEDED_CO_PURCHASE: Record<string, string[]> = {
  'books-01': ['books-05', 'books-02', 'tech-04', 'home-06', 'play-01'],
  'books-02': ['books-01', 'books-05', 'tech-04'],
  'books-03': ['books-01', 'books-04', 'home-01'],
  'books-04': ['books-03', 'books-06', 'play-03'],
  'books-05': ['books-01', 'books-02', 'tech-01'],
  'books-06': ['books-04', 'home-05'],
  'tech-01': ['tech-04', 'tech-02', 'books-01', 'home-01'],
  'tech-02': ['tech-05', 'tech-01', 'play-01', 'style-03'],
  'tech-03': ['tech-01', 'tech-06', 'style-01'],
  'tech-04': ['tech-01', 'books-01', 'books-05'],
  'tech-05': ['tech-02', 'tech-06', 'play-04'],
  'tech-06': ['tech-03', 'tech-05'],
  'home-01': ['home-03', 'home-06', 'books-01', 'beauty-02'],
  'home-02': ['home-04', 'home-01', 'beauty-01'],
  'home-03': ['home-01', 'home-02', 'beauty-01', 'play-01'],
  'home-04': ['home-02', 'home-05'],
  'home-05': ['home-04', 'home-06', 'books-06'],
  'home-06': ['home-01', 'books-01'],
  'style-01': ['style-03', 'style-04', 'tech-03'],
  'style-02': ['style-01', 'style-05'],
  'style-03': ['style-01', 'style-06', 'play-01', 'tech-02'],
  'style-04': ['style-01', 'style-05'],
  'style-05': ['style-02', 'style-04'],
  'style-06': ['style-03', 'play-05'],
  'beauty-01': ['beauty-03', 'beauty-04', 'home-02', 'home-03'],
  'beauty-02': ['beauty-01', 'beauty-05', 'home-01'],
  'beauty-03': ['beauty-01', 'beauty-06', 'books-01'],
  'beauty-04': ['beauty-01', 'beauty-02'],
  'beauty-05': ['beauty-02', 'beauty-06'],
  'beauty-06': ['beauty-03', 'beauty-05'],
  'play-01': ['books-01', 'tech-01', 'home-03', 'play-04'],
  'play-02': ['play-03', 'play-04', 'books-04'],
  'play-03': ['play-02', 'play-05'],
  'play-04': ['play-01', 'play-02'],
  'play-05': ['play-03', 'play-06', 'style-06'],
  'play-06': ['play-05', 'tech-02'],
};

// Build Co-Purchase Frequency Graph from seeded matrix & active orders
function buildCoPurchaseMatrix(orders: Order[] = []): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();

  const addPair = (a: string, b: string, weight = 1) => {
    if (a === b) return;
    if (!matrix.has(a)) matrix.set(a, new Map());
    const m = matrix.get(a)!;
    m.set(b, (m.get(b) || 0) + weight);
  };

  // Seeded entries
  Object.entries(SEEDED_CO_PURCHASE).forEach(([src, targets]) => {
    targets.forEach((tgt) => {
      addPair(src, tgt, 2);
      addPair(tgt, src, 2);
    });
  });

  // Orders in store & initial orders
  const allOrders = [...SEEDED_ORDERS, ...orders];
  allOrders.forEach((ord) => {
    const itemIds = ord.items.map((i) => i.productId);
    for (let i = 0; i < itemIds.length; i++) {
      for (let j = i + 1; j < itemIds.length; j++) {
        addPair(itemIds[i], itemIds[j], 4);
        addPair(itemIds[j], itemIds[i], 4);
      }
    }
  });

  return matrix;
}

// ----------------------------------------------------
// 6B. SMART RECOMMENDATION ENGINE (Hybrid Scoring)
// score = 0.35 * categoryAffinity + 0.25 * tagOverlap + 0.25 * coPurchase + 0.10 * rating + 0.05 * recency
// ----------------------------------------------------
export const SmartRecommender: Recommender = {
  id: 'smart',
  name: 'Postal Smart Hybrid',
  description:
    'Blends category affinity, tag graph, co-purchase frequency, reviews, and recency.',
  recommend(ctx: RecommendContext): ScoredProduct[] {
    const limit = ctx.limit || 4;
    const allProducts = ctx.allProducts || PRODUCTS;
    const orders = ctx.orders || [];
    const coMatrix = buildCoPurchaseMatrix(orders);

    const views = ctx.behaviour?.views || [];
    const cartAdds = ctx.behaviour?.cartAdds || [];
    const purchases = ctx.behaviour?.purchases || [];
    const wishlist = ctx.behaviour?.wishlist || [];

    // Check cold start: no user interactions whatsoever
    const hasHistory =
      views.length > 0 || cartAdds.length > 0 || purchases.length > 0 || wishlist.length > 0;

    // Filter candidate pool:
    // Exclude out of stock, exclude already purchased, exclude currentProductId and explicit excludeIds
    const excludeSet = new Set<string>([
      ...(ctx.excludeIds || []),
      ...(purchases || []),
    ]);
    if (ctx.currentProductId) {
      excludeSet.add(ctx.currentProductId);
    }

    let candidates = allProducts.filter((p) => p.stock > 0 && !p.hidden && !excludeSet.has(p.id));

    // Fallback if all candidates excluded
    if (candidates.length === 0) {
      candidates = allProducts.filter((p) => p.stock > 0 && !p.hidden && p.id !== ctx.currentProductId);
    }

    // Cold Start Fallback: Rank by rating * popularity with slight category bias
    if (!hasHistory) {
      return candidates
        .sort((a, b) => b.rating * b.ratingCount - a.rating * a.ratingCount)
        .slice(0, limit)
        .map((p, idx) => {
          const matchPercentage = Math.max(76, 96 - idx * 4);
          return {
            product: p,
            score: (matchPercentage - 50) / 50,
            matchPercentage,
            reason:
              idx === 0
                ? `Acclaimed bestseller in ${p.category}`
                : `Postal community favorite · ${p.rating}★`,
          };
        });
    }

    // 1. Calculate Category Affinity (views: 1, wishlist: 2, cartAdds: 3, purchases: 5)
    const categoryWeights: Record<string, number> = {};
    const addCatWeight = (pid: string, weight: number) => {
      const found = allProducts.find((p) => p.id === pid);
      if (found) {
        categoryWeights[found.category] = (categoryWeights[found.category] || 0) + weight;
      }
    };

    views.forEach((id) => addCatWeight(id, 1));
    wishlist.forEach((id) => addCatWeight(id, 2));
    cartAdds.forEach((id) => addCatWeight(id, 3));
    purchases.forEach((id) => addCatWeight(id, 5));

    // If context has current product or category, add strong current session weight
    if (ctx.currentProductId) {
      const cur = allProducts.find((p) => p.id === ctx.currentProductId);
      if (cur) categoryWeights[cur.category] = (categoryWeights[cur.category] || 0) + 4;
    }
    if (ctx.category && ctx.category !== 'all') {
      categoryWeights[ctx.category] = (categoryWeights[ctx.category] || 0) + 4;
    }

    const maxCatWeight = Math.max(1, ...Object.values(categoryWeights));

    // 2. Calculate Tag Overlap Weights
    const tagWeights: Record<string, number> = {};
    const addTagWeight = (pid: string, weight: number) => {
      const found = allProducts.find((p) => p.id === pid);
      if (found) {
        found.tags.forEach((t) => {
          tagWeights[t] = (tagWeights[t] || 0) + weight;
        });
      }
    };

    views.forEach((id) => addTagWeight(id, 1));
    wishlist.forEach((id) => addTagWeight(id, 2));
    cartAdds.forEach((id) => addTagWeight(id, 3));
    purchases.forEach((id) => addTagWeight(id, 5));

    if (ctx.currentProductId) {
      const cur = allProducts.find((p) => p.id === ctx.currentProductId);
      if (cur) cur.tags.forEach((t) => (tagWeights[t] = (tagWeights[t] || 0) + 4));
    }

    const maxTagWeight = Math.max(1, ...Object.values(tagWeights));

    // 3. Co-Purchase Score
    // Interaction seeds: current product, cart items, top viewed items
    const interactionPids = [
      ...(ctx.currentProductId ? [ctx.currentProductId] : []),
      ...cartAdds.slice(0, 3),
      ...views.slice(0, 3),
      ...purchases.slice(0, 3),
    ];

    // Find the most recently viewed product for contextual reason strings
    const lastViewedProduct = views.length > 0 ? allProducts.find((p) => p.id === views[0]) : null;
    const currentProduct = ctx.currentProductId
      ? allProducts.find((p) => p.id === ctx.currentProductId)
      : null;

    // Dates for recency
    const nowMs = Date.now();
    const timestamps = allProducts.map((p) => new Date(p.createdAt).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps, nowMs);
    const timeSpan = Math.max(1, maxTime - minTime);

    // Score all candidate products
    const scoredList: ScoredProduct[] = candidates.map((p) => {
      // (a) Category affinity (0..1)
      const catRaw = categoryWeights[p.category] || 0;
      const categoryAffinity = Math.min(1, catRaw / maxCatWeight);

      // (b) Tag overlap (0..1)
      let matchedTagSum = 0;
      let topMatchedTag = '';
      p.tags.forEach((t) => {
        if (tagWeights[t]) {
          matchedTagSum += tagWeights[t];
          topMatchedTag = t;
        }
      });
      const tagOverlap = Math.min(1, matchedTagSum / (maxTagWeight * 2));

      // (c) Co-purchase (0..1)
      let coPurchaseFreq = 0;
      let coPurchasePartner = '';
      interactionPids.forEach((iPid) => {
        const pairCount = coMatrix.get(iPid)?.get(p.id) || 0;
        if (pairCount > coPurchaseFreq) {
          coPurchaseFreq = pairCount;
          const partnerObj = allProducts.find((prod) => prod.id === iPid);
          if (partnerObj) coPurchasePartner = partnerObj.name;
        }
      });
      const coPurchase = Math.min(1, coPurchaseFreq / 6);

      // (d) Rating (normalized 3.5 - 5.0 -> 0..1)
      const rating = Math.min(1, Math.max(0, (p.rating - 3.5) / 1.5));

      // (e) Recency (0..1)
      const pTime = new Date(p.createdAt).getTime();
      const recency = Math.min(1, Math.max(0, (pTime - minTime) / timeSpan));

      // Final hybrid formula as requested:
      // score = 0.35 * categoryAffinity + 0.25 * tagOverlap + 0.25 * coPurchase + 0.10 * rating + 0.05 * recency
      const hybridScore =
        0.35 * categoryAffinity +
        0.25 * tagOverlap +
        0.25 * coPurchase +
        0.10 * rating +
        0.05 * recency;

      // Match percentage scaled to attractive 72%–99%
      const matchPercentage = Math.min(99, Math.max(68, Math.round(62 + hybridScore * 37)));

      // Determine human reason based on highest contributor
      let reason = `Popular in ${p.category.toUpperCase()}`;
      if (coPurchasePartner && coPurchase >= 0.4) {
        reason = `Often bought together with ${coPurchasePartner.split(' ')[0]}`;
      } else if (lastViewedProduct && p.category === lastViewedProduct.category) {
        reason = `Because you viewed ${lastViewedProduct.name.split(' ')[0]}`;
      } else if (currentProduct && p.category === currentProduct.category) {
        reason = `Complements your ${currentProduct.name.split(' ')[0]}`;
      } else if (topMatchedTag && tagOverlap >= 0.35) {
        reason = `Matched by #${topMatchedTag} craft tag`;
      } else if (categoryAffinity >= 0.6) {
        reason = `Frequent match in ${p.category.toUpperCase()}`;
      } else if (wishlist.includes(p.id)) {
        reason = `Saved in your postal wishlist`;
      } else {
        reason = `Top rated · ${p.rating}★ archival standard`;
      }

      return {
        product: p,
        score: hybridScore,
        matchPercentage,
        reason,
      };
    });

    // Sort descending by score
    scoredList.sort((a, b) => b.score - a.score);

    return scoredList.slice(0, limit);
  },
};

// ----------------------------------------------------
// 6C. POPULAR RECOMMENDATION ENGINE
// Rank by ratingCount * rating, with a recency boost.
// ----------------------------------------------------
export const PopularRecommender: Recommender = {
  id: 'popular',
  name: 'Community Favorites (Popular)',
  description: 'Ranked purely by verified review volume, star ratings, and fresh arrivals.',
  recommend(ctx: RecommendContext): ScoredProduct[] {
    const limit = ctx.limit || 4;
    const allProducts = ctx.allProducts || PRODUCTS;

    const excludeSet = new Set<string>([
      ...(ctx.excludeIds || []),
      ...(ctx.currentProductId ? [ctx.currentProductId] : []),
    ]);

    const candidates = allProducts.filter((p) => p.stock > 0 && !p.hidden && !excludeSet.has(p.id));

    const nowMs = Date.now();
    const timestamps = allProducts.map((p) => new Date(p.createdAt).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps, nowMs);
    const timeSpan = Math.max(1, maxTime - minTime);

    // Compute raw popularity score: rating * ratingCount * recencyBoost
    const scoredList: ScoredProduct[] = candidates.map((p) => {
      const pTime = new Date(p.createdAt).getTime();
      const recencyBoost = 1 + 0.25 * ((pTime - minTime) / timeSpan); // 1.0 to 1.25 multiplier
      const popularityScore = p.rating * p.ratingCount * recencyBoost;

      return {
        product: p,
        score: popularityScore,
        matchPercentage: 0, // will compute percentile rank below
        reason: '',
      };
    });

    // Sort descending by popularity
    scoredList.sort((a, b) => b.score - a.score);

    // Assign match percentages and reasons based on top rank
    const maxScore = scoredList.length > 0 ? scoredList[0].score : 1;

    return scoredList.slice(0, limit).map((item, idx) => {
      const relativeRatio = item.score / maxScore;
      const matchPercentage = Math.min(99, Math.max(75, Math.round(75 + relativeRatio * 24)));

      let reason = `Top rated across Parcel (${item.product.ratingCount} reviews)`;
      if (idx === 0) {
        reason = `Grand Archival Bestseller (${item.product.rating}★)`;
      } else if (idx === 1) {
        reason = `Most frequently packed in ${item.product.category}`;
      } else if (item.product.rating >= 4.8) {
        reason = `Exceptional ${item.product.rating}★ community rating`;
      }

      return {
        ...item,
        matchPercentage,
        reason,
      };
    });
  },
};

// ----------------------------------------------------
// 6A. ENGINE REGISTRY & SWAPPABLE RESOLVER
// ----------------------------------------------------
export const RECOMMENDER_ENGINES: Record<EngineId, Recommender> = {
  smart: SmartRecommender,
  popular: PopularRecommender,
};

export function getRecommender(engineId: EngineId = 'smart'): Recommender {
  return RECOMMENDER_ENGINES[engineId] || RECOMMENDER_ENGINES.smart;
}

/**
 * Universal Recommend Function returning typed ScoredProduct array.
 * Swaps engine automatically based on the chosen engineId (read from store or context).
 */
export function recommendScored(
  ctx: RecommendContext,
  engineId: EngineId = 'smart'
): ScoredProduct[] {
  const engine = getRecommender(engineId);
  return engine.recommend(ctx);
}

/**
 * Backward-compatible helper returning Product[]
 */
export function recommend(userId?: string, context?: RecommendContext): Product[] {
  const scored = recommendScored(context || {});
  return scored.map((s) => s.product);
}

export function getProductsByCategory(category: string): Product[] {
  if (!category || category === 'all') return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === category);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return PRODUCTS;
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.shortDesc.toLowerCase().includes(q)
  );
}
