import React, { useEffect, useState, useRef } from 'react';
import CloudLayout from 'd3-cloud';

export interface WordItem {
  text: string;
  count: number;
}

export interface PlacedWordItem {
  text: string;
  count: number;
  size: number;
  color: string;
  x: number;
  y: number;
  rotate: number;
}

interface D3WordCloudProps {
  words: WordItem[];
  width?: number;
  height?: number;
  className?: string;
  maxWords?: number;
  allowRotation?: boolean;
}

const DEFAULT_PALETTE = [
  '#818cf8', // indigo-400
  '#2dd4bf', // teal-400
  '#fbbf24', // amber-400
  '#f472b6', // pink-400
  '#38bdf8', // sky-400
  '#34d399', // emerald-400
  '#c084fc', // purple-400
  '#fb7185', // rose-400
  '#a78bfa', // violet-400
  '#38bdf8', // cyan-400
];

export const D3WordCloud: React.FC<D3WordCloudProps> = ({
  words,
  width: customWidth,
  height: customHeight,
  className = '',
  maxWords = 75,
  allowRotation = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: customWidth || 800,
    height: customHeight || 450,
  });
  const [placedWords, setPlacedWords] = useState<PlacedWordItem[]>([]);
  const [viewBox, setViewBox] = useState<string>('-400 -225 800 450');

  // ResizeObserver to track container bounds
  useEffect(() => {
    if (customWidth && customHeight) {
      setDimensions({ width: customWidth, height: customHeight });
      return;
    }

    const elem = containerRef.current;
    if (!elem) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      }
    });

    observer.observe(elem);
    return () => observer.disconnect();
  }, [customWidth, customHeight]);

  // Compute Word Cloud placement
  useEffect(() => {
    if (!words || words.length === 0) {
      setPlacedWords([]);
      return;
    }

    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) return;

    // Sort words by count descending
    const sortedWords = [...words]
      .filter((w) => w.text && w.text.trim().length > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, maxWords);

    if (sortedWords.length === 0) {
      setPlacedWords([]);
      return;
    }

    const maxCount = Math.max(...sortedWords.map((w) => w.count), 1);
    const minCount = Math.min(...sortedWords.map((w) => w.count), 1);

    // Font size scaling: min ~18px, max ~76px proportional to viewport
    const scaleFactor = Math.min(width, height) / 550;
    const minFontSize = Math.max(16, Math.round(18 * scaleFactor));
    const maxFontSize = Math.max(36, Math.round(72 * scaleFactor));

    const getFontSize = (count: number) => {
      if (maxCount === minCount) return (minFontSize + maxFontSize) / 2;
      const normalized = (count - minCount) / (maxCount - minCount);
      // Square-root curve gives prominent emphasis to top words while keeping others legible
      return Math.round(minFontSize + Math.pow(normalized, 0.65) * (maxFontSize - minFontSize));
    };

    try {
      const layout = new CloudLayout()
        .size([width, height])
        .overflow(false)
        .strategy('archimedean');

      // Possible rotation angles: 80% horizontal, 20% vertical (classic AhaSlides look)
      const possibleRotations = allowRotation ? [0, 0, 0, 0, 90] : [0];

      // Prepare sprites sorted largest first
      const sprites = sortedWords
        .map((w, idx) => {
          const size = getFontSize(w.count);
          const rotate = possibleRotations[idx % possibleRotations.length];
          const color = DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];

          const sprite = layout.getSprite(w.text, {
            size,
            datum: { ...w, size, color, rotate },
            font: 'system-ui, -apple-system, sans-serif',
            fontWeight: size > 40 ? 800 : 700,
            padding: 3,
            rotate,
          });

          return sprite;
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      const placedList: PlacedWordItem[] = [];

      for (const sprite of sprites) {
        const placed = layout.place(sprite);
        if (placed) {
          const datum = placed.datum as any;
          placedList.push({
            text: datum.text,
            count: datum.count,
            size: datum.size,
            color: datum.color,
            x: placed.x,
            y: placed.y,
            rotate: datum.rotate || 0,
          });
        }
      }

      // Compute bounding box
      const bounds = layout.bounds();
      if (bounds) {
        const [min, max] = bounds;
        const margin = 24;
        const bWidth = Math.max(max.x - min.x + margin * 2, width);
        const bHeight = Math.max(max.y - min.y + margin * 2, height);
        setViewBox(`${-bWidth / 2} ${-bHeight / 2} ${bWidth} ${bHeight}`);
      } else {
        setViewBox(`${-width / 2} ${-height / 2} ${width} ${height}`);
      }

      setPlacedWords(placedList);
    } catch (err) {
      console.warn('d3-cloud placement error:', err);
      // Graceful fallback: render centered items
      setPlacedWords(
        sortedWords.map((w, idx) => ({
          text: w.text,
          count: w.count,
          size: getFontSize(w.count),
          color: DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
          x: 0,
          y: (idx - sortedWords.length / 2) * 28,
          rotate: 0,
        }))
      );
    }
  }, [words, dimensions.width, dimensions.height, maxWords, allowRotation]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      {words.length === 0 ? (
        <div className="text-slate-500 text-lg flex items-center justify-center py-12">
          Waiting for audience entries...
        </div>
      ) : (
        <svg
          viewBox={viewBox}
          className="w-full h-full max-h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          <g>
            {placedWords.map((item, idx) => (
              <text
                key={`${item.text}_${idx}`}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`translate(${item.x}, ${item.y}) rotate(${item.rotate})`}
                style={{
                  fontSize: `${item.size}px`,
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: item.size > 38 ? 800 : 700,
                  fill: item.color,
                  letterSpacing: '-0.025em',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.25))',
                }}
                className="cursor-default select-none hover:opacity-90 transition-opacity"
              >
                {item.text}
              </text>
            ))}
          </g>
        </svg>
      )}
    </div>
  );
};
