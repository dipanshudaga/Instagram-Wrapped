import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { StoryCards } from './components/StoryCards';
import { parseInstagramData, InstagramData } from './utils/instagram-parser-html';

export default function App() {
  const [showWrapped, setShowWrapped] = useState(false);
  const [wrappedData, setWrappedData] = useState<InstagramData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartWrapped = async (useDemo: boolean, file?: File) => {
    setIsLoading(true);
    setError(null);

    try {
      if (useDemo) {
        // Use demo data (null means use mock data in StoryCards)
        setWrappedData(null);
        setShowWrapped(true);
      } else if (file) {
        // Parse real Instagram HTML data from ZIP
        const data = await parseInstagramData(file);
        console.log('✅ Parsed data:', data);
        setWrappedData(data);
        setShowWrapped(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse Instagram data');
      console.error('❌ Parse error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowWrapped(false);
    setWrappedData(null);
    setError(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
        <div className="max-w-md bg-red-500/10 border border-red-500/30 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={handleClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      {!showWrapped ? (
        <LandingPage onStartWrapped={handleStartWrapped} isLoading={isLoading} />
      ) : (
        <StoryCards onClose={handleClose} data={wrappedData} />
      )}
    </div>
  );
}
