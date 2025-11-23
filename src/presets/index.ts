// Export all presets
import { PresetsByCategory } from './types';

// B2B presets
import { catalogPreset } from './b2b/catalog';
import { pricesPreset } from './b2b/prices';
import { boostSalesPreset } from './b2b/boost-sales';
import { boostImpressionsPreset } from './b2b/boost-impressions';
import { shelvesPreset } from './b2b/shelves';
import { reachPromotionPreset } from './b2b/reach-promotion';
import { reviewsForPointsPreset } from './b2b/reviews-for-points';
import { ordersPreset as b2bOrdersPreset } from './b2b/orders';

// B2C presets
import { productListPreset } from './b2c/product-list';
import { productDetailsPreset } from './b2c/product-details';
import { reviewsPreset } from './b2c/reviews';
import { usersPreset } from './b2c/users';
import { wishlistPreset } from './b2c/wishlist';
import { ordersPreset as b2cOrdersPreset } from './b2c/orders';

export const presets: PresetsByCategory = {
  b2b: [
    catalogPreset,
    pricesPreset,
    boostSalesPreset,
    boostImpressionsPreset,
    shelvesPreset,
    reachPromotionPreset,
    reviewsForPointsPreset,
    b2bOrdersPreset
  ],
  b2c: [
    productListPreset,
    productDetailsPreset,
    wishlistPreset,
    b2cOrdersPreset,
    reviewsPreset,
    usersPreset
  ]
};

export * from './types';

