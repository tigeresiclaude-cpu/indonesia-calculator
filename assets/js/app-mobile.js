/* หน้า mobile — ต่อ DOM เข้ากับ MergerCore */
(function () {
  'use strict';

  var C = window.MergerCore;
  var fmt = C.formatMoney;

  var el = {};
  ['badge', 'types-a', 'types-b', 'dot-a', 'dot-b', 'goods-a', 'goods-b',
   'res-nominal', 'res-increment', 'ladder', 'ladder-lbl',
   'bid-tap', 'bid-display', 'formula',
   'sp-lbl-a', 'sp-lbl-b', 'sp-pct-a', 'sp-pct-b', 'sp-amt-a', 'sp-amt-b'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  var selected = { a: 'rice', b: 'rice' };
  var state = null;
  var currentBid = 0;

  /* ชิปเลือกประเภทสินค้า */
  function renderTypes(which) {
    el['types-' + which].innerHTML = C.GOODS.map(function (g) {
      var on = selected[which] === g.id;
      return '<label class="type-chip ' + g.cls + (on ? ' selected' : '') + '">' +
        '<input type="radio" name="type-' + which + '" value="' + g.id + '"' +
        (on ? ' checked' : '') + '/>' + g.name + '</label>';
    }).join('');
  }

  function updateDot(which) {
    var g = C.getGood(selected[which]);
    if (g) el['dot-' + which].className = 'co-dot ' + g.dot;
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
      el.badge.textContent = '⚠️ ประเภทไม่ตรงกัน — ไม่สามารถ merge ได้';
      el['res-nominal'].textContent = '—';
      el['res-increment'].textContent = '—';
      el.ladder.innerHTML = '';
      el['ladder-lbl'].textContent = 'ขั้นบันไดการประมูล';
      el.formula.innerHTML = '';
      setBid(0);
      return;
    }

    if (state.mergeType === 'siapsaji') {
      el.badge.className = 'badge siapsaji';
      el.badge.textContent = '🍱 ข้าวกล่อง Merger · ข้าว + เครื่องเทศ';
    } else {
      el.badge.className = 'badge normal';
      el.badge.textContent = 'Normal Merger · ' + (state.goodA ? state.goodA.name : '');
    }

    el['res-nominal'].textContent = fmt(state.nominal);
    el['res-increment'].textContent = fmt(state.increment);

    el['sp-lbl-a'].textContent = 'ส่วนแบ่งบริษัท A (' + state.goodA.name + ' ' + state.goodsA + 'ชิ้น)';
    el['sp-lbl-b'].textContent = 'ส่วนแบ่งบริษัท B (' + state.goodB.name + ' ' + state.goodsB + 'ชิ้น)';
    el['sp-pct-a'].textContent = state.pctA.toFixed(1) + '%';
    el['sp-pct-b'].textContent = state.pctB.toFixed(1) + '%';

    el.formula.innerHTML =
      '<b>Nominal:</b> (' + state.goodsA + '+' + state.goodsB + ') × ' + state.unitValue +
      ' = <span>' + fmt(state.nominal) + '</span> &nbsp;·&nbsp; <b>+' + state.increment + '</b>/ขั้น';

    /* จำนวนชิ้น/ประเภทเปลี่ยน → ขั้นราคาเปลี่ยนตาม ราคาเดิมอาจไม่ตรงขั้นอีกต่อไป */
    setBid(C.isValidBid(currentBid, state) ? currentBid : 0);
  }

  /* บันไดราคา */
  function renderLadder() {
    var ladder = C.buildLadder(state, currentBid);
    el['ladder-lbl'].textContent = ladder.label;
    el.ladder.innerHTML = ladder.pills.map(function (p) {
      return '<span class="bid-pill ' + p.state + '" data-bid="' + p.value + '">' + fmt(p.value) + '</span>';
    }).join('');
  }

  /* ราคาประมูล + ส่วนแบ่ง */
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

  function openPicker() {
    if (!state || !state.valid || state.nominal === 0) return;
    Picker.open({
      values: C.pickerValues(state),
      title: 'Nominal ' + fmt(state.nominal) + ' · +' + state.increment + '/ขั้น',
      current: currentBid || state.nominal,
      onConfirm: setBid
    });
  }

  /* ผูก event — HTML ไม่มี onclick */
  ['a', 'b'].forEach(function (which) {
    el['types-' + which].addEventListener('change', function (e) {
      if (e.target.name !== 'type-' + which) return;
      selected[which] = e.target.value;
      updateDot(which);
      renderTypes(which);
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
    if (pill) setBid(Number(pill.dataset.bid));
  });

  el['bid-tap'].addEventListener('click', openPicker);

  /* เริ่มต้น */
  renderTypes('a'); renderTypes('b');
  updateDot('a'); updateDot('b');
  calc();
})();
