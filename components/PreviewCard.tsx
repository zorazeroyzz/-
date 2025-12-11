
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { CommissionData, ThemeColors, ImageItem } from '../types';
import { THEMES, FONT_OPTIONS } from '../constants';
import { AlertTriangle, ZoomIn, Camera, Star, Zap, Heart, Crosshair, Skull, Radio, Activity, Hexagon, Eye, QrCode, X } from 'lucide-react';

interface PreviewCardProps {
  data: CommissionData;
  innerRef: React.RefObject<HTMLDivElement>;
  scaleFactor: number;
  onPosChange: (id: string, pos: {x: number, y: number}) => void;
  onImageUpdate: (list: 'exhibitionImages' | 'mainImages', index: number, updates: Partial<ImageItem>) => void;
  onScaleChange: (id: string, scale: number) => void;
  onToggleVisibility: (field: keyof CommissionData) => void;
}

interface EditableImageProps {
  item: ImageItem;
  index: number;
  listType: 'exhibitionImages' | 'mainImages';
  onUpdate: (list: 'exhibitionImages' | 'mainImages', index: number, updates: Partial<ImageItem>) => void;
  scaleFactor: number;
}

// --- DOHNA MOTION BACKGROUND (REMASTERED) ---
// UPDATED: Wrapped in React.memo to drastically reduce lag when dragging other elements.
const DohnaMotionBackground = React.memo(({ theme, themeName }: { theme: ThemeColors, themeName: string }) => {
  
  // 1. Precise Color Logic for High Contrast
  const colors = useMemo(() => {
    // === CLASSIC PINK (Cyan BG + Pink Stripe) ===
    if (themeName === 'pink') {
        return {
            bg: '#2be0ed',         // Dohna Cyan
            dot: '#0099dd',        // Darker blue
            stripe: '#e6007a',     // Hot Pink
            stripeShadow: '#000000',
            elements: ['#ffff00', '#ffffff', '#1a051d'], 
            accent: '#ffff00'
        };
    }
    // === ELECTRIC YELLOW (Dark Purple BG + Yellow Stripe) ===
    if (themeName === 'yellow') {
        return {
            bg: '#2a0a2e',        // Dark Purple
            dot: '#4a1a4e',       
            stripe: '#ffe600',    // Yellow
            stripeShadow: '#000000',
            elements: ['#e6007a', '#00ccff', '#ffffff'],
            accent: '#e6007a'
        };
    }
    // === CYBER BLUE (White/Light Grey BG + Blue Stripe) ===
    if (themeName === 'blue') {
        return {
            bg: '#f0f0f0',        // Light Grey
            dot: '#d0d0d0',
            stripe: '#0099dd',    // Blue
            stripeShadow: '#000000',
            elements: ['#ffff00', '#ff0055', '#000000'],
            accent: '#ffff00'
        };
    }
    // === TOXIC GREEN (Deep Purple BG + Acid Green Stripe) ===
    if (themeName === 'green') {
        return {
            bg: '#4b0082',        // Indigo/Purple
            dot: '#300055',
            stripe: '#39ff14',    // Acid Green
            stripeShadow: '#000000',
            elements: ['#ffffff', '#ff0055', '#39ff14'],
            accent: '#ff0055'
        };
    }
    // === WARNING RED (Cyan BG + Red Stripe - High Contrast) ===
    if (themeName === 'red') {
        return {
            bg: '#00ffff',        // Cyan
            dot: '#00cccc',
            stripe: '#ff2a2a',    // Red
            stripeShadow: '#000000',
            elements: ['#ffffff', '#000000', '#ffff00'],
            accent: '#ffffff'
        };
    }
    // === HYPNO PURPLE (Acid Green BG + Purple Stripe) ===
    if (themeName === 'purple') {
        return {
            bg: '#ccff00',        // Acid Yellow/Green
            dot: '#aacc00',
            stripe: '#bf00ff',    // Purple
            stripeShadow: '#000000',
            elements: ['#ffffff', '#000000', '#bf00ff'],
            accent: '#000000'
        };
    }

    // === FALLBACK (Uses theme colors but ensures structure) ===
    return {
        bg: theme.bg,
        dot: 'rgba(0,0,0,0.1)',
        stripe: theme.color1,
        stripeShadow: '#000000',
        elements: [theme.color2, theme.color3, '#ffffff'],
        accent: theme.color3
    };
  }, [themeName, theme]);

  // 2. Generate Structured Geometric Elements
  const elements = useMemo(() => {
    const vWidth = 1000;
    const vHeight = 1400;
    
    // Stripe Logic
    const stripeAngle = -30;
    const stripeY = 600;
    const stripeHeight = 450;

    const shapes: Array<{
        id: string; 
        type: 'capsule' | 'cross' | 'ring' | 'line';
        x: number; 
        y: number; 
        w: number; 
        h: number; 
        color: string; 
        zIndex: number; // 0=Behind Stripe, 1=Front
    }> = [];

    // Helper
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    // >> LAYER 1: Background Elements (Sparse, large)
    for (let i = 0; i < 8; i++) {
        shapes.push({
            id: `bg-${i}`,
            type: Math.random() > 0.5 ? 'ring' : 'cross',
            x: rand(0, vWidth),
            y: rand(0, stripeY - 200),
            w: rand(40, 80),
            h: rand(40, 80),
            color: colors.dot, // Subtle blending
            zIndex: 0
        });
    }

    // >> LAYER 2: The "Rain" inside/near the Stripe
    // We create "Lanes" to avoid messy overlap
    const laneCount = 5;
    const laneHeight = stripeHeight / laneCount;
    
    for (let l = 0; l < laneCount; l++) {
        const laneY = stripeY - stripeHeight/2 + (l * laneHeight);
        
        // Items per lane
        const count = Math.floor(rand(3, 6)); 
        for (let k = 0; k < count; k++) {
            const isSpeedLine = Math.random() > 0.7;
            const w = isSpeedLine ? rand(300, 600) : rand(60, 180);
            const h = isSpeedLine ? rand(4, 8) : rand(20, 35);
            
            shapes.push({
                id: `rain-${l}-${k}`,
                type: isSpeedLine ? 'line' : 'capsule',
                x: rand(-200, vWidth + 200),
                y: laneY + rand(10, laneHeight - 10),
                w: w,
                h: h,
                color: pick(colors.elements),
                zIndex: 1
            });
        }
    }

    // >> LAYER 3: Decorative Clusters (The "Pop" feel)
    for (let i = 0; i < 5; i++) {
        const cx = rand(100, vWidth - 100);
        const cy = rand(stripeY - 100, stripeY + 200);
        shapes.push({
            id: `dec-${i}`,
            type: 'cross',
            x: cx,
            y: cy,
            w: 40,
            h: 40,
            color: colors.accent,
            zIndex: 1
        });
    }

    return { shapes, stripeY, stripeHeight, stripeAngle };
  }, [colors]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ backgroundColor: colors.bg }}>
      <svg 
        className="absolute inset-0 w-full h-full" 
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 750 1000"
      >
        <defs>
            {/* HALFTONE PATTERN: The soul of pop art */}
            <pattern id="halftone-dot" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="3" fill={colors.dot} opacity="0.4" />
            </pattern>
            {/* STRIPE PATTERN: Subtle lines inside the main stripe */}
            <pattern id="stripe-line" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                 <line x1="0" y1="10" x2="10" y2="0" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
            </pattern>
        </defs>

        {/* 1. Background Texture */}
        <rect x="0" y="0" width="100%" height="100%" fill="url(#halftone-dot)" />

        {/* GLOBAL ROTATION GROUP */}
        <g transform={`rotate(${elements.stripeAngle}, 375, 500)`}>
            
            {/* 2. Background Decor Shapes */}
            {elements.shapes.filter(s => s.zIndex === 0).map(s => (
                <g key={s.id} opacity="0.6">
                    {s.type === 'cross' && (
                        <path d={`M${s.x} ${s.y} h${s.w} M${s.x + s.w/2} ${s.y - s.h/2} v${s.h}`} stroke={s.color} strokeWidth="12" strokeLinecap="round" />
                    )}
                    {s.type === 'ring' && (
                        <circle cx={s.x} cy={s.y} r={s.w/2} stroke={s.color} strokeWidth="8" fill="none" />
                    )}
                </g>
            ))}

            {/* 3. THE MAIN STRIPE (With Solid Hard Shadow) */}
            {/* Shadow */}
            <rect 
                x="-500" y={elements.stripeY - elements.stripeHeight/2 + 20} 
                width="2000" height={elements.stripeHeight} 
                fill={colors.stripeShadow} 
            />
            {/* Main Body */}
            <rect 
                x="-500" y={elements.stripeY - elements.stripeHeight/2} 
                width="2000" height={elements.stripeHeight} 
                fill={colors.stripe} 
            />
            {/* Inner Texture */}
            <rect 
                 x="-500" y={elements.stripeY - elements.stripeHeight/2} 
                 width="2000" height={elements.stripeHeight} 
                 fill="url(#stripe-line)"
            />
            {/* Top/Bottom Accents */}
            <rect x="-500" y={elements.stripeY - elements.stripeHeight/2 + 10} width="2000" height="5" fill="rgba(255,255,255,0.3)" />
            <rect x="-500" y={elements.stripeY + elements.stripeHeight/2 - 15} width="2000" height="5" fill="rgba(0,0,0,0.2)" />


            {/* 4. FOREGROUND ELEMENTS (Rain/Capsules/Decor) */}
            {elements.shapes.filter(s => s.zIndex === 1).map(s => (
                <g key={s.id}>
                    {/* Shadow Layer (Offset by 6px) */}
                    {s.type === 'capsule' && (
                        <rect x={s.x + 6} y={s.y + 6} width={s.w} height={s.h} rx={s.h/2} fill="black" />
                    )}
                    {s.type === 'cross' && (
                         <path d={`M${s.x+6} ${s.y+6} h${s.w} M${s.x+6 + s.w/2} ${s.y+6 - s.h/2} v${s.h}`} stroke="black" strokeWidth="12" strokeLinecap="square" />
                    )}
                    
                    {/* Object Layer */}
                    {s.type === 'capsule' && (
                        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.h/2} fill={s.color} />
                    )}
                    {s.type === 'line' && (
                        <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={s.color} opacity="0.9" />
                    )}
                    {s.type === 'cross' && (
                         <path d={`M${s.x} ${s.y} h${s.w} M${s.x + s.w/2} ${s.y - s.h/2} v${s.h}`} stroke={s.color} strokeWidth="12" strokeLinecap="square" />
                    )}
                </g>
            ))}
        </g>
      </svg>
      
      {/* 5. VINTAGE NOISE (Essential Texture) */}
      <div className="absolute inset-0 bg-noise opacity-[0.12] mix-blend-multiply pointer-events-none"></div>
      
      {/* 6. VIGNETTE (Focus Center) */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.25)] pointer-events-none"></div>
    </div>
  );
});


// Optimized Image Component with Local State
const EditableImage: React.FC<EditableImageProps> = React.memo(({ 
  item, 
  index, 
  listType, 
  onUpdate, 
  scaleFactor
}) => {
  const [localState, setLocalState] = useState({
    x: item.x,
    y: item.y,
    scale: item.scale
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const initialPosRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    setLocalState({
      x: item.x,
      y: item.y,
      scale: item.scale
    });
  }, [item.x, item.y, item.scale]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragStartRef.current = { x: clientX, y: clientY };
    initialPosRef.current = { x: localState.x, y: localState.y };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragStartRef.current || !initialPosRef.current) return;
      
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

      const dx = (clientX - dragStartRef.current.x) / scaleFactor;
      const dy = (clientY - dragStartRef.current.y) / scaleFactor;

      setLocalState(prev => ({
        ...prev,
        x: initialPosRef.current!.x + dx,
        y: initialPosRef.current!.y + dy
      }));
    };

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdate(listType, index, {
          x: localState.x,
          y: localState.y
        });
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, scaleFactor, listType, index, onUpdate, localState.x, localState.y]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setLocalState(prev => ({ ...prev, scale: newScale }));
  };

  const handleSliderCommit = () => {
    onUpdate(listType, index, { scale: localState.scale });
  };

  const getGridClasses = () => {
    if (listType === 'mainImages') {
      return item.isLandscape ? 'col-span-2 aspect-auto' : 'col-span-1 aspect-[2/3]';
    } else {
      return item.isLandscape ? 'col-span-3 aspect-auto' : 'col-span-1 aspect-[2/3]';
    }
  };

  return (
    <div 
      className={`relative group bg-white overflow-hidden border-2 border-black ${getGridClasses()}`}
    >
        {/* Controls Overlay */}
        <div className="absolute top-0 right-0 p-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto bg-[var(--color-accent)] border-l-2 border-b-2 border-black">
           <div className="flex items-center gap-1">
              <ZoomIn size={12} className="text-black" />
              <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.05" 
                value={localState.scale}
                onChange={handleSliderChange}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                className="w-16 h-2 bg-black rounded-none appearance-none cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()} 
                onTouchStart={(e) => e.stopPropagation()} 
              />
           </div>
        </div>

        {/* The visual image */}
        <div className="w-full h-full bg-gray-200 overflow-hidden"> 
            <img 
              src={item.url} 
              className="w-full h-full object-cover block cursor-move relative z-10 origin-center" 
              alt="Portfolio" 
              style={{ 
                transform: `translate3d(${localState.x}px, ${localState.y}px, 0) scale(${localState.scale})`,
                backfaceVisibility: 'hidden',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
              onMouseDown={handleStart}
              onTouchStart={handleStart}
              draggable={false}
            />
        </div>
    </div>
  );
});

const PreviewCard: React.FC<PreviewCardProps> = ({ data, innerRef, scaleFactor, onPosChange, onImageUpdate, onScaleChange, onToggleVisibility }) => {
  // SAFETY: Default to pink theme if data.themeColor is undefined or invalid
  const theme = THEMES[data.themeColor] || THEMES.pink;
  
  // Resolve Font
  const selectedFont = FONT_OPTIONS.find(f => f.id === data.titleFont) || FONT_OPTIONS[0];

  // Resolve Title Colors
  const titleFill = data.titleColor || '#ffffff';
  const titleShadow = data.titleShadowColor === 'auto' || !data.titleShadowColor ? theme.color1 : data.titleShadowColor;

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const initialPosRef = useRef<{x: number, y: number} | null>(null);

  const handleHeaderStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    setDraggedId(id);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragStartRef.current = { x: clientX, y: clientY };
    
    let startPos = { x: 0, y: 0 };
    if (id === 'avatar') startPos = data.avatarPosition;
    if (id === 'status') startPos = data.statusPosition;
    if (id === 'title') startPos = data.titlePosition;
    if (id === 'slogan') startPos = data.sloganPosition;
    if (id === 'tags') startPos = data.tagsPosition;
    if (id === 'contactBg') startPos = data.contactBackgroundPosition || { x: 0, y: 0 };
    
    initialPosRef.current = startPos;
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggedId || !dragStartRef.current || !initialPosRef.current) return;
      
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

      const dx = (clientX - dragStartRef.current.x) / scaleFactor;
      const dy = (clientY - dragStartRef.current.y) / scaleFactor;

      const newPos = {
        x: initialPosRef.current!.x + dx,
        y: initialPosRef.current!.y + dy
      };
      
      onPosChange(draggedId, newPos);
    };

    const handleEnd = () => {
      setDraggedId(null);
    };

    if (draggedId) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [draggedId, scaleFactor, onPosChange]);

  const ImageGrid = React.useMemo(() => ({ images, listType, title, borderColor }: { images: ImageItem[], listType: 'exhibitionImages' | 'mainImages', title: string, borderColor: string }) => (
    <div className="mb-6 relative">
      <div className="flex items-center gap-2 mb-2 pl-2 border-l-8" style={{ borderColor: borderColor }}>
        {/* Removed font-bold to prevent blurring with ZCOOL KuaiLe which is already thick */}
        <h4 className="text-2xl text-black font-dohna" style={{ color: borderColor, textShadow: '1px 1px 0 #000' }}>
            {title}
        </h4>
        <div className="flex-1 h-0.5 bg-black"></div>
      </div>
      
      <div className="bg-white border-2 border-black p-4 shadow-hard">
        {images.length > 0 ? (
          <div className={`grid gap-2 ${listType === 'mainImages' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {images.map((item, i) => (
               <EditableImage 
                 key={item.id} 
                 item={item} 
                 index={i} 
                 listType={listType}
                 onUpdate={onImageUpdate} 
                 scaleFactor={scaleFactor}
               />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 h-24 flex flex-col items-center justify-center bg-gray-50">
            <span className="text-sm font-bold text-gray-400">NO SIGNAL // UPLOAD</span>
          </div>
        )}
      </div>
    </div>
  ), [scaleFactor, onImageUpdate]);


  return (
    <div className="w-full flex justify-center py-8">
      {/* Background Container for the Card */}
      <div 
        ref={innerRef}
        className="relative w-[750px] flex flex-col font-sans overflow-hidden bg-white"
        style={{ 
            minHeight: '1000px',
            '--color-main': theme.color1,
            '--color-sub': theme.color2,
            '--color-accent': theme.color3
        } as React.CSSProperties}
      >
        {/* === NEW DOHNA MOTION BACKGROUND (REMASTERED) === */}
        {/* React.memo applied above ensures this doesn't re-render on drag unless theme changes */}
        <DohnaMotionBackground theme={theme} themeName={data.themeColor} />

        {/* === HEADER AREA === */}
        <div className="relative z-10 p-8 pb-0" style={{ marginBottom: `${data.spacingHeader}px` }}>
            
            {/* NAME TITLE */}
            <div 
              className="relative cursor-move group w-full z-30 mb-8"
              style={{ transform: `translate(${data.titlePosition.x}px, ${data.titlePosition.y}px)` }}
              onMouseDown={(e) => handleHeaderStart(e, 'title')}
              onTouchStart={(e) => handleHeaderStart(e, 'title')}
            >
              <h1 className="text-[6.5rem] leading-none font-bold italic relative z-10 w-full text-center text-stroke-heavy tracking-tighter"
                  style={{ 
                    // Parent color is fallback or used for stroke context
                    color: titleFill, 
                    textShadow: `8px 8px 0 ${titleShadow}`,
                    fontFamily: selectedFont.family,
                  }}>
                  <span className="relative inline-block" style={{ transform: 'skewX(-10deg)' }}>
                     {/* Coloring Logic: Tokenized Segments for Alternating Colors */}
                     {(() => {
                        // Regex splits by separators (keeping separators due to capturing group)
                        // Hyphen moved to end of class to prevent range error
                        const regex = /([ :：/／|｜\\.,_>+~=!"'’‘“”;；[\]{}()（）-]+)/;
                        const parts = data.photographerName.split(regex);
                        
                        let textIndex = 0;
                        
                        return parts.map((part, i) => {
                            if (!part) return null;
                            
                            const isPunctuation = regex.test(part);
                            
                            let color;
                            if (isPunctuation) {
                                color = '#ffffff'; // Punctuation Fixed White
                            } else {
                                // Alternate Text Groups: Primary -> Secondary -> Primary...
                                // Fallback to theme.color3 (Accent) if secondary not set, ensuring contrast.
                                const primary = titleFill;
                                const secondary = data.titleColorSecondary || theme.color3;
                                
                                color = textIndex % 2 === 0 ? primary : secondary;
                                textIndex++;
                            }
                            
                            return <span key={i} style={{ color }}>{part}</span>;
                        });
                     })()}
                  </span>
              </h1>
            </div>

            <div className="flex justify-between items-start relative px-4">
               {/* STATUS STICKER */}
               <div 
                 className="flex flex-col cursor-move group relative z-30 -rotate-6"
                 style={{ transform: `translate(${data.statusPosition.x}px, ${data.statusPosition.y}px) scale(${data.statusScale})` }}
                 onMouseDown={(e) => handleHeaderStart(e, 'status')}
                 onTouchStart={(e) => handleHeaderStart(e, 'status')}
                 onWheel={(e) => {
                    e.stopPropagation(); e.preventDefault();
                    onScaleChange('status', Math.max(0.5, Math.min(3, data.statusScale + (e.deltaY > 0 ? -0.1 : 0.1))));
                 }}
               >
                 <div className="bg-[var(--color-accent)] border-4 border-black px-8 py-2 shadow-hard-xl">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-black rounded-full animate-pulse"></div>
                        <span className="text-3xl font-black text-black font-dohna tracking-widest italic">OPEN NOW</span>
                    </div>
                 </div>
               </div>

               {/* AVATAR */}
               <div 
                  className="relative w-48 h-48 shrink-0 group z-20 cursor-move"
                  style={{ transform: `translate(${data.avatarPosition.x}px, ${data.avatarPosition.y}px) scale(${data.avatarScale})` }}
                  onMouseDown={(e) => handleHeaderStart(e, 'avatar')}
                  onTouchStart={(e) => handleHeaderStart(e, 'avatar')}
                  onWheel={(e) => {
                    e.stopPropagation(); e.preventDefault();
                    onScaleChange('avatar', Math.max(0.5, Math.min(3, data.avatarScale + (e.deltaY > 0 ? -0.1 : 0.1))));
                  }}
               >
                  {/* Decorative Backplates */}
                  <div className="absolute top-3 left-3 w-full h-full bg-[var(--color-sub)] border-4 border-black"></div>
                  <div className="absolute -top-3 -left-3 w-full h-full bg-[var(--color-main)] border-4 border-black"></div>
                  
                  {/* Image container */}
                  <div className="absolute inset-0 bg-white border-4 border-black overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                    {data.avatar ? (
                      <img src={data.avatar} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Camera size={32} className="text-black" />
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* SLOGAN */}
            <div 
              className="mt-8 cursor-move group w-full flex justify-center z-30"
              style={{ transform: `translate(${data.sloganPosition.x}px, ${data.sloganPosition.y}px)` }}
              onMouseDown={(e) => handleHeaderStart(e, 'slogan')}
              onTouchStart={(e) => handleHeaderStart(e, 'slogan')}
            >
              <div className="bg-black text-white px-10 py-3 transform skew-x-[-12deg] border-4 border-white shadow-hard" style={{ backgroundColor: '#000' }}>
                 <p className="text-3xl font-bold font-dohna tracking-wider transform skew-x-[12deg]">
                    {data.slogan} <span className="text-[var(--color-accent)]">//</span>
                 </p>
              </div>
            </div>

            {/* TAGS */}
            <div 
              className="mt-8 cursor-move group w-full flex justify-center z-30"
              style={{ transform: `translate(${data.tagsPosition.x}px, ${data.tagsPosition.y}px)` }}
              onMouseDown={(e) => handleHeaderStart(e, 'tags')}
              onTouchStart={(e) => handleHeaderStart(e, 'tags')}
            >
               <div className="flex items-center gap-2 justify-center w-full px-4">
                  {/* Label: Forced to row with tags */}
                  <span className="text-3xl font-bold font-dohna text-white italic shrink-0 text-stroke-md drop-shadow-[2px_2px_0_#000] mr-2">
                    互勉列表：
                  </span>

                  {/* Tags: Forced to one row (nowrap) */}
                  <div className="flex flex-nowrap gap-4 items-center">
                      {data.tags.map((tag, i) => (
                        <div key={i} className="relative group hover:-translate-y-1 transition-transform shrink-0">
                            <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                            <span 
                              className="relative block px-6 py-1 font-bold text-xl border-4 border-black bg-white text-black font-dohna whitespace-nowrap">
                              #{tag}
                            </span>
                        </div>
                      ))}
                  </div>
               </div>
            </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="p-8 relative z-20">
           
           {/* 1. IMAGES */}
           {data.showPortfolio && (
             <div className="relative mt-4" style={{ marginBottom: `${data.spacingPortfolio}px` }}>
                <ImageGrid 
                   title="场照 // EXHIBITION.DATA" 
                   listType="exhibitionImages"
                   images={data.exhibitionImages} 
                   borderColor={theme.color1}
                />
                <ImageGrid 
                   title="正片 // MAIN.WORK" 
                   listType="mainImages"
                   images={data.mainImages} 
                   borderColor={theme.color2}
                />
             </div>
           )}

           {/* 2. PRICING */}
           {data.showPricing && (
             <div className="relative" style={{ marginBottom: `${data.spacingPricing}px` }}>
                <div className="flex items-center justify-between border-b-8 border-black mb-8 pb-2">
                   <h3 
                    className="text-5xl font-bold italic text-black tracking-tighter text-stroke-md drop-shadow-[4px_4px_0_#000]"
                    style={{ 
                        fontFamily: selectedFont.family,
                        color: titleFill, // Also apply custom color here for consistency
                        textShadow: `4px 4px 0 ${titleShadow}`
                    }}
                   >
                     SERVICE MENU
                   </h3>
                   <div className="flex gap-2">
                      <Star fill="#ffe600" stroke="#ffffff" strokeWidth={3} size={32} />
                      <Star fill="#ffe600" stroke="#ffffff" strokeWidth={3} size={32} />
                      <Star fill="#ffe600" stroke="#ffffff" strokeWidth={3} size={32} />
                   </div>
                </div>

                <div className="grid gap-6">
                  {data.pricing.map((item, i) => (
                     <div key={item.id} className="relative bg-white border-4 border-black p-0 shadow-hard flex group overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-hard-xl">
                        {/* Left Color Strip */}
                        <div className="w-6 border-r-4 border-black" style={{ backgroundColor: [theme.color1, theme.color2, theme.color3][i % 3] }}></div>
                        
                        <div className="flex-1 p-5 flex items-center justify-between">
                            <div>
                               {/* Removed italic */}
                               <h4 className="text-3xl font-bold text-black uppercase font-dohna">{item.title}</h4>
                               <div className="flex items-center gap-2 mt-2">
                                  <Zap size={16} fill="#ffe600" className="text-black" />
                                  <p className="font-bold text-base text-black bg-gray-100 px-3 py-0.5 border-2 border-black rounded-sm">
                                    {item.desc}
                                  </p>
                               </div>
                            </div>
                            
                            <div className="relative">
                               <div className="bg-black text-white px-6 py-2 transform -rotate-3 border-4 border-white shadow-hard-sm">
                                  <span className="text-3xl font-bold italic font-dohna text-[var(--color-accent)]">{item.price}</span>
                                </div>
                            </div>
                        </div>
                     </div>
                  ))}
                </div>
             </div>
           )}

           {/* 3. NOTICE */}
           {data.showNotice && (
             <div className="relative group/notice" style={{ marginBottom: `${data.spacingNotice}px` }}>
                {/* Explicit Yellow/Black Theme for Warning Section */}
                <div className="bg-black border-4 p-2 relative shadow-hard" style={{ borderColor: '#ffe600' }}>
                   {/* CLOSE BUTTON */}
                   <button 
                     onClick={(e) => { e.stopPropagation(); onToggleVisibility('showNotice'); }}
                     className="absolute top-2 right-2 text-black bg-[#ffe600] z-20 opacity-0 group-hover/notice:opacity-100 transition-opacity p-1 border-2 border-black hover:bg-white"
                     title="Hide Section"
                   >
                      <X size={16} strokeWidth={3} />
                   </button>

                   <div className="border-4 border-dashed p-6" style={{ borderColor: '#ffe600' }}>
                      <div className="flex items-center gap-3 border-b-4 pb-4 mb-4" style={{ borderColor: '#ffe600' }}>
                         <AlertTriangle size={48} fill="#ffe600" className="text-black flex-shrink-0" strokeWidth={2.5} />
                         {/* Removed italic */}
                         <h3 className="text-3xl font-bold text-[#ffe600]">IMPORTANT NOTICE // 须知</h3>
                      </div>
                      <div className="font-bold text-lg leading-relaxed text-[#ffe600] whitespace-pre-line font-mono">
                         {data.notice || "NO CONTENT"}
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* 4. CONTACT */}
           {data.showContact && (
             <div className="relative mt-16">
                <div className="bg-white border-4 border-black relative overflow-hidden flex flex-col items-center p-10 shadow-hard-xl">
                   
                   {data.contactBackgroundImage && (
                     <div className="absolute inset-0 z-0">
                        <img 
                           src={data.contactBackgroundImage} 
                           alt="bg"
                           className="w-full h-full object-cover cursor-move mix-blend-multiply"
                           style={{ 
                               transform: `translate(${data.contactBackgroundPosition?.x || 0}px, ${data.contactBackgroundPosition?.y || 0}px) scale(${data.contactBackgroundScale})`,
                               opacity: data.contactBackgroundOpacity
                           }}
                           onMouseDown={(e) => handleHeaderStart(e, 'contactBg')}
                           onTouchStart={(e) => handleHeaderStart(e, 'contactBg')}
                           draggable={false}
                        />
                        <div className="absolute inset-0 bg-dohna-dots opacity-10"></div>
                     </div>
                   )}

                   <div className="relative z-10 w-full flex flex-col items-center">
                       {/* Removed italic */}
                       <h3 
                        className="text-6xl font-bold text-stroke-heavy drop-shadow-hard mb-10"
                        style={{ 
                            fontFamily: selectedFont.family,
                            color: titleFill,
                            textShadow: `4px 4px 0 ${titleShadow}`
                        }}
                       >
                         CONTACT ME
                       </h3>
                       
                       <div className="flex items-center justify-center gap-16 w-full mb-10">
                         {data.qrCodeQQ && (
                           <div className="relative group bg-white p-4 border-4 border-black shadow-hard transform rotate-2 hover:rotate-0 transition-transform">
                               <div className="w-32 h-32">
                                   <img src={data.qrCodeQQ} alt="QQ" className="w-full h-full object-contain" />
                               </div>
                               <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 font-bold text-sm border-2 border-white">QQ</div>
                           </div>
                         )}

                         {data.qrCodeWeChat && (
                           <div className="relative group bg-white p-4 border-4 border-black shadow-hard transform -rotate-2 hover:rotate-0 transition-transform">
                               <div className="w-32 h-32">
                                   <img src={data.qrCodeWeChat} alt="WX" className="w-full h-full object-contain" />
                               </div>
                               <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 font-bold text-sm border-2 border-white">WECHAT</div>
                           </div>
                         )}
                       </div>

                       {data.showContactInfo && (
                           <div className="relative group/info transform -rotate-1 hover:scale-105 transition-transform hover:z-50">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleVisibility('showContactInfo'); }}
                                    className="absolute -top-3 -right-3 bg-black text-white rounded-full p-1 border-2 border-white hover:bg-red-500 opacity-0 group-hover/info:opacity-100 transition-opacity z-50 shadow-sm"
                                    title="Hide Display ID"
                                >
                                    <X size={12} strokeWidth={3} />
                                </button>
                                <div className="bg-[var(--color-accent)] text-black px-16 py-4 text-4xl font-bold italic border-4 border-black shadow-hard font-dohna">
                                    {data.contactInfo}
                                </div>
                           </div>
                       )}
                   </div>
                </div>
             </div>
           )}
        </div>
        
        {/* Footer Bar */}
        <div className="h-8 w-full bg-black flex items-center justify-center overflow-hidden border-t-8 border-black">
            <div className="text-xs text-[var(--color-accent)] font-mono whitespace-nowrap font-black tracking-[0.5em]">
               DOHNA DOHNA DOHNA DOHNA DOHNA DOHNA DOHNA DOHNA DOHNA DOHNA DOHNA DOHNA DOHNA DOHNA
            </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;
