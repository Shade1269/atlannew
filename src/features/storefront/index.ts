// Components
export { WishlistButton } from './components/WishlistButton';
export { HeaderWishlistButton } from './components/HeaderWishlistButton';
export { HeaderCompareButton } from './components/HeaderCompareButton';
export { CompareProducts, CompareButton } from './components/CompareProducts';
export { AdvancedSearch, FiltersSidebar, type SearchFilters } from './components/AdvancedSearch';
export { RelatedProducts, FrequentlyBoughtTogether } from './components/RelatedProducts';
export { CustomerLoyaltyCard, LoyaltyPointsBadge, AllLoyaltyTiers } from './components/CustomerLoyalty';
export { 
  AbandonedCartRecovery, 
  useAbandonedCartTracking, 
  getAbandonedCart 
} from './components/AbandonedCartRecovery';
export { ProductReviews } from './components/ProductReviews';
export { StockAlertButton } from './components/StockAlertButton';

// Hooks
export { useWishlist } from './hooks/useWishlist';
export { useCompare } from './hooks/useCompare';
export { useProductReviews } from './hooks/useProductReviews';
