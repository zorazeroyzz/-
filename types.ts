
export interface PricingItem {
  id: string;
  title: string;
  price: string;
  desc: string;
}

export interface ImageItem {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  isLandscape?: boolean;
}

export interface CommissionData {
  photographerName: string;
  slogan: string;
  tags: string[];
  contactInfo: string;
  pricing: PricingItem[];
  exhibitionImages: ImageItem[]; 
  mainImages: ImageItem[]; 
  avatar: string; 
  
  // Positions for draggable header elements
  avatarPosition: { x: number; y: number };
  statusPosition: { x: number; y: number };
  titlePosition: { x: number; y: number };
  sloganPosition: { x: number; y: number };
  tagsPosition: { x: number; y: number };

  // Scale for draggable header elements
  avatarScale: number;
  statusScale: number;

  qrCodeQQ: string; 
  qrCodeWeChat: string; 
  
  // Contact BG
  contactBackgroundImage: string;
  contactBackgroundOpacity: number;
  contactBackgroundPosition: { x: number; y: number };
  contactBackgroundScale: number;

  notice: string; 
  themeColor: 'pink' | 'yellow' | 'blue' | 'red' | 'purple' | 'green';
  titleFont: string; 
  titleColor: string;        // Primary Fill Color
  titleColorSecondary?: string; // New: Secondary Fill Color for Alternating Effect
  titleShadowColor: string;  // Shadow Color (or 'auto')
  
  // Visibility flags
  showPortfolio: boolean;
  showPricing: boolean;
  showNotice: boolean;
  showContact: boolean;

  // Spacing controls
  spacingHeader: number;      
  spacingPortfolio: number;
  spacingPricing: number;
  spacingNotice: number;
}

export interface Preset {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  data: CommissionData;
}

export type ThemeColors = {
  color1: string;   // Main (e.g., Pink)
  color2: string;   // Sub (e.g., Blue)
  color3: string;   // Accent (e.g., Yellow)
  bg: string;       // Background color
  pattern: string;  // CSS class for pattern
};
