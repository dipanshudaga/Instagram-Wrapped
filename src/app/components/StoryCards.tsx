import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Share2, Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { InstagramData } from '../utils/instagram-parser-html';
import { NumberCounter } from './NumberCounter';
import { formatNumber, generatePillPositions, truncateText } from '../utils/wrapped-utils';

interface StoryCardsProps {
  data?: InstagramData | null;
  onClose: () => void;
}

const mockData: InstagramData = {
  accountAge: { years: 9, months: 7 },
  topChatPartners: [
    { name: 'sarah_designs', count: 2847 },
    { name: 'best_friend', count: 2103 },
    { name: 'coffee_addict', count: 1654 }
  ],
  likes: {
    total: 18453,
    topCreator: '@art_daily',
    topCreatorCount: 342
  },
  comments: {
    total: 1247,
    topCreator: '@meme_lord',
    topCreatorCount: 89
  },
  avgResponseTime: { hours: 0, minutes: 2 },
  topSharedTo: [
    { name: 'sarah_designs', count: 234 },
    { name: 'coffee_addict', count: 187 },
    { name: 'work_chat', count: 156 }
  ],
  topReceivedFrom: [
    { name: 'best_friend', count: 421 },
    { name: 'sarah_designs', count: 298 },
    { name: 'meme_supplier', count: 176 }
  ],
  contentCreated: {
    posts: 42,
    reels: 18,
    stories: 387
  },
  topics: [
    { name: 'Basketball', emoji: '🏀' },
    { name: 'Food', emoji: '🍕' },
    { name: 'Travel', emoji: '✈️' },
    { name: 'Technology', emoji: '💻' },
    { name: 'Art', emoji: '🎨' },
    { name: 'Music', emoji: '🎵' },
    { name: 'Coffee', emoji: '☕' },
    { name: 'Movies', emoji: '🎬' },
    { name: 'Fitness', emoji: '💪' },
    { name: 'Photography', emoji: '📷' }
  ]
};

export function StoryCards({ onClose, data = mockData }: StoryCardsProps) {
  const displayData = data || mockData;
  const [currentCard, setCurrentCard] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  // SoundPlayer removed
  const cardRef = useRef<HTMLDivElement>(null);
  const totalCards = 10;
  const autoScrollDuration = 10000; // 10 seconds per card

  const handleNext = useCallback(() => {
    if (currentCard < totalCards - 1) {
      setDirection(1);
      setCurrentCard(prev => prev + 1);
    }
  }, [currentCard]);

  const handlePrev = useCallback(() => {
    if (currentCard > 0) {
      setDirection(-1);
      setCurrentCard(prev => prev - 1);
    }
  }, [currentCard]);

  // Auto-scroll effect
  useEffect(() => {
    if (isPaused || currentCard >= totalCards - 1) return;

    const timer = setTimeout(() => {
      handleNext();
    }, autoScrollDuration);

    return () => clearTimeout(timer);
  }, [currentCard, isPaused, handleNext, autoScrollDuration, totalCards]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const handleShare = async () => {
    if (isSharing || !cardRef.current) return;
    setIsSharing(true);
    setIsPaused(true); // Pause while sharing

    try {
      // 1. Generate image
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Higher quality
        backgroundColor: '#000', // Ensure background is filled
        filter: (node) => {
          // Filter out UI elements we don't want in the share image
          if (node.id === 'ui-close-btn' || node.id === 'ui-share-btn' || node.id === 'ui-nav-left' || node.id === 'ui-nav-right' || node.id === 'ui-progress-bar') {
            return false;
          }
          return true;
        },
        style: {
          borderRadius: '0px', // Reset border radius
        }
      });
      const blob = await (await fetch(dataUrl)).blob();

      if (!blob) throw new Error('Failed to generate image');

      const file = new File([blob], 'instagram-wrapped-2024.png', { type: 'image/png' });

      // 2. Share using Web Share API
      // Note: navigator.canShare with files is strictly required to verify file sharing support
      const shareData = {
        files: [file],
        title: 'My Instagram Wrapped',
        text: 'Check out my Instagram Wrapped! 📸'
      };

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else {
        // Fallback: Download the image
        const link = document.createElement('a');
        link.download = 'instagram-wrapped-2024.png';
        link.href = URL.createObjectURL(blob);
        link.click();

        // Toast notification removed
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: Download if share fails (no clipboard copy)
      try {
        if (cardRef.current) {
          const blob = await htmlToImage.toBlob(cardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#000',
            style: { borderRadius: '0px' }
          });
          if (blob) {
            const link = document.createElement('a');
            link.download = 'instagram-wrapped-2024.png';
            link.href = URL.createObjectURL(blob);
            link.click();
          }
        }
      } catch (e) { console.error('Download fallback failed', e) }
    } finally {
      setIsSharing(false);
      setIsPaused(false); // Resume after sharing
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  // Generate pill positions once (scaled for 420px width)
  const pillPositions = useRef(generatePillPositions(15).map(pos => ({
    ...pos,
    x: pos.x * 0.4,
    y: pos.y * 0.45,
    width: pos.width * 0.45,
    height: pos.height * 0.45
  }))).current;

  const cards = [
    // CARD 1: Intro
    <motion.div
      key="intro"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col items-center justify-center p-8 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, #8B5CF6 0%, #000000 120%)'
      }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <motion.div variants={itemVariants} className="text-center absolute top-24 bottom-28 left-8 right-8 flex flex-col items-center justify-center">
        <motion.p
          className="text-white/80 mb-3"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '24px' }}
        >
          Your
        </motion.p>
        <motion.h1
          className="text-white leading-none mb-2"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, letterSpacing: '-0.02em', fontSize: '52px' }}
        >
          INSTAGRAM
        </motion.h1>
        <motion.h1
          className="text-white leading-none mb-8"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, letterSpacing: '-0.02em', fontSize: '52px' }}
        >
          WRAPPED
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-white/70"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '18px' }}
        >
          Let's dive in
        </motion.p>
      </motion.div>
    </motion.div>,

    // CARD 2: Account Age
    <motion.div
      key="age"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col justify-center p-8 md:p-12 overflow-hidden"
      style={{ background: '#0F0F0F' }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-24 bottom-28 left-8 right-8 flex flex-col justify-center">
        {displayData.accountAge && (
          <>
            <motion.p
              variants={itemVariants}
              className="text-white/60 uppercase tracking-widest mb-3"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '12px' }}
            >
              Chronically Online Since
            </motion.p>
            <motion.div variants={itemVariants} className="mb-6">
              <div className="text-white leading-none mb-2">
                <NumberCounter
                  value={displayData.accountAge.years}
                  fontSize="90px"
                />
              </div>
              <p className="text-white" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '24px' }}>
                YEARS
              </p>
            </motion.div>
            {displayData.accountAge.months > 0 && (
              <motion.div variants={itemVariants} className="mb-6">
                <div className="text-white leading-none mb-1">
                  <NumberCounter value={displayData.accountAge.months} fontSize="50px" />
                </div>
                <p className="text-white/80" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px' }}>
                  MONTHS
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>,

    // CARD 3: Chat Partners
    <motion.div
      key="chats"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col justify-center p-8 md:p-12 overflow-hidden"
      style={{ background: 'radial-gradient(circle at top right, #8B5CF6 0%, #1a1a1a 100%)' }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      {/* Background Icon - Animated */}
      <motion.div
        className="absolute -right-12 top-20 text-[200px] opacity-5 pointer-events-none rotate-12"
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        💬
      </motion.div>
      <div className="absolute top-24 bottom-28 left-8 right-8 flex flex-col justify-center">
        <motion.div variants={itemVariants} className="mb-10">
          <h2 className="text-white text-3xl md:text-4xl mb-3" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, lineHeight: 1.2 }}>
            Your top 3
          </h2>
          <p className="text-white/80" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '20px', lineHeight: 1.4 }}>
            chat partners
          </p>
        </motion.div>

        {displayData.topChatPartners && displayData.topChatPartners.slice(0, 3).map((partner, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="rounded-2xl p-6 mb-5 flex items-center justify-between relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="text-white/60 text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                #{i + 1}
              </div>
              <p className="text-white text-xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                {truncateText(partner.name, 16)}
              </p>
            </div>
            <p className="text-white/90 text-lg" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
              {formatNumber(partner.count)}
            </p>
          </motion.div>
        ))}

        <motion.p
          variants={itemVariants}
          className="text-white/70 text-sm mt-6"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}
        >
        </motion.p>
      </div>
    </motion.div>,

    // CARD 4: Likes Given
    <motion.div
      key="likes"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col justify-center p-8 md:p-12 overflow-hidden"
      style={{ background: 'radial-gradient(circle at bottom left, #EC4899 0%, #1a1a1a 100%)' }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      {/* Background Icon - Animated */}
      <motion.div
        className="absolute -left-12 bottom-20 text-[200px] opacity-5 pointer-events-none -rotate-12"
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        ❤️
      </motion.div>
      <div className="absolute top-24 bottom-28 left-8 right-8 flex flex-col justify-center">
        <motion.div variants={itemVariants} className="mb-10">
          <div className="text-white leading-none mb-4">
            <NumberCounter
              value={displayData.likes?.total || 0}
              fontSize="64px"
            />
          </div>
          <p className="text-white text-2xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, lineHeight: 1.3 }}>
            likes given ❤️
          </p>
        </motion.div>

        {displayData.likes?.topCreator && (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl p-7 relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <p className="text-white/70 text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
              Posts you liked the most
            </p>
            <p className="text-white text-xl mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
              {displayData.likes.topCreator}
            </p>
            <p className="text-white/80" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
              {displayData.likes.topCreatorCount} posts
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>,

    // CARD 5: Comments
    <motion.div
      key="comments"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col justify-center p-8 md:p-12 overflow-hidden"
      style={{ background: 'radial-gradient(circle at top left, #3B82F6 0%, #1a1a1a 100%)' }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      {/* Background Icon - Animated */}
      <motion.div
        className="absolute right-0 bottom-0 text-[200px] opacity-5 pointer-events-none rotate-6"
        animate={{
          y: [0, -18, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        ✏️
      </motion.div>
      <div className="absolute top-24 bottom-28 left-8 right-8 flex flex-col justify-center">
        <motion.div variants={itemVariants} className="mb-10">
          <div className="text-white leading-none mb-4">
            <NumberCounter value={displayData.comments?.total || 0} fontSize="64px" />
          </div>
          <p className="text-white text-2xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, lineHeight: 1.3 }}>
            comments dropped 💬
          </p>
        </motion.div>

        {displayData.comments?.topCreator && displayData.comments.topCreatorCount > 0 && (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl p-7 relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <p className="text-white/70 text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
              Posts you commented most on
            </p>
            <p className="text-white text-xl mb-2 break-words" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
              {displayData.comments.topCreator}
            </p>
            <p className="text-white/80" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
              {displayData.comments.topCreatorCount} comments
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>,

    // CARD 6: Content Created
    <motion.div
      key="content"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col justify-center p-8 md:p-12 overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, #06B6D4 0%, #1a1a1a 100%)' }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <div className="absolute top-24 bottom-28 left-8 right-8 flex flex-col justify-center">
        <motion.h2
          variants={itemVariants}
          className="text-white text-3xl mb-10"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, lineHeight: 1.2 }}
        >
          You created
        </motion.h2>

        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-6 mb-5 flex items-center justify-between relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <p className="text-white text-xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
              Posts
            </p>
          </div>
          <div className="text-white text-2xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900 }}>
            <NumberCounter value={displayData.contentCreated?.posts || 0} fontSize="32px" />
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-6 mb-5 flex items-center justify-between relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <p className="text-white text-xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
              Reels
            </p>
          </div>
          <div className="text-white text-2xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900 }}>
            <NumberCounter value={displayData.contentCreated?.reels || 0} fontSize="32px" />
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-6 mb-5 flex items-center justify-between relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <p className="text-white text-xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
              Stories
            </p>
          </div>
          <div className="text-white text-2xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900 }}>
            <NumberCounter value={displayData.contentCreated?.stories || 0} fontSize="32px" />
          </div>
        </motion.div>
      </div>
    </motion.div>,

    // CARD 7: Top Shared To
    <motion.div
      key="shared"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col justify-center p-8 md:p-12 overflow-hidden"
      style={{ background: 'radial-gradient(circle at top right, #10B981 0%, #1a1a1a 100%)' }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      {/* Background Icon - Animated */}
      <motion.div
        className="absolute -right-8 bottom-32 text-[180px] opacity-5 pointer-events-none -rotate-12"
        animate={{
          y: [0, -15, 0],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        📤
      </motion.div>
      <div className="absolute top-24 bottom-28 left-8 right-8 flex flex-col justify-center">
        <motion.div variants={itemVariants} className="mb-10">
          <h2 className="text-white text-3xl md:text-4xl mb-3" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, lineHeight: 1.2 }}>
            You share reels
          </h2>
          <p className="text-white/80" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '20px', lineHeight: 1.4 }}>
            the most to
          </p>
        </motion.div>

        {displayData.topSharedTo && displayData.topSharedTo.slice(0, 3).map((item, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="rounded-2xl p-6 mb-5 flex items-center justify-between relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="text-white/60 text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                #{i + 1}
              </div>
              <p className="text-white text-xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                {truncateText(item.name, 14)}
              </p>
            </div>
            <p className="text-white/90 text-lg" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
              {item.count}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>,

    // CARD 8: Top Received From
    <motion.div
      key="received"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col justify-center p-8 md:p-12 overflow-hidden"
      style={{ background: 'radial-gradient(circle at bottom left, #F97316 0%, #1a1a1a 100%)' }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      {/* Background Icon - Animated */}
      <motion.div
        className="absolute -left-8 top-32 text-[180px] opacity-5 pointer-events-none rotate-12"
        animate={{
          y: [0, 18, 0],
        }}
        transition={{
          duration: 7.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        📥
      </motion.div>
      <div className="absolute top-24 bottom-28 left-8 right-8 flex flex-col justify-center">
        <motion.div variants={itemVariants} className="mb-10">
          <h2 className="text-white text-3xl md:text-4xl mb-3" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, lineHeight: 1.2 }}>
            You get reels
          </h2>
          <p className="text-white/80" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '20px', lineHeight: 1.4 }}>
            the most from
          </p>
        </motion.div>

        {displayData.topReceivedFrom && displayData.topReceivedFrom.slice(0, 3).map((item, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="rounded-2xl p-6 mb-5 flex items-center justify-between relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="text-white/60 text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                #{i + 1}
              </div>
              <p className="text-white text-xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                {truncateText(item.name, 14)}
              </p>
            </div>
            <p className="text-white/90 text-lg" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
              {item.count}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>,

    // CARD 9: Topics
    <motion.div
      key="topics"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col justify-center px-8 md:px-12 pt-24 pb-32 overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, #1E293B 0%, #000000 100%)' }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <div className="absolute top-24 bottom-28 left-8 right-8 flex flex-col justify-center">
        <motion.div variants={itemVariants} className="mb-4">
          <h2 className="text-white text-3xl md:text-4xl mb-1" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900 }}>
            Your Algorithm
          </h2>
          <p className="text-white/80" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '20px' }}>
            in {displayData.topics?.length || 0} interests
          </p>
        </motion.div>

        {/* Topic pills - showing first 12 in wrap layout */}
        <div className="flex flex-wrap gap-1.5">
          {displayData.topics && displayData.topics.slice(0, 12).map((topic, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="bg-white/10 backdrop-blur rounded-full px-2.5 py-1.5 flex items-center gap-1.5"
            >
              <span className="text-base">{topic.emoji}</span>
              <p className="text-white text-xs" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                {topic.name}
              </p>
            </motion.div>
          ))}
        </div>

        {displayData.topics && displayData.topics.length > 12 && (
          <motion.p
            variants={itemVariants}
            className="text-white/60 text-xs mt-3"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}
          >
            +{displayData.topics.length - 12} more interests
          </motion.p>
        )}
      </div>
    </motion.div>,

    // CARD 10: Outro
    <motion.div
      key="outro"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full flex flex-col items-center justify-center px-8 py-12 overflow-hidden bg-black"
      style={{
        background: 'radial-gradient(circle at center, #7C3AED 0%, #0F0F0F 120%)',
        zIndex: 1 // Ensure z-index is positive
      }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <motion.div variants={itemVariants} className="text-center">
        <p className="text-white/80 mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '24px' }}>
          That's your
        </p>
        <h1 className="text-white leading-tight mb-1" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, letterSpacing: '-0.04em', fontSize: '52px' }}>
          Instagram
        </h1>
        <h1 className="text-white leading-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, letterSpacing: '-0.04em', fontSize: '52px' }}>
          Wrapped
        </h1>
        <p className="text-white/70" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '20px' }}>
          Thanks for being here
        </p>
      </motion.div>

      {/* Floating sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${15 + (i % 3) * 35}%`,
            top: `${15 + Math.floor(i / 3) * 60}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ✨
        </motion.div>
      ))}
    </motion.div>
  ];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center md:p-4 select-none"
    >
      <div className="relative w-full max-w-[420px] h-full bg-black overflow-hidden md:rounded-3xl" ref={cardRef}>
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-3" id="ui-progress-bar">
          {Array.from({ length: totalCards }).map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                key={`${idx}-${currentCard}`}
                className="h-full bg-white"
                initial={{ width: idx < currentCard ? '100%' : '0%' }}
                animate={{
                  width: idx < currentCard ? '100%' : idx === currentCard ? '100%' : '0%'
                }}
                transition={{
                  duration: idx === currentCard ? autoScrollDuration / 1000 : 0.1,
                  ease: idx === currentCard ? 'linear' : 'easeOut'
                }}
              />
            </div>
          ))}
        </div>

        {/* Created By - Top Left */}
        <div className="absolute top-10 left-3 z-50 flex flex-col justify-center h-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <span className="text-white/50 text-[10px] font-medium leading-tight">created by</span>
          <span className="text-white/50 text-xs font-bold leading-tight">dipanshu daga</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          id="ui-close-btn"
          className="absolute top-10 right-3 z-50 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Story Card */}
        <div className="relative w-full h-full">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentCard}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "tween", duration: 0.3, ease: "easeInOut" },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0"
            >
              {cards[currentCard]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Areas - Exclude bottom for share button */}
        <div className="absolute inset-0 bottom-28 z-40 flex">
          <button
            onClick={handlePrev}
            className="flex-1 cursor-pointer"
            disabled={currentCard === 0}
            aria-label="Previous"
          />
          <button
            onClick={handleNext}
            className="flex-1 cursor-pointer"
            disabled={currentCard === totalCards - 1}
            aria-label="Next"
          />
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-6 pointer-events-none max-w-[700px] mx-auto">
        {currentCard > 0 && (
          <button
            onClick={handlePrev}
            id="ui-nav-left"
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div className="flex-1" />
        {currentCard < totalCards - 1 && (
          <button
            onClick={handleNext}
            id="ui-nav-right"
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Share Button - Hidden on intro (0) and outro (9) */}
      {currentCard !== 0 && currentCard !== 9 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50" id="ui-share-btn">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            disabled={isSharing}
            className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            style={{ touchAction: 'manipulation' }}
          >
            {isSharing ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
              {isSharing ? 'Sharing...' : 'Share'}
            </span>
          </motion.button>
        </div>
      )}

    </div>
  );
}
