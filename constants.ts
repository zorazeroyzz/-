import { ThemeColors } from './types';

export const THEMES: Record<string, ThemeColors> = {
  pink: {
    primary: '#ff0055', // Hot Pink
    secondary: '#1a1a1a', // Near Black
    accent: '#00ffcc', // Cyan (Clash)
    text: '#ffffff',
    bg: '#121212',
    gradient: 'linear-gradient(135deg, #ff0055 0%, #ff00aa 100%)'
  },
  yellow: {
    primary: '#ffcc00', // Cyber Yellow
    secondary: '#000000', // Pure Black
    accent: '#ff0055', // Hot Pink (Clash)
    text: '#ffffff',
    bg: '#1a1a1a',
    gradient: 'linear-gradient(135deg, #ffcc00 0%, #ffaa00 100%)'
  },
  blue: {
    primary: '#00aaff', // Electric Blue
    secondary: '#050514', // Deep Navy
    accent: '#ffcc00', // Yellow (Clash)
    text: '#ffffff',
    bg: '#0a0a1a',
    gradient: 'linear-gradient(135deg, #00aaff 0%, #0055ff 100%)'
  },
  red: {
    primary: '#ff3333', // Warning Red
    secondary: '#1a0505', // Deep Red/Black
    accent: '#ffffff', // White
    text: '#ffffff',
    bg: '#000000',
    gradient: 'linear-gradient(135deg, #ff3333 0%, #990000 100%)'
  },
  purple: {
    primary: '#bf00ff', // Neon Purple
    secondary: '#1a002e', // Deep Purple
    accent: '#39ff14', // Acid Green (EVA Unit 01 Vibe)
    text: '#ffffff',
    bg: '#0f0518',
    gradient: 'linear-gradient(135deg, #bf00ff 0%, #7700ff 100%)'
  },
  green: {
    primary: '#39ff14', // Acid Green
    secondary: '#000000', // Black
    accent: '#ff00ff', // Magenta (Toxic Glitch Vibe)
    text: '#ffffff',
    bg: '#051a05',
    gradient: 'linear-gradient(135deg, #39ff14 0%, #005500 100%)'
  },
  cyan: {
    primary: '#00ffff', // Cyan
    secondary: '#1a001a', // Deep Magenta Background
    accent: '#ff00ff', // Magenta (Vapor/Glitch Vibe)
    text: '#ffffff',
    bg: '#001a1a',
    gradient: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)'
  },
  orange: {
    primary: '#ff6600', // Safety Orange
    secondary: '#0f172a', // Slate Blue
    accent: '#00ffff', // Cyan (Industrial Vibe)
    text: '#ffffff',
    bg: '#1a0a00',
    gradient: 'linear-gradient(135deg, #ff6600 0%, #ff3300 100%)'
  }
};

export const DEFAULT_DATA = {
  photographerName: "摄氏零度",
  slogan: "次元壁突破 // SHUTTER BREAK",
  tags: ["日系", "赛博朋克", "情绪", "暗黑"],
  contactInfo: "QQ: 123456789",
  pricing: [
    { id: '1', title: '漫展场照 // EXHIBITION', price: '500r', desc: '9张精修 / 动作指导 / 底片全送' },
    { id: '2', title: '外景正片 // LOCATION', price: '1200r', desc: '20张精修 / 包含排版 / 1-2h拍摄' },
    { id: '3', title: '棚拍企划 // STUDIO', price: '1500r', desc: '布光设计 / 后期合成 / 提供道具' },
  ],
  exhibitionImages: [], // Now ImageItem[]
  mainImages: [],       // Now ImageItem[]
  avatar: "",
  
  // Position Defaults
  avatarPosition: { x: 0, y: 0 },
  statusPosition: { x: 0, y: 0 },
  titlePosition: { x: 0, y: 0 },
  sloganPosition: { x: 0, y: 0 },
  tagsPosition: { x: 0, y: 0 },

  // Scale Defaults
  avatarScale: 1,
  statusScale: 1,

  qrCodeQQ: "",
  qrCodeWeChat: "",
  
  // Contact BG
  contactBackgroundImage: "",
  contactBackgroundOpacity: 0.5,
  contactBackgroundPosition: { x: 0, y: 0 },
  contactBackgroundScale: 1,

  notice: "1. 跑单不退定金，改期请提前3天。\n2. 包往返路费/门票。\n3. 工期2-3周，加急x1.5。\n4. 默认可展示，买断x2。",
  themeColor: 'pink' as const,
  showPortfolio: true,
  showPricing: true,
  showNotice: true,
  showContact: true,
  
  // Default Spacing (px)
  spacingHeader: 0,     // Bottom padding of header
  spacingPortfolio: 32,
  spacingPricing: 32,
  spacingNotice: 32,
};