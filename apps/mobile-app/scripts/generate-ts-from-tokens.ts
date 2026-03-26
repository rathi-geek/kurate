/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';

// This script generates sizeConfig.ts and Colors.ts from constants/tokens.js
// It ensures that tokens.js is the single source of truth for design tokens.

// eslint-disable-next-line import/no-unresolved
const tokens = require('../constants/tokens.js');

// Helper to convert rgb(x y z) to #hex
const rgbToHex = (rgb: string) => {
  const result = /rgb\((\d+)\s(\d+)\s(\d+)\)/.exec(rgb);
  if (!result) return rgb;
  return (
    '#' +
    result
      .slice(1)
      .map(n => parseInt(n, 10).toString(16).padStart(2, '0'))
      .join('')
  );
};

// Helper to convert '16px' to 16
const pxToNum = (px: string) => (px ? parseInt(px.replace('px', ''), 10) : 0);

// Helper to build a color map from a color object
const buildColorMap = (colorGroups: any): Map<string, string> => {
  const colorMap = new Map<string, string>();
  for (const groupName in colorGroups) {
    if (Object.prototype.hasOwnProperty.call(colorGroups, groupName)) {
      const capitalizedGroupName =
        groupName.charAt(0).toUpperCase() +
        groupName.slice(1).replace(/-/g, '');
      for (const shade in colorGroups[groupName]) {
        if (
          Object.prototype.hasOwnProperty.call(colorGroups[groupName], shade)
        ) {
          const key = `${capitalizedGroupName}${shade.replace(/-/g, '')}`;
          const value = rgbToHex(colorGroups[groupName][shade]);
          colorMap.set(key, value);
        }
      }
    }
  }
  return colorMap;
};

// ===== 1. Generate Colors.ts =====

const generateColorsFile = () => {
  // 1. Generate the base light theme map
  const lightColorMap = buildColorMap(tokens.colors);

  // 2. Create the dark theme map as a copy of the light theme
  const darkColorMap = new Map<string, string>(lightColorMap);

  // 3. Apply dark theme overrides from the minimal dark theme object
  const darkOverrides = tokens.colorsDark || {};
  for (const groupName in darkOverrides) {
    if (Object.prototype.hasOwnProperty.call(darkOverrides, groupName)) {
      const capitalizedGroupName =
        groupName.charAt(0).toUpperCase() +
        groupName.slice(1).replace(/-/g, '');

      for (const shade in darkOverrides[groupName]) {
        if (
          Object.prototype.hasOwnProperty.call(darkOverrides[groupName], shade)
        ) {
          const keyToOverride = `${capitalizedGroupName}${shade.replace(/-/g, '')}`;
          const value = rgbToHex(darkOverrides[groupName][shade]);
          if (darkColorMap.has(keyToOverride)) {
            darkColorMap.set(keyToOverride, value);
          }
        }
      }
    }
  }

  // 4. Convert maps to strings for the file content
  const lightColors = [...lightColorMap.entries()]
    .map(([key, value]) => `  ${key}: '${value}',`)
    .join('\n');

  const darkColors = [...darkColorMap.entries()]
    .map(([key, value]) => `  ${key}: '${value}',`)
    .join('\n');

  const colorsFileContent = `
// THIS FILE IS AUTO-GENERATED. DO NOT EDIT.
// To update, edit constants/tokens.js and run 'pnpm generate:ts'

const colorsLight = {
${lightColors}
} as const;

const colorsDark = {
${darkColors}
} as const;

export default {
  light: colorsLight,
  dark: colorsDark,
};
`;

  fs.writeFileSync(
    path.join(__dirname, '../constants/Colors.ts'),
    colorsFileContent.trim(),
  );
  console.log('✅ Generated constants/Colors.ts');
};

// ===== 2. Generate sizeConfig.ts =====

const generateSizeConfigFile = () => {
  // --- Start: Static values not in tokens.js ---
  const staticValues = `
    // ===== Breakpoints / Responsive =====
    breakpoints: {
      xs: 475,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    } as const,

    tabletBreakpoint: 768,

    tabletScale: 1.2,
    tabletFontScale: 1.15,
    tabletSpacingScale: 1.25,

    baseSpacing: 4,
    baseFontSize: 16,
  `;
  // --- End: Static values ---

  const fontSizes = Object.entries(tokens.fontSize)
    .map(
      ([key, value]: [string, any]) => `      '${key}': ${pxToNum(value[0])},`,
    )
    .join('\n');

  const lineHeights = Object.entries(tokens.fontSize)
    .map(
      ([key, value]: [string, any]) =>
        `      '${key}': ${pxToNum(value[1].lineHeight)},`,
    )
    .join('\n');

  const fontWeights = Object.entries(tokens.fontWeight)
    .map(([key, value]) => `      ${key}: ${value},`)
    .join('\n');

  const fontFamilies = Object.entries(tokens.fontFamily)
    .map(([key, value]: [string, any]) => `      ${key}: ['${value[0]}'],`)
    .join('\n');

  const spacing = Object.entries(tokens.spacing)
    .map(([key, value]) => `      '${key}': ${pxToNum(value as string)},`)
    .join('\n');

  const borderRadius = Object.entries(tokens.borderRadius)
    .map(([key, value]) => `      '${key}': ${pxToNum(value as string)},`)
    .join('\n');

  const borderWidth = Object.entries(tokens.borderWidth)
    .map(([key, value]) => `      '${key}': ${pxToNum(value as string)},`)
    .join('\n');

  const sizeConfigFileContent = `
// THIS FILE IS AUTO-GENERATED. DO NOT EDIT.
// To update, edit constants/tokens.js and run 'pnpm generate:ts'

export const sizeConfig = {
  ${staticValues}
  
  // ===== Typography =====
  fontSizes: {
${fontSizes}
  } as const,

  lineHeights: {
${lineHeights}
  } as const,

  fontWeights: {
${fontWeights}
  } as const,

  fontFamilies: {
${fontFamilies}
  } as const,

  // ===== Spacing =====
  spacing: {
${spacing}
  } as const,

  // ===== Border =====
  borderRadius: {
${borderRadius}
  } as const,
  
  borderWidth: {
${borderWidth}
  } as const,

} as const;

// ===== Types (for convenience) =====
export type SpacingKeys = keyof typeof sizeConfig.spacing;
export type SpacingValues = (typeof sizeConfig.spacing)[SpacingKeys];
export type SpacingMap = {
  [K in SpacingKeys]: (typeof sizeConfig.spacing)[K];
};
export type FontSizeKeys = keyof typeof sizeConfig.fontSizes;
export type FontSizeValues = (typeof sizeConfig.fontSizes)[FontSizeKeys];
export type LineHeightKeys = keyof typeof sizeConfig.lineHeights;
export type LineHeightValues = (typeof sizeConfig.lineHeights)[LineHeightKeys];
export type BorderWidthKeys = keyof typeof sizeConfig.borderWidth;
export type BorderWidthValues = (typeof sizeConfig.borderWidth)[BorderWidthKeys];
export type BreakpointKeys = keyof typeof sizeConfig.breakpoints;
export type BreakpointValues = (typeof sizeConfig.breakpoints)[BreakpointKeys];
export type FontWeightKeys = keyof typeof sizeConfig.fontWeights;
export type FontFamilyKeys = keyof typeof sizeConfig.fontFamilies;
`;

  fs.writeFileSync(
    path.join(__dirname, '../constants/sizeConfig.ts'),
    sizeConfigFileContent.trim(),
  );
  console.log('✅ Generated constants/sizeConfig.ts');
};

// ===== Run Generators =====
try {
  generateColorsFile();
  generateSizeConfigFile();
  console.log('\nSuccessfully generated TS files from tokens.js!');
} catch (error) {
  console.error('Error generating TS files:', error);
}
