// 复用原 select 的值与 change 事件，用轻量对话框统一卡组、等级、筛选界面。
// 不支持 dialog 的旧浏览器继续使用原生控件；只观察新增节点，不轮询。
import { esc } from './util.js';
let dialog = null;
let source = null;
let trigger = null;
let savedOverflow = '';

function enhance(select) {
  if (!select.id || select.dataset.enhanced || select.multiple || select.size > 1) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'select-trigger';
  button.dataset.selectFor = select.id;
  button.setAttribute('aria-haspopup', 'dialog');
  const label = select.getAttribute('aria-label') || select.labels?.[0]?.textContent
    || select.closest('.field')?.querySelector('label')?.textContent || '选择选项';
  const selected = select.options[select.selectedIndex];
  button.innerHTML = `<span>${esc(selected?.textContent || '选择选项')}</span><span class="select-chevron" aria-hidden="true"></span>`;
  button.setAttribute('aria-label', label.trim() + '：' + (selected?.textContent || '选择选项'));
  button.dataset.label = label.trim();
  button.disabled = select.disabled;
  select.after(button);
  select.dataset.enhanced = 'true';
  select.hidden = true;
}

function getDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'select-sheet';
  dialog.setAttribute('aria-labelledby', 'select-sheet-title');
  document.body.appendChild(dialog);
  dialog.addEventListener('close', () => {
    document.body.style.overflow = savedOverflow;
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    trigger = source = null;
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-select-close]')) { dialog.close(); return; }
    const option = event.target.closest('[data-choice]');
    if (!option || option.disabled || !source?.isConnected) return;
    const select = source;
    const index = Number(option.dataset.choice);
    const changed = select.selectedIndex !== index;
    select.selectedIndex = index;
    const selected = select.options[index];
    trigger.querySelector('span').textContent = selected.textContent;
    trigger.setAttribute('aria-label', trigger.dataset.label + '：' + selected.textContent);
    dialog.close();
    if (changed) select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  dialog.addEventListener('keydown', (event) => {
    const options = Array.from(dialog.querySelectorAll('[data-choice]:not(:disabled)'));
    const index = options.indexOf(document.activeElement);
    if (!options.length || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  });
  return dialog;
}

export function closeSelect() { if (dialog?.open) dialog.close(); }

export function initSelects(root) {
  if (typeof MutationObserver === 'undefined' || typeof document.createElement('dialog').showModal !== 'function') return;
  root.querySelectorAll('select').forEach(enhance);
  const observer = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType !== 1 || !node.isConnected) continue;
      if (node.tagName === 'SELECT') enhance(node);
      else node.querySelectorAll('select').forEach(enhance);
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-select-for]');
    if (!button || button.disabled) return;
    const select = document.getElementById(button.dataset.selectFor);
    if (!select || select.disabled) return;
    const sheet = getDialog();
    source = select;
    trigger = button;
    sheet.innerHTML = `<div class="select-sheet-head"><h2 id="select-sheet-title">${esc(button.dataset.label)}</h2><button type="button" class="select-close" data-select-close aria-label="关闭选择">×</button></div>
      <div class="select-options" role="listbox" aria-label="${esc(button.dataset.label)}">${Array.from(select.options).map((option, index) => `<button type="button" class="select-option" role="option" aria-selected="${index === select.selectedIndex}" data-choice="${index}" ${option.disabled || option.parentElement.disabled ? 'disabled' : ''}><span>${esc(option.textContent)}</span><span class="select-tick" aria-hidden="true">${index === select.selectedIndex ? '✓' : ''}</span></button>`).join('')}</div>`;
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheet.showModal();
    sheet.querySelector('[aria-selected="true"]:not(:disabled)')?.focus({ preventScroll: true });
  });
}
