
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CommissionData, PricingItem, ImageItem, Preset } from './types';
import { DEFAULT_DATA, THEMES, FONT_OPTIONS, DOHNA_COLORS } from './constants';
import PreviewCard from './components/PreviewCard';
import { savePreset, getUserPresets, deletePreset } from './services/storage';
import { toPng } from 'html-to-image';
// @ts-ignore
import jsQR from 'jsqr';
import { 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Camera,
  Image as ImageIcon,
  QrCode,
  Eye,
  EyeOff,
  MoveVertical,
  XCircle,
  Save,
  FolderOpen,
  Database,
  Menu,
  Type,
  Palette
} from 'lucide-react';

const processQrImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          resolve(result);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Defensive check for ESM default export vs named export
          // @ts-ignore
          const qrScanner = jsQR.default || jsQR;
          
          if (typeof qrScanner !== 'function') {
             console.error("jsQR library not loaded correctly", qrScanner);
             resolve(result);
             return;
          }

          const code = qrScanner(imageData.data, imageData.width, imageData.height);
          
          if (code) {
             const loc = code.location;
             const minX = Math.min(loc.topLeftCorner.x, loc.bottomLeftCorner.x, loc.topRightCorner.x, loc.bottomRightCorner.x);
             const maxX = Math.max(loc.topLeftCorner.x, loc.bottomLeftCorner.x, loc.topRightCorner.x, loc.bottomRightCorner.x);
             const minY = Math.min(loc.topLeftCorner.y, loc.topRightCorner.y, loc.bottomLeftCorner.y, loc.bottomRightCorner.y);
             const maxY = Math.max(loc.topLeftCorner.y, loc.topRightCorner.y, loc.bottomLeftCorner.y, loc.bottomRightCorner.y);

             const centerX = (minX + maxX) / 2;
             const centerY = (minY + maxY) / 2;
             const qrWidth = maxX - minX;
             const qrHeight = maxY - minY;
             
             const baseSize = Math.max(qrWidth, qrHeight);
             const finalSize = Math.round(baseSize * 1.4);

             const cropCanvas = document.createElement('canvas');
             cropCanvas.width = finalSize;
             cropCanvas.height = finalSize;
             const cropCtx = cropCanvas.getContext('2d');
             
             if (cropCtx) {
               cropCtx.fillStyle = '#ffffff';
               cropCtx.fillRect(0, 0, finalSize, finalSize);
               cropCtx.translate(finalSize / 2, finalSize / 2);
               cropCtx.drawImage(canvas, -centerX, -centerY);
               resolve(cropCanvas.toDataURL());
               return;
             }
          }
        } catch (err) {
          console.error("QR Crop Error", err);
        }
        resolve(result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
};

const LOCAL_USER_ID = 'local_user';

const App: React.FC = () => {
  // App State
  const [data, setData] = useState<CommissionData>(DEFAULT_DATA);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  
  // Preset Manager State
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current theme with safety fallback
  const theme = THEMES[data.themeColor] || THEMES.pink;

  // Calculate approximate scale factor based on window width
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1024) {
        setScaleFactor(0.75);
      } else if (w >= 768) {
        setScaleFactor(0.60);
      } else {
        const availableWidth = w - 32;
        const scale = Math.min(0.5, availableWidth / 750);
        setScaleFactor(scale);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch presets when user or manager visibility changes
  useEffect(() => {
    if (showPresetManager) {
      loadPresetsList();
    }
  }, [showPresetManager]);

  const loadPresetsList = async () => {
    try {
      const results = await getUserPresets(LOCAL_USER_ID);
      setPresets(results);
    } catch (e) {
      console.error("Failed to load presets", e);
    }
  };

  // --- Handlers (Optimized with useCallback) ---
  const handleInputChange = useCallback((field: keyof CommissionData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePosChange = useCallback((id: string, pos: {x: number, y: number}) => {
    setData(prev => {
      if (id === 'avatar' && prev.avatarPosition.x === pos.x && prev.avatarPosition.y === pos.y) return prev;
      let update = {};
      if (id === 'avatar') update = { avatarPosition: pos };
      if (id === 'status') update = { statusPosition: pos };
      if (id === 'title') update = { titlePosition: pos };
      if (id === 'slogan') update = { sloganPosition: pos };
      if (id === 'tags') update = { tagsPosition: pos };
      if (id === 'contactBg') update = { contactBackgroundPosition: pos };
      return { ...prev, ...update };
    });
  }, []);

  const handleScaleChange = useCallback((id: string, scale: number) => {
    setData(prev => {
      let update = {};
      if (id === 'avatar') update = { avatarScale: scale };
      if (id === 'status') update = { statusScale: scale };
      if (id === 'contactBg') update = { contactBackgroundScale: scale };
      return { ...prev, ...update };
    });
  }, []);

  const handleImageUpdate = useCallback((targetList: 'exhibitionImages' | 'mainImages', index: number, updates: Partial<ImageItem>) => {
    setData(prev => {
      const newList = [...prev[targetList]];
      newList[index] = { ...newList[index], ...updates };
      return { ...prev, [targetList]: newList };
    });
  }, []);

  const toggleSection = useCallback((field: keyof CommissionData) => {
    setData(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const removeImage = useCallback((index: number, targetList: 'exhibitionImages' | 'mainImages') => {
    setData(prev => ({
      ...prev,
      [targetList]: prev[targetList].filter((_, i) => i !== index)
    }));
  }, []);

  const addPricingItem = useCallback(() => {
    const newItem: PricingItem = {
      id: Date.now().toString(),
      title: 'NEW ITEM',
      price: '0000',
      desc: 'Description...'
    };
    setData(prev => ({ ...prev, pricing: [...prev.pricing, newItem] }));
  }, []);

  const updatePricing = useCallback((id: string, field: keyof PricingItem, value: string) => {
    setData(prev => ({
      ...prev,
      pricing: prev.pricing.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  }, []);

  const removePricing = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      pricing: prev.pricing.filter(item => item.id !== id)
    }));
  }, []);

  // --- File Handlers ---
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'qq' | 'wechat') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const processedImage = await processQrImage(file);
      setData(prev => ({
        ...prev,
        [type === 'qq' ? 'qrCodeQQ' : 'qrCodeWeChat']: processedImage
      }));
    }
  };

  const handleContactBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({
          ...prev,
          contactBackgroundImage: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, targetList: 'exhibitionImages' | 'mainImages') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const isLandscape = img.width > img.height;
          const newItem: ImageItem = {
            id: Date.now().toString() + Math.random().toString(),
            url: resultStr,
            x: 0,
            y: 0,
            scale: 1,
            isLandscape
          };
          setData(prev => ({
            ...prev,
            [targetList]: [...prev[targetList], newItem] 
          }));
        };
        img.src = resultStr;
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Preset Manager Functions ---
  const handleSavePreset = async () => {
    const name = newPresetName.trim() || `SAVE FILE ${new Date().toLocaleTimeString()}`;
    try {
      await savePreset(LOCAL_USER_ID, name, data);
      await loadPresetsList();
      setNewPresetName('');
      
      alert('GAME SAVED.');
    } catch (e) {
      alert('SAVE FAILED');
    }
  };

  const handleLoadPreset = (presetData: CommissionData) => {
    if (window.confirm('LOAD THIS FILE? UNSAVED PROGRESS WILL BE LOST.')) {
      setData({ ...DEFAULT_DATA, ...presetData });
      setShowPresetManager(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (window.confirm('DELETE THIS FILE PERMANENTLY?')) {
      await deletePreset(id);
      await loadPresetsList();
    }
  };

  const handleExportJSON = (preset: Preset) => {
    const jsonString = JSON.stringify(preset.data);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${preset.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (importedData.photographerName !== undefined) {
             await savePreset(LOCAL_USER_ID, `IMPORT ${new Date().toLocaleTimeString()}`, importedData);
             await loadPresetsList();
             alert('IMPORT SUCCESSFUL');
          } else {
             alert('INVALID FILE');
          }
        } catch (err) {
          alert('READ ERROR');
        }
      };
      reader.readAsText(file);
    }
  };


  // --- Export ---
  const handleExport = useCallback(async () => {
    if (window.innerWidth < 768 && activeTab === 'editor') {
       setActiveTab('preview');
       setTimeout(() => {
          if (previewRef.current) capture();
       }, 100);
    } else {
       if (previewRef.current) capture();
    }

    async function capture() {
       if (!previewRef.current) return;
       try {
        const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `${data.photographerName}-DOHNA.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export failed', err);
        alert('EXPORT FAILED');
      }
    }
  }, [data.photographerName, activeTab]);


  const SectionHeader = ({ title, colorClass, field }: { title: string, colorClass: string, field?: keyof CommissionData }) => (
    <h2 className={`text-lg font-black italic uppercase border-b-2 border-current pb-1 mb-4 flex items-center justify-between font-dohna tracking-wider`} style={{ color: colorClass }}>
       <span className="flex items-center gap-2">
         {title}
       </span>
       {field && (
         <button onClick={() => toggleSection(field)} className="text-white hover:text-[var(--color-accent)] transition-colors">
            {data[field] ? <Eye size={20} /> : <EyeOff size={20} className="text-gray-500" />}
         </button>
       )}
    </h2>
  );

  const SpacingControl = ({ value, field, label }: { value: number, field: keyof CommissionData, label?: string }) => (
    <div className="mt-4 pt-4 border-t border-dashed border-gray-700">
       <div className="flex justify-between items-center mb-2">
         <label className="text-[10px] text-[var(--color-sub)] font-mono uppercase flex items-center gap-1">
           <MoveVertical size={10} />
           {label || "Y-AXIS SPACING"}
         </label>
         <span className="text-[10px] text-gray-400 font-mono">{value}px</span>
       </div>
       <input 
        type="range" 
        min="-100" 
        max="150" 
        step="4"
        value={value} 
        onChange={(e) => handleInputChange(field, Number(e.target.value))}
        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-main)]"
       />
    </div>
  );

  return (
    <div 
      className={`h-screen flex flex-col md:flex-row text-white overflow-hidden font-sans`}
      style={{
          backgroundColor: theme.bg,
          '--color-main': theme.color1,
          '--color-sub': theme.color2,
          '--color-accent': theme.color3
      } as React.CSSProperties}
    >
      {/* Dynamic Background Pattern for App Area */}
      <div className={`absolute inset-0 pointer-events-none opacity-10 z-0 ${theme.pattern}`}></div>

      {/* --- PRESET MANAGER MODAL --- */}
      {showPresetManager && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-black border-4 w-full max-w-2xl h-[80vh] flex flex-col shadow-[0_0_50px_rgba(230,0,122,0.4)] relative" style={{ borderColor: theme.color1 }}>
              {/* Modal Decor */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--color-accent)]" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)'}}></div>

              {/* Modal Header */}
              <div className="bg-[var(--color-main)] p-4 border-b-4 border-black flex justify-between items-center relative z-10">
                 <h2 className="text-3xl font-black italic text-white flex items-center gap-2 drop-shadow-[2px_2px_0_#000] font-dohna">
                   <FolderOpen size={28} /> 
                   DATA ARCHIVES
                 </h2>
                 <button onClick={() => setShowPresetManager(false)} className="text-white hover:text-black hover:rotate-90 transition-transform">
                   <XCircle size={32} />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 bg-dohna-dots relative">
                 <div className="relative z-10 space-y-8">
                     {/* Save New */}
                     <div className="bg-white border-2 border-black p-4 shadow-[6px_6px_0px_#000]">
                        <label className="text-xs font-black text-black mb-2 block bg-[var(--color-accent)] w-fit px-2 border-2 border-black -ml-6 -mt-6 rotate-[-2deg]">NEW RECORD</label>
                        <div className="flex gap-2 mt-2">
                           <input 
                             type="text" 
                             value={newPresetName}
                             onChange={e => setNewPresetName(e.target.value)}
                             placeholder="DATA NAME..."
                             className="flex-1 dohna-input text-white"
                           />
                           <button onClick={handleSavePreset} className="dohna-btn bg-[var(--color-sub)] text-white px-6 flex items-center gap-2">
                              <Save size={18} /> SAVE
                           </button>
                        </div>
                     </div>

                     {/* List */}
                     <div className="space-y-3">
                        <div className="bg-black text-[var(--color-main)] font-black text-xl px-2 inline-block border-2 mb-2" style={{ borderColor: theme.color1 }}>LOAD RECORD</div>
                        {presets.length === 0 ? (
                           <div className="text-center text-gray-500 py-8 italic font-bold border-2 border-dashed border-gray-700">NO DATA FOUND</div>
                        ) : (
                           presets.map(preset => (
                              <div key={preset.id} className="bg-white border-2 border-black p-3 flex justify-between items-center group hover:bg-[var(--color-accent)] transition-colors shadow-[4px_4px_0px_#000]">
                                 <div>
                                    <div className="font-black text-black text-lg font-dohna">{preset.name}</div>
                                    <div className="text-[10px] text-gray-600 font-mono font-bold">
                                       {new Date(preset.createdAt).toLocaleString()}
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <button 
                                       onClick={() => handleExportJSON(preset)}
                                       className="p-2 text-black hover:bg-white border-2 border-transparent hover:border-black"
                                       title="Export"
                                    >
                                       <Download size={20} />
                                    </button>
                                    <button 
                                       onClick={() => handleDeletePreset(preset.id)}
                                       className="p-2 text-[var(--color-main)] hover:bg-black hover:text-white border-2 border-transparent hover:border-white"
                                       title="Delete"
                                    >
                                       <Trash2 size={20} />
                                    </button>
                                    <button 
                                       onClick={() => handleLoadPreset(preset.data)}
                                       className="dohna-btn bg-black text-white px-4 py-1 border-white hover:text-[var(--color-accent)]"
                                    >
                                       LOAD
                                    </button>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                     
                     <div className="pt-4 border-t-2 border-gray-700">
                         <div className="flex justify-end">
                            <label className="cursor-pointer dohna-btn bg-white text-black px-4 py-2 flex items-center gap-2 hover:bg-gray-200">
                               <Upload size={16} /> IMPORT JSON
                               <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
                            </label>
                         </div>
                     </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- Sidebar Editor (Left) --- */}
      <div className={`
          ${activeTab === 'editor' ? 'flex' : 'hidden'} 
          md:flex w-full md:w-[420px] bg-black border-r-4 border-black flex-col 
          h-[calc(100vh-60px)] md:h-screen z-20 shadow-[10px_0_30px_rgba(0,0,0,0.8)]
      `}>
        <div className="p-6 bg-black border-b-4 border-black flex justify-between items-center shrink-0 relative overflow-hidden">
           {/* Header Background Strip */}
           <div className="absolute top-0 left-0 w-full h-2 bg-dohna-stripes"></div>
           
           <div className="relative z-10">
             <h1 className="text-3xl font-black italic text-white tracking-tighter drop-shadow-[3px_3px_0_#e6007a] font-dohna" style={{ textShadow: `3px 3px 0 ${theme.color1}` }}>
               DOHNA<span style={{ color: theme.color2 }}>GEN</span>
             </h1>
             <div className="flex items-center gap-1 text-[10px] text-black font-mono bg-[var(--color-accent)] px-1 w-fit border border-black font-bold mt-1">
                <Database size={10} /> 
                STATUS: LOCAL
             </div>
           </div>
           
           <div className="flex items-center gap-3 relative z-10">
               <button onClick={() => setShowPresetManager(true)} className="dohna-btn bg-white text-black p-2 text-xs flex items-center gap-1" title="Data">
                 <FolderOpen size={18} /> 
               </button>

               {/* Desktop Export Button */}
               <button onClick={handleExport} className="hidden md:flex dohna-btn bg-[var(--color-sub)] text-white p-2">
                 <Download size={20} />
               </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative bg-dohna-dots">
           {/* Section: Basic Info */}
           <div className="space-y-4 relative z-10 bg-black/80 p-4 border-2 shadow-[4px_4px_0_#e6007a]" style={{ borderColor: theme.color1, boxShadow: `4px 4px 0 ${theme.color1}` }}>
             <SectionHeader title="IDENTITY" colorClass={theme.color3} />
             
             <div className="flex gap-4 items-start">
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="relative w-24 h-24 bg-white border-2 border-black flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group shadow-[4px_4px_0px_#fff]">
                    {data.avatar ? (
                      <img src={data.avatar} className="w-full h-full object-cover" alt="avatar" />
                    ) : (
                      <Camera className="text-black" size={32} />
                    )}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                   <div>
                      <label className="block text-[10px] font-black mb-1" style={{ color: theme.color1 }}>CODENAME</label>
                      <input 
                        type="text" 
                        value={data.photographerName} 
                        onChange={(e) => handleInputChange('photographerName', e.target.value)}
                        className="w-full dohna-input text-lg"
                      />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black mb-1 flex justify-between items-end" style={{ color: theme.color2 }}>
                       <span>SLOGAN</span>
                     </label>
                     <input 
                       type="text" 
                       value={data.slogan} 
                       onChange={(e) => handleInputChange('slogan', e.target.value)}
                       className="w-full dohna-input text-xs"
                     />
                   </div>
                </div>
             </div>

             <div>
               <label className="block text-[10px] font-black text-white mb-1">TAGS (COMMA SEPARATED)</label>
               <input 
                 type="text" 
                 value={data.tags.join(', ')} 
                 onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(s => s.trim()))}
                 className="w-full dohna-input text-sm"
               />
             </div>

             <SpacingControl value={data.spacingHeader} field="spacingHeader" label="HEADER OFFSET" />
           </div>

           {/* Section: Visuals */}
           <div className="space-y-4 relative z-10 bg-black/80 p-4 border-2 shadow-[4px_4px_0_#0099dd]" style={{ borderColor: theme.color2, boxShadow: `4px 4px 0 ${theme.color2}` }}>
             <SectionHeader title="VISUALS" colorClass={theme.color2} field="showPortfolio" />
             
             {/* Theme Selector */}
             <div className="mb-6">
                <label className="block text-[10px] font-black text-white mb-2">COLOR THEME</label>
                <div className="flex flex-wrap gap-2">
                   {Object.keys(THEMES).map((themeKey) => {
                      const t = THEMES[themeKey];
                      return (
                        <button
                          key={themeKey}
                          onClick={() => handleInputChange('themeColor', themeKey)}
                          className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${data.themeColor === themeKey ? 'scale-110 border-white shadow-[0_0_10px_white]' : 'border-gray-600 hover:scale-105'}`}
                          style={{ background: `linear-gradient(135deg, ${t.color1} 50%, ${t.color2} 50%)` }}
                          title={themeKey.toUpperCase()}
                        />
                      );
                   })}
                </div>
             </div>

             {/* Font Selector */}
             <div className="mb-6">
                <label className="block text-[10px] font-black text-white mb-2 flex items-center gap-1">
                    <Type size={12} /> TYPOGRAPHY // 字体排印
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {FONT_OPTIONS.map((font) => (
                        <button
                            key={font.id}
                            onClick={() => handleInputChange('titleFont', font.id)}
                            className={`px-2 py-2 text-xs font-black border-2 transition-all ${data.titleFont === font.id 
                                ? 'bg-[var(--color-accent)] text-black border-white shadow-[2px_2px_0_#fff]' 
                                : 'bg-black text-gray-400 border-gray-700 hover:border-gray-500'}`}
                            style={{ fontFamily: font.family }}
                        >
                            {font.name}
                        </button>
                    ))}
                </div>
             </div>

             {/* Title Color Selector */}
             <div className="mb-6">
                <label className="block text-[10px] font-black text-white mb-2 flex items-center gap-1">
                    <Palette size={12} /> TITLE COLORS // 标题配色
                </label>
                
                {/* 1. Primary Fill Color */}
                <div className="bg-black/50 p-2 border border-gray-700 mb-2">
                   <span className="text-[8px] font-bold text-gray-400 block mb-2 uppercase tracking-wider">PRIMARY COLOR</span>
                   <div className="flex flex-wrap gap-2">
                      {DOHNA_COLORS.map(c => (
                         <button
                           key={c.id}
                           onClick={() => handleInputChange('titleColor', c.value)}
                           className={`w-6 h-6 border-2 transition-transform ${data.titleColor === c.value ? 'scale-125 border-white z-10' : 'border-gray-600 hover:scale-110'}`}
                           style={{ backgroundColor: c.value }}
                           title={c.name}
                         />
                      ))}
                   </div>
                </div>

                {/* 2. Secondary Fill Color (Alternating) */}
                <div className="bg-black/50 p-2 border border-gray-700 mb-2">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">SECONDARY COLOR // 双色交替</span>
                     {data.titleColorSecondary && (
                       <button onClick={() => handleInputChange('titleColorSecondary', '')} className="text-[8px] bg-red-600 text-white px-1 font-bold">OFF</button>
                     )}
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {DOHNA_COLORS.map(c => (
                         <button
                           key={c.id}
                           onClick={() => handleInputChange('titleColorSecondary', c.value)}
                           className={`w-6 h-6 border-2 transition-transform ${data.titleColorSecondary === c.value ? 'scale-125 border-white z-10' : 'border-gray-600 hover:scale-110'}`}
                           style={{ backgroundColor: c.value }}
                           title={c.name}
                         />
                      ))}
                   </div>
                </div>
                
                {/* 3. Shadow Color */}
                <div className="bg-black/50 p-2 border border-gray-700">
                   <span className="text-[8px] font-bold text-gray-400 block mb-2 uppercase tracking-wider">SHADOW COLOR</span>
                   <div className="flex flex-wrap gap-2">
                      <button 
                         onClick={() => handleInputChange('titleShadowColor', 'auto')}
                         className={`w-6 h-6 border-2 flex items-center justify-center text-[8px] font-black transition-transform ${data.titleShadowColor === 'auto' ? 'bg-white text-black scale-125 border-white z-10' : 'bg-transparent text-gray-400 border-gray-600 hover:border-white'}`}
                         title="AUTO (Theme Color)"
                      >
                         A
                      </button>
                      {DOHNA_COLORS.map(c => (
                         <button
                           key={c.id}
                           onClick={() => handleInputChange('titleShadowColor', c.value)}
                           className={`w-6 h-6 border-2 transition-transform ${data.titleShadowColor === c.value ? 'scale-125 border-white z-10' : 'border-gray-600 hover:scale-110'}`}
                           style={{ backgroundColor: c.value }}
                           title={c.name}
                         />
                      ))}
                   </div>
                </div>
             </div>

             {/* Exhibition Images */}
             {data.showPortfolio && (
               <>
                 <div className="bg-white/5 p-2 border" style={{ borderColor: `${theme.color2}55` }}>
                   <label className="block text-xs font-black mb-2 flex justify-between" style={{ color: theme.color2 }}>
                     <span>EXHIBITION</span>
                   </label>
                   <div className="flex flex-wrap gap-2">
                     {data.exhibitionImages.map((img, i) => (
                       <div key={img.id} className="relative w-14 h-14 border-2 border-white group shrink-0">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(i, 'exhibitionImages')} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center" style={{ color: theme.color1 }}>
                            <Trash2 size={12} />
                          </button>
                       </div>
                     ))}
                     <label className="w-14 h-14 border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-white/10 shrink-0" style={{ borderColor: theme.color2 }}>
                       <Plus size={16} style={{ color: theme.color2 }} />
                       <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'exhibitionImages')} className="hidden" />
                     </label>
                   </div>
                 </div>

                 {/* Main Images */}
                 <div className="bg-white/5 p-2 border mt-2" style={{ borderColor: `${theme.color1}55` }}>
                   <label className="block text-xs font-black mb-2 flex justify-between" style={{ color: theme.color1 }}>
                     <span>MAIN WORK</span>
                   </label>
                   <div className="flex flex-wrap gap-2">
                     {data.mainImages.map((img, i) => (
                       <div key={img.id} className="relative w-14 h-14 border-2 border-white group shrink-0">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(i, 'mainImages')} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center" style={{ color: theme.color1 }}>
                            <Trash2 size={12} />
                          </button>
                       </div>
                     ))}
                     <label className="w-14 h-14 border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-white/10 shrink-0" style={{ borderColor: theme.color1 }}>
                       <Plus size={16} style={{ color: theme.color1 }} />
                       <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'mainImages')} className="hidden" />
                     </label>
                   </div>
                 </div>
                 
                 <SpacingControl value={data.spacingPortfolio} field="spacingPortfolio" />
               </>
             )}
           </div>

           {/* Section: Pricing */}
           <div className="space-y-4 relative z-10 bg-black/80 p-4 border-2 shadow-[4px_4px_0_#e6007a]" style={{ borderColor: theme.color1, boxShadow: `4px 4px 0 ${theme.color1}` }}>
             <SectionHeader title="MENU LIST" colorClass={theme.color1} field="showPricing" />
             
             {data.showPricing && (
               <div className="space-y-3">
                 {data.pricing.map((item) => (
                   <div key={item.id} className="bg-white p-2 border-2 border-black relative group shadow-[2px_2px_0px_#000]">
                      <button onClick={() => removePricing(item.id)} className="absolute -top-2 -right-2 bg-black text-white rounded-full p-0.5 hover:bg-red-500 z-10">
                        <XCircle size={14} />
                      </button>
                      <div className="flex gap-2 mb-2">
                          <input 
                             className="bg-gray-100 border-b-2 border-black w-2/3 text-xs font-black text-black p-1 focus:outline-none focus:bg-[var(--color-accent)]"
                             value={item.title}
                             onChange={(e) => updatePricing(item.id, 'title', e.target.value)}
                             placeholder="ITEM"
                          />
                          <input 
                             className="bg-black text-[var(--color-accent)] w-1/3 text-xs font-black p-1 text-center focus:outline-none border-2 border-[var(--color-accent)]"
                             value={item.price}
                             onChange={(e) => updatePricing(item.id, 'price', e.target.value)}
                             placeholder="$$$"
                          />
                      </div>
                      <div className="relative">
                        <textarea 
                          className="w-full bg-transparent text-[10px] text-gray-800 font-bold resize-none focus:outline-none border-t border-dashed border-gray-400 pt-1"
                          rows={2}
                          value={item.desc}
                          onChange={(e) => updatePricing(item.id, 'desc', e.target.value)}
                          placeholder="Details..."
                        />
                      </div>
                   </div>
                 ))}
                 <button onClick={addPricingItem} className="dohna-btn w-full py-2 bg-[var(--color-accent)] text-black flex items-center justify-center gap-2 text-sm">
                   <Plus size={16} /> ADD ITEM
                 </button>
                 
                 <SpacingControl value={data.spacingPricing} field="spacingPricing" />
               </div>
             )}
           </div>

           {/* Section: Notice & Contact */}
           <div className="space-y-4 pb-12 relative z-10 bg-black/80 p-4 border-2 border-white shadow-[4px_4px_0_#fff]">
             <SectionHeader title="CONTACT" colorClass="white" field="showContact" />

             {data.showNotice && (
               <div className="mb-4">
                  <label className="text-[10px] font-black mb-1 block flex justify-between items-center" style={{ color: theme.color3 }}>
                    <span>WARNING TEXT</span>
                    <button onClick={() => toggleSection('showNotice')} className="text-red-500 text-[10px]">HIDE</button>
                  </label>
                  <textarea 
                    value={data.notice}
                    onChange={(e) => handleInputChange('notice', e.target.value)}
                    rows={3}
                    className="w-full dohna-input text-xs"
                    placeholder="TERMS..."
                  />
                  <SpacingControl value={data.spacingNotice} field="spacingNotice" />
               </div>
             )}
             
             {data.showContact && (
                  <div className="space-y-4 border-t border-gray-700 pt-4">
                    {/* Background Image Control */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-white">TICKET BG</label>
                             {data.contactBackgroundImage && (
                                <button 
                                    onClick={() => handleInputChange('contactBackgroundImage', '')}
                                    className="text-red-500 text-[10px] font-bold"
                                >
                                CLEAR
                                </button>
                            )}
                        </div>
                       
                        <div className="flex items-center gap-2 mb-2">
                           {/* Upload Button */}
                           <div className="relative overflow-hidden group w-full">
                              <button className="dohna-btn w-full py-1 bg-white text-black text-[10px] flex items-center justify-center gap-2">
                                <ImageIcon size={12} />
                                {data.contactBackgroundImage ? 'CHANGE BG' : 'UPLOAD BG'}
                              </button>
                              <input type="file" accept="image/*" onChange={handleContactBgUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                           </div>
                        </div>

                        {/* Opacity Slider */}
                        {data.contactBackgroundImage && (
                          <div className="grid grid-cols-2 gap-2">
                             <div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05"
                                    value={data.contactBackgroundOpacity} 
                                    onChange={(e) => handleInputChange('contactBackgroundOpacity', Number(e.target.value))}
                                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[var(--color-main)]"
                                />
                             </div>
                             <div>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="3" 
                                    step="0.1"
                                    value={data.contactBackgroundScale} 
                                    onChange={(e) => handleInputChange('contactBackgroundScale', Number(e.target.value))}
                                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[var(--color-sub)]"
                                />
                             </div>
                          </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* QQ Upload */}
                        <div className="flex flex-col gap-1">
                            <div className="w-full aspect-square bg-white border-2 border-black flex items-center justify-center relative shadow-[2px_2px_0px_#000]">
                                {data.qrCodeQQ ? (
                                    <img src={data.qrCodeQQ} alt="QR" className="w-full h-full object-cover" />
                                ) : (
                                    <QrCode size={20} className="text-black" />
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleQrUpload(e, 'qq')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="text-[10px] font-black text-center text-white bg-black border border-white">QQ QR</div>
                        </div>

                        {/* WeChat Upload */}
                        <div className="flex flex-col gap-1">
                            <div className="w-full aspect-square bg-white border-2 border-black flex items-center justify-center relative shadow-[2px_2px_0px_#000]">
                                {data.qrCodeWeChat ? (
                                    <img src={data.qrCodeWeChat} alt="QR" className="w-full h-full object-cover" />
                                ) : (
                                    <QrCode size={20} className="text-black" />
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleQrUpload(e, 'wechat')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="text-[10px] font-black text-center text-white bg-black border border-white">WX QR</div>
                        </div>
                    </div>

                    <div className="mt-2">
                        <label className="block text-[10px] font-black text-white mb-1 flex justify-between items-center">
                           <span>DISPLAY ID</span>
                           <button onClick={() => toggleSection('showContactInfo')} className={data.showContactInfo ? "text-white hover:text-[var(--color-accent)]" : "text-gray-500"}>
                              {data.showContactInfo ? "HIDE" : "SHOW"}
                           </button>
                        </label>
                        {data.showContactInfo && (
                           <input 
                             type="text" 
                             value={data.contactInfo} 
                             onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                             className="w-full dohna-input text-center"
                           />
                        )}
                    </div>
                  </div>
             )}
           </div>

        </div>
      </div>

      {/* --- Main Preview Area (Right) --- */}
      <div className={`
          ${activeTab === 'preview' ? 'flex' : 'hidden'}
          md:flex flex-1 relative overflow-y-auto custom-scrollbar items-start justify-center p-4 md:p-8
          h-[calc(100vh-60px)] md:h-screen
      `} style={{ backgroundColor: theme.bg }}>
         {/* Preview Background Decor */}
         <div className={`absolute inset-0 pointer-events-none opacity-20 ${theme.pattern}`}></div>

        {/* Adjusted scale for the taller aspect ratio */}
        <div className="origin-top transition-transform mt-4 z-10" style={{ transform: `scale(${scaleFactor})` }}>
          <PreviewCard 
            data={data} 
            innerRef={previewRef} 
            scaleFactor={scaleFactor} 
            onPosChange={handlePosChange}
            onImageUpdate={handleImageUpdate}
            onScaleChange={handleScaleChange}
            onToggleVisibility={toggleSection}
          />
        </div>
      </div>

      {/* --- Mobile Bottom Nav --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-black border-t-4 flex z-50" style={{ borderColor: theme.color1 }}>
        <button 
           className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'editor' ? 'text-[var(--color-main)]' : 'text-gray-500'}`}
           onClick={() => setActiveTab('editor')}
        >
          <Menu size={20} />
          <span className="text-[10px] font-black tracking-widest font-dohna">EDIT</span>
        </button>
        <button 
           className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'preview' ? 'text-[var(--color-sub)]' : 'text-gray-500'}`}
           onClick={() => setActiveTab('preview')}
        >
          <Eye size={20} />
          <span className="text-[10px] font-black tracking-widest font-dohna">VIEW</span>
        </button>
        <button 
           className="flex-1 flex flex-col items-center justify-center gap-1 text-white hover:text-[var(--color-accent)]"
           onClick={handleExport}
        >
          <Download size={20} />
          <span className="text-[10px] font-black tracking-widest font-dohna">EXPORT</span>
        </button>
      </div>
    </div>
  );
};

export default App;
