/**
 * useDetailMetrics — the single responsive contract for the themed detail pages.
 *
 * Everything here is derived from useWindowDimensions(), so a rotation, a fold
 * opening, a split-screen resize or a font-scale change re-lays-out live. No
 * module-level Dimensions snapshot (those freeze at the first orientation and
 * are the reason the old photo grid mis-sized on tablets).
 *
 * Breakpoints (shortest side, dp):
 *   < 360  compact phone (Galaxy A0x, older budget Androids)
 *   < 600  phone
 *   < 840  large phone / small tablet, foldable open
 *   >=840  tablet
 */
import {useMemo} from 'react';
import {useWindowDimensions} from 'react-native';

const BASE_WIDTH = 375; // the width the mockup's px values were drawn against
const MAX_SCALE = 1.45; // cap so tablets don't get comic-book sized type
const MAX_CONTENT = 760; // centre the sheet on very wide screens

export const useDetailMetrics = () => {
  const {width, height, fontScale} = useWindowDimensions();

  return useMemo(() => {
    const shortest = Math.min(width, height);
    const landscape = width > height;
    const isCompact = shortest < 360;
    const isTablet = shortest >= 600;
    const isLarge = shortest >= 840;

    const scale = Math.min(Math.max(width, 320) / BASE_WIDTH, MAX_SCALE);
    // moderate scale: move `factor` of the way toward the raw device scale
    const ms = (size, factor = 0.5) =>
      Math.round(size + (scale - 1) * size * factor);

    // Content column — full bleed on phones, centred and capped on tablets.
    const contentW = Math.min(width, isTablet ? MAX_CONTENT : width);
    const sideInset = Math.max(0, (width - contentW) / 2);
    const gutter = isCompact ? 14 : isTablet ? 22 : 16;
    const inner = contentW - gutter * 2;

    // Hero: 4:3 on phones, shorter in landscape / on tablets so it isn't a wall.
    const heroH = Math.round(
      landscape && !isTablet
        ? Math.min(height * 0.62, 320)
        : isTablet
        ? Math.min(contentW * 0.62, 460)
        : Math.min(width * 0.78, 400),
    );

    // Grid column counts adapt to the real available width.
    const factCols = inner >= 620 ? 3 : 2;
    const galCols = inner >= 700 ? 5 : inner >= 520 ? 4 : 3;
    const photoCols = inner >= 620 ? 3 : 2;

    // Horizontal card rail. The mockup shows ~2.35 cards on a 340dp phone
    // (132dp card in a 310dp row) — matching that keeps the cards substantial
    // instead of thin slivers, while the next one still peeks in to signal
    // scrollability. Tablets fit more without the card ballooning.
    const railCard = Math.max(
      140,
      Math.min(Math.round(inner / (isTablet ? 3.6 : 2.35)), isTablet ? 220 : 184),
    );
    // 3:2-ish photo, the mockup's 132x82 proportion.
    const railImage = Math.round(railCard * 0.64);

    const gridWidth = (cols, gap) => Math.floor((inner - gap * (cols - 1)) / cols);

    return {
      width, height, fontScale, landscape,
      isCompact, isTablet, isLarge,
      scale, ms,
      contentW, sideInset, gutter, inner,
      heroH, factCols, galCols, photoCols, railCard, railImage,
      gridWidth,
    };
  }, [width, height, fontScale]);
};

export default useDetailMetrics;
