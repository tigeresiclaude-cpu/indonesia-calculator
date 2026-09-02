/* หน้า mobile — ต่อ DOM เข้ากับ MergerCore */
(function () {
  'use strict';

  var C = window.MergerCore;
  var fmt = C.formatMoney;

  var el = {};
  ['badge', 'dot-a', 'dot-b', 'good-a', 'good-b', 'val-a', 'val-b',
   'goods-a', 'goods-b', 'res-nominal', 'res-increment', 'formula',
   'ladder', 'ladder-lbl', 'payout', 'bid-tap', 'bid-display',
   'sp-pct-a', 'sp-pct-b', 'sp-amt-a', 'sp-amt-b', 'sp-who-a', 'sp-who-b'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  var selected = { a: 'rice', b: 'rice' };
  var state = null;
  var currentBid = 0;

  /* ปุ่มเลือกประเภทสินค้า */
  function renderGood(which) {
    var g = C.getGood(selected[which]);
    if (!g) return;
    el['dot-' + which].className = 'swatch ' + g.dot;
    el['good-' + which].textContent = g.name;
    el['val-' + which].textContent = g.value;
  }

  function openGoodSheet(which) {
    Sheet.open({
      title: 'สินค้าของบริษัท ' + which.toUpperCase(),
      current: selected[which],
      options: C.GOODS.map(function (g) {
        return { value: g.id, label: g.name + ' · ' + g.nameEn, hint: g.value + '/ชิ้น', dot: g.dot };
      }),
      onSelect: function (id) {
        selected[which] = id;
        renderGood(which);
        calc();
      }
    });
  }

  /* คำนวณ */
  function calc() {
    state = C.evaluate({
      typeA: selected.a,
      typeB: selected.b,
      goodsA: el['goods-a'].value,
      goodsB: el['goods-b'].value
    });

    if (!state.valid) {
      el.badge.className = 'badge invalid';
      el.badge.textContent = '⚠️ merge ไม่ได้ — ต้องเป็นสินค้าชนิดเดียวกัน หรือ ข้าว + เครื่องเทศ';
      el['res-nominal'].textContent = '—';
      el['res-increment'].textContent = '—';
      el.formula.textContent = '';
      el.ladder.innerHTML = '';
      el['ladder-lbl'].textContent = 'ขั้นบันไดการประมูล';
      el.payout.classList.add('off');
      el['sp-who-a'].textContent = '—';
      el['sp-who-b'].textContent = '—';
      el['sp-pct-a'].textContent = '—%';
      el['sp-pct-b'].textContent = '—%';
      setBid(0);
      return;
    }

    el.payout.classList.remove('off');

    if (state.mergeType === 'siapsaji') {
      el.badge.className = 'badge siapsaji';
      el.badge.textContent = '🍱 ข้าวกล่อง Merger · ข้าว + เครื่องเทศ';
    } else {
      el.badge.className = 'badge normal';
      el.badge.textContent = 'Normal Merger · ' + (state.goodA ? state.goodA.name : '');
    }

    el['res-nominal'].textContent = fmt(state.nominal);
    el['res-increment'].textContent = fmt(state.increment);
    el.formula.innerHTML =
      '(' + state.goodsA + ' + ' + state.goodsB + ' ชิ้น) × <b>' + state.unitValue + '</b> รูเปียห์';

    el['sp-pct-a'].textContent = state.pctA.toFixed(1) + '%';
    el['sp-pct-b'].textContent = state.pctB.toFixed(1) + '%';
    el['sp-who-a'].textContent = state.goodA.name + ' ' + state.goodsA + ' ชิ้น';
    el['sp-who-b'].textContent = state.goodB.name + ' ' + state.goodsB + ' ชิ้น';

    /* จำนวนชิ้น/ประเภทเปลี่ยน → ขั้นราคาเปลี่ยนตาม ราคาเดิมอาจไม่ตรงขั้นอีกต่อไป */
    setBid(C.isValidBid(currentBid, state) ? currentBid : 0);
  }

  /* บันไดราคา */
  function renderLadder() {
    var ladder = C.buildLadder(state, currentBid);
    el['ladder-lbl'].textContent = ladder.label.replace('(กดเพื่อเลือก)', '· แตะเพื่อเลือก');
    el.ladder.innerHTML = ladder.pills.map(function (p) {
      return '<button class="bid-pill ' + p.state + '" type="button" data-bid="' + p.value + '">' +
        fmt(p.value) + '</button>';
    }).join('');

    var active = el.ladder.querySelector('.current') || el.ladder.querySelector('.first');
    if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  /* ราคาที่ชนะ + ส่วนแบ่ง */
  function setBid(value) {
    currentBid = value || 0;

    el['bid-display'].textContent = currentBid ? fmt(currentBid) : '—';
    el['bid-tap'].classList.toggle('has-val', !!currentBid);

    if (!state || !state.valid || !currentBid) {
      el['sp-amt-a'].textContent = '—';
      el['sp-amt-b'].textContent = '—';
    } else {
      var split = C.splitBid(currentBid, state);
      el['sp-amt-a'].textContent = fmt(split.a);
      el['sp-amt-b'].textContent = fmt(split.b);
    }

    if (state && state.valid) renderLadder();
  }

  function openBidPicker() {
    if (!state || !state.valid || state.nominal === 0) return;
    Picker.open({
      values: C.pickerValues(state),
      title: 'Nominal ' + fmt(state.nominal) + ' · +' + state.increment + '/ขั้น',
      current: currentBid || state.nominal,
      onConfirm: setBid
    });
  }

  /* ผูก event — HTML ไม่มี onclick */
  document.querySelectorAll('[data-good]').forEach(function (btn) {
    btn.addEventListener('click', function () { openGoodSheet(btn.dataset.good); });
  });

  document.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = el['goods-' + btn.dataset.step];
      input.value = C.clampGoods((parseInt(input.value, 10) || C.MIN_GOODS) + Number(btn.dataset.delta));
      calc();
    });
  });

  ['a', 'b'].forEach(function (which) {
    el['goods-' + which].addEventListener('input', calc);
    el['goods-' + which].addEventListener('blur', function () {
      el['goods-' + which].value = C.clampGoods(el['goods-' + which].value);
      calc();
    });
  });

  el.ladder.addEventListener('click', function (e) {
    var pill = e.target.closest('.bid-pill');
    if (pill) setBid(Number(pill.dataset.bid));
  });

  el['bid-tap'].addEventListener('click', openBidPicker);

  /* เริ่มต้น */
  renderGood('a'); renderGood('b');
  calc();
})();
