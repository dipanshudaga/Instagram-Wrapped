// Utility functions for Instagram Wrapped

// Format numbers with K/M suffix
export function formatNumber(value: number): string {
  if (value < 10000) return value.toLocaleString();
  if (value < 1000000) return (value / 1000).toFixed(1).replace('.0', '') + 'K';
  return (value / 1000000).toFixed(1).replace('.0', '') + 'M';
}

// Get responsive font size based on number value
export function getNumberSize(value: number): string {
  if (value < 100) return '180px';
  if (value < 1000) return '140px';
  if (value < 10000) return '100px';
  return '80px';
}

// Generate organic positions for topic pills
export function generatePillPositions(count: number): Array<{
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}> {
  const positions = [];
  const sizes = ['large', 'medium', 'small'];
  const sizeMap = {
    large: { width: 280, height: 80 },
    medium: { width: 220, height: 70 },
    small: { width: 180, height: 60 }
  };

  // Content area: 960px wide × 1300px tall (leaving space for title/footer)
  const contentWidth = 900;
  const contentHeight = 1200;
  const padding = 30;

  for (let i = 0; i < count; i++) {
    // Distribute sizes: 5 large, 6 medium, rest small
    let size: 'large' | 'medium' | 'small';
    if (i < 5) size = 'large';
    else if (i < 11) size = 'medium';
    else size = 'small';

    const dims = sizeMap[size];

    // Generate position with some randomness but in a grid-like flow
    const cols = 2;
    const row = Math.floor(i / cols);
    const col = i % cols;

    const baseX = (contentWidth / cols) * col + padding;
    const baseY = row * 90 + padding;

    // Add randomness
    const randomX = Math.random() * 40 - 20;
    const randomY = Math.random() * 30 - 15;

    positions.push({
      x: baseX + randomX,
      y: baseY + randomY,
      width: dims.width,
      height: dims.height,
      rotation: Math.random() * 6 - 3 // -3 to +3 degrees
    });
  }

  return positions;
}

// Simple sound effect player
// SoundPlayer class removed by request

// Truncate text to fit
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
