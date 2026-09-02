/* Merger Bid Core — กฎเกมและสูตรทั้งหมด ใช้ร่วมกันทั้ง desktop และ mobile
   ไม่แตะ DOM · แก้กฎที่ไฟล์นี้ที่เดียวมีผลทั้งสองหน้า */
(function (global) {
  'use strict';

  /* สินค้าและราคาต่อชิ้น */
  var GOODS = [
    { id: 'ship',     name: 'เรือ',       nameEn: 'Ship',      value: 10, cls: 'c-ship',     dot: 'dot-ship' },
    { id: 'rice',     name: 'ข้าว',       nameEn: 'Rice',      value: 20, cls: 'c-rice',     dot: 'dot-rice' },
    { id: 'spice',    name: 'เครื่องเทศ', nameEn: 'Spice',     value: 25, cls: 'c-spice',    dot: 'dot-spice' },
    { id: 'rubber',   name: 'ยาง',        nameEn: 'Rubber',    value: 30, cls: 'c-rubber',   dot: 'dot-rubber' },
    { id: 'siapsaji', name: 'ข้าวกล่อง',  nameEn: 'Siap Saji', value: 35, cls: 'c-siapsaji', dot: 'dot-siapsaji' },
    { id: 'oil',      name: 'น้ำมัน',     nameEn: 'Oil',       value: 40, cls: 'c-oil',      dot: 'dot-oil' }
  ];

  var GOODS_BY_ID = GOODS.reduce(function (map, g) { map[g.id] = g; return map; }, {});

  /* ราคาต่อชิ้นเมื่อ ข้าว + เครื่องเทศ ควบรวมเป็นข้าวกล่อง
     หมายเหตุ: 25 ไม่เท่ากับ GOODS.siapsaji.value (35) — ยกมาจากโค้ดเดิม */
  var SIAP_SAJI_UNIT_VALUE = 25;

  var MIN_GOODS = 1;
  var MAX_GOODS = 30;
  var LADDER_LENGTH = 10;   // จำนวนขั้นที่แสดงบนบันได
  var LADDER_LOOKBACK = 2;  // แสดงย้อนหลังกี่ขั้นเมื่อมี bid แล้ว
  var PICKER_STEPS = 100;   // จำนวนตัวเลือกใน picker

  function getGood(id) {
    return GOODS_BY_ID[id] || null;
  }

  function clampGoods(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = MIN_GOODS;
    return Math.min(MAX_GOODS, Math.max(MIN_GOODS, n));
  }

  function formatMoney(n) {
    return Number(n).toLocaleString('en-US');
  }

  /* ประเภทการควบรวม: เหมือนกัน = normal, ข้าว+เครื่องเทศ = siapsaji, นอกนั้น merge ไม่ได้ */
  function getMergeType(a, b) {
    if (a === b) return 'normal';
    if ([a, b].sort().join('+') === 'rice+spice') return 'siapsaji';
    return 'invalid';
  }

  /* คำนวณหลัก — คืน object เดียวที่ UI ใช้ได้ทั้งหมด */
  function evaluate(input) {
    var goodsA = clampGoods(input.goodsA);
    var goodsB = clampGoods(input.goodsB);
    var total = goodsA + goodsB;
    var mergeType = getMergeType(input.typeA, input.typeB);

    var state = {
      mergeType: mergeType,
      valid: mergeType !== 'invalid',
      typeA: input.typeA,
      typeB: input.typeB,
      goodA: getGood(input.typeA),
      goodB: getGood(input.typeB),
      goodsA: goodsA,
      goodsB: goodsB,
      total: total,
      unitValue: 0,
      nominal: 0,
      increment: 0,
      pctA: total > 0 ? (goodsA / total * 100) : 0,
      pctB: total > 0 ? (goodsB / total * 100) : 0
    };

    if (!state.valid) return state;

    state.unitValue = mergeType === 'siapsaji'
      ? SIAP_SAJI_UNIT_VALUE
      : (state.goodA ? state.goodA.value : 0);

    state.nominal = total * state.unitValue;
    state.increment = total;   // จำนวนชิ้นรวม = ขนาดของแต่ละขั้น bid
    return state;
  }

  /* bid ต้องไม่ต่ำกว่า nominal และต้องตรงขั้นพอดี */
  function isValidBid(bid, state) {
    if (!state.valid || state.increment <= 0) return false;
    return bid >= state.nominal && (bid - state.nominal) % state.increment === 0;
  }

  /* ราคาที่ถูกต้องใกล้เคียงที่สุด — ใช้ในข้อความ error */
  function nearestBid(bid, state) {
    if (!state.valid || state.increment <= 0) return 0;
    if (bid < state.nominal) return state.nominal;
    return state.nominal + Math.round((bid - state.nominal) / state.increment) * state.increment;
  }

  /* บันไดราคา → { label, pills: [{ value, state }] }
     state ของ pill: first | current | past | step */
  function buildLadder(state, currentBid) {
    if (!state.valid || state.increment <= 0) {
      return { label: '', pills: [] };
    }

    var atNominal = !currentBid || currentBid === state.nominal;
    var displayStart, currentIdx, label;

    if (atNominal) {
      displayStart = state.nominal;
      currentIdx = -1;
      label = 'ขั้นบันไดการประมูล (กดเพื่อเลือก)';
    } else {
      var maxBack = Math.floor((currentBid - state.nominal) / state.increment);
      var back = Math.min(LADDER_LOOKBACK, maxBack);
      displayStart = currentBid - back * state.increment;
      currentIdx = back;
      label = 'ขั้นถัดไปจาก ' + formatMoney(currentBid) + ' รูเปียห์ (กดเพื่อเลือก)';
    }

    var pills = [];
    for (var i = 0; i < LADDER_LENGTH; i++) {
      var pillState;
      if (i === currentIdx) pillState = 'current';
      else if (i < currentIdx) pillState = 'past';
      else if (currentIdx === -1 && i === 0) pillState = 'first';
      else pillState = 'step';
      pills.push({ value: displayStart + i * state.increment, state: pillState });
    }
    return { label: label, pills: pills };
  }

  /* แบ่งเงินตามสัดส่วนจำนวนชิ้น — ปัดให้ A แล้วยกเศษให้ B เพื่อให้ a + b = bid เสมอ */
  function splitBid(bid, state) {
    if (!bid || !state.valid || state.total <= 0) return { a: 0, b: 0 };
    var a = Math.round(bid * state.goodsA / state.total);
    return { a: a, b: bid - a };
  }

  /* รายการราคาที่ picker ให้เลือกได้ */
  function pickerValues(state) {
    var values = [];
    if (!state.valid || state.increment <= 0) return values;
    for (var i = 0; i < PICKER_STEPS; i++) {
      values.push(state.nominal + i * state.increment);
    }
    return values;
  }

  global.MergerCore = {
    GOODS: GOODS,
    MIN_GOODS: MIN_GOODS,
    MAX_GOODS: MAX_GOODS,
    SIAP_SAJI_UNIT_VALUE: SIAP_SAJI_UNIT_VALUE,
    getGood: getGood,
    clampGoods: clampGoods,
    formatMoney: formatMoney,
    getMergeType: getMergeType,
    evaluate: evaluate,
    isValidBid: isValidBid,
    nearestBid: nearestBid,
    buildLadder: buildLadder,
    splitBid: splitBid,
    pickerValues: pickerValues
  };
})(window);
