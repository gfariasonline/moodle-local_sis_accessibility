/* @preserve
 * Sienna Accessibility Widget - adapted tool definitions.
 * Copyright (c) 2025 Benny Luk. MIT; see ../LICENSE.
 * Modifications Copyright (c) 2026 Thiago Serrão. MIT.
 * Upstream e574c32da16aa57d78fbc43a8e9652ff30d69402.
 */
// Ported from src/tools/{adjustFontWeight,adjustLetterSpacing,adjustLineHeight,
// highlightLinks,highlightTitle,stopAnimations}.ts and src/enum/Filters.ts.
// Explicit library entry: no automatic DOM insertion, globals, storage or network.
export const textSelector = 'h1,h2,h3,h4,h5,h6,p,a,dl,dt,dd,li,ol,th,td,span,blockquote,label,button';
export const iconSelector = '.material-icons,.fa,.fa-solid,.fa-regular,.fa-brands,.glyphicon,.icon,.mdi,' +
    '.ion,.svg-icon,.iconfont,.emoji-icon,.bi,.octicon,.feather,.heroicon,.bx,.ri';
export const textStyles = {
    bold: {'font-weight': '700'},
    lineheight: {'line-height': '2'},
    letterspacing: {'letter-spacing': '2px'},
    dyslexia: {'font-family': 'SISOpenDyslexic, Arial, sans-serif'},
};
// Underline keeps the host theme's keyboard focus outline/box-shadow intact.
export const highlightStyles = {'text-decoration-line': 'underline', 'text-decoration-style': 'double',
    'text-decoration-thickness': '2px', 'text-underline-offset': '3px'};
export const filters = {
    monochrome: 'grayscale(100%)',
    lowsaturation: 'saturate(50%)',
    highsaturation: 'saturate(200%)',
    highcontrast: 'contrast(125%)',
};
export const contrastStyles = {
    lightcontrast: {'color': '#000', 'background-color': '#fff'},
    darkcontrast: {'color': '#fff', 'background-color': '#000'},
};
