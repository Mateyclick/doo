
// API Keys
export const REMOVE_BG_API_KEY = 'MOCK_API_KEY'; // Replace with your actual API key

// Templates configuration
export const DEFAULT_TEMPLATES: { id: string; name: string; path: string; category?: string; }[] = [
  { id: '1', name: 'Standard Offer', path: '/templates/1.svg', category: 'basic' },
  { id: '2', name: 'Discount', path: '/templates/2.svg', category: 'basic' },
  { id: '3', name: 'Special', path: '/templates/3.svg', category: 'premium' },
  { id: '4', name: 'Limited Time', path: '/templates/4.svg', category: 'premium' },
];

// Canvas dimensions (Instagram Story format)
export const CANVAS_DIMENSIONS = {
  width: 1080,
  height: 1920
};

// Default price styling
export const DEFAULT_PRICE_STYLE = {
  fontFamily: 'Arial',
  fontSize: 36,
  fontWeight: 'bold',
  color: '#FF0000'
};
