import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';

export type AspectRatioType = '16:9' | '16:10' | '4:3';

interface AspectScaledCanvasProps {
  aspectRatio?: AspectRatioType;
  children: React.ReactNode;
  containerClassName?: string;
  wrapperClassName?: string;
  style?: React.CSSProperties;
  virtualWidthOverride?: number;
  virtualHeightOverride?: number;
}

/**
 * AspectScaledCanvas
 * Implements Container-Driven Dynamic DOM Scaling via hardware-accelerated CSS transform: scale().
 * Locks the aspect ratio of the inner canvas strictly to 16:9, 16:10, or 4:3.
 *
 * Baselines:
 * - 16:9  -> 1920 x 1080
 * - 16:10 -> 1920 x 1200
 * - 4:3   -> 1440 x 1080
 */
export const AspectScaledCanvas: React.FC<AspectScaledCanvasProps> = ({
  aspectRatio = '16:9',
  children,
  containerClassName = '',
  wrapperClassName = '',
  style,
  virtualWidthOverride,
  virtualHeightOverride,
}) => {
  const frameRef = useRef<HTMLDivElement>(null);

  // Virtual Coordinate Baseline Resolution
  const virtualWidth =
    virtualWidthOverride ||
    (aspectRatio === '4:3' ? 1440 : 1920);

  const virtualHeight =
    virtualHeightOverride ||
    (aspectRatio === '4:3' ? 1080 : aspectRatio === '16:10' ? 1200 : 1080);

  const targetRatio = virtualWidth / virtualHeight;

  const [dimensions, setDimensions] = useState<{
    fittedWidth: number;
    fittedHeight: number;
    scale: number;
    ready: boolean;
  }>({
    fittedWidth: 960,
    fittedHeight: 540,
    scale: 0.5,
    ready: false,
  });

  const updateScale = () => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const availableWidth = rect.width;
    const availableHeight = rect.height;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    const frameRatio = availableWidth / availableHeight;
    let fittedWidth: number;
    let fittedHeight: number;

    if (frameRatio > targetRatio) {
      // Frame is wider than target aspect ratio:
      // Constrained by height -> produces symmetrical pillarbox space on left and right
      fittedHeight = availableHeight;
      fittedWidth = Math.round(availableHeight * targetRatio);
    } else {
      // Frame is taller than target aspect ratio:
      // Constrained by width -> produces letterbox space on top and bottom
      fittedWidth = availableWidth;
      fittedHeight = Math.round(availableWidth / targetRatio);
    }

    const scale = fittedWidth / virtualWidth;

    setDimensions({
      fittedWidth,
      fittedHeight,
      scale,
      ready: true,
    });
  };

  useLayoutEffect(() => {
    updateScale();
  }, [aspectRatio, virtualWidth, virtualHeight]);

  useEffect(() => {
    updateScale();

    let resizeObserver: ResizeObserver | null = null;
    if (frameRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScale();
      });
      resizeObserver.observe(frameRef.current);
    }

    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [aspectRatio, virtualWidth, virtualHeight]);

  return (
    <div
      ref={frameRef}
      className={`w-full h-full relative overflow-hidden flex items-center justify-center select-none ${containerClassName}`}
    >
      {/* Aspect-Locked Wrapper Canvas */}
      <div
        className={`relative shrink-0 overflow-hidden shadow-2xl transition-all duration-150 ${wrapperClassName}`}
        style={{
          '--slide-aspect-ratio': `${targetRatio}`,
          width: `${dimensions.fittedWidth}px`,
          height: `${dimensions.fittedHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          opacity: dimensions.ready ? 1 : 0,
          ...style,
        } as React.CSSProperties}
      >
        {/* Virtual Coordinate Canvas scaled via hardware-accelerated CSS transform */}
        <div
          style={{
            width: `${virtualWidth}px`,
            height: `${virtualHeight}px`,
            transform: `scale(${dimensions.scale})`,
            transformOrigin: 'top left',
            willChange: 'transform',
          }}
          className="absolute top-0 left-0 overflow-hidden flex flex-col pointer-events-auto"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
