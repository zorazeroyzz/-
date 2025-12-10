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
  exhibitionImages: ImageItem[]; // Updated type
  mainImages: ImageItem[]; // Updated type
  avatar: string; // User avatar
  
  // Positions for draggable header elements
  avatarPosition: { x: number; y: number };
  statusPosition: { x: number; y: number };
  titlePosition: { x: number; y: number };
  sloganPosition: { x: number; y: number };
  tagsPosition: { x: number; y: number };

  // Scale for draggable header elements
  avatarScale: number;
  statusScale: number;

  qrCodeQQ: string; // QQ QR Code
  qrCodeWeChat: string; // WeChat QR Code
  
  // Contact section styling
  contactBackgroundImage: string;
  contactBackgroundOpacity: number;
  contactBackgroundPosition: { x: number; y: number };
  contactBackgroundScale: number;

  notice: string; 
  themeColor: 'pink' | 'yellow' | 'blue' | 'red' | 'purple' | 'green' | 'cyan' | 'orange';
  
  // Visibility flags
  showPortfolio: boolean;
  showPricing: boolean;
  showNotice: boolean;
  showContact: boolean;

  // Spacing controls
  spacingHeader: number;      // Bottom padding of header
  spacingPortfolio: number;
  spacingPricing: number;
  spacingNotice: number;
}

export type ThemeColors = {
  primary: string;   // Main Neon (Borders, Highlights)
  secondary: string; // Header Background (Dark/Tinted)
  accent: string;    // Clashing Color (Badges, Special Text)
  text: string;      // Header Text Color
  bg: string;        // Web App Background (for preview context)
  gradient: string;
};