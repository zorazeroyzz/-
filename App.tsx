import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CommissionData, PricingItem, ImageItem, Preset } from './types';
import { DEFAULT_DATA, THEMES } from './constants';
import PreviewCard from './components/PreviewCard';
import { generateCoolSlogan, enhanceDescription } from './services/geminiService';
import { savePreset, getUserPresets, deletePreset, setServerUrl, getServerUrl } from './services/storage';
import { toPng } from 'html-to-image';
// @ts-ignore
import jsQR from 'jsqr';
import { 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Sparkles, 
  Palette, 
  RefreshCw,
  FileText,
  Camera,
  Image as ImageIcon,
  QrCode,
  Eye,
  EyeOff,
  MoveVertical,
  XCircle,
  Layout,
  Save,
  FolderOpen,
  LogOut,
  FileJson,
  User,
  ArrowRight,
  Settings,
  Cloud,
  CloudOff,
  Server
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

const App: React.FC = () => {
  // Auth & Server State
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('dohna_user'));
  const [loginInput, setLoginInput] = useState('');
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl() || '');
  const [currentServerUrl, setCurrentServerUrl] = useState<string | null>(getServerUrl());

  // App State
  const [data, setData] = useState<CommissionData>(DEFAULT_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  
  // Preset Manager State
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (currentUser && showPresetManager) {
      loadPresetsList();
    }
  }, [currentUser, showPresetManager]);

  const loadPresetsList = async () => {
    if (!currentUser) return;
    try {
      const list = await getUserPresets(currentUser);
      setPresets(list);
    } catch (e) {
      console.error("Failed to load presets", e);
    }
  };

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) return;
    const user = loginInput.trim().toUpperCase();
    localStorage.setItem('dohna_user', user);
    setCurrentUser(user);
    setLoginInput('');
  };

  const handleLogout = () => {
    localStorage.removeItem('dohna_user');
    setCurrentUser(null);
    setData(DEFAULT_DATA);
  };

  const handleSaveServerSettings = () => {
    setServerUrl(serverUrlInput);
    setCurrentServerUrl(getServerUrl());
    setShowServerSettings(false);
    alert(serverUrlInput ? "✅ SERVER CONNECTED" : "⚠️ LOCAL MODE ONLY");
  };

  const handleInputChange = (field: keyof CommissionData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handlePosChange = (id: string, pos: {x: number, y: number}) => {
    if (id === 'avatar') setData(prev => ({ ...prev, avatarPosition: pos }));
    if (id === 'status') setData(prev => ({ ...prev, statusPosition: pos }));
    if (id === 'title') setData(prev => ({ ...prev, titlePosition: pos }));
    if (id === 'slogan') setData(prev => ({ ...prev, sloganPosition: pos }));
    if (id === 'tags') setData(prev => ({ ...prev, tagsPosition: pos }));
    if (id === 'contactBg') setData(prev => ({ ...prev, contactBackgroundPosition: pos }));
  }

  const handleScaleChange = (id: string, scale: number) => {
    if (id === 'avatar') setData(prev => ({ ...prev, avatarScale: scale }));
    if (id === 'status') setData(prev => ({ ...prev, statusScale: scale }));
    if (id === 'contactBg') setData(prev => ({ ...prev, contactBackgroundScale: scale }));
  }

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

  const removeImage = (index: number, targetList: 'exhibitionImages' | 'mainImages') => {
    setData(prev => ({
      ...prev,
      [targetList]: prev[targetList].filter((_, i) => i !== index)
    }));
  };

  const handleImageUpdate = (targetList: 'exhibitionImages' | 'mainImages', index: number, updates: Partial<ImageItem>) => {
    setData(prev => {
      const newList = [...prev[targetList]];
      newList[index] = { ...newList[index], ...updates };
      return { ...prev, [targetList]: newList };
    });
  };

  const addPricingItem = () => {
    const newItem: PricingItem = {
      id: Date.now().toString(),
      title: '新业务 // NEW',
      price: '000r',
      desc: '包含内容...'
    };
    setData(prev => ({ ...prev, pricing: [...prev.pricing, newItem] }));
  };

  const updatePricing = (id: string, field: keyof PricingItem, value: string) => {
    setData(prev => ({
      ...prev,
      pricing: prev.pricing.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removePricing = (id: string) => {
    setData(prev => ({
      ...prev,
      pricing: prev.pricing.filter(item => item.id !== id)
    }));
  };

  // --- AI Actions ---
  const generateSlogan = async () => {
    setIsGenerating(true);
    const slogan = await generateCoolSlogan(data.photographerName, data.tags);
    setData(prev => ({ ...prev, slogan }));
    setIsGenerating(false);
  };

  const enhancePriceDesc = async (id: string, text: string) => {
    const newText = await enhanceDescription(text);
    updatePricing(id, 'desc', newText);
  };

  // --- Preset Manager Functions ---
  const handleSavePreset = async () => {
    if (!currentUser) return;
    const name = newPresetName.trim() || `Preset ${new Date().toLocaleTimeString()}`;
    try {
      await savePreset(currentUser, name, data);
      await loadPresetsList();
      setNewPresetName('');
      alert('✅ 预设保存成功 / Preset Saved');
    } catch (e) {
      alert('保存失败 / Save Failed');
    }
  };

  const handleLoadPreset = (presetData: CommissionData) => {
    if (window.confirm('Load this preset? Unsaved changes will be lost.')) {
      setData({ ...DEFAULT_DATA, ...presetData });
      setShowPresetManager(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (window.confirm('Delete this preset permanently?')) {
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
    link.download = `${preset.name.replace(/\s+/g, '_')}_dohna_backup.json`;
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
          // Basic validation
          if (importedData.photographerName !== undefined) {
             if (currentUser) {
                await savePreset(currentUser, `Imported ${new Date().toLocaleTimeString()}`, importedData);
                await loadPresetsList();
                alert('✅ 导入成功 / Import Successful');
             }
          } else {
             alert('❌ 无效的文件 / Invalid File');
          }
        } catch (err) {
          alert('❌ 读取错误 / Error Reading File');
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
        link.download = `${data.photographerName}-commission.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export failed', err);
        alert('Failed to export image.');
      }
    }
  }, [data.photographerName, activeTab]);

  const toggleSection = (field: keyof CommissionData) => {
    setData(prev => ({ ...prev, [field]: !prev[field] }));
  }

  const SectionHeader = ({ title, colorClass, field }: { title: string, colorClass: string, field?: keyof CommissionData }) => (
    <h2 className={`text-xl font-bold ${colorClass} uppercase border-b-2 border-current pb-1 mb-2 flex items-center justify-between`}>
       <span className="flex items-center gap-2">
         {title}
       </span>
       {field && (
         <button onClick={() => toggleSection(field)} className="text-white hover:opacity-80">
            {data[field] ? <Eye size={18} /> : <EyeOff size={18} className="text-gray-500" />}
         </button>
       )}
    </h2>
  );

  const SpacingControl = ({ value, field, label }: { value: number, field: keyof CommissionData, label?: string }) => (
    <div className="mt-6 pt-4 border-t border-dashed border-neutral-700">
       <div className="flex justify-between items-center mb-2">
         <label className="text-[10px] text-gray-500 font-mono uppercase flex items-center gap-1">
           <MoveVertical size={10} />
           {label || "Bottom Spacing"}
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
        className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
       />
    </div>
  );

  // --- LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center font-sans overflow-hidden relative">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#330033_0%,_#000000_100%)] opacity-50"></div>
         <div className="z-10 bg-neutral-900 border-2 border-pink-500 p-8 w-[90%] max-w-md shadow-[0_0_20px_rgba(255,0,128,0.3)] relative group">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-4 text-pink-500 font-black italic tracking-widest text-xl border-l-2 border-r-2 border-pink-500">
              DOHNA SYSTEM
            </div>
            
            <h2 className="text-white text-3xl font-black italic mb-6 text-center mt-4">
              IDENTITY VERIFICATION
            </h2>
            
            {!showServerSettings ? (
              <form onSubmit={handleLogin} className="space-y-6">
                 <div>
                    <label className="block text-xs text-gray-400 font-mono mb-2 uppercase">Input Codename // 代号</label>
                    <input 
                      type="text" 
                      value={loginInput}
                      onChange={e => setLoginInput(e.target.value)}
                      className="w-full bg-black border-b-2 border-gray-600 text-white p-3 text-xl font-bold focus:border-pink-500 focus:outline-none placeholder-gray-700 text-center uppercase tracking-widest"
                      placeholder="ENTER ID..."
                      autoFocus
                    />
                 </div>
                 <button 
                   type="submit" 
                   className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black italic text-xl py-3 border-2 border-white shadow-[4px_4px_0px_white] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                 >
                   LOGIN <ArrowRight size={24} />
                 </button>
                 
                 <div className="text-center pt-4 border-t border-gray-800">
                    <button 
                       type="button" 
                       onClick={() => setShowServerSettings(true)}
                       className="text-gray-500 hover:text-cyan-400 text-xs font-mono flex items-center justify-center gap-2 w-full"
                    >
                       <Settings size={12} /> 
                       {currentServerUrl ? "SERVER: CONNECTED" : "SERVER: LOCAL ONLY"}
                    </button>
                 </div>
              </form>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                 <div>
                    <label className="block text-xs text-cyan-400 font-mono mb-2 uppercase flex items-center gap-2">
                       <Server size={14} /> Server API Endpoint
                    </label>
                    <input 
                      type="text" 
                      value={serverUrlInput}
                      onChange={e => setServerUrlInput(e.target.value)}
                      className="w-full bg-black border-b-2 border-cyan-600 text-white p-2 text-sm font-mono focus:border-cyan-400 focus:outline-none placeholder-gray-700"
                      placeholder="https://your-app.vercel.app/api"
                    />
                    <p className="text-[10px] text-gray-500 mt-2">
                       Set your backend API URL to enable cross-device sync.
                       Leave empty for offline mode.
                    </p>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowServerSettings(false)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 border border-gray-600"
                    >
                      CANCEL
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSaveServerSettings}
                      className="flex-1 bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 border border-cyan-400"
                    >
                      SAVE CONFIG
                    </button>
                 </div>
              </div>
            )}
            
            <div className="mt-6 text-[10px] text-gray-500 text-center font-mono flex justify-center gap-4">
               <span>SECURE CONNECTION</span>
               {currentServerUrl ? (
                  <span className="text-cyan-500 flex items-center gap-1"><Cloud size={10} /> SYNC ON</span>
               ) : (
                  <span className="text-gray-600 flex items-center gap-1"><CloudOff size={10} /> OFFLINE</span>
               )}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row text-white overflow-hidden font-sans bg-neutral-900">
      
      {/* --- PRESET MANAGER MODAL --- */}
      {showPresetManager && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-neutral-900 border-2 border-cyan-500 w-full max-w-2xl h-[80vh] flex flex-col shadow-[0_0_30px_rgba(0,255,255,0.2)]">
              {/* Modal Header */}
              <div className="bg-black p-4 border-b-2 border-cyan-500 flex justify-between items-center">
                 <h2 className="text-2xl font-black italic text-cyan-400 flex items-center gap-2">
                   <FolderOpen size={24} /> 
                   DATA ARCHIVES
                   {currentServerUrl && <span className="text-xs bg-cyan-900 text-cyan-200 px-2 py-0.5 rounded ml-2">CLOUD</span>}
                 </h2>
                 <button onClick={() => setShowPresetManager(false)} className="text-gray-400 hover:text-white">
                   <XCircle size={24} />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-neutral-900/50">
                 
                 {/* Save New */}
                 <div className="mb-8 bg-neutral-800 p-4 border border-cyan-500/30">
                    <label className="text-xs text-gray-400 font-mono mb-2 block">SAVE CURRENT STATE AS NEW PRESET</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={newPresetName}
                         onChange={e => setNewPresetName(e.target.value)}
                         placeholder="Enter Preset Name (e.g. Pink Theme V1)"
                         className="flex-1 bg-black border border-gray-600 p-2 text-white focus:border-cyan-500 focus:outline-none"
                       />
                       <button onClick={handleSavePreset} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 font-bold flex items-center gap-2">
                          <Save size={16} /> SAVE
                       </button>
                    </div>
                 </div>

                 {/* Import */}
                 <div className="mb-8 flex items-center justify-between bg-neutral-800 p-4 border border-dashed border-gray-600">
                    <div className="flex items-center gap-3">
                       <FileJson className="text-yellow-400" size={24} />
                       <div>
                          <div className="font-bold text-sm">IMPORT FROM FILE</div>
                          <div className="text-[10px] text-gray-500">Restore data from .json backup</div>
                       </div>
                    </div>
                    <label className="cursor-pointer bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 text-xs font-bold border border-gray-500 flex items-center gap-2">
                       <Upload size={14} /> SELECT FILE
                       <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
                    </label>
                 </div>

                 {/* List */}
                 <div className="space-y-3">
                    <label className="text-xs text-gray-400 font-mono block mb-2 border-b border-gray-700 pb-1">SAVED ARCHIVES ({presets.length})</label>
                    {presets.length === 0 ? (
                       <div className="text-center text-gray-600 py-8 italic">NO DATA FOUND</div>
                    ) : (
                       presets.map(preset => (
                          <div key={preset.id} className="bg-black border border-gray-700 p-3 flex justify-between items-center group hover:border-cyan-500 transition-colors">
                             <div>
                                <div className="font-bold text-white text-lg">{preset.name}</div>
                                <div className="text-[10px] text-gray-500 font-mono">
                                   {new Date(preset.createdAt).toLocaleString()}
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <button 
                                   onClick={() => handleExportJSON(preset)}
                                   className="p-2 text-yellow-500 hover:bg-neutral-800 rounded"
                                   title="Export JSON"
                                >
                                   <Download size={18} />
                                </button>
                                <button 
                                   onClick={() => handleDeletePreset(preset.id)}
                                   className="p-2 text-red-500 hover:bg-neutral-800 rounded"
                                   title="Delete"
                                >
                                   <Trash2 size={18} />
                                </button>
                                <button 
                                   onClick={() => handleLoadPreset(preset.data)}
                                   className="px-4 py-1 bg-neutral-800 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500 font-bold text-xs"
                                >
                                   LOAD
                                </button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- Sidebar Editor (Left) --- */}
      <div className={`
          ${activeTab === 'editor' ? 'flex' : 'hidden'} 
          md:flex w-full md:w-[450px] bg-neutral-900 border-r-4 border-black flex-col 
          h-[calc(100vh-60px)] md:h-screen z-20 shadow-2xl
      `}>
        <div className="p-6 bg-black text-white border-b-4 border-neutral-800 flex justify-between items-center shrink-0">
           <div>
             <h1 className="text-2xl font-black italic text-pink-500 tracking-tighter">DOHNA-CN</h1>
             <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                <User size={10} /> 
                USER: <span className="text-white">{currentUser}</span>
                {currentServerUrl && (
                   <span className="ml-2 text-[8px] bg-cyan-900 text-cyan-200 px-1 rounded border border-cyan-700">CLOUD ON</span>
                )}
             </div>
           </div>
           
           <div className="flex items-center gap-2">
               <button onClick={() => setShowPresetManager(true)} className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 border border-gray-600 transition-all text-xs flex items-center gap-1" title="Manage Presets">
                 <FolderOpen size={16} /> 
                 <span className="hidden lg:inline">ARCHIVES</span>
               </button>
               
               <button onClick={handleLogout} className="bg-neutral-800 hover:bg-red-900 text-red-500 p-2 border border-gray-600 transition-all" title="Logout">
                 <LogOut size={16} />
               </button>

               {/* Desktop Export Button */}
               <button onClick={handleExport} className="hidden md:flex bg-pink-600 hover:bg-pink-500 text-white p-3 border-2 border-white shadow-[4px_4px_0px_white] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
                 <Download size={20} />
               </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
           
           {/* Section: Basic Info */}
           <div className="space-y-4">
             <SectionHeader title="01 身份卡 Identity" colorClass="text-yellow-400" />
             
             <div className="flex gap-4 items-center">
                <div className="relative w-20 h-20 bg-neutral-800 border-2 border-dashed border-gray-600 flex items-center justify-center shrink-0 hover:border-pink-500 cursor-pointer overflow-hidden group">
                  {data.avatar ? (
                    <img src={data.avatar} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <Camera className="text-gray-500" />
                  )}
                  {/* Added z-10 to input to ensure it is clickable, and pointer-events-none to overlay */}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-center pointer-events-none z-0">
                    更换头像
                  </div>
                </div>
                <div className="flex-1">
                   <label className="block text-xs font-mono text-gray-400 mb-1">CN / 摄影师昵称</label>
                   <input 
                     type="text" 
                     value={data.photographerName} 
                     onChange={(e) => handleInputChange('photographerName', e.target.value)}
                     className="w-full bg-neutral-800 border-2 border-neutral-600 p-2 text-white focus:border-pink-500 focus:outline-none font-bold"
                   />
                   <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
                     <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
                     右侧预览中可拖拽头像位置
                   </div>
                </div>
             </div>

             <div>
               <label className="block text-xs font-mono text-gray-400 mb-1 flex justify-between">
                 <span>SLOGAN / 个人签名</span>
                 <button onClick={generateSlogan} disabled={isGenerating} className="text-pink-500 hover:text-white text-xs flex items-center gap-1">
                   {isGenerating ? <RefreshCw className="animate-spin" size={10} /> : <Sparkles size={10} />} AI GEN
                 </button>
               </label>
               <input 
                 type="text" 
                 value={data.slogan} 
                 onChange={(e) => handleInputChange('slogan', e.target.value)}
                 className="w-full bg-neutral-800 border-2 border-neutral-600 p-2 text-white focus:border-pink-500 focus:outline-none"
               />
             </div>

             <div>
               <label className="block text-xs font-mono text-gray-400 mb-1">互勉题材 (用逗号分隔)</label>
               <input 
                 type="text" 
                 value={data.tags.join(', ')} 
                 onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(s => s.trim()))}
                 className="w-full bg-neutral-800 border-2 border-neutral-600 p-2 text-white focus:border-pink-500 focus:outline-none"
               />
             </div>

             <SpacingControl value={data.spacingHeader} field="spacingHeader" label="Header Bottom Spacing" />
           </div>

           {/* Section: Theme */}
           <div className="space-y-4">
             <SectionHeader title="02 视觉 Visuals" colorClass="text-cyan-400" field="showPortfolio" />
             
             <div className="flex gap-3 mb-4 flex-wrap">
                {(['pink', 'yellow', 'blue', 'red', 'purple', 'green', 'cyan', 'orange'] as const).map(c => (
                  <button 
                    key={c}
                    onClick={() => handleInputChange('themeColor', c)}
                    className={`w-10 h-10 border-2 rounded-full relative group transition-transform ${data.themeColor === c ? 'scale-110 border-white z-10 shadow-[0_0_10px_white]' : 'border-gray-600 opacity-70 hover:opacity-100 hover:scale-105'}`}
                    style={{ background: THEMES[c].gradient }}
                    title={c.toUpperCase()}
                  />
                ))}
             </div>
             
             {/* Exhibition Images */}
             {data.showPortfolio && (
               <>
                 <div>
                   <label className="block text-xs font-mono text-gray-400 mb-2 flex justify-between">
                     <span>场照展示 (No Limit)</span>
                     <span className="text-cyan-400 text-[10px]">EXHIBITION</span>
                   </label>
                   {/* Changed to flex-wrap for unlimited photos */}
                   <div className="flex flex-wrap gap-2">
                     {data.exhibitionImages.map((img, i) => (
                       <div key={img.id} className="relative w-20 h-20 border border-gray-600 group shrink-0">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(i, 'exhibitionImages')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500">
                            <Trash2 size={12} />
                          </button>
                       </div>
                     ))}
                     <label className="w-20 h-20 border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-cyan-500 shrink-0">
                       <Plus size={16} className="text-gray-500" />
                       <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'exhibitionImages')} className="hidden" />
                     </label>
                   </div>
                 </div>

                 {/* Main Images */}
                 <div className="mt-4">
                   <label className="block text-xs font-mono text-gray-400 mb-2 flex justify-between">
                     <span>正片展示 (No Limit)</span>
                     <span className="text-pink-400 text-[10px]">MAIN WORK</span>
                   </label>
                   <div className="flex flex-wrap gap-2">
                     {data.mainImages.map((img, i) => (
                       <div key={img.id} className="relative w-20 h-20 border border-gray-600 group shrink-0">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(i, 'mainImages')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500">
                            <Trash2 size={12} />
                          </button>
                       </div>
                     ))}
                     <label className="w-20 h-20 border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-pink-500 shrink-0">
                       <Plus size={16} className="text-gray-500" />
                       <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'mainImages')} className="hidden" />
                     </label>
                   </div>
                 </div>
                 
                 <SpacingControl value={data.spacingPortfolio} field="spacingPortfolio" />
               </>
             )}
           </div>

           {/* Section: Pricing */}
           <div className="space-y-4">
             <SectionHeader title="03 业务 Menu" colorClass="text-green-400" field="showPricing" />
             
             {data.showPricing && (
               <div className="space-y-4">
                 {data.pricing.map((item) => (
                   <div key={item.id} className="bg-neutral-800 p-3 border border-neutral-700 relative group">
                      <button onClick={() => removePricing(item.id)} className="absolute top-2 right-2 text-neutral-600 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                      <input 
                         className="bg-transparent border-b border-neutral-600 w-2/3 text-sm font-bold text-white mb-2 focus:outline-none focus:border-pink-500"
                         value={item.title}
                         onChange={(e) => updatePricing(item.id, 'title', e.target.value)}
                         placeholder="业务名称"
                      />
                      <input 
                         className="bg-transparent border-b border-neutral-600 w-1/3 text-sm font-bold text-green-400 mb-2 focus:outline-none focus:border-green-500 text-right float-right"
                         value={item.price}
                         onChange={(e) => updatePricing(item.id, 'price', e.target.value)}
                         placeholder="价格"
                      />
                      <div className="relative">
                        <textarea 
                          className="w-full bg-black/30 p-2 text-xs text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-pink-500"
                          rows={2}
                          value={item.desc}
                          onChange={(e) => updatePricing(item.id, 'desc', e.target.value)}
                          placeholder="详细描述..."
                        />
                        <button 
                          onClick={() => enhancePriceDesc(item.id, item.desc)}
                          className="absolute bottom-1 right-1 text-gray-500 hover:text-pink-500"
                          title="AI润色"
                        >
                          <Sparkles size={12} />
                        </button>
                      </div>
                   </div>
                 ))}
                 <button onClick={addPricingItem} className="w-full py-2 border-2 border-dashed border-gray-600 text-gray-500 hover:border-green-400 hover:text-green-400 flex items-center justify-center gap-2 text-sm font-bold">
                   <Plus size={16} /> 添加业务
                 </button>
                 
                 <SpacingControl value={data.spacingPricing} field="spacingPricing" />
               </div>
             )}
           </div>

           {/* Section: Notice & Contact */}
           <div className="space-y-4 pb-12">
             <SectionHeader title="04 须知 Notice" colorClass="text-purple-400" field="showNotice" />

             {data.showNotice && (
               <div>
                  <textarea 
                    value={data.notice}
                    onChange={(e) => handleInputChange('notice', e.target.value)}
                    rows={4}
                    className="w-full bg-neutral-800 border-2 border-neutral-600 p-2 text-white focus:border-pink-500 focus:outline-none text-sm"
                    placeholder="请输入接单须知..."
                  />
                  <SpacingControl value={data.spacingNotice} field="spacingNotice" />
               </div>
             )}
             
             <div className="mt-6">
                <SectionHeader title="05 联系 Contact" colorClass="text-purple-400" field="showContact" />
                {data.showContact && (
                  <div className="space-y-4">
                    {/* Background Image Control */}
                    <div className="mb-4 bg-neutral-800 p-3 rounded-md border border-neutral-700">
                        <label className="block text-xs font-mono text-gray-400 mb-2">背景设置 (Background)</label>
                        <div className="flex items-center gap-3">
                           {/* Upload Button */}
                           <div className="relative overflow-hidden group">
                              <button className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs rounded flex items-center gap-2">
                                <ImageIcon size={12} />
                                {data.contactBackgroundImage ? '更换图片' : '上传背景图'}
                              </button>
                              <input type="file" accept="image/*" onChange={handleContactBgUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                           </div>

                           {/* Clear Button */}
                           {data.contactBackgroundImage && (
                             <button 
                                onClick={() => handleInputChange('contactBackgroundImage', '')}
                                className="p-1 text-red-500 hover:text-red-400"
                                title="Remove Image"
                             >
                               <XCircle size={16} />
                             </button>
                           )}
                        </div>

                        {/* Opacity Slider (only if image exists) */}
                        {data.contactBackgroundImage && (
                          <div className="mt-3 space-y-3">
                             <div>
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                  <span>透明度 (Opacity)</span>
                                  <span>{Math.round(data.contactBackgroundOpacity * 100)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05"
                                    value={data.contactBackgroundOpacity} 
                                    onChange={(e) => handleInputChange('contactBackgroundOpacity', Number(e.target.value))}
                                    className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                             </div>
                             
                             <div>
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                  <span>缩放 (Scale)</span>
                                  <span>{data.contactBackgroundScale.toFixed(1)}x</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="3" 
                                    step="0.1"
                                    value={data.contactBackgroundScale} 
                                    onChange={(e) => handleInputChange('contactBackgroundScale', Number(e.target.value))}
                                    className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                             </div>
                          </div>
                        )}
                        {!data.contactBackgroundImage && (
                           <p className="text-[10px] text-gray-500 mt-2">当前使用默认纯色背景</p>
                        )}
                    </div>

                    {/* QQ Upload */}
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-neutral-800 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:border-purple-500 hover:text-purple-500 cursor-pointer relative shrink-0">
                          {data.qrCodeQQ ? (
                            <img src={data.qrCodeQQ} alt="QR" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <QrCode size={16} />
                              <span className="text-[8px] mt-1">QQ</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={(e) => handleQrUpload(e, 'qq')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <div className="text-xs text-gray-400">QQ QR Code <span className="text-[10px] text-pink-500 opacity-70">(Auto Crop)</span></div>
                    </div>

                    {/* WeChat Upload */}
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-neutral-800 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 cursor-pointer relative shrink-0">
                          {data.qrCodeWeChat ? (
                            <img src={data.qrCodeWeChat} alt="QR" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <QrCode size={16} />
                              <span className="text-[8px] mt-1">WeChat</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={(e) => handleQrUpload(e, 'wechat')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <div className="text-xs text-gray-400">WeChat QR Code <span className="text-[10px] text-green-500 opacity-70">(Auto Crop)</span></div>
                    </div>

                    <div className="mt-2">
                        <label className="block text-xs font-mono text-gray-400 mb-1">展示ID (QQ/WX)</label>
                        <input 
                           type="text" 
                           value={data.contactInfo} 
                           onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                           className="w-full bg-neutral-800 border-2 border-neutral-600 p-2 text-white focus:border-pink-500 focus:outline-none font-bold text-center"
                         />
                    </div>
                  </div>
                )}
             </div>
           </div>

        </div>
      </div>

      {/* --- Main Preview Area (Right) --- */}
      <div className={`
          ${activeTab === 'preview' ? 'flex' : 'hidden'}
          md:flex flex-1 bg-neutral-900 relative overflow-y-auto custom-scrollbar items-start justify-center p-4 md:p-8
          h-[calc(100vh-60px)] md:h-screen
      `}>
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
             style={{ 
               backgroundImage: `
                 linear-gradient(45deg, #1a1a1a 25%, transparent 25%), 
                 linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), 
                 linear-gradient(45deg, transparent 75%, #1a1a1a 75%), 
                 linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)
               `,
               backgroundSize: '20px 20px',
               backgroundColor: '#111' 
             }}
        ></div>
        
        {/* Adjusted scale for the taller aspect ratio */}
        <div className="origin-top transition-transform mt-4" style={{ transform: `scale(${scaleFactor})` }}>
          <PreviewCard 
            data={data} 
            innerRef={previewRef} 
            scaleFactor={scaleFactor} 
            onPosChange={handlePosChange}
            onImageUpdate={handleImageUpdate}
            onScaleChange={handleScaleChange}
          />
        </div>
      </div>

      {/* --- Mobile Bottom Nav --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-black border-t-2 border-neutral-800 flex z-50">
        <button 
           className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'editor' ? 'text-pink-500' : 'text-gray-500'}`}
           onClick={() => setActiveTab('editor')}
        >
          <Palette size={20} />
          <span className="text-[10px] font-bold tracking-widest">编辑 EDIT</span>
        </button>
        <button 
           className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'preview' ? 'text-pink-500' : 'text-gray-500'}`}
           onClick={() => setActiveTab('preview')}
        >
          <Eye size={20} />
          <span className="text-[10px] font-bold tracking-widest">预览 VIEW</span>
        </button>
        <button 
           className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-white active:text-pink-500"
           onClick={handleExport}
        >
          <Download size={20} />
          <span className="text-[10px] font-bold tracking-widest">导出 SAVE</span>
        </button>
      </div>

    </div>
  );
};

export default App;