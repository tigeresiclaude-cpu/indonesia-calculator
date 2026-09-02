/* หน้า desktop — ต่อ DOM เข้ากับ MergerCore */
(function () {
  'use strict';

  var C = window.MergerCore;
  var fmt = C.formatMoney;

  /* เก็บ reference ครั้งเดียว ไม่ต้อง getElementById ซ้ำทุกรอบ */
  var el = {};
  ['badge', 'types-a', 'types-b', 'dot-a', 'dot-b', 'title-a', 'title-b',
   'goods-a', 'goods-b', 'res-nominal', 'res-increment', 'ladder', 'ladder-lbl',
   'bid-actual', 'bid-error', 'breakdown',
   'split-lbl-a', 'split-lbl-b', 'split-pct-a', 'split-pct-b', 'split-amt-a', 'split-amt-b'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  var selected = { a: 'rice', b: 'rice' };
  var state = null;

  /* ตัวเลือกประเภทสินค้า */
  function renderTypes(which) {
    el['types-' + which].innerHTML = C.GOODS.map(function (g) {
      return '<div class="good-type-row"><label>' +
        '<input type="radio" name="type-' + which + '" value="' + g.id + '"' +
        (selected[which] === g.id ? ' checked' : '') + '/>' +
        '<span class="good-chip ' + g.cls + '">' + g.name + ' (' + g.nameEn + ')</span>' +
        '</label></div>';
    }).join('');
  }

  function updateHeader(which) {
    var g = C.getGood(selected[which]);
    if (!g) return;
    el['dot-' + which].className = 'dot ' + g.dot;
    el['title-' + which].textContent =
      'Company ' + which.toUpperCase() + ' · ' + g.name + ' (' + g.nameEn + ')';
  }

  /* อ่านค่าจากฟอร์ม → คำนวณ → วาดผล */
  function readInputs() {
    return {
      typeA: selected.a,
      typeB: selected.b,
      goodsA: el['goods-a'].value,
      goodsB: el['goods-b'].value
    };
  }

  function calc() {
    state = C.evaluate(readInputs());

    if (!state.valid) {
      el.badge.className = 'badge invalid';
      el.badge.textContent = '⚠️ ประเภทสินค้าไม่ตรงกัน — ไม่สามารถ merge ได้';
      el['res-nominal'].textContent = '—';
      el['res-increment'].textContent = '—';
      el.ladder.innerHTML = '';
      el.breakdown.innerHTML = '';
      clearBid();
      resetSplit();
      return;
    }

    if (state.mergeType === 'siapsaji') {
      el.badge.className = 'badge siapsaji';
      el.badge.textContent = '🍱 ข้าวกล่อง (Siap Saji) Merger · ข้าว + เครื่องเทศ';
    } else {
      el.badge.className = 'badge normal';
      el.badge.textContent = 'Normal Merger · ' +
        (state.goodA ? state.goodA.name + ' (' + state.goodA.nameEn + ')' : '');
    }

    el['res-nominal'].textContent = fmt(state.nominal);
    el['res-increment'].textContent = fmt(state.increment);

    el.breakdown.innerHTML =
      '<b>Nominal:</b> (' + state.goodsA + ' + ' + state.goodsB + ') × ' + state.unitValue +
      ' = <span>' + fmt(state.nominal) + ' รูเปียห์</span><br>' +
      '<b>Increment:</b> รวม ' + state.total + ' ชิ้น → เพิ่มครั้งละ <span>' + fmt(state.increment) + ' รูเปียห์</span>';

    el['split-lbl-a'].textContent = 'เจ้าของ A (' + state.goodA.name + ', ' + state.goodsA + ' ชิ้น)';
    el['split-lbl-b'].textContent = 'เจ้าของ B (' + state.goodB.name + ', ' + state.goodsB + ' ชิ้น)';
    el['split-pct-a'].textContent = state.pctA.toFixed(1) + '%';
    el['split-pct-b'].textContent = state.pctB.toFixed(1) + '%';

    calcSplit();
  }

  /* บันไดราคา */
  function renderLadder(currentBid) {
    var ladder = C.buildLadder(state, currentBid);
    el['ladder-lbl'].textContent = ladder.label;
    el.ladder.innerHTML = ladder.pills.map(function (p) {
      return '<span class="bid-pill ' + p.state + '" data-bid="' + p.value + '">' + fmt(p.value) + '</span>';
    }).join('');
  }

  /* ราคาที่ประมูลได้จริง + ส่วนแบ่ง */
  function clearBid() {
    el['bid-actual'].value = '';
    el['bid-actual'].className = 'bid-actual';
    el['bid-error'].className = 'bid-error';
  }

  function resetSplit() {
    el['split-amt-a'].textContent = '—';
    el['split-amt-b'].textContent = '—';
    el['split-pct-a'].textContent = '— %';
    el['split-pct-b'].textContent = '— %';
  }

  function clearAmounts() {
    el['split-amt-a'].textContent = '—';
    el['split-amt-b'].textContent = '—';
  }

  function calcSplit() {
    if (!state || !state.valid || state.nominal === 0) { resetSplit(); return; }

    var raw = el['bid-actual'].value;
    var bid = parseInt(raw, 10) || 0;

    if (!raw || bid === 0) {
      el['bid-actual'].className = 'bid-actual';
      el['bid-error'].className = 'bid-error';
      clearAmounts();
      renderLadder(0);
      return;
    }

    if (!C.isValidBid(bid, state)) {
      el['bid-actual'].className = 'bid-actual invalid-bid';
      el['bid-error'].className = 'bid-error show';
      el['bid-error'].textContent =
        'ราคาไม่ถูกต้อง — ต้องเป็น ' + fmt(state.nominal) + ' หรือ +' + state.increment +
        ' ทุกขั้น (ใกล้เคียง: ' + fmt(C.nearestBid(bid, state)) + ')';
      clearAmounts();
      renderLadder(0);
      return;
    }

    el['bid-actual'].className = 'bid-actual valid-bid';
    el['bid-error'].className = 'bid-error';
    renderLadder(bid);

    var split = C.splitBid(bid, state);
    el['split-amt-a'].textContent = fmt(split.a);
    el['split-amt-b'].textContent = fmt(split.b);
  }

  function selectBid(value) {
    el['bid-actual'].value = value;
    calcSplit();
    el['bid-actual'].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function openPicker() {
    if (!state || !state.valid || state.nominal === 0) return;
    Picker.open({
      values: C.pickerValues(state),
      title: 'ราคา Bid (Nominal: ' + fmt(state.nominal) + ', +' + state.increment + '/ขั้น)',
      current: parseInt(el['bid-actual'].value, 10) || state.nominal,
      onConfirm: selectBid
    });
  }

  /* ผูก event ทั้งหมดไว้ที่นี่ — HTML ไม่มี onclick */
  ['a', 'b'].forEach(function (which) {
    el['types-' + which].addEventListener('change', function (e) {
      if (e.target.name !== 'type-' + which) return;
      selected[which] = e.target.value;
      updateHeader(which);
      calc();
    });
    el['goods-' + which].addEventListener('input', calc);
  });

  document.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = el['goods-' + btn.dataset.step];
      input.value = C.clampGoods((parseInt(input.value, 10) || C.MIN_GOODS) + Number(btn.dataset.delta));
      calc();
    });
  });

  el.ladder.addEventListener('click', function (e) {
    var pill = e.target.closest('.bid-pill');
    if (pill) selectBid(Number(pill.dataset.bid));
  });

  el['bid-actual'].addEventListener('click', openPicker);
  el['bid-actual'].addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
  });

  /* เริ่มต้น */
  renderTypes('a'); renderTypes('b');
  updateHeader('a'); updateHeader('b');
  calc();
})();
