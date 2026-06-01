import React, { useState, useEffect, useRef } from 'react';
import { 
  Link2, UploadCloud, Smartphone, Mail, Phone, MessageSquare, 
  Wifi, Contact, FileText, Download, Palette, Image as ImageIcon,
  Puzzle, CheckCircle2
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'motion/react';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { 
  buildWifi, buildVCard, buildEmail, buildWhatsapp, buildSms, buildPhone 
} from '../utils/qrHelpers';
import { PREDEFINED_LOGOS } from '../utils/logos';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

type QRType = 'url' | 'file' | 'vcard' | 'email' | 'phone' | 'sms' | 'whatsapp' | 'wifi';

export default function Home() {
  const [activeType, setActiveType] = useState<QRType>('url');

  // Input states
  const [url, setUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{name: string, size: string} | null>(null);
  
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA', hidden: false });
  const [vcard, setVcard] = useState({ firstName: '', lastName: '', phone: '', email: '', company: '', website: '', address: '' });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState({ phone: '', text: '' });
  const [whatsapp, setWhatsapp] = useState({ phone: '', text: '' });

  // Customization States
  const [bgColor, setBgColor] = useState('#ffffff');
  const [dotsColor, setDotsColor] = useState('#000000');
  const [dotsType, setDotsType] = useState<DotType>('square');
  const [cornersSquareType, setCornersSquareType] = useState<CornerSquareType>('square');
  const [cornersSquareColor, setCornersSquareColor] = useState('#000000');
  const [cornersDotType, setCornersDotType] = useState<CornerDotType>('square');
  const [cornersDotColor, setCornersDotColor] = useState('#000000');
  const [includeMargin, setIncludeMargin] = useState(true);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [transparentBg, setTransparentBg] = useState(false);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [logoSize, setLogoSize] = useState(0.25);
  const [dotsColor2, setDotsColor2] = useState('#0a0a0a');
  const [gradientRotation, setGradientRotation] = useState(Math.PI / 4);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');

  const applyTheme = (theme: string) => {
    switch(theme) {
      case 'emerald':
        setDotsColor('#10b981');
        setGradientEnabled(true);
        setDotsColor2('#064e3b');
        setDotsType('rounded');
        setCornersSquareType('extra-rounded');
        setCornersDotType('dot');
        setCornersSquareColor('#10b981');
        setCornersDotColor('#10b981');
        break;
      case 'ocean':
        setDotsColor('#3b82f6');
        setGradientEnabled(true);
        setDotsColor2('#1e3a8a');
        setDotsType('classy-rounded');
        setCornersSquareType('dot');
        setCornersDotType('dot');
        setCornersSquareColor('#3b82f6');
        setCornersDotColor('#3b82f6');
        break;
      case 'minimal':
        setDotsColor('#000000');
        setGradientEnabled(false);
        setDotsType('square');
        setCornersSquareType('square');
        setCornersDotType('square');
        setCornersSquareColor('#000000');
        setCornersDotColor('#000000');
        setBgColor('#ffffff');
        setTransparentBg(false);
        break;
      case 'sunset':
        setDotsColor('#f59e0b');
        setGradientEnabled(true);
        setDotsColor2('#ef4444');
        setDotsType('extra-rounded');
        setCornersSquareType('extra-rounded');
        setCornersDotType('square');
        setCornersSquareColor('#ef4444');
        setCornersDotColor('#f59e0b');
        break;
    }
  };

  // Generate QR Value based on active type
  const qrValue = React.useMemo(() => {
    switch(activeType) {
      case 'url': return url || 'https://google.com';
      case 'file': return fileUrl || 'https://google.com';
      case 'wifi': return buildWifi(wifi.ssid, wifi.password, wifi.encryption, wifi.hidden);
      case 'vcard': return buildVCard(vcard);
      case 'email': return buildEmail(email.to, email.subject, email.body);
      case 'phone': return buildPhone(phone);
      case 'sms': return buildSms(sms.phone, sms.text);
      case 'whatsapp': return buildWhatsapp(whatsapp.phone, whatsapp.text);
      default: return 'https://example.com';
    }
  }, [activeType, url, fileUrl, wifi, vcard, email, phone, sms, whatsapp]);

  // QR Code Instance
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling>();

  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExtensionMode, setIsExtensionMode] = useState(false);

  useEffect(() => {
    // Basic detection for extension context
    const isExt = window.location.search.includes('context=extension') || 
                  ((window as any).chrome && (window as any).chrome.runtime && (window as any).chrome.runtime.id);
    setIsExtensionMode(!!isExt);
  }, []);

  const exportExtension = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      
      // Manifest
      const manifestObj = {
        "manifest_version": 3,
        "name": "MK QR Pro Extension",
        "version": "1.0.0",
        "description": "Professional QR Code Generator by MK Design Studio",
        "action": {
          "default_popup": "popup.html",
          "default_icon": "icon128.png"
        },
        "icons": {
          "128": "icon128.png"
        },
        "permissions": ["activeTab", "downloads"]
      };

      zip.file('manifest.json', JSON.stringify(manifestObj, null, 2));

      // Generate a simple icon using canvas
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, 128, 128);
        // Emerald square
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(24, 24, 80, 80, 16);
        ctx.fill();
        // White "QR" text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', 64, 64);
        
        const iconBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (iconBlob) zip.file('icon128.png', iconBlob);
      }

      // Simple README for instructions
      zip.file('LEAME_INSTALACAO.txt', `MK QR Pro - Extensão para Navegador
      
Instalação:
1. Extraia o conteúdo deste arquivo ZIP em uma pasta em seu computador.
2. Abra o Chrome (ou Brave/Edge/Opera).
3. Digite na barra de endereços: chrome://extensions
4. Ative a chave "Modo do desenvolvedor" (Developer Mode) no canto superior direito.
5. Clique no botão "Carregar sem compactação" (Load unpacked).
6. Selecione a pasta onde você extraiu os arquivos.

Pronto! A extensão aparecerá na sua barra de ferramentas.

Nota: Esta extensão facilita o acesso ao MK QR Pro do MK Design Studio.`);

      // Popup that loads the app
      zip.file('popup.html', `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MK QR Pro</title>
  <style>
    body { 
      width: 450px; 
      height: 600px; 
      margin: 0; 
      padding: 0; 
      overflow: hidden; 
      background: #050505;
      display: flex;
      flex-direction: column;
      font-family: sans-serif;
    }
    .header {
      padding: 15px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo {
      width: 24px;
      height: 24px;
      background: #10b981;
      border-radius: 6px;
    }
    iframe { 
      border: none; 
      width: 100%; 
      flex: 1;
    }
    .loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
      z-index: -1;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"></div>
    <span style="color: white; font-weight: bold; font-size: 14px;">MK QR Pro Extension</span>
  </div>
  <div class="loading">Iniciando aplicação profissional...</div>
  <iframe src="${window.location.origin}?context=extension"></iframe>
</body>
</html>`);

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'mk-qr-pro-extension.zip');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao gerar extensão.');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate QR Options dynamically based on size
  const getQrOptions = (size: number): any => ({
    width: size,
    height: size,
    type: "canvas",
    margin: includeMargin ? Math.floor(size * 0.04) : 0,
    data: qrValue,
    image: logoBase64 || undefined,
    qrOptions: {
      errorCorrectionLevel: 'H',
    },
    dotsOptions: {
      type: dotsType,
      color: gradientEnabled ? undefined : dotsColor,
      gradient: gradientEnabled ? {
        type: gradientType,
        rotation: gradientRotation,
        colorStops: [{ offset: 0, color: dotsColor }, { offset: 1, color: dotsColor2 }]
      } : undefined
    },
    backgroundOptions: {
      color: transparentBg ? "transparent" : bgColor,
    },
    cornersSquareOptions: {
      type: cornersSquareType,
      color: cornersSquareColor,
    },
    cornersDotOptions: {
      type: cornersDotType,
      color: cornersDotColor,
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: Math.floor(size * 0.02),
      imageSize: logoSize
    }
  });

  useEffect(() => {
    qrCodeInstance.current = new QRCodeStyling(getQrOptions(250));

    if (qrCodeRef.current) {
      qrCodeRef.current.innerHTML = '';
      qrCodeInstance.current.append(qrCodeRef.current);
    }
  }, []);

  // Update QR Code on state changes
  useEffect(() => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.update(getQrOptions(250));
    }
  }, [qrValue, logoBase64, logoSize, includeMargin, dotsType, dotsColor, dotsColor2, gradientEnabled, gradientRotation, gradientType, bgColor, transparentBg, cornersSquareType, cornersSquareColor, cornersDotType, cornersDotColor]);


  const formatSize = (size: string | number) => {
    if (typeof size === 'string') return size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadedFile(null);
    setFileUrl('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.url) {
        setFileUrl(data.url);
        setUploadedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB'
        });
      } else {
        alert(data.error || 'Erro ao processar arquivo');
      }
    } catch (err) {
      alert('Falha na conexão com o servidor.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoBase64(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const downloadQR = async () => {
    setIsDownloading(true);
    try {
      // 3840 is 4K resolution width
      const qr4k = new QRCodeStyling(getQrOptions(3840));
      await qr4k.download({ extension: 'png', name: 'qr-pro-4k' });
    } catch (err) {
      console.error('Falha ao baixar:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const typeTabs: { id: QRType, icon: any, label: string }[] = [
    { id: 'url', icon: Link2, label: 'Link URL' },
    { id: 'file', icon: FileText, label: 'Doc / PDF / App' },
    { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' },
    { id: 'wifi', icon: Wifi, label: 'Wi-Fi' },
    { id: 'vcard', icon: Contact, label: 'Contato' },
    { id: 'email', icon: Mail, label: 'E-mail' },
    { id: 'phone', icon: Phone, label: 'Telefone' },
    { id: 'sms', icon: MessageSquare, label: 'SMS' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[150px] rounded-full mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/30 blur-[150px] rounded-full mix-blend-screen opacity-50"></div>
      </div>

      <header className="w-full bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-white">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.4)] shrink-0">
              <Smartphone size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
               <h1 className="font-extrabold text-xl md:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-none pb-1">MK Design Studio</h1>
               <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.25em] text-emerald-500">QR Code Generator</span>
            </div>
          </div>

          {!isExtensionMode && (
            <button 
              onClick={exportExtension}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 transition-all hover:text-emerald-400 disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Puzzle size={14} />
              )}
              <span className="hidden sm:inline">Download Extensão</span>
            </button>
          )}
        </div>
      </header>
      
      <main className={cn("max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 relative z-10", isExtensionMode && "md:p-4 gap-4")}>
        
        {/* Left Column - Input Panel */}
        <div className="flex-1 shrink-0 flex flex-col gap-6">
          <div className="bg-[#111113]/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-2 overflow-x-auto scrollbar-none">
            <div className="flex md:grid md:grid-cols-4 gap-2 min-w-max md:min-w-0">
              {typeTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveType(tab.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 px-6 md:px-2 min-w-[100px] md:min-w-0 rounded-2xl transition-all duration-300 relative overflow-hidden select-none",
                      isActive 
                        ? "text-emerald-400" 
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <motion.div layoutId="activeTabBadge" className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl z-0" />
                    )}
                    <Icon size={20} className="relative z-10" />
                    <span className="text-xs font-semibold relative z-10 whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-[#111113]/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-6 md:p-8 min-h-[350px]">
            <h2 className="text-xl font-bold text-white mb-6">Criar QR Code de {typeTabs.find(t => t.id === activeType)?.label}</h2>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeType}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                
                {/* --- URL FORM --- */}
                {activeType === 'url' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Link / URL da Aplicação</label>
                      <input 
                        type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://sua-aplicacao.com.br"
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all"
                      />
                    </div>
                  </div>
                )}
                
                {/* --- FILE FORM --- */}
                {activeType === 'file' && (
                  <div className="flex flex-col items-center justify-center pt-4">
                    {!uploadedFile ? (
                      <label className={cn(
                        "flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                        uploading ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 hover:border-emerald-500/50 bg-[#0A0A0A] hover:bg-[#111113] shadow-inner"
                      )}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                          ) : (
                            <UploadCloud className="w-10 h-10 mb-4 text-gray-500" />
                          )}
                          <p className="mb-2 text-sm text-gray-400">
                            <span className="font-semibold text-emerald-400">{uploading ? 'Enviando arquivo...' : 'Clique para enviar'}</span> ou arraste o arquivo PDF/Doc
                          </p>
                          {!uploading && <p className="text-xs text-gray-600">Suporta Arquivos, PDF, Áudios (Máx. 10MB)</p>}
                        </div>
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    ) : (
                      <div className="w-full border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-6 flex flex-col items-center text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
                        <h4 className="text-sm font-semibold text-white break-all">{uploadedFile.name}</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-6">{formatSize(uploadedFile.size)}</p>
                        <label className="px-5 py-2.5 bg-[#0A0A0A] shadow-inner border border-white/10 rounded-xl text-sm font-medium cursor-pointer hover:bg-white/5 transition-colors text-white">
                          Enviar outro arquivo
                          <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* --- WHATSAPP FORM --- */}
                {activeType === 'whatsapp' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Número de Telefone</label>
                      <input 
                        type="tel" value={whatsapp.phone} onChange={(e) => setWhatsapp({...whatsapp, phone: e.target.value})}
                        placeholder="Ex: 5511999999999"
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Mensagem Inicial</label>
                      <textarea 
                        value={whatsapp.text} onChange={(e) => setWhatsapp({...whatsapp, text: e.target.value})}
                        placeholder="Olá, gostaria de mais informações..." rows={3}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* --- WIFI FORM --- */}
                {activeType === 'wifi' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Nome da Rede (SSID)</label>
                      <input 
                        type="text" value={wifi.ssid} onChange={(e) => setWifi({...wifi, ssid: e.target.value})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">Senha</label>
                        <input 
                          type="password" value={wifi.password} onChange={(e) => setWifi({...wifi, password: e.target.value})}
                          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all"
                        />
                       </div>
                       <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">Criptografia</label>
                        <select 
                          value={wifi.encryption} onChange={(e) => setWifi({...wifi, encryption: e.target.value})}
                          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all appearance-none"
                        >
                          <option value="WPA">WPA/WPA2/WPA3</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">Sem Senha</option>
                        </select>
                       </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" checked={wifi.hidden} onChange={(e) => setWifi({...wifi, hidden: e.target.checked})}
                        className="w-4 h-4 rounded text-emerald-500 bg-[#0A0A0A] border-white/10 focus:ring-emerald-500 focus:ring-offset-[#111113] shadow-inner" 
                      />
                      <span className="text-sm text-gray-300">Rede Oculta</span>
                    </label>
                  </div>
                )}

                {/* --- VCARD FORM --- */}
                {activeType === 'vcard' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dados Pessoais</h3>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1 block">Nome</label>
                      <input type="text" value={vcard.firstName} onChange={e => setVcard({...vcard, firstName: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1 block">Sobrenome</label>
                      <input type="text" value={vcard.lastName} onChange={e => setVcard({...vcard, lastName: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-400 mb-1 block">Telefone</label>
                      <input type="tel" value={vcard.phone} onChange={e => setVcard({...vcard, phone: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-400 mb-1 block">E-mail</label>
                      <input type="email" value={vcard.email} onChange={e => setVcard({...vcard, email: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all" />
                    </div>
                  </div>
                )}

                {/* --- EMAIL FORM --- */}
                {activeType === 'email' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Destinatário</label>
                      <input type="email" value={email.to} onChange={e => setEmail({...email, to: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Assunto</label>
                      <input type="text" value={email.subject} onChange={e => setEmail({...email, subject: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all" />
                    </div>
                  </div>
                )}
                
                {/* --- PHONE & SMS --- */}
                {(activeType === 'phone' || activeType === 'sms') && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Número de Telefone</label>
                      <input type="tel" value={activeType === 'phone' ? phone : sms.phone} 
                             onChange={e => activeType === 'phone' ? setPhone(e.target.value) : setSms({...sms, phone: e.target.value})} 
                             className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all" />
                    </div>
                    {activeType === 'sms' && (
                      <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">Mensagem</label>
                        <textarea value={sms.text} onChange={e => setSms({...sms, text: e.target.value})} rows={3}
                                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all resize-none" />
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>


        {/* Right Column - Customization & Preview */}
        <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-6">
          <div className="bg-[#111113]/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-8 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none"></div>
            
            {/* QR Preview Wrapper */}
            <div className={cn("p-4 rounded-3xl transition-colors duration-300 relative", transparentBg ? "bg-transparent shadow-none" : "shadow-lg shadow-black/50")} style={transparentBg ? {} : { backgroundColor: bgColor }}>
               {/* Actual QR Canvas container */}
               <div ref={qrCodeRef} className="flex justify-center items-center overflow-hidden rounded-xl"></div>
            </div>

            <button 
              onClick={downloadQR}
              disabled={isDownloading}
              className="mt-8 w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-wait disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Processando 4K...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Baixar 4K (Ultra HD)
                </>
              )}
            </button>
          </div>

          {/* Customization Panel */}
          <div className="bg-[#111113]/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-6 flex flex-col relative overflow-hidden">
            <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
            
            <div className="mb-6 space-y-4">
              <h3 className="text-sm font-bold tracking-widest uppercase text-white flex items-center gap-2 pb-2 border-b border-white/10">
                <Palette size={16} className="text-emerald-500" /> Temas Rápidos
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'emerald', label: 'Esmeralda', color: 'bg-emerald-500' },
                  { id: 'ocean', label: 'Oceano', color: 'bg-blue-500' },
                  { id: 'sunset', label: 'Sunset', color: 'bg-orange-500' },
                  { id: 'minimal', label: 'Minimal', color: 'bg-white' },
                ].map(theme => (
                  <button key={theme.id} onClick={() => applyTheme(theme.id)} className="flex flex-col items-center gap-1.5 group">
                    <div className={cn("w-full aspect-square rounded-lg transition-transform group-hover:scale-105 border border-white/10", theme.color)} />
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-emerald-400">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <h3 className="text-sm font-bold tracking-widest uppercase text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
              Estilos & Cores
            </h3>
            
            <div className="space-y-6">
              
              {/* Formas (Shapes) */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">Estilo dos Pontos</label>
                <div className="grid grid-cols-3 gap-2">
                  {['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'].map(type => (
                    <button key={type} onClick={() => setDotsType(type as any)} 
                      className={cn("py-2 px-1 text-[10px] font-medium rounded-lg border transition-colors capitalize text-center", dotsType === type ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-[#111113] border-white/10 text-gray-400 hover:text-white")}>
                      {type.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

                {/* Eye Corners */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">Estilo Borda</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['square', 'dot', 'extra-rounded'].map(type => (
                        <button key={type} onClick={() => setCornersSquareType(type as any)} 
                          className={cn("py-2 text-[10px] font-medium rounded-lg border transition-colors capitalize", cornersSquareType === type ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-[#111113] border-white/10 text-gray-400 hover:text-white")}>
                          {type.split('-')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">Estilo Centro</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['square', 'dot'].map(type => (
                        <button key={type} onClick={() => setCornersDotType(type as any)} 
                          className={cn("py-2 text-[10px] font-medium rounded-lg border transition-colors capitalize", cornersDotType === type ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-[#111113] border-white/10 text-gray-400 hover:text-white")}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Eye Colors */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-2">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cor Borda</label>
                     <label className="flex items-center gap-3 p-2 border border-white/10 bg-[#111113] rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                       <input type="color" value={cornersSquareColor} onChange={(e) => setCornersSquareColor(e.target.value)}
                         className="w-8 h-8 rounded shrink-0 p-0 border-0 cursor-pointer outline-none bg-transparent" />
                     </label>
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cor Centro</label>
                     <label className="flex items-center gap-3 p-2 border border-white/10 bg-[#111113] rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                       <input type="color" value={cornersDotColor} onChange={(e) => setCornersDotColor(e.target.value)}
                         className="w-8 h-8 rounded shrink-0 p-0 border-0 cursor-pointer outline-none bg-transparent" />
                     </label>
                   </div>
                </div>

              <hr className="border-white/5" />

              {/* COLORS */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                   {/* QR Color */}
                   <div className="flex flex-col gap-2 relative">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cor do QR</label>
                     <label className="flex items-center gap-3 p-2 border border-white/10 bg-[#111113] rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                       <input type="color" value={dotsColor} onChange={(e) => setDotsColor(e.target.value)}
                         className="w-8 h-8 rounded shrink-0 p-0 border-0 cursor-pointer outline-none bg-transparent" />
                       <span className="text-xs font-medium text-gray-300">{dotsColor.toUpperCase()}</span>
                     </label>
                     <label className="flex items-center gap-2 mt-1 cursor-pointer">
                       <input type="checkbox" checked={gradientEnabled} onChange={e => setGradientEnabled(e.target.checked)} className="rounded bg-[#111113] border-white/20 text-emerald-500 focus:ring-emerald-500" />
                       <span className="text-xs text-gray-400">Usar Gradiente</span>
                     </label>
                   </div>
                   
                   {/* Gradient Secondary */}
                   {gradientEnabled ? (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cor Final</label>
                        <label className="flex items-center gap-3 p-2 border border-white/10 bg-[#111113] rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                          <input type="color" value={dotsColor2} onChange={(e) => setDotsColor2(e.target.value)}
                            className="w-8 h-8 rounded shrink-0 p-0 border-0 cursor-pointer outline-none bg-transparent" />
                          <span className="text-xs font-medium text-gray-300">{dotsColor2.toUpperCase()}</span>
                        </label>
                      </div>
                   ): <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cores Rápidas</label>
                        <div className="grid grid-cols-4 gap-1">
                          {['#000000', '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'].map(c => (
                            <button key={c} onClick={() => setDotsColor(c)} className={cn("w-6 h-6 rounded-md border border-white/10 transition-transform hover:scale-110", dotsColor === c && "ring-2 ring-emerald-500")} style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>}
                </div>

                {gradientEnabled && (
                  <div className="p-3 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo</label>
                      <div className="flex gap-2">
                        <button onClick={() => setGradientType('linear')} className={cn("px-2 py-0.5 text-[9px] rounded-md border", gradientType === 'linear' ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-[#111113] border-white/10 text-gray-500")}>Linear</button>
                        <button onClick={() => setGradientType('radial')} className={cn("px-2 py-0.5 text-[9px] rounded-md border", gradientType === 'radial' ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-[#111113] border-white/10 text-gray-500")}>Radial</button>
                      </div>
                    </div>
                    {gradientType === 'linear' && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Rotação</label>
                          <span className="text-[10px] text-emerald-500 font-mono">{((gradientRotation * 180) / Math.PI).toFixed(0)}°</span>
                        </div>
                        <input type="range" min="0" max={Math.PI * 2} step="0.1" value={gradientRotation} onChange={e => setGradientRotation(parseFloat(e.target.value))} className="w-full h-1 bg-[#111113] rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                      </div>
                    )}
                  </div>
                )}
              </div>


              <hr className="border-white/5" />

              {/* Logo Upload & Select */}
              <div className="flex flex-col gap-4">
                <label className="text-xs font-semibold text-emerald-500 uppercase tracking-wide flex items-center justify-between">
                  Logo Central
                  {logoBase64 && (
                    <button onClick={() => setLogoBase64(null)} className="text-red-400 hover:text-red-300 font-normal">Remover</button>
                  )}
                </label>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                   <label className="flex flex-col items-center justify-center shrink-0 w-14 h-14 border border-dashed border-white/20 bg-[#111113] rounded-xl hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer text-gray-400 hover:text-emerald-500">
                     <ImageIcon size={18} />
                     <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                   </label>
                   {Object.entries({ 
                     'WhatsApp': PREDEFINED_LOGOS.whatsapp,
                     'Wi-Fi': PREDEFINED_LOGOS.wifi,
                     'E-mail': PREDEFINED_LOGOS.mail,
                     'PDF': PREDEFINED_LOGOS.pdf,
                     'Instagram': PREDEFINED_LOGOS.instagram,
                     'Facebook': PREDEFINED_LOGOS.facebook,
                     'Twitter': PREDEFINED_LOGOS.twitter,
                     'LinkedIn': PREDEFINED_LOGOS.linkedin
                   }).map(([name, src]) => (
                     <button key={name} onClick={() => setLogoBase64(src)} className={cn("w-14 h-14 shrink-0 rounded-xl border flex items-center justify-center bg-white p-3 transition-colors", logoBase64 === src ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-transparent hover:border-gray-200")}>
                        <img src={src} alt={name} className="w-full h-full object-contain" />
                     </button>
                   ))}
                </div>

                {logoBase64 && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Tamanho da Logo</label>
                      <span className="text-[10px] text-emerald-500 font-mono">{(logoSize * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="0.5" 
                      step="0.01" 
                      value={logoSize} 
                      onChange={(e) => setLogoSize(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#111113] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                )}
              </div>

              <hr className="border-white/5" />

              {/* Margin */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer" onClick={() => setIncludeMargin(!includeMargin)}>
                  Margem Externa (Quiet Zone)
                </label>
                <button 
                  onClick={() => setIncludeMargin(!includeMargin)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                    includeMargin ? "bg-emerald-500" : "bg-[#111113]"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 transition duration-200 ease-in-out",
                      includeMargin ? "translate-x-4 bg-white" : "translate-x-0 bg-gray-500"
                    )}
                  />
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
