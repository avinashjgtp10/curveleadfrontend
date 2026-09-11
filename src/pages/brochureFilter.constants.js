export const BROCHURE_FILTER_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'products', label: 'Products' },
  { value: 'services', label: 'Services' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'company', label: 'Company' },
];

export const BROCHURE_REPORT_CATEGORIES = [
  { value: '', label: 'All Categories' },
  ...BROCHURE_FILTER_CATEGORIES.filter(category => category.value),
  { value: 'general', label: 'General' },
];

export const BROCHURE_SORT_OPTIONS = [
  { value: 'recent', label: 'Sort: Recently Created' },
  { value: 'name', label: 'Sort: Name' },
  { value: 'views', label: 'Sort: Most Viewed' },
  { value: 'shares', label: 'Sort: Most Shared' },
];

export const BROCHURE_PAGE_SIZE_OPTIONS = [5, 10, 15, 20];
