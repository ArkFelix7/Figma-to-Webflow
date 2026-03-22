export interface LumosSpacingMap {
  [key: number]: string;
}

export const LUMOS_SPACING_SCALE: LumosSpacingMap = {
  4: 'xs',
  8: 'small',
  12: 'sm',
  16: 'medium',
  20: 'md',
  24: 'large',
  28: 'lg',
  32: 'xl',
  36: 'xl',
  40: '2xl',
  48: '3xl',
  56: '4xl',
  64: '5xl',
  72: '6xl',
  80: '7xl',
  96: '8xl',
};

export const LUMOS_CONTAINER_MAX_WIDTHS: LumosSpacingMap = {
  320: 'xs',
  480: 'sm',
  640: 'md',
  768: 'lg',
  1024: 'xl',
  1200: '2xl',
  1440: '3xl',
  1600: '4xl',
};

export function getLumosPaddingClass(padding: { top?: number; bottom?: number; left?: number; right?: number }): string[] {
  const classes: string[] = [];

  // Inline padding (left and right)
  const inlineValues = [padding.left, padding.right].filter(v => v != null);
  const uniqueInline = [...new Set(inlineValues)];
  if (uniqueInline.length === 1 && uniqueInline[0] && LUMOS_SPACING_SCALE[uniqueInline[0]]) {
    classes.push(`u-padding-inline-${LUMOS_SPACING_SCALE[uniqueInline[0]]}`);
  } else {
    if (padding.left && LUMOS_SPACING_SCALE[padding.left]) {
      classes.push(`u-padding-inline-start-${LUMOS_SPACING_SCALE[padding.left]}`);
    }
    if (padding.right && LUMOS_SPACING_SCALE[padding.right]) {
      classes.push(`u-padding-inline-end-${LUMOS_SPACING_SCALE[padding.right]}`);
    }
  }

  // Block padding (top and bottom)
  const blockValues = [padding.top, padding.bottom].filter(v => v != null);
  const uniqueBlock = [...new Set(blockValues)];
  if (uniqueBlock.length === 1 && uniqueBlock[0] && LUMOS_SPACING_SCALE[uniqueBlock[0]]) {
    classes.push(`u-padding-block-${LUMOS_SPACING_SCALE[uniqueBlock[0]]}`);
  } else {
    if (padding.top && LUMOS_SPACING_SCALE[padding.top]) {
      classes.push(`u-padding-block-start-${LUMOS_SPACING_SCALE[padding.top]}`);
    }
    if (padding.bottom && LUMOS_SPACING_SCALE[padding.bottom]) {
      classes.push(`u-padding-block-end-${LUMOS_SPACING_SCALE[padding.bottom]}`);
    }
  }

  return classes;
}

export interface LumosClassMapping {
  className: string;
  matched: boolean;
  requested: number;
  usedValue?: number;
  warning?: string;
}

function findClosestNumericMatch(value: number, map: Record<number, string>): { key: number; diff: number } {
  const entries = Object.keys(map).map(Number);
  let closestKey = entries[0];
  let minDiff = Math.abs(value - closestKey);

  for (const key of entries) {
    const diff = Math.abs(value - key);
    if (diff < minDiff) {
      minDiff = diff;
      closestKey = key;
    }
  }

  return { key: closestKey, diff: minDiff };
}

const LUMOS_GAP_STEP_VALUES: { [step: number]: number } = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
};

function findClosestGapStep(gap: number): { step: number; usedValue: number; diff: number } {
  const entries = Object.entries(LUMOS_GAP_STEP_VALUES).map(([step, value]) => ({ step: Number(step), value }));
  let chosen = entries[0];
  let minDiff = Math.abs(gap - chosen.value);

  for (const entry of entries) {
    const diff = Math.abs(gap - entry.value);
    if (diff < minDiff) {
      minDiff = diff;
      chosen = entry;
    }
  }

  return { step: chosen.step, usedValue: chosen.value, diff: minDiff };
}

export function getLumosGapClass(gap: number): LumosClassMapping {
  const { step, usedValue, diff } = findClosestGapStep(gap);
  const className = `u-gap-${step}`;
  return {
    className,
    matched: diff === 0,
    requested: gap,
    usedValue,
    warning: diff === 0 ? undefined : `gap ${gap} not in step map, nearest ${usedValue} at u-gap-${step}`,
  };
}

export function getLumosContainerClass(maxWidth: number): LumosClassMapping {
  if (LUMOS_CONTAINER_MAX_WIDTHS[maxWidth]) {
    return { className: `u-container-${LUMOS_CONTAINER_MAX_WIDTHS[maxWidth]}`, matched: true, requested: maxWidth, usedValue: maxWidth };
  }

  const { key } = findClosestNumericMatch(maxWidth, LUMOS_CONTAINER_MAX_WIDTHS);
  return {
    className: `u-container-${LUMOS_CONTAINER_MAX_WIDTHS[key]}`,
    matched: false,
    requested: maxWidth,
    usedValue: key,
    warning: `container max width ${maxWidth} not mapped; nearest ${key}`,
  }; 
}

export function getLumosTypographyClass(node: any): LumosClassMapping {
  const { fontSize } = node.style || {};

  const sizeMap: { [key: number]: string } = {
    12: 'xs',
    14: 'small',
    16: 'body',
    18: 'body-large',
    20: 'h6',
    24: 'h5',
    28: 'h4',
    32: 'h3',
    36: 'h2',
    48: 'h1',
    56: 'display-small',
    64: 'display-medium',
    72: 'display-large',
  };

  if (fontSize && sizeMap[fontSize]) {
    return { className: `u-text-style-${sizeMap[fontSize]}`, matched: true, requested: fontSize, usedValue: fontSize };
  }
  
  if (fontSize) {
    const { key } = findClosestNumericMatch(fontSize, sizeMap);
    return {
      className: `u-text-style-${sizeMap[key]}`,
      matched: false,
      requested: fontSize,
      usedValue: key,
      warning: `font size ${fontSize} not mapped; nearest ${key}`,
    };
  }

  return { className: '', matched: false, requested: 0 };
}

export function getLumosFontWeightClass(fontWeight?: number): string {
  if (!fontWeight) return '';
  if (fontWeight >= 700) return 'u-weight-bold';
  if (fontWeight >= 600) return 'u-weight-semibold';
  if (fontWeight >= 500) return 'u-weight-medium';
  if (fontWeight >= 400) return 'u-weight-regular';
  if (fontWeight >= 300) return 'u-weight-light';
  return '';
}

export function getLumosLayoutClass(node: any): string[] {
  const classes: string[] = [];

  // Flexbox utilities with explicit step classes
  if (node.layout?.mode === 'HORIZONTAL') {
    const spacing = node.layout?.itemSpacing ?? 0;
    const gapMeta = getLumosGapClass(spacing);
    const step = gapMeta.className.replace(/^u-gap-/, '');
    classes.push(`u-flex-inline-${step}`);
  } else if (node.layout?.mode === 'VERTICAL') {
    const spacing = node.layout?.itemSpacing ?? 0;
    const gapMeta = getLumosGapClass(spacing);
    const step = gapMeta.className.replace(/^u-gap-/, '');
    classes.push(`u-flex-block-${step}`);
  }

  // Container max-width
  if (node.layout?.box?.width) {
    const containerClass = getLumosContainerClass(node.layout.box.width);
    if (containerClass?.className) {
      classes.push(containerClass.className);
    }
  }

  return classes;
}