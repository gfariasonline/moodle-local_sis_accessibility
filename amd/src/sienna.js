// thirdparty/sienna/src/sienna.js
/*!
 * Sienna Accessibility Widget - adapted tool definitions.
 * Copyright (c) 2025 Benny Luk. MIT; see ../LICENSE.
 * Modifications Copyright (c) 2026 Thiago Serrão. MIT.
 * Upstream e574c32da16aa57d78fbc43a8e9652ff30d69402.
 */
var textSelector = "h1,h2,h3,h4,h5,h6,p,a,dl,dt,dd,li,ol,th,td,span,blockquote,label,button";
var iconSelector = ".material-icons,.fa,.fa-solid,.fa-regular,.fa-brands,.glyphicon,.icon,.mdi,.ion,.svg-icon,.iconfont,.emoji-icon,.bi,.octicon,.feather,.heroicon,.bx,.ri";
var textStyles = {
  bold: { "font-weight": "700" },
  lineheight: { "line-height": "2" },
  letterspacing: { "letter-spacing": "2px" },
  dyslexia: { "font-family": "SISOpenDyslexic, Arial, sans-serif" }
};
var highlightStyles = {
  "text-decoration-line": "underline",
  "text-decoration-style": "double",
  "text-decoration-thickness": "2px",
  "text-underline-offset": "3px"
};
var filters = {
  monochrome: "grayscale(100%)",
  lowsaturation: "saturate(50%)",
  highsaturation: "saturate(200%)",
  highcontrast: "contrast(125%)"
};
var contrastStyles = {
  lightcontrast: { "color": "#000", "background-color": "#fff" },
  darkcontrast: { "color": "#fff", "background-color": "#000" }
};
export {
  contrastStyles,
  filters,
  highlightStyles,
  iconSelector,
  textSelector,
  textStyles
};
