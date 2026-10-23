// 内联线条图标，无外部字体、图标库或网络请求。
const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  cards: '<rect x="6" y="5" width="14" height="16" rx="3"/><path d="M16 5V3H5a2 2 0 0 0-2 2v12M10 11h6m-6 4h4"/>',
  grammar: '<path d="M12 6c-3-3-7-3-10-2v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15M5 8l4 1M5 12l4 1m6-4 4-1m-4 5 4-1"/>',
  listening: '<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 13H3v7h4v-7Zm16 0h1v7h-4v-7Z"/>',
  mistakes: '<path d="M6 3h12v18l-6-4-6 4Zm3 5h6m-6 4h4"/>',
  stats: '<path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/>',
  data: '<path d="M3 7V4h7l2 3h9v13H3Zm5 6h8m-8 3h5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  fire: '<path d="M13 2c2 5-3 6-3 10 0 1 1 2 2 2 2 0 3-2 3-4 4 3 5 6 3 9-3 5-12 3-12-3 0-5 4-6 7-14Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};

export function icon(name, className = '') {
  return `<svg class="icon ${className}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.cards}</svg>`;
}
