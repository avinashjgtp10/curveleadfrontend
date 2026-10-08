export const BROCHURE_FILTER_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'products', label: 'Products' },
  { value: 'services', label: 'Services' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'company', label: 'Company' },
  { value: 'general', label: 'General' },
];

export const BROCHURE_REPORT_CATEGORIES = [
  { value: '', label: 'All Categories' },
  ...BROCHURE_FILTER_CATEGORIES.filter(category => category.value),
];

export const BROCHURE_SORT_OPTIONS = [
  { value: 'recent', label: 'Sort: Recently Created' },
  { value: 'name', label: 'Sort: Name' },
  { value: 'views', label: 'Sort: Most Viewed' },
  { value: 'shares', label: 'Sort: Most Shared' },
];

export const BROCHURE_PAGE_SIZE_OPTIONS = [100, 200, 300, 400, 500];

export function brochureCategory(value) {
 const key=String(value||'').trim().toLowerCase();
 return ({product:'products',products:'products',service:'services',services:'services',price:'pricing',pricing:'pricing',company:'company'})[key]||'general';
}
export function brochureMatches(b,search='',statFilter='') {
 return (!search||String(b.name||'').toLowerCase().includes(search.trim().toLowerCase())) && (statFilter!=='shared'||Number(b.times_shared)>0) && (statFilter!=='viewed'||Number(b.views)>0);
}
export function brochureCounts(rows,search='',statFilter='') {
 return rows.filter(b=>brochureMatches(b,search,statFilter)).reduce((counts,b)=>{counts['']++;const key=brochureCategory(b.category);counts[key]=(counts[key]||0)+1;return counts;},{'':0});
}
