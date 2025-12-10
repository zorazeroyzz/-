import React, { useRef, useState, useEffect } from 'react';
import { CommissionData, ThemeColors, ImageItem } from '../types';
import { THEMES } from '../constants';
import { Zap, Aperture, AlertTriangle, MessageSquare, Quote, Hash, Image as ImageIcon, Camera, Move, ZoomIn } from 'lucide-react';

interface PreviewCardProps {
  data: CommissionData;
  innerRef: React.RefObject<HTMLDivElement>;
  scaleFactor: number;
  onPosChange: (id: string, pos: {x: number, y: number}) => void;
  onImageUpdate: (list: 'exhibitionImages' | 'mainImages', index: number, updates: Partial<ImageItem>) => void;
  onScaleChange: (id: string, scale: number) => void;
}

interface EditableImageProps {
  item: ImageItem;
  index: number;
  listType: 'exhibitionImages' | 'mainImages';
  onUpdate: (list: 'exhibitionImages' | 'mainImages', index: number, updates: Partial<ImageItem>) => void;
  scaleFactor: number;
  theme: ThemeColors;
}

const EditableImage: React.FC<EditableImageProps> = ({ 
  item, 
  index, 
  listType, 
  onUpdate, 
  scaleFactor,
  theme
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const initialPosRef = useRef<{x: number, y: number} | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to header dragging
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { x: item.x, y: item.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || !initialPosRef.current) return;
      
      const dx = (e.clientX - dragStartRef.current.x) / scaleFactor;
      const dy = (e.clientY - dragStartRef.current.y) / scaleFactor;

      onUpdate(listType, index, {
        x: initialPosRef.current.x + dx,
        y: initialPosRef.current.y + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scaleFactor, index, listType, onUpdate]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Determine scale direction
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    let newScale = Math.max(0.1, Math.min(5, item.scale + delta));
    
    onUpdate(listType, index, { scale: newScale });
  };

  return (
    <div 
      className={`relative group bg-white shadow-sm overflow-hidden ${item.isLandscape ? 'col-span-3 aspect-auto' : 'col-span-1 aspect-[2/3]'}`}
      style={{ border: `1px solid ${theme.secondary}` }}
    >
        {/* Helper text overlay on hover */}
        <div className="absolute top-0 right-0 p-1 z-20 opacity-0 group-hover:opacity-100 bg-black/50 text-white text-[10px] pointer-events-none transition-opacity">
          <div className="flex items-center gap-1"><Move size={10} /> Drag</div>
          <div className="flex items-center gap-1"><ZoomIn size={10} /> Scroll</div>
        </div>

        {/* The visual image (transformed) */}
        <div className="w-full h-full"> 
            <img 
              src={item.url} 
              className="w-full block cursor-move relative z-10 origin-center" 
              alt="Portfolio" 
              style={{ 
                transform: `translate(${item.x}px, ${item.y}px) scale(${item.scale})`
              }}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
            />
        </div>
    </div>
  );
};


const PreviewCard: React.FC<PreviewCardProps> = ({ data, innerRef, scaleFactor, onPosChange, onImageUpdate, onScaleChange }) => {
  const theme = THEMES[data.themeColor];
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const initialPosRef = useRef<{x: number, y: number} | null>(null);

  // Generic Drag Logic for Header Elements
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedId(id);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    
    // Set initial position based on ID
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedId || !dragStartRef.current || !initialPosRef.current) return;
      
      const dx = (e.clientX - dragStartRef.current.x) / scaleFactor;
      const dy = (e.clientY - dragStartRef.current.y) / scaleFactor;

      const newPos = {
        x: initialPosRef.current.x + dx,
        y: initialPosRef.current.y + dy
      };

      onPosChange(draggedId, newPos);
    };

    const handleMouseUp = () => {
      setDraggedId(null);
    };

    if (draggedId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedId, scaleFactor, onPosChange]);

  const ImageGrid = ({ images, listType, title }: { images: ImageItem[], listType: 'exhibitionImages' | 'mainImages', title: string }) => (
    <div className="mb-4">
      {/* Title Header - Always Visible */}
      <div className="flex items-center gap-2 mb-2 px-6">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }}></span>
          <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500">{title}</h4>
          <div className="h-[1px] flex-1 bg-gray-200"></div>
      </div>
      
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 px-1">
          {images.map((item, i) => (
             <EditableImage 
               key={item.id} 
               item={item} 
               index={i} 
               listType={listType}
               onUpdate={onImageUpdate} 
               scaleFactor={scaleFactor}
               theme={theme}
             />
          ))}
        </div>
      ) : (
        <div className="mx-6 border-2 border-dashed h-24 flex flex-col items-center justify-center bg-gray-50 rounded-sm"
             style={{ borderColor: `${theme.primary}40`, color: theme.secondary }}>
          <span className="text-xs font-bold opacity-50">Upload Images Here</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full flex justify-center py-8 bg-gray-900/50">
      {/* Container - Modeled after a "Long Phone Image" (长条图) */}
      <div 
        ref={innerRef}
        className="relative w-[750px] bg-white flex flex-col font-sans"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* === HEADER AREA (Compacted) === */}
        <div className="relative overflow-hidden z-10"
             style={{ 
               backgroundColor: theme.secondary, 
               color: theme.text,
               paddingBottom: `${24 + data.spacingHeader}px` // Reduced padding
             }}>
          
          {/* Background Abstract Shapes */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ 
                  backgroundImage: `
                    linear-gradient(45deg, ${theme.primary} 25%, transparent 25%, transparent 75%, ${theme.primary} 75%, ${theme.primary}), 
                    linear-gradient(45deg, ${theme.primary} 25%, transparent 25%, transparent 75%, ${theme.primary} 75%, ${theme.primary})
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px'
               }} 
          />
          
          <div className="relative z-10 px-6 pt-6">
            
            <div className="flex justify-between items-start">
               {/* 1. SYSTEM STATUS (Draggable & Zoomable) */}
               <div 
                 className="flex flex-col gap-1 cursor-move group relative z-30"
                 style={{ transform: `translate(${data.statusPosition.x}px, ${data.statusPosition.y}px) scale(${data.statusScale})` }}
                 onMouseDown={(e) => handleMouseDown(e, 'status')}
                 onWheel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    onScaleChange('status', Math.max(0.5, Math.min(3, data.statusScale + delta)));
                 }}
               >
                 <div className="absolute -top-3 left-0 bg-pink-500 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    <Move size={8} className="inline mr-1"/>MOVE <ZoomIn size={8} className="inline ml-1"/>ZOOM
                 </div>
                 <div className="px-2 py-0.5 font-black text-xs tracking-widest uppercase transform -skew-x-12 border w-fit shadow-md"
                      style={{ backgroundColor: theme.primary, color: theme.secondary, borderColor: theme.text }}>
                    摄影接单
                 </div>
               </div>

               {/* 2. AVATAR (Draggable & Zoomable) */}
               <div 
                  className="relative w-32 h-32 shrink-0 group z-20 cursor-move"
                  style={{ transform: `translate(${data.avatarPosition.x}px, ${data.avatarPosition.y}px) scale(${data.avatarScale})` }}
                  onMouseDown={(e) => handleMouseDown(e, 'avatar')}
                  onWheel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    onScaleChange('avatar', Math.max(0.5, Math.min(3, data.avatarScale + delta)));
                  }}
               >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    <Move size={8} className="inline mr-1"/>Drag <ZoomIn size={8} className="inline ml-1"/>Zoom
                  </div>

                  <div className="absolute inset-0 rotate-6 border-2 transition-transform group-hover:rotate-12 shadow-lg pointer-events-none" 
                       style={{ borderColor: theme.primary, backgroundColor: theme.text }}></div>
                  <div className="absolute inset-0 -rotate-3 border-2 overflow-hidden transition-transform group-hover:-rotate-0 shadow-lg pointer-events-none"
                       style={{ borderColor: theme.text, backgroundColor: theme.secondary }}>
                    {data.avatar ? (
                      <img src={data.avatar} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-50">
                        <Camera size={32} color={theme.text} />
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* 3. Main Title (Draggable) */}
            <div 
              className="mt-2 relative cursor-move group w-fit z-30"
              style={{ transform: `translate(${data.titlePosition.x}px, ${data.titlePosition.y}px)` }}
              onMouseDown={(e) => handleMouseDown(e, 'title')}
            >
               <div className="absolute -top-6 left-0 bg-pink-500 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <Move size={8} className="inline mr-1"/>MOVE
               </div>
              <h1 className="text-6xl font-black italic tracking-tighter leading-none relative z-10 drop-shadow-md"
                  style={{ 
                    fontFamily: '"Noto Sans SC", sans-serif', 
                    textShadow: `2px 2px 0px ${theme.primary}`
                  }}>
                {data.photographerName}
              </h1>
            </div>

            {/* 4. Slogan Bar (Draggable) */}
            <div 
              className="flex items-center gap-2 mt-2 cursor-move group w-fit relative z-30"
              style={{ transform: `translate(${data.sloganPosition.x}px, ${data.sloganPosition.y}px)` }}
              onMouseDown={(e) => handleMouseDown(e, 'slogan')}
            >
              <div className="absolute -top-4 left-0 bg-pink-500 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <Move size={8} className="inline mr-1"/>MOVE
               </div>
              <div className="h-6 w-1" style={{ backgroundColor: theme.accent }}></div>
              <p className="text-lg font-bold tracking-wider uppercase italic opacity-90" style={{ color: theme.accent }}>
                  {data.slogan}
              </p>
            </div>

            {/* 5. Tags (Draggable) */}
            <div 
              className="mt-4 cursor-move group relative w-fit z-30"
              style={{ transform: `translate(${data.tagsPosition.x}px, ${data.tagsPosition.y}px)` }}
              onMouseDown={(e) => handleMouseDown(e, 'tags')}
            >
               <div className="absolute -top-4 left-0 bg-pink-500 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <Move size={8} className="inline mr-1"/>MOVE
               </div>
              
               <div className="flex items-center gap-3">
                  {/* New Label */}
                  <span className="text-2xl font-black italic tracking-tighter" 
                        style={{ 
                            color: theme.text, 
                            textShadow: `2px 2px 0px ${theme.primary}`,
                            WebkitTextStroke: `1px ${theme.secondary}`
                        }}>
                      互勉题材
                  </span>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, i) => (
                      <span key={i} 
                        className="px-3 py-1 font-bold text-base border-2 rounded-full flex items-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,0.5)]"
                        style={{ backgroundColor: theme.secondary, borderColor: theme.primary, color: theme.text }}>
                        <Hash size={14} style={{ color: theme.accent }} />
                        {tag}
                      </span>
                    ))}
                  </div>
               </div>
            </div>
          </div>
          
          {/* Jagged Divider */}
          <div className="absolute bottom-0 left-0 w-full h-6" 
               style={{ 
                 background: '#ffffff', 
                 clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 95% 40%, 90% 0, 85% 40%, 80% 0, 75% 40%, 70% 0, 65% 40%, 60% 0, 55% 40%, 50% 0, 45% 40%, 40% 0, 35% 40%, 30% 0, 25% 40%, 20% 0, 15% 40%, 10% 0, 5% 40%, 0 0)' 
               }}>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="pb-6 relative z-0">
           
           {/* 1. IMAGES / PORTFOLIO SECTION (Wide Layout) */}
           {data.showPortfolio && (
             <div className="relative mt-4" style={{ marginBottom: `${data.spacingPortfolio}px`, zIndex: 10 }}>
                <div className="grid grid-cols-1 gap-4">
                   <ImageGrid 
                      title="EXHIBITION / 漫展" 
                      listType="exhibitionImages"
                      images={data.exhibitionImages} 
                   />
                   <ImageGrid 
                      title="MAIN WORK / 正片" 
                      listType="mainImages"
                      images={data.mainImages} 
                   />
                </div>
             </div>
           )}

           {/* 2. PRICING / MENU */}
           {data.showPricing && (
             <div className="relative px-6" style={{ marginBottom: `${data.spacingPricing}px`, zIndex: 20 }}>
                <div className="flex items-center gap-2 mb-4 border-b-2 pb-2" style={{ borderColor: theme.secondary }}>
                   <span className="text-white px-2 font-bold text-lg italic" style={{ backgroundColor: theme.secondary }}>MENU</span>
                   <h3 className="text-2xl font-black italic uppercase" style={{ color: theme.secondary }}>PRICE LIST</h3>
                </div>

                <div className="flex flex-col gap-3">
                  {data.pricing.map((item, i) => (
                     <div key={item.id} className="relative">
                        <div className="bg-white border-l-4 p-3 flex justify-between items-center group hover:-translate-y-1 transition-transform duration-200 border-b border-r border-t border-gray-100 shadow-sm"
                             style={{ borderLeftColor: theme.primary }}>
                           <div className="flex-1">
                              <h4 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                 {item.title}
                              </h4>
                              <p className="font-medium mt-1 text-xs text-gray-500">
                                {item.desc}
                              </p>
                           </div>
                           <div className="text-right">
                              <div className="text-2xl font-black italic tracking-tighter" style={{ color: theme.primary }}>
                                 {item.price}
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
                </div>
             </div>
           )}

           {/* 3. NOTICE / RULES */}
           {data.showNotice && (
             <div className="relative px-6" style={{ marginBottom: `${data.spacingNotice}px`, zIndex: 30 }}>
                <div className="text-white p-4 relative overflow-hidden rounded-sm" style={{ backgroundColor: theme.secondary }}>
                   {/* Stripe Pattern */}
                   <div className="absolute top-0 right-0 w-24 h-24 transform rotate-45 translate-x-12 -translate-y-12 opacity-20"
                        style={{ backgroundColor: theme.accent }}></div>
                   
                   <div className="relative z-10 flex items-start gap-3">
                      <AlertTriangle size={24} style={{ color: theme.accent }} className="flex-shrink-0 mt-1" />
                      <div className="flex-1">
                         <h3 className="text-lg font-black uppercase italic border-b pb-1 mb-2 inline-block"
                             style={{ color: theme.accent, borderColor: theme.accent }}>
                           NOTICE
                         </h3>
                         <div className="whitespace-pre-line font-medium text-xs leading-relaxed opacity-90">
                            {data.notice || "暂无须知内容..."}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* 4. FOOTER / CONTACT */}
           {data.showContact && (
             <div className="pb-4 px-6 relative" style={{ zIndex: 40 }}>
                <div className="border-2 p-4 text-center relative flex flex-col items-center overflow-hidden" 
                     style={{ borderColor: theme.secondary, backgroundColor: '#fff' }}>
                   
                   {/* Background Image Layer */}
                   {data.contactBackgroundImage && (
                     <div className="absolute inset-0 z-0 overflow-hidden">
                        <img 
                           src={data.contactBackgroundImage} 
                           alt="bg"
                           className="absolute w-full h-auto min-h-full max-w-none cursor-move origin-center"
                           style={{ 
                               transform: `translate(${data.contactBackgroundPosition?.x || 0}px, ${data.contactBackgroundPosition?.y || 0}px) scale(${data.contactBackgroundScale})`,
                               opacity: data.contactBackgroundOpacity
                           }}
                           onMouseDown={(e) => handleMouseDown(e, 'contactBg')}
                           draggable={false}
                           onWheel={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const delta = e.deltaY > 0 ? -0.1 : 0.1;
                              onScaleChange('contactBg', Math.max(0.1, Math.min(5, data.contactBackgroundScale + delta)));
                           }}
                        />
                     </div>
                   )}

                   {/* Content Layer */}
                   <div className="relative z-10 w-full flex flex-col items-center pointer-events-none">
                       <h3 className="text-3xl font-black mb-6 italic tracking-tighter drop-shadow-sm" 
                           style={{ 
                             color: theme.secondary,
                             textShadow: `2px 2px 0px ${theme.primary}`
                           }}>
                         CONTACT ME
                       </h3>
                       
                       {/* Dual QR Code Area - NEW DESIGN */}
                       <div className="flex items-center justify-center gap-10 w-full max-w-lg pointer-events-auto mb-6">
                         {/* QQ */}
                         {data.qrCodeQQ && (
                           <div className="relative group">
                               {/* Back decorative layers */}
                               <div className="absolute -inset-2 bg-black/20 translate-y-2 translate-x-2"></div>
                               <div className="absolute -inset-1 rotate-3" style={{ backgroundColor: theme.primary }}></div>
                               
                               {/* QR Container */}
                               <div className="relative bg-white p-2 border-2" style={{ borderColor: theme.secondary }}>
                                   <div className="w-32 h-32 relative">
                                       <img src={data.qrCodeQQ} alt="QQ" className="w-full h-full object-contain" />
                                       
                                       {/* Decorative Corners */}
                                       <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4" style={{ borderColor: theme.secondary }}></div>
                                       <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4" style={{ borderColor: theme.secondary }}></div>
                                       <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4" style={{ borderColor: theme.secondary }}></div>
                                       <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4" style={{ borderColor: theme.secondary }}></div>
                                   </div>
                               </div>

                               {/* Badge */}
                               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-black italic tracking-widest border-2 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
                                    style={{ backgroundColor: theme.secondary, color: theme.primary, borderColor: theme.text }}>
                                 QQ
                               </div>
                           </div>
                         )}

                         {/* WeChat */}
                         {data.qrCodeWeChat && (
                           <div className="relative group">
                               {/* Back decorative layers */}
                               <div className="absolute -inset-2 bg-black/20 translate-y-2 translate-x-2"></div>
                               <div className="absolute -inset-1 -rotate-2" style={{ backgroundColor: theme.accent }}></div>
                               
                               {/* QR Container */}
                               <div className="relative bg-white p-2 border-2" style={{ borderColor: theme.secondary }}>
                                   <div className="w-32 h-32 relative">
                                       <img src={data.qrCodeWeChat} alt="WX" className="w-full h-full object-contain" />
                                       
                                       {/* Decorative Corners */}
                                       <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4" style={{ borderColor: theme.secondary }}></div>
                                       <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4" style={{ borderColor: theme.secondary }}></div>
                                       <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4" style={{ borderColor: theme.secondary }}></div>
                                       <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4" style={{ borderColor: theme.secondary }}></div>
                                   </div>
                               </div>

                               {/* Badge */}
                               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-black italic tracking-widest border-2 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
                                    style={{ backgroundColor: theme.secondary, color: theme.accent, borderColor: theme.text }}>
                                 WECHAT
                               </div>
                           </div>
                         )}
                       </div>

                       {/* Footer Text */}
                       <div className="mt-4 flex items-center gap-0 pointer-events-auto shadow-lg">
                          <span className="font-black text-sm px-4 py-2 border-y-2 border-l-2" 
                                style={{ 
                                  backgroundColor: theme.secondary, 
                                  color: theme.text,
                                  borderColor: theme.secondary
                                }}>
                            更多例图请私信查看
                          </span>
                          <span className="text-xl font-black px-4 py-1 border-2 italic tracking-tighter" 
                                style={{ 
                                  backgroundColor: '#fff', 
                                  color: theme.primary,
                                  borderColor: theme.secondary
                                }}>
                            {data.contactInfo}
                          </span>
                       </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;