/* Bottom sheet เลือกตัวเลือกจากรายการ — ใช้เลือกประเภทสินค้าบนมือถือ
   ต้องมีในหน้า: #sheet-overlay > .sheet > (.sheet-title#sheet-title + .sheet-list#sheet-list) */
(function (global) {
  'use strict';

  var overlay, list, titleEl;
  var onSelect = null;
  var wired = false;

  function close() {
    if (overlay) overlay.classList.remove('show');
  }

  function wire() {
    if (wired) return;
    wired = true;

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    list.addEventListener('click', function (e) {
      var row = e.target.closest('.sheet-opt');
      if (!row) return;
      var value = row.dataset.value;
      close();
      if (typeof onSelect === 'function') onSelect(value);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('show')) close();
    });
  }

  /* opts: { title, options:[{value,label,hint,cls,dot}], current, onSelect } */
  function open(opts) {
    overlay = overlay || document.getElementById('sheet-overlay');
    list    = list    || document.getElementById('sheet-list');
    titleEl = titleEl || document.getElementById('sheet-title');
    if (!overlay || !list) return;

    onSelect = opts.onSelect;
    wire();

    titleEl.textContent = opts.title || '';
    list.innerHTML = (opts.options || []).map(function (o) {
      var on = o.value === opts.current;
      return '<button class="sheet-opt' + (on ? ' on' : '') + '" type="button" data-value="' + o.value + '"' +
        (on ? ' aria-current="true"' : '') + '>' +
        '<i class="swatch ' + (o.dot || '') + '"></i>' +
        '<span class="so-label">' + o.label + '</span>' +
        '<span class="so-hint">' + (o.hint || '') + '</span>' +
        '<span class="so-check">✓</span>' +
        '</button>';
    }).join('');

    overlay.classList.add('show');
    var active = list.querySelector('.sheet-opt.on');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  global.Sheet = { open: open, close: close };
})(window);
