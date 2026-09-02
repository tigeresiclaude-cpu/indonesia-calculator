/* วงล้อเลือกราคา — ใช้ร่วมกันทั้ง desktop และ mobile
   ต้องมีในหน้า: #picker-overlay > .picker-modal > (.picker-header กับปุ่ม
   [data-picker-cancel]/[data-picker-confirm] + #picker-title) และ #picker-drum */
(function (global) {
  'use strict';

  var overlay, drum, titleEl;
  var values = [];
  var onConfirm = null;
  var itemHeight = 48;
  var wired = false;

  function readItemHeight() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--picker-item-h');
    var px = parseFloat(raw);
    return px > 0 ? px : 48;
  }

  function activeIndex() {
    var idx = Math.round(drum.scrollTop / itemHeight);
    return Math.max(0, Math.min(values.length - 1, idx));
  }

  function highlight() {
    var idx = activeIndex();
    var items = drum.children;
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', i === idx);
    }
  }

  function wire() {
    if (wired) return;
    wired = true;

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    overlay.querySelector('[data-picker-cancel]').addEventListener('click', close);
    overlay.querySelector('[data-picker-confirm]').addEventListener('click', confirm);

    drum.addEventListener('scroll', highlight);
    /* กดที่ตัวเลขได้เลย ไม่ต้องเลื่อนแล้วกดยืนยัน */
    drum.addEventListener('click', function (e) {
      var item = e.target.closest('.picker-item');
      if (!item) return;
      commit(values[Number(item.dataset.idx)]);
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('show')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Enter')  { confirm(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var next = activeIndex() + (e.key === 'ArrowDown' ? 1 : -1);
        drum.scrollTop = Math.max(0, Math.min(values.length - 1, next)) * itemHeight;
      }
    });
  }

  function commit(value) {
    close();
    if (typeof onConfirm === 'function' && value != null) onConfirm(value);
  }

  function confirm() {
    commit(values[activeIndex()]);
  }

  function close() {
    if (overlay) overlay.classList.remove('show');
  }

  /* opts: { values, title, current, onConfirm } */
  function open(opts) {
    overlay = overlay || document.getElementById('picker-overlay');
    drum    = drum    || document.getElementById('picker-drum');
    titleEl = titleEl || document.getElementById('picker-title');
    if (!overlay || !drum) return;

    values = opts.values || [];
    onConfirm = opts.onConfirm;
    if (!values.length) return;

    itemHeight = readItemHeight();
    wire();

    titleEl.textContent = opts.title || '';
    drum.innerHTML = values.map(function (v, i) {
      return '<div class="picker-item" data-idx="' + i + '">' + v.toLocaleString('en-US') + '</div>';
    }).join('');

    var startIdx = opts.current ? values.indexOf(opts.current) : 0;
    if (startIdx < 0) startIdx = 0;

    overlay.classList.add('show');
    requestAnimationFrame(function () {
      drum.scrollTop = startIdx * itemHeight;
      highlight();
    });
  }

  global.Picker = { open: open, close: close };
})(window);
