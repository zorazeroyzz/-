
import { ThemeColors, CommissionData } from './types';

export const THEMES: Record<string, ThemeColors> = {
  pink: {
    color1: '#e6007a', // Hot Pink
    color2: '#0099dd', // Cyan Blue
    color3: '#ffe600', // Yellow
    bg: '#000000',
    pattern: 'pattern-dots'
  },
  yellow: {
    color1: '#ffe600', // Yellow
    color2: '#e6007a', // Pink
    color3: '#0099dd', // Blue
    bg: '#1a1a00',
    pattern: 'pattern-stripes'
  },
  blue: {
    color1: '#0099dd', // Blue
    color2: '#ffe600', // Yellow
    color3: '#e6007a', // Pink
    bg: '#000a1a',
    pattern: 'pattern-grid'
  },
  green: {
    color1: '#39ff14', // Acid Green
    color2: '#bf00ff', // Purple
    color3: '#ff0055', // Red
    bg: '#051a05',
    pattern: 'pattern-checkers'
  },
  red: {
    color1: '#ff2a2a', // Red
    color2: '#00ffff', // Cyan
    color3: '#ffffff', // White
    bg: '#1a0505',
    pattern: 'pattern-spikes'
  },
  purple: {
    color1: '#bf00ff', // Purple
    color2: '#39ff14', // Green
    color3: '#00ffff', // Cyan
    bg: '#1a002e',
    pattern: 'pattern-hypno'
  }
};

export const FONT_OPTIONS = [
  { id: 'russo', name: 'RUSSO (Mecha)', family: '"Russo One", sans-serif' },
  { id: 'mochiy', name: 'MOCHIY (Pop)', family: '"Mochiy Pop One", sans-serif' },
  { id: 'glitch', name: 'GLITCH (Cyber)', family: '"Rubik Glitch", system-ui' },
  { id: 'bangers', name: 'BANGERS (Comic)', family: '"Bangers", system-ui' },
  { id: 'marker', name: 'MARKER (Street)', family: '"Permanent Marker", cursive' },
  { id: 'zcool', name: 'KUAILE (Fun)', family: '"ZCOOL KuaiLe", sans-serif' },
  { id: 'mashan', name: 'MASHAN (Brush)', family: '"Ma Shan Zheng", cursive' },
  { id: 'pixel', name: 'PIXEL (Retro)', family: '"Press Start 2P", cursive' },
];

export const DOHNA_COLORS = [
  { id: 'white', value: '#ffffff', name: 'WHITE' },
  { id: 'black', value: '#000000', name: 'BLACK' },
  { id: 'pink', value: '#e6007a', name: 'PINK' },
  { id: 'cyan', value: '#0099dd', name: 'CYAN' },
  { id: 'yellow', value: '#ffe600', name: 'YELLOW' },
  { id: 'green', value: '#39ff14', name: 'ACID' },
  { id: 'purple', value: '#bf00ff', name: 'PURPLE' },
  { id: 'red', value: '#ff2a2a', name: 'RED' },
];

export const DEFAULT_DATA: CommissionData = {
  photographerName: "摄氏零度",
  slogan: "次元壁突破 // SHUTTER BREAK",
  tags: ["日系", "赛博朋克", "情绪", "暗黑"],
  contactInfo: "QQ: 123456789",
  pricing: [
    { id: '1', title: '漫展场照 // EXHIBITION', price: '500r', desc: '9张精修 / 动作指导 / 底片全送' },
    { id: '2', title: '外景正片 // LOCATION', price: '1200r', desc: '20张精修 / 包含排版 / 1-2h拍摄' },
    { id: '3', title: '棚拍企划 // STUDIO', price: '1500r', desc: '布光设计 / 后期合成 / 提供道具' },
  ],
  exhibitionImages: [], 
  mainImages: [],       
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
  themeColor: 'pink',
  titleFont: 'russo',
  titleColor: '#ffffff',     // Default White
  titleColorSecondary: '',   // Default None
  titleShadowColor: 'auto',  // Default Auto (Theme Color)
  
  showPortfolio: true,
  showPricing: true,
  showNotice: true,
  showContact: true,
  
  // Default Spacing (px)
  spacingHeader: 0,     
  spacingPortfolio: 32,
  spacingPricing: 32,
  spacingNotice: 32,
};
