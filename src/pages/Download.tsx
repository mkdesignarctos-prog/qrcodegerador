import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, File as FileIcon, ArchiveX, CopyCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function DownloadPage() {
  const { id } = useParams();
  const [fileInfo, setFileInfo] = useState<{ filename: string, size: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchFileInfo = async () => {
      try {
        const res = await fetch(`/api/file-info/${id}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        setFileInfo(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchFileInfo();
    }
  }, [id]);

  const handleDownload = () => {
    if (!id || !fileInfo) return;
    setDownloading(true);
    
    const anchor = document.createElement('a');
    anchor.href = `/api/file-download/${id}`;
    anchor.download = fileInfo.filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    
    setTimeout(() => {
      setDownloading(false);
    }, 1500);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[150px] rounded-full mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/30 blur-[150px] rounded-full mix-blend-screen opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#111113]/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 overflow-hidden z-10"
      >
        <div className="p-8 sm:p-10 flex flex-col items-center text-center">
          {loading ? (
             <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-[#0A0A0A] border-t-emerald-500 rounded-full animate-spin mb-6"></div>
                <h2 className="text-lg font-semibold text-white">Buscando arquivo...</h2>
             </div>
          ) : error ? (
            <div className="flex flex-col items-center">
               <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                 <ArchiveX size={32} />
               </div>
               <h2 className="text-xl font-bold text-white mb-2">Arquivo indisponível</h2>
               <p className="text-gray-400 text-sm">Este arquivo não existe ou já expirou.</p>
            </div>
          ) : fileInfo ? (
            <div className="flex flex-col items-center w-full">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)] rotate-3 hover:rotate-0 transition-all duration-300">
                <FileIcon size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 truncate max-w-full px-4" title={fileInfo.filename}>
                {fileInfo.filename}
              </h2>
              <p className="text-emerald-400/80 text-sm font-medium mb-8 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {formatSize(fileInfo.size)}
              </p>
              
              <button 
                onClick={handleDownload}
                disabled={downloading}
                className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg text-base transform hover:-translate-y-0.5 disabled:transform-none ${
                  downloading 
                  ? 'bg-emerald-600 text-white shadow-none opacity-80' 
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black hover:from-emerald-400 hover:to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                }`}
              >
                {downloading ? (
                  <>
                    <CopyCheck size={20} />
                    Download Iniciado!
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Baixar Arquivo
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
        
        <div className="bg-[#0A0A0A]/80 backdrop-blur-md py-5 px-8 border-t border-white/5 text-center flex flex-col items-center justify-center">
          <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1">Compartilhado via</p>
          <p className="font-extrabold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            MK Design Studio
          </p>
        </div>
      </motion.div>
    </div>
  );
}
