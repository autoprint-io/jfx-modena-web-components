#!/usr/bin/env bun
// Precise computation of JavaFX Modena derive() and ladder() color functions.
// Outputs pre-computed CSS custom property values.

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsb({ r, g, b }) {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rf) h = 60 * (((gf - bf) / delta) % 6);
    else if (max === gf) h = 60 * ((bf - rf) / delta + 2);
    else h = 60 * ((rf - gf) / delta + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : delta / max;
  return { h, s, b: max };
}

function hsbToRgb({ h, s, b: v }) {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// JavaFX derive(): shifts brightness in HSB space
// Positive pct: newB = B + (1 - B) * pct
// Negative pct: newB = B + B * pct (pct is negative, so this subtracts)
function derive(hex, pct) {
  const rgb = hexToRgb(hex);
  const hsb = rgbToHsb(rgb);
  const shift = pct / 100;
  if (shift >= 0) {
    hsb.b = hsb.b + (1 - hsb.b) * shift;
  } else {
    hsb.b = hsb.b + hsb.b * shift;
  }
  hsb.b = Math.max(0, Math.min(1, hsb.b));
  return rgbToHex(hsbToRgb(hsb));
}

// JavaFX ladder(): evaluates brightness of ref, picks value from stops
// Stops are [value, threshold%] pairs. Returns interpolated value.
function getBrightness(hex) {
  return rgbToHsb(hexToRgb(hex)).b;
}

function ladder(refHex, stops) {
  const brightness = getBrightness(refHex) * 100;
  if (brightness <= stops[0].at) return stops[0].value;
  if (brightness >= stops[stops.length - 1].at) return stops[stops.length - 1].value;
  for (let i = 0; i < stops.length - 1; i++) {
    if (brightness >= stops[i].at && brightness <= stops[i + 1].at) {
      const t = (brightness - stops[i].at) / (stops[i + 1].at - stops[i].at);
      // If values are hex colors, interpolate RGB
      if (typeof stops[i].value === 'string' && stops[i].value.startsWith('#')) {
        const c1 = hexToRgb(stops[i].value);
        const c2 = hexToRgb(stops[i + 1].value);
        return rgbToHex({
          r: c1.r + (c2.r - c1.r) * t,
          g: c1.g + (c2.g - c1.g) * t,
          b: c1.b + (c2.b - c1.b) * t,
        });
      }
      // If values are numbers (like alpha), interpolate
      if (typeof stops[i].value === 'number') {
        return stops[i].value + (stops[i + 1].value - stops[i].value) * t;
      }
      return stops[i + 1].value;
    }
  }
  return stops[stops.length - 1].value;
}

// ─── Base palette ───
const BASE = '#ececec';
const ACCENT = '#0096C9';
const DEFAULT_BTN = '#ABD8ED';
const FOCUS = '#039ED3';
const FAINT_FOCUS = '#039ED322';

// ─── Derived values ───
const tokens = {};

tokens['--jfx-base'] = BASE;
tokens['--jfx-accent'] = ACCENT;
tokens['--jfx-default-button'] = DEFAULT_BTN;
tokens['--jfx-focus-color'] = FOCUS;
tokens['--jfx-faint-focus-color'] = FAINT_FOCUS;
tokens['--jfx-dark-text'] = '#000000';
tokens['--jfx-mid-text'] = '#333333';
tokens['--jfx-light-text'] = '#ffffff';

tokens['--jfx-background'] = derive(BASE, 26.4);
tokens['--jfx-control-inner-bg'] = derive(BASE, 80);
tokens['--jfx-control-inner-bg-alt'] = derive(derive(BASE, 80), -2);

// Hover base: ladder(base, derive(base,20%) 20%, derive(base,30%) 35%, derive(base,40%) 50%)
tokens['--jfx-hover-base'] = ladder(BASE, [
  { value: derive(BASE, 20), at: 20 },
  { value: derive(BASE, 30), at: 35 },
  { value: derive(BASE, 40), at: 50 },
]);

tokens['--jfx-pressed-base'] = derive(BASE, -6);

// Text colors via ladder
function textLadder(refHex) {
  return ladder(refHex, [
    { value: '#ffffff', at: 45 },
    { value: '#000000', at: 46 },
    { value: '#000000', at: 59 },
    { value: '#333333', at: 60 },
  ]);
}

tokens['--jfx-text-base-color'] = textLadder(BASE);
tokens['--jfx-text-bg-color'] = textLadder(derive(BASE, 26.4));
tokens['--jfx-text-inner-color'] = textLadder(derive(BASE, 80));

// Outer border
tokens['--jfx-outer-border'] = derive(BASE, -23);

// Mark color: ladder(color, white 30%, derive(color,-63%) 31%)
tokens['--jfx-mark-color'] = ladder(BASE, [
  { value: '#ffffff', at: 30 },
  { value: derive(BASE, -63), at: 31 },
]);
tokens['--jfx-mark-highlight'] = ladder(BASE, [
  { value: derive(BASE, 80), at: 60 },
  { value: '#ffffff', at: 70 },
]);

// Shadow highlight alpha
const shadowAlpha = ladder(derive(BASE, 26.4), [
  { value: 0.07, at: 0 },
  { value: 0.07, at: 20 },
  { value: 0.07, at: 70 },
  { value: 0.70, at: 90 },
  { value: 0.75, at: 100 },
]);
tokens['--jfx-shadow-highlight'] = `rgba(255,255,255,${typeof shadowAlpha === 'number' ? shadowAlpha.toFixed(3) : 0.75})`;

// Box border
tokens['--jfx-box-border'] = ladder(BASE, [
  { value: '#000000', at: 20 },
  { value: derive(BASE, -15), at: 30 },
]);

// Text box border
tokens['--jfx-text-box-border'] = ladder(derive(BASE, 26.4), [
  { value: '#000000', at: 10 },
  { value: derive(derive(BASE, 26.4), -15), at: 30 },
]);

// ─── Body/border gradients for each state ───
function computeStateColors(colorHex, label) {
  const prefix = label ? `--jfx-${label}-` : '--jfx-';

  // Outer border
  tokens[`${prefix}outer-border`] = derive(colorHex, -23);

  // Inner border gradient (top → bottom)
  const innerTop = ladder(colorHex, [
    { value: derive(colorHex, 30), at: 0 },
    { value: derive(colorHex, 20), at: 40 },
    { value: derive(colorHex, 25), at: 60 },
    { value: derive(colorHex, 55), at: 80 },
    { value: derive(colorHex, 55), at: 90 },
    { value: derive(colorHex, 75), at: 100 },
  ]);
  const innerBot = ladder(colorHex, [
    { value: derive(colorHex, 20), at: 0 },
    { value: derive(colorHex, 10), at: 20 },
    { value: derive(colorHex, 5), at: 40 },
    { value: derive(colorHex, -2), at: 60 },
    { value: derive(colorHex, -5), at: 100 },
  ]);
  tokens[`${prefix}inner-border-top`] = innerTop;
  tokens[`${prefix}inner-border-bot`] = innerBot;

  // Body gradient (top → bottom)
  const bodyTop = ladder(colorHex, [
    { value: derive(colorHex, 8), at: 75 },
    { value: derive(colorHex, 10), at: 80 },
  ]);
  const bodyBot = derive(colorHex, -8);
  tokens[`${prefix}body-top`] = bodyTop;
  tokens[`${prefix}body-bot`] = bodyBot;
}

computeStateColors(BASE, 'normal');
computeStateColors(tokens['--jfx-hover-base'], 'hover');
computeStateColors(tokens['--jfx-pressed-base'], 'pressed');
computeStateColors(DEFAULT_BTN, 'default');

// Hover/pressed states for default button
const defaultHover = ladder(DEFAULT_BTN, [
  { value: derive(DEFAULT_BTN, 20), at: 20 },
  { value: derive(DEFAULT_BTN, 30), at: 35 },
  { value: derive(DEFAULT_BTN, 40), at: 50 },
]);
computeStateColors(defaultHover, 'default-hover');
const defaultPressed = derive(DEFAULT_BTN, -6);
computeStateColors(defaultPressed, 'default-pressed');

// Selection colors
tokens['--jfx-selection-bar'] = ACCENT;
tokens['--jfx-selection-bar-non-focused'] = '#d3d3d3';
tokens['--jfx-cell-hover-color'] = '#cce3f4';

// ─── Output ───
console.log(':root {');
for (const [key, val] of Object.entries(tokens)) {
  console.log(`  ${key}: ${val};`);
}
console.log('}');

// Also output a JSON version for reference
const fs = require('fs');
fs.writeFileSync(
  '/Users/vinny/Documents/Codex/2026-05-10/modena-ds/tools/tokens.json',
  JSON.stringify(tokens, null, 2)
);
console.log('\n/* tokens.json written */');
