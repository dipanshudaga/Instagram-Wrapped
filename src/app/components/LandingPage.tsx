import { useState } from 'react';
import { Upload, Lock, Settings, Download, Mail, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onStartWrapped: (useDemo: boolean, file?: File) => void;
  isLoading?: boolean;
}

export function LandingPage({ onStartWrapped, isLoading }: LandingPageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      setIsProcessing(true);
      setTimeout(() => onStartWrapped(false, file), 500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        setIsProcessing(true);
        setTimeout(() => onStartWrapped(false, file), 500);
      }
    }
  };

  const handleDemo = () => {
    setIsProcessing(true);
    setTimeout(() => onStartWrapped(true), 500);
  };

  const isLoading_or_Processing = isLoading || isProcessing;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-6 py-16 max-w-4xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 flex flex-col items-center"
        >
          <h1 className="text-6xl md:text-9xl mb-6 px-4 tracking-tighter" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, lineHeight: 0.95 }}>
            Instagram<br />Wrapped
          </h1>
          <p className="text-xl text-white/70" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
            Your year in review
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-10 mb-8"
        >
          <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
            How to get your data
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Settings,
                title: 'Request Export',
                desc: 'Settings → Accounts Center → Export your information'
              },
              {
                icon: Mail,
                title: 'Download ZIP',
                desc: 'Wait for email with download link (few mins to hours)'
              },
              {
                icon: Upload,
                title: 'Upload Here',
                desc: 'Drop the ZIP file in the area below'
              }
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-purple-500/40 transition-all duration-300">
                    <Icon className="w-8 h-8 text-white/90 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg mb-3" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                    {step.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl rounded-3xl p-8 mb-8"
        >
          <div className="flex gap-4 items-start">
            <Lock className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                100% Private
              </h3>
              <p className="text-white/70 text-sm" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
                All processing happens in your browser. Your data never leaves your device.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-dashed transition-all ${isDragging ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' : 'border-white/20 hover:border-white/30'
            } p-12`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <motion.div
                animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center"
              >
                <Upload className="w-8 h-8" />
              </motion.div>
            </div>
            <h3 className="text-2xl mb-3" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
              {isLoading_or_Processing ? 'Processing your data...' : 'Drop your data here'}
            </h3>
            <p className="text-white/60 mb-6" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
              {isLoading_or_Processing ? 'This may take a minute...' : 'or click to browse'}
            </p>
            {!isLoading_or_Processing && (
              <label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full cursor-pointer hover:bg-white/90 hover:scale-105 transition-all shadow-lg hover:shadow-xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                  Choose File
                </span>
              </label>
            )}

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-white/50 text-sm mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Don't have your data yet?
              </p>
              <button
                onClick={handleDemo}
                disabled={isLoading_or_Processing}
                className="text-white hover:text-white/80 transition-colors disabled:opacity-50"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}
              >
                Try Demo Version →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
