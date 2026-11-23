/* Fence Quote NZ — UI and storage */
(function () {
  'use strict';
  var APP_VERSION = '2.2.1';
  function fmtPct(n) { return (Math.round(n * 100) / 100) + '%'; }
  var TZ = 'Pacific/Auckland';
  var D = window.FQ_DATA, C = window.FQCalc, P = window.FQPdf;
  var K = { profile: 'fq_profile', draft: 'fq_draft', prices: 'fq_prices', palings: 'fq_palings', boards: 'fq_boards', records: 'fq_records', counter: 'fq_counter', invCounter: 'fq_invcounter' };
  var ACCEPT_STATEMENT = 'I have read this quote, including the scope of works, exclusions, payment terms and fixed price, and I accept it.';

  // ---------------- storage ----------------
  var storageOk = true;
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { storageOk = false; return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { storageOk = false; toast('Could not save on this device: ' + e.message); return false; }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { n = Number(n || 0); return (n < 0 ? '−$' : '$') + Math.abs(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }

  // ---------------- dates (NZ time) ----------------
  function nzParts(date) {
    var f = new Intl.DateTimeFormat('en-NZ', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date || new Date());
    var o = {}; f.forEach(function (p) { o[p.type] = p.value; }); return o;
  }
  function todayISO() { var p = nzParts(); return p.year + '-' + p.month + '-' + p.day; }
  function addDays(iso, days) { var d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + Number(days || 0)); return d.toISOString().slice(0, 10); }
  function dateLabel(iso) { if (!iso) return '-'; var d = new Date(iso + 'T12:00:00Z'); return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  // NZ bank account: bank(2)-branch(4)-account(7)-suffix(2 or 3)
  function formatNzAcc(v) {
    v = String(v || '').trim(); var d = v.replace(/\D/g, '');
    if (d.length === 15 || d.length === 16) return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6, 13) + '-' + d.slice(13);
    return v;
  }
  function bankHint() {
    var el = $('pBankAccHint'); if (!el) return;
    var d = $('pBankAccNo').value.replace(/\D/g, '');
    el.textContent = !d ? '' : (d.length === 15 || d.length === 16) ? '✓ ' + formatNzAcc($('pBankAccNo').value) : 'Check the number: NZ accounts have 15 or 16 digits, like 12-3456-7890123-00 (you have ' + d.length + ').';
    el.className = 'small ' + (!d || d.length === 15 || d.length === 16 ? 'ok-text' : 'bad-text');
  }
  function depositOf(doc) { var m = /(\d+(?:\.\d+)?)\s*%\s*deposit/i.exec(doc.paymentTerms || ''); if (!m) return null; var pct = Number(m[1]); return { pct: pct, amount: Math.round(doc.price.amount * pct) / 100 }; }
  function weekdayDateLabel(iso) { if (!iso) return ''; var d = new Date(iso + 'T12:00:00Z'); return d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function scheduleOf(dr) {
    var days = Number(dr.durationDays) || 0;
    return { startDate: dr.startDate || '', startLabel: dr.startDate ? weekdayDateLabel(dr.startDate) : 'To be confirmed', durationDays: days,
      durationLabel: days > 0 ? 'About ' + days + ' working day' + (days === 1 ? '' : 's') + ' (weather permitting)' : 'To be confirmed' };
  }
  function dateTimeLabel(d) { return new Date(d).toLocaleString('en-NZ', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZoneName: 'short' }); }

  // ---------------- state ----------------
  var profile = Object.assign(clone(D.defaults.profile), load(K.profile, {}));
  var priceOverrides = load(K.prices, {});
  var customPalings = load(K.palings, []);
  var customBoards = load(K.boards, []);
  var records = load(K.records, []);
  var draft = load(K.draft, null);
  var calc = null, deckCalc = null, pricing = null, currentRecordId = null;

  function nextRef() {
    var p = nzParts(); var day = p.year.slice(2) + p.month + p.day;
    var c = load(K.counter, { day: '', n: 0 });
    if (c.day !== day) c = { day: day, n: 0 };
    var ref;
    do { c.n += 1; ref = (profile.quotePrefix || 'Q') + '-' + day + '-' + String(c.n).padStart(2, '0'); }
    while (records.some(function (r) { return r.ref === ref; }));
    save(K.counter, c);
    return ref;
  }
  function newDraft() {
    var issue = todayISO();
    return {
      id: 'd' + Date.now(), ref: nextRef(), input: { length: '', height: 1.8 }, options: clone(D.defaults.options),
      labour: [{ name: (profile.contactPerson || 'Me'), hours: 8, rate: 75 }], extras: [], marginPct: 10, roundTo: 0, discountPct: 0, startDate: '', durationDays: '',
      client: { name: '', address: '', phone: '', email: '' }, issueDate: issue, expiryDate: addDays(issue, profile.validityDays || 30),
      scope: '', scopeEdited: false, exclusions: profile.exclusions, paymentTerms: profile.paymentTerms, optVer: 2,
      jobs: { fence: true, deck: false }, deck: clone(D.deckDefaults)
    };
  }
  // older quotes (before decks) are fence-only
  function normDraft(d) {
    d.jobs = d.jobs || { fence: true, deck: false };
    d.deck = d.deck || {};
    d.deck.input = Object.assign(clone(D.deckDefaults.input), d.deck.input || {});
    d.deck.options = Object.assign(clone(D.deckDefaults.options), d.deck.options || {});
    return d;
  }
  if (!draft || !draft.ref) draft = newDraft();
  normDraft(draft);
  draft.options = Object.assign(clone(D.defaults.options), draft.options || {});
  if (!draft.optVer) { if (Number(draft.options.maxCentres) === 2.4) draft.options.maxCentres = 1.8; if (draft.options.railId === 'bn-0308502') draft.options.railId = 'auto'; draft.optVer = 2; }
  function saveDraft() { save(K.draft, draft); }

  // ---------------- catalogue with overrides ----------------
  function applyOv(item) {
    var o = priceOverrides[item.id] || {};
    var it = Object.assign({}, item);
    it.researchedPrice = item.price;
    if (o.price != null && o.price !== '') { it.price = Number(o.price); it.overridden = true; }
    if (o.perPack) it.perPack = Number(o.perPack);
    if (o.yieldM3) it.yieldM3 = Number(o.yieldM3);
    if (o.supplier) it.supplier = String(o.supplier);
    return it;
  }
  function catalogue() {
    return {
      palings: D.palings.concat(customPalings).map(applyOv),
      posts: D.posts.map(applyOv), rails: D.rails.map(applyOv),
      nails: applyOv(D.nails), railFix: applyOv(D.railFix), concrete: applyOv(D.concrete),
      deck: {
        piles: D.deck.piles.map(applyOv), joists: D.deck.joists.map(applyOv), bearers: D.deck.bearers.map(applyOv),
        boards: D.deck.boards.concat(customBoards).map(applyOv), screws: applyOv(D.deck.screws), hangers: D.deck.hangers.map(applyOv),
        ties: applyOv(D.deck.ties), wireDogs: applyOv(D.deck.wireDogs), bolts: applyOv(D.deck.bolts), nails: applyOv(D.deck.nails), concrete: applyOv(D.concrete)
      }
    };
  }
  var OFF = { ok: false, off: true, errors: [], warnings: [], notes: [], lines: [], total: 0 };
  function takeoffsOk() { var j = draft.jobs; return (j.fence || j.deck) && (!j.fence || calc.ok) && (!j.deck || deckCalc.ok); }
  function matTotal() { return C.r2((draft.jobs.fence && calc.ok ? calc.total : 0) + (draft.jobs.deck && deckCalc.ok ? deckCalc.total : 0)); }
  function jobWord(jobs) { jobs = jobs || draft.jobs; return jobs.fence && jobs.deck ? 'fence and deck' : jobs.deck ? 'deck' : 'fence'; }
  function jobDesc(jobs) { jobs = jobs || draft.jobs; return jobs.fence && jobs.deck ? 'Supply and install timber paling fence and timber deck' : jobs.deck ? 'Supply and build timber deck' : 'Supply and install timber paling fence'; }

  // ---------------- scope ----------------
  function buildScope() {
    var parts = [];
    if (draft.jobs.fence && calc.ok) parts.push(fenceScope(calc));
    if (draft.jobs.deck && deckCalc.ok) parts.push(deckScope(deckCalc));
    if (parts.length === 2) return 'FENCE\n' + parts[0].replace(/\n- Tidy up and removal of our offcuts and packaging$/, '') + '\n\nDECK\n' + parts[1];
    return parts.join('\n\n');
  }
  function sizeName(n) { return String(n || '').replace(/ \(green\)/, '').replace(/ SG8/, ''); }
  function deckScope(t) {
    var s = t.summary;
    return 'Supply and build a ' + s.length.toFixed(1) + ' m × ' + s.width.toFixed(1) + ' m timber deck (' + s.area.toFixed(1) + ' m²), about ' + Math.round(s.height * 1000) + ' mm high, ' + (s.attached ? 'attached to the house' : 'free-standing') + ', on level ground:\n' +
      '- ' + s.pileCount + ' x 125 × 125 H5 timber piles set in concrete, ' + s.bearerRows + ' row' + (s.bearerRows > 1 ? 's' : '') + ' of ' + sizeName(s.bearer.name.replace(/ bearer$/, '')) + ' bearers\n' +
      '- ' + sizeName(s.joist.name.replace(/ framing/, '')) + ' joists at ' + s.centres + ' mm centres' + (s.attached ? ', on galvanised joist hangers from a stringer bolted to the house' : '') + '\n' +
      '- Decking: ' + s.board.name + ', ' + s.gapMm + ' mm gaps, fixed with stainless steel screws\n' +
      '- Galvanised structural fixings (joist ties, wire dogs, nails)\n' +
      '- Tidy up and removal of our offcuts and packaging';
  }
  function fenceScope(t) {
    var s = t.summary;
    var gap = s.gapMm > 0 ? 'with ' + s.gapMm + ' mm gaps' : s.gapMm < 0 ? 'overlapped ' + (-s.gapMm) + ' mm' : 'butted';
    return 'Supply and install ' + s.length.toFixed(1) + ' m of ' + s.height.toFixed(2) + ' m high timber paling fence in one straight run on level ground:\n' +
      '- ' + s.posts + ' x ' + s.post.name + ' posts at ' + s.centres.toFixed(2) + ' m centres, set ' + Math.round(s.embedment * 1000) + ' mm into the ground and concreted (' + Math.round(s.holeDiameter * 1000) + ' mm holes)\n' +
      '- ' + s.rows + ' rows of ' + s.rail.name.replace(/ radiata timber fence rail/i, '') + ' rails\n' +
      '- ' + s.palingsInstalled + ' x ' + s.paling.name.replace(/ fence paling/i, '') + ' palings, ' + gap + ', ' + Math.round(s.clearance * 1000) + ' mm clear of the ground\n' +
      '- Galvanised paling nails and galvanised rail screws\n' +
      '- Tidy up and removal of our offcuts and packaging';
  }

  // ---------------- recalc ----------------
  function recalc() {
    var cat = catalogue();
    calc = draft.jobs.fence ? C.takeoff(draft.input, draft.options, cat) : OFF;
    deckCalc = draft.jobs.deck ? C.deckTakeoff(draft.deck.input, draft.deck.options, cat.deck, D.deckRules) : OFF;
    var mat = matTotal();
    pricing = C.price(mat, draft.labour, draft.extras, { gstRegistered: profile.gstRegistered, marginPct: draft.marginPct, roundTo: draft.roundTo, discountPct: draft.discountPct });
    if (!draft.scopeEdited && takeoffsOk()) draft.scope = buildScope();
    // show the rebuilt scope in the box too (it used to stay blank until the app was reopened)
    if (!draft.scopeEdited && $('qScope').value !== draft.scope) $('qScope').value = draft.scope;
    saveDraft();
    renderMeasure(); renderDeck(); renderQuote(); renderSendIfVisible();
    $('refBadge').textContent = draft.ref;
  }

  // ---------------- MEASURE view ----------------
  function fillMeasureInputs() {
    $('inLength').value = draft.input.length; $('inHeight').value = draft.input.height;
    var o = draft.options;
    $('optMaxCentres').value = o.maxCentres; $('optEmbedment').value = o.embedment; $('optHoleDia').value = Math.round(o.holeDiameter * 1000);
    $('optRailRows').value = String(o.railRows); $('optClearance').value = Math.round(o.groundClearance * 1000); $('optGap').value = o.palingGapMm;
    $('optWaste').value = o.palingWastePct; $('optFixWaste').value = o.fixingWastePct; $('optNailsPer').value = o.nailsPerPalingPerRail;
    $('optExposure').value = o.exposure; $('optGround').value = o.ground; $('optSpecial').value = o.special; $('optFront').checked = !!o.frontYard;
    fillPalingSelect(); fillRailSelect(); fillDeckInputs();
  }
  function fillDeckInputs() {
    var di = draft.deck.input, o = draft.deck.options;
    $('jobFence').checked = !!draft.jobs.fence; $('jobDeck').checked = !!draft.jobs.deck;
    $('dLength').value = di.length; $('dWidth').value = di.width; $('dHeight').value = di.height;
    $('dAttached').checked = o.attached !== false; $('dCentres').value = String(o.joistCentres);
    $('dCant').value = o.cantilever; $('dGap').value = o.boardGapMm; $('dEmbed').value = Math.round(o.pileEmbed * 1000); $('dHoleDia').value = Math.round(o.pileHoleDia * 1000);
    $('dBoardWaste').value = o.boardWastePct; $('dTimberWaste').value = o.timberWastePct; $('dFixWaste').value = o.fixingWastePct; $('dScrews').value = o.screwsPerCrossing;
    $('dTies').value = o.tiesPerCrossing; $('dDogs').value = o.wireDogsPerPile; $('dBolts').value = o.boltCentres; $('dFront').checked = o.frontBoundary !== false; $('dCoastal').checked = !!o.coastal;
    fillDeckSelects();
  }
  function fillDeckSelects() {
    var dc = catalogue().deck, o = draft.deck.options;
    $('dBoard').innerHTML = dc.boards.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.name) + ' – ' + money(b.price) + '/m' + (b.supplier ? ' · ' + esc(b.supplier) : '') + '</option>'; }).join('');
    $('dBoard').value = dc.boards.some(function (b) { return b.id === o.boardId; }) ? o.boardId : dc.boards[0].id;
    $('dJoist').innerHTML = '<option value="auto">Auto (best price)</option>' + dc.joists.map(function (j) { return '<option value="' + esc(j.id) + '">' + esc(j.depthMm + ' × ' + j.widthMm) + '</option>'; }).join('');
    $('dJoist').value = dc.joists.some(function (j) { return j.id === o.joistId; }) ? o.joistId : 'auto';
    $('dBearer').innerHTML = '<option value="auto">Auto (best price)</option>' + dc.bearers.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.size === '140x90' ? '2/140 × 45 (nailed)' : b.size.replace('x', ' × ')) + '</option>'; }).join('');
    $('dBearer').value = dc.bearers.some(function (b) { return b.id === o.bearerId; }) ? o.bearerId : 'auto';
  }
  function fillPalingSelect() {
    var cat = catalogue(), sel = $('selPaling');
    sel.innerHTML = '<option value="auto">Auto – shortest paling long enough</option>' + cat.palings.map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.name) + ' – ' + money(p.price) + (p.supplier ? ' · ' + esc(p.supplier) : '') + '</option>';
    }).join('');
    sel.value = cat.palings.some(function (p) { return p.id === draft.options.palingId; }) ? draft.options.palingId : 'auto';
  }
  function fillRailSelect() {
    var cat = catalogue();
    $('optRail').innerHTML = '<option value="auto">Auto (cheapest that fits)</option>' + cat.rails.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('');
    $('optRail').value = cat.rails.some(function (r) { return r.id === draft.options.railId; }) ? draft.options.railId : 'auto';
  }
  function statusTag(item) {
    if (item.overridden) return '<span class="tag override">your price</span>';
    return '<span class="tag ' + item.status + '">' + (item.status === 'verified' ? 'checked ' + esc(item.checked) : item.status === 'derived' ? 'derived ' + esc(item.checked) : 'estimate – confirm') + '</span>';
  }
  function lineHTML(l) {
    var lm = l.unitLabel === 'm';
    return '<div class="mline" data-key="' + l.key + '"><div class="mline-top"><div><div class="mline-title">' + esc(l.label) + '</div>' +
      '<div class="mline-item">' + (l.item.url ? '<a href="' + esc(l.item.url) + '" target="_blank" rel="noopener">' + esc(l.item.name) + '</a>' : esc(l.item.name)) + (l.item.item ? ' · I/N ' + esc(l.item.item) : '') + (l.item.supplier ? ' · ' + esc(l.item.supplier) : '') + '</div></div>' +
      '<div style="text-align:right"><div class="mline-qty">' + (lm ? Number(l.qty).toFixed(1) : l.qty) + '</div><div class="small muted">' + (lm ? 'metres' : l.unitLabel === 'each' ? 'to buy' : l.unitLabel + (l.qty === 1 ? '' : 's')) + '</div></div></div>' +
      '<div class="mline-detail">' + esc(l.detail) + '</div>' +
      '<div class="mline-price">' + (lm ? 'Per metre $' : 'Unit $') + '<input type="number" inputmode="decimal" step="0.01" min="0" data-price-id="' + esc(l.item.id) + '" value="' + l.unitPrice.toFixed(2) + '"> ' + statusTag(l.item) +
      '<span style="margin-left:auto" class="mline-sub">' + money(l.subtotal) + '</span></div></div>';
  }
  function alertsHTML(t) {
    return {
      errors: (t.errors || []).map(function (e) { return '<div class="alert error">⛔ ' + esc(e) + '</div>'; }).join(''),
      warnings: (t.warnings || []).map(function (w) {
        var label = w.level === 'design' ? 'Estimating / design' : w.level === 'planning' ? 'Planning rule' : 'Consent rule';
        return '<div class="alert ' + w.level + '"><span class="tag ' + w.level + '">' + label + '</span> ' + esc(w.text) + '</div>';
      }).join('')
    };
  }
  function renderDeck() {
    $('deckSection').hidden = !draft.jobs.deck;
    $('fenceSection').hidden = !draft.jobs.fence;
    $('jobsNote').innerHTML = !draft.jobs.fence && !draft.jobs.deck ? '<b class="bad-text">Tick Fence or Deck (or both) to start.</b>' : 'Tick one or both. Everything you tick goes on the same quote and PDF' + (draft.jobs.fence && draft.jobs.deck && matTotal() > 0 ? ' – materials total for both: <b>' + money(matTotal()) + '</b>' : '') + '.';
    if (!draft.jobs.deck) return;
    var t = deckCalc, a = alertsHTML(t);
    $('deckErrors').innerHTML = a.errors; $('deckWarnings').innerHTML = a.warnings;
    if (!t.ok) {
      $('deckLines').innerHTML = '<p class="muted">' + (draft.deck.input.length || draft.deck.input.width ? 'Fix the problem above to see the deck takeoff.' : 'Enter the deck length, width and height.') + '</p>';
      $('deckSummary').innerHTML = ''; $('deckTotal').textContent = ''; $('deckBasisNote').textContent = '';
      return;
    }
    var s = t.summary;
    $('deckSummary').innerHTML = ['<span><b>' + s.area.toFixed(1) + '</b> m²</span>', '<span><b>' + s.pileCount + '</b> piles</span>', '<span>Joists <b>' + s.joist.depthMm + '×' + s.joist.widthMm + '</b> @ ' + s.centres + '</span>',
      '<span>Bearers <b>' + s.bearer.size.replace('x', '×') + '</b> × ' + s.bearerRows + '</span>', '<span>Joist span <b>' + s.span.toFixed(2) + ' m</b> (max ' + s.maxSpan.toFixed(2) + ')</span>'].join('');
    $('deckLines').innerHTML = t.lines.map(lineHTML).join('') + (t.notes || []).map(function (n) { return '<p class="small muted">ℹ️ ' + esc(n) + '</p>'; }).join('');
    $('deckTotal').textContent = money(t.total);
    $('deckBasisNote').textContent = 'Unit prices are Bunnings NZ and Mitre 10 NZ public retail prices incl GST, checked ' + D.priceCheckedLabel + '. Timber is priced per metre. Edit any price to use your own (saved for future quotes). "estimate" = not sold online, ask your merchant.';
  }
  function renderMeasure() {
    var t = calc;
    if (!draft.jobs.fence) return;
    $('takeoffErrors').innerHTML = (t.errors || []).map(function (e) { return '<div class="alert error">⛔ ' + esc(e) + '</div>'; }).join('');
    $('takeoffWarnings').innerHTML = (t.warnings || []).map(function (w) {
      var label = w.level === 'design' ? 'Estimating / design' : w.level === 'planning' ? 'Planning rule' : 'Consent rule';
      return '<div class="alert ' + w.level + '"><span class="tag ' + w.level + '">' + label + '</span> ' + esc(w.text) + '</div>';
    }).join('');
    if (!t.ok) {
      $('takeoffLines').innerHTML = '<p class="muted">' + (draft.input.length ? 'Fix the problem above to see the takeoff.' : 'Enter the fence length and height.') + '</p>';
      $('takeoffSummary').innerHTML = ''; $('matTotal').textContent = '';
      return;
    }
    var s = t.summary;
    $('takeoffSummary').innerHTML = ['<span><b>' + s.posts + '</b> posts</span>', '<span>Actual centres <b>' + s.centres.toFixed(3) + ' m</b></span>',
      '<span><b>' + s.rows + '</b> rail rows</span>', '<span>Post stock <b>' + s.post.lengthM.toFixed(1) + ' m</b></span>', '<span>Paling <b>' + (s.paling.lengthM * 1000) + ' mm</b></span>'].join('');
    $('takeoffLines').innerHTML = t.lines.map(lineHTML).join('');
    $('matTotal').textContent = money(t.total);
    $('priceBasisNote').textContent = 'Unit prices are Bunnings NZ retail, GST-inclusive, prices checked ' + D.priceCheckedLabel + '. Edit any unit price to override it (saved for future quotes). Items marked "estimate" could not be read from Bunnings automatically: tap the product link and enter the shelf price.';
  }

  // ---------------- QUOTE view ----------------
  function renderLabour() {
    $('labourList').innerHTML = draft.labour.map(function (p, i) {
      return '<div class="person" data-i="' + i + '"><div class="person-top"><input data-f="name" value="' + esc(p.name) + '" placeholder="Person ' + (i + 1) + ' name" aria-label="Person name">' +
        '<button type="button" class="icon-btn" data-remove-person="' + i + '" aria-label="Remove person"' + (draft.labour.length <= 1 ? ' disabled' : '') + '>✕</button></div>' +
        '<div class="grid3"><label>Hours onsite<input data-f="hours" type="number" inputmode="decimal" step="0.25" min="0" value="' + esc(p.hours) + '"></label>' +
        '<label>Rate $/h' + (profile.gstRegistered ? ' (excl GST)' : '') + '<input data-f="rate" type="number" inputmode="decimal" step="1" min="0" value="' + esc(p.rate) + '"></label>' +
        '<div class="lt" data-lt="' + i + '"></div></div></div>';
    }).join('');
  }
  function renderExtras() {
    $('extrasList').innerHTML = draft.extras.map(function (e, i) {
      return '<div class="person" data-ei="' + i + '"><div class="person-top"><input data-f="desc" value="' + esc(e.desc) + '" placeholder="e.g. Remove old fence & dump fees">' +
        '<button type="button" class="icon-btn" data-remove-extra="' + i + '" aria-label="Remove extra">✕</button></div>' +
        '<div class="grid2" style="margin-top:8px"><label class="small muted">Amount $' + (profile.gstRegistered ? ' (excl GST)' : '') + '<input data-f="amount" type="number" inputmode="decimal" step="0.01" value="' + esc(e.amount) + '"></label></div></div>';
    }).join('') || '<p class="small muted">No extras.</p>';
  }
  function renderBizSummary() {
    var b = profile, bits = [b.contactPerson, b.phone, b.email, b.address, b.gstRegistered ? (b.gstNumber ? 'GST ' + b.gstNumber : 'GST registered (no GST number entered)') : 'Not GST registered'].filter(Boolean);
    $('bizSummary').innerHTML = '<b>' + esc(b.tradingName || 'No business name yet') + '</b>' + (bits.length ? '<br>' + bits.map(esc).join(' · ') : '') + '<br><span class="muted">Shown at the top of the quote and PDF.</span>';
  }
  function renderQuote() {
    renderBizSummary();
    var p = pricing;
    $('qMaterials').textContent = money(matTotal());
    $('qMaterialsBasis').innerHTML = takeoffsOk()
      ? 'Pulled from the takeoff (retail, incl GST)' + (draft.jobs.fence && draft.jobs.deck ? ': fence ' + money(calc.total) + ' + deck ' + money(deckCalc.total) : '') + '. ' + (p.registered ? 'GST registered: costed at <b>' + money(p.materialsCost) + ' excl GST</b> (you claim the ' + money(p.materialsGstClaimable) + ' GST back), and GST is added once on the final price.' : 'Not GST registered: costed at the full GST-inclusive ' + money(p.materialsCost) + ' (you cannot claim it back). No GST is charged on the quote.')
      : '<span class="tag consent">Takeoff incomplete</span> Fix the takeoff on the Measure tab.';
    p.labourLines.forEach(function (l, i) { var el = document.querySelector('[data-lt="' + i + '"]'); if (el) el.textContent = money(l.total); });
    $('qLabourTotal').textContent = money(p.labourTotal);
    $('labourBasis').textContent = profile.gstRegistered ? 'Rates are excluding GST.' : 'Not GST registered: rates are what you charge, no GST added.';
    $('qExtrasTotal').textContent = money(p.extrasTotal);
    var rows = [
      ['Materials (retail incl GST)', money(p.materialsInclGst), 'sub'],
      ['Materials cost' + (p.registered ? ' (excl GST)' : ' (incl GST, not claimable)'), money(p.materialsCost)],
      ['Labour (' + p.labourLines.length + ' ' + (p.labourLines.length === 1 ? 'person' : 'people') + ')', money(p.labourTotal)]
    ];
    p.labourLines.forEach(function (l) { rows.push(['  ' + (l.name || 'Person') + ': ' + l.hours + ' h × ' + money(l.rate), money(l.total), 'sub']); });
    rows.push(['Extras', money(p.extrasTotal)], ['Total cost', money(p.cost)], ['Margin ' + p.marginPct + '%', money(p.margin)]);
    if (p.registered) rows.push(['Price excl GST', money(p.priceExGst)], ['GST 15% (added once)', money(p.gst)]);
    if (p.roundingAdj) rows.push(['Rounding', money(p.roundingAdj), 'sub']);
    if (p.discountPct > 0) rows.push(['Price before discount' + (p.registered ? ' incl GST' : ''), money(p.listPrice)], ['Discount ' + fmtPct(p.discountPct) + ' (shown to client)', '−' + money(p.discountAmount)]);
    rows.push(['Client fixed price' + (p.registered ? ' incl GST' : ' (no GST)'), money(p.clientPrice), 'total']);
    rows.push(['Your estimated profit (margin + rounding' + (p.discountPct > 0 ? ' − discount' : '') + ', excl GST)', money(p.profit), 'sub']);
    $('pricingTable').innerHTML = '<table class="ptable">' + rows.map(function (r) { return '<tr class="' + (r[2] || '') + '"><td>' + esc(r[0]) + '</td><td class="r">' + r[1] + '</td></tr>'; }).join('') + '</table>' +
      '<p class="small muted">The client sees only the fixed price' + (p.registered ? ' and its GST component' : '') + '. Labour rates, material costs and margin are never shown on the quote or PDF.</p>' +
      (p.discountPct > 0 && p.profit < 0 ? '<p class="small"><span class="tag consent">Check</span> With this discount the job is below cost: you would lose ' + money(-p.profit) + ' (excl GST).</p>' : '');
  }
  function fillQuoteInputs() {
    renderLabour(); renderExtras();
    $('inMargin').value = draft.marginPct; $('inRound').value = String(draft.roundTo || 0); $('inDiscount').value = draft.discountPct ? draft.discountPct : '';
    $('cName').value = draft.client.name; $('cAddress').value = draft.client.address; $('cPhone').value = draft.client.phone; $('cEmail').value = draft.client.email;
    $('qRef').value = draft.ref; $('qIssue').value = draft.issueDate; $('qExpiry').value = draft.expiryDate;
    $('qStart').value = draft.startDate || ''; $('qDays').value = draft.durationDays || ''; $('qScope').value = draft.scope; $('qExclusions').value = draft.exclusions; $('qTerms').value = draft.paymentTerms;
  }

  // ---------------- client document model ----------------
  function businessSnapshot() {
    return { tradingName: profile.tradingName, legalName: profile.legalName, contactPerson: profile.contactPerson, phone: profile.phone, email: profile.email, address: profile.address, gstNumber: profile.gstRegistered ? profile.gstNumber : '', nzbn: profile.nzbn, bankAccountName: profile.bankAccountName || '', bankAccountNumber: profile.bankAccountNumber || '', bankName: profile.bankName || '' };
  }
  function buildDoc() {
    var p = pricing;
    return {
      ref: draft.ref, jobs: { fence: !!draft.jobs.fence, deck: !!draft.jobs.deck }, jobLabel: jobWord(), jobDesc: jobDesc(), issueDate: draft.issueDate, expiryDate: draft.expiryDate, issueDateLabel: dateLabel(draft.issueDate), expiryDateLabel: dateLabel(draft.expiryDate),
      business: businessSnapshot(), client: clone(draft.client), scope: draft.scope,
      exclusions: String(draft.exclusions || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
      paymentTerms: draft.paymentTerms,
      schedule: scheduleOf(draft),
      price: {
        amount: p.clientPrice, gstRegistered: p.registered, gst: p.clientGst, exGst: p.clientExGst,
        discountPct: p.discountPct || 0, listPrice: p.listPrice, discountAmount: p.discountAmount,
        gstLine: p.registered ? 'Price includes GST at 15%.' + (profile.gstNumber ? ' GST No ' + profile.gstNumber + '.' : '') : 'No GST charged: ' + (profile.tradingName || 'the contractor') + ' is not registered for GST.'
      },
      acceptance: null
    };
  }
  function problems() {
    var out = [];
    if (!draft.jobs.fence && !draft.jobs.deck) out.push('Pick Fence or Deck on the Measure tab.');
    if (draft.jobs.fence && !calc.ok) out.push('Fence takeoff has a problem (see Measure tab): ' + (calc.errors[0] || 'enter length and height'));
    if (draft.jobs.deck && !deckCalc.ok) out.push('Deck takeoff has a problem (see Measure tab): ' + (deckCalc.errors[0] || 'enter length, width and height'));
    if (!profile.tradingName) out.push('Add your business name in My business details.');
    if (!draft.client.name.trim()) out.push('Enter the client name on the Quote tab.');
    if (!draft.client.address.trim()) out.push('Enter the job address on the Quote tab.');
    if (!draft.scope.trim()) out.push('Scope of works is empty.');
    if (!(pricing.clientPrice > 0)) out.push('Price is $0.');
    if (!profile.bankAccountNumber) out.push('Tip: add your bank account in My business details so the client knows where to pay.');
    if (profile.gstRegistered && !profile.gstNumber) out.push('Tip: add your GST number in My business details (optional on a quote).');
    return out;
  }
  function blocking() { return problems().filter(function (p) { return p.indexOf('Tip:') !== 0; }); }

  function howToPayHTML(doc) {
    var b = doc.business; if (!b.bankAccountNumber) return '';
    var dep = depositOf(doc);
    return '<h4>How to pay</h4><p>' + (b.bankAccountName ? '<b>Account name:</b> ' + esc(b.bankAccountName) + '<br>' : '') + '<b>Account number:</b> ' + esc(b.bankAccountNumber) + (b.bankName ? ' (' + esc(b.bankName) + ')' : '') +
      '<br><b>Reference:</b> ' + esc(doc.ref) + (dep ? '<br><b>Deposit (' + dep.pct + '%):</b> ' + money(dep.amount) + ' on acceptance' : '') + '</p>';
  }
  function renderDocHTML(doc, el) {
    var b = doc.business, a = doc.acceptance, p = doc.price;
    var biz = [b.legalName && b.legalName !== b.tradingName ? esc(b.legalName) : '', b.contactPerson ? 'Contact: ' + esc(b.contactPerson) : '', b.phone ? 'Phone: ' + esc(b.phone) : '', b.email ? 'Email: ' + esc(b.email) : '', b.address ? esc(b.address) : '', p.gstRegistered && b.gstNumber ? 'GST No: ' + esc(b.gstNumber) : '', b.nzbn ? 'NZBN: ' + esc(b.nzbn) : ''].filter(Boolean).join('<br>');
    el.innerHTML =
      '<div class="d-head"><div class="d-biz"><b>' + esc(b.tradingName) + '</b>' + biz + '</div><div class="d-title"><div class="q">QUOTE</div><div><b>Ref:</b> ' + esc(doc.ref) + '</div><div><b>Issued:</b> ' + esc(doc.issueDateLabel) + '</div><div><b>Valid until:</b> ' + esc(doc.expiryDateLabel) + '</div></div></div>' +
      (a ? '<div class="d-status accepted">✔ ACCEPTED by ' + esc(a.name) + '<br><span style="font-weight:400">on ' + esc(a.atLabel) + '</span></div>' : '<div class="d-status awaiting">AWAITING ACCEPTANCE – this quote has not been accepted yet</div>') +
      '<h4>Prepared for</h4><p><b>' + esc(doc.client.name || '-') + '</b><br>Job address: ' + esc(doc.client.address || '-') + (doc.client.phone ? '<br>Phone: ' + esc(doc.client.phone) : '') + (doc.client.email ? '<br>Email: ' + esc(doc.client.email) : '') + '</p>' +
      '<h4>Scope of works</h4><p>' + esc(doc.scope) + '</p>' +
      '<h4>Exclusions</h4><ul>' + (doc.exclusions.length ? doc.exclusions.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') : '<li>None stated</li>') + '</ul>' +
      '<h4>Payment terms</h4><p>' + esc(doc.paymentTerms || '-') + '</p>' +
      (doc.schedule ? '<h4>Start date &amp; job length</h4><p><b>Start date:</b> ' + esc(doc.schedule.startLabel) + '<br><b>Job length:</b> ' + esc(doc.schedule.durationLabel) + '</p>' : '') +
      '<div class="d-price">' + (p.discountPct > 0 ? '<div class="d-disc"><span>Price</span><span class="was">' + money(p.listPrice) + '</span></div><div class="d-disc save"><span>Discount ' + fmtPct(p.discountPct) + '</span><span>−' + money(p.discountAmount) + '</span></div>' : '') + '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px"><b>' + (p.discountPct > 0 ? 'FIXED PRICE AFTER DISCOUNT' : 'FIXED PRICE') + '</b><span class="amt">' + money(p.amount) + (p.gstRegistered ? ' <small>incl GST</small>' : '') + '</span></div>' +
      (p.gstRegistered ? '<div class="small">Price excluding GST ' + money(p.exGst) + ' · GST (15%) ' + money(p.gst) + '</div>' : '') + '<div class="small">' + esc(p.gstLine) + '</div></div>' +
      howToPayHTML(doc) +
      '<h4>Acceptance</h4>' + (a ? (a.signature ? '<img class="d-sig" alt="Client signature" src="' + esc(a.signature) + '">' : '') + '<p><b>Accepted by:</b> ' + esc(a.name) + '<br><b>Date and time:</b> ' + esc(a.atLabel) + '<br><span class="small">Ticked: "' + esc(a.statement) + '"</span><br><span class="small" style="word-break:break-all">Record fingerprint (SHA-256): ' + esc(a.hash) + '</span></p>' : '<p>Not yet accepted.</p>') +
      '<div class="d-foot">This is a quote, not a tax invoice.</div>';
  }

  // ---------------- records ----------------
  function persistRecords() { return save(K.records, records); }
  function findRecord(ref) { return records.filter(function (r) { return r.ref === ref; })[0]; }
  function internalSnapshot() {
    function ls(t, pre) { return t.ok ? t.lines.map(function (l) { return { label: pre + l.label, item: l.item.name, supplier: l.item.supplier || '', qty: l.qty, unit: l.unitLabel, unitPrice: l.unitPrice, subtotal: l.subtotal }; }) : []; }
    var lines = (draft.jobs.fence ? ls(calc, draft.jobs.deck ? 'Fence: ' : '') : []).concat(draft.jobs.deck ? ls(deckCalc, draft.jobs.fence ? 'Deck: ' : '') : []);
    return { draft: clone(draft), takeoff: takeoffsOk() ? { lines: lines, total: matTotal() } : null, pricing: clone(pricing) };
  }
  function saveAwaiting() {
    var existing = findRecord(draft.ref);
    if (existing && existing.status === 'accepted') { draft.ref = nextRef(); saveDraft(); existing = null; toast('That ref was already accepted, so this is now ' + draft.ref); }
    var doc = buildDoc();
    var now = new Date().toISOString();
    if (existing) { existing.doc = doc; existing.internal = internalSnapshot(); existing.updatedAt = now; }
    else records.unshift({ id: 'r' + Date.now(), ref: draft.ref, status: 'awaiting', createdAt: now, updatedAt: now, doc: doc, internal: internalSnapshot() });
    persistRecords();
    return findRecord(draft.ref);
  }
  function sha256Hex(str) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); });
    }
    var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Promise.resolve('fnv1a-' + (h >>> 0).toString(16));
  }

  // ---------------- PDF delivery ----------------
  function pdfFile(doc) {
    var blob = P.blob(doc);
    var name = P.fileName(doc);
    var file = null;
    try { file = new File([blob], name, { type: 'application/pdf', lastModified: Date.now() }); } catch (e) { file = null; }
    return { blob: blob, file: file, name: name };
  }
  function canShareFiles(file) { try { return !!(file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })); } catch (e) { return false; } }
  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }
  function shareDoc(doc, helpEl) { shareFile(pdfFile(doc), helpEl); } // built synchronously, so the tap still counts as a user gesture
  function shareFile(f, helpEl) {
    if (canShareFiles(f.file)) {
      navigator.share({ files: [f.file], title: f.name }).then(function () {
        helpEl.innerHTML = '<div class="alert ok">Handed <b>' + esc(f.name) + '</b> to the app you picked. Check in WhatsApp / Mail that you tapped Send; this app cannot see whether it was sent.</div>';
      }).catch(function (err) {
        if (err && err.name === 'AbortError') { helpEl.innerHTML = '<div class="alert info">Share cancelled. Nothing was sent.</div>'; return; }
        downloadBlob(f.blob, f.name);
        helpEl.innerHTML = '<div class="alert design">Sharing failed (' + esc(err && err.message || err) + '). The PDF was downloaded instead; attach it from Downloads / Files.</div>';
      });
    } else {
      downloadBlob(f.blob, f.name);
      helpEl.innerHTML = '<div class="alert design">This browser cannot share files directly, so <b>' + esc(f.name) + '</b> was downloaded. <b>WhatsApp:</b> open the chat → + / 📎 → Document → pick it from Downloads/Files. <b>Email:</b> new email → attach → pick the file.</div>';
    }
  }
  function downloadDoc(doc, helpEl) {
    var f = pdfFile(doc); downloadBlob(f.blob, f.name);
    helpEl.innerHTML = '<div class="alert info">Downloaded <b>' + esc(f.name) + '</b> (' + Math.round(f.blob.size / 1024) + ' KB). iPhone: Files app → Downloads. Android: Files → Downloads.</div>';
  }
  function openDoc(doc) {
    var f = pdfFile(doc); var url = URL.createObjectURL(f.blob);
    var w = window.open(url, '_blank');
    if (!w) downloadBlob(f.blob, f.name);
    setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
  }
  function emailDraft(doc, helpEl) {
    var subj = 'Quote ' + doc.ref + ' – ' + doc.business.tradingName + (doc.acceptance ? ' (accepted)' : '');
    var body = 'Hi ' + (doc.client.name || '') + ',\n\n' + (doc.acceptance ? 'Thanks for accepting. Attached is your accepted quote ' : 'Please find attached quote ') + doc.ref + ' for the ' + (doc.jobLabel || 'fence') + ' at ' + (doc.client.address || '') + '.\n\n' + (doc.price.discountPct > 0 ? 'Price before discount: ' + money(doc.price.listPrice) + '\nDiscount ' + fmtPct(doc.price.discountPct) + ': -' + money(doc.price.discountAmount) + '\n' : '') + 'Fixed price: ' + money(doc.price.amount) + (doc.price.gstRegistered ? ' incl GST' : ' (no GST)') + (doc.schedule ? '\nStart date: ' + doc.schedule.startLabel + '\nJob length: ' + doc.schedule.durationLabel : '') + '\nValid until: ' + doc.expiryDateLabel + (doc.business.bankAccountNumber ? '\n\nHow to pay: bank transfer to ' + (doc.business.bankAccountName ? doc.business.bankAccountName + ', ' : '') + doc.business.bankAccountNumber + (doc.business.bankName ? ' (' + doc.business.bankName + ')' : '') + ', reference ' + doc.ref + (depositOf(doc) ? '\nDeposit (' + depositOf(doc).pct + '%): ' + money(depositOf(doc).amount) + ' on acceptance' : '') : '') + '\n\nKind regards,\n' + (doc.business.contactPerson || '') + '\n' + doc.business.tradingName + (doc.business.phone ? '\n' + doc.business.phone : '');
    helpEl.innerHTML = '<div class="alert design">⚠️ This email draft has <b>NO attachment</b>. Download the PDF first, then attach it in your mail app before you tap Send. Easier: use <b>Share PDF → Mail/Gmail</b>, which attaches it for you.</div>';
    location.href = 'mailto:' + encodeURIComponent(doc.client.email || '') + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
  }

  // ---------------- SEND view ----------------
  function renderSendIfVisible() { if ($('view-send').classList.contains('active')) renderSend(); }
  function renderSend() {
    var probs = problems(), block = blocking();
    $('sendProblems').innerHTML = probs.map(function (p) {
      var tip = p.indexOf('Tip:') === 0, fix = '';
      if (p.indexOf('bank account') >= 0) fix = 'pBankAccNo';
      if (!tip) {
        if (p.indexOf('client name') >= 0) fix = 'cName'; else if (p.indexOf('job address') >= 0) fix = 'cAddress';
        else if (p.indexOf('Scope') === 0) fix = 'qScope'; else if (p.indexOf('Deck takeoff') === 0) fix = 'dLength'; else if (p.indexOf('Pick Fence') === 0) fix = 'jobFence'; else if (p.indexOf('Fence takeoff') === 0 || p.indexOf('Price is') === 0) fix = draft.jobs.fence ? 'inLength' : 'dLength';
        else if (p.indexOf('business name') >= 0) fix = 'pTrading';
      }
      return '<div class="alert ' + (tip ? 'info' : 'error') + '">' + esc(p) + (fix ? '<button type="button" class="fix-btn' + (tip ? ' tip' : '') + '" data-fix="' + fix + '">' + (tip ? 'Add it now →' : 'Fix this now →') + '</button>' : '') + '</div>';
    }).join('');
    var doc = buildDoc();
    renderDocHTML(doc, $('docPreview'));
    $('docStatus').className = 'status-banner awaiting';
    $('docStatus').textContent = 'Quote ' + draft.ref + ' · ' + money(pricing.clientPrice) + ' · Awaiting acceptance';
    ['btnShare', 'btnDownload', 'btnOpenPdf', 'btnEmailDraft', 'btnClientAccept'].forEach(function (id) { $(id).disabled = block.length > 0; });
    var probe = null; try { probe = new File([new Blob(['x'], { type: 'application/pdf' })], 'probe.pdf', { type: 'application/pdf' }); } catch (e) {}
    $('shareHelp').innerHTML = canShareFiles(probe) ? '<p class="small ok-text">✓ This browser can share the PDF file directly to WhatsApp, Mail and Gmail.</p>' : '<p class="small muted">This browser cannot share files directly (common on desktop). Share PDF will download the file instead, then attach it.</p>';
  }
  function sendAction(fn) {
    return function () {
      if (blocking().length) { toast('Fix the problems listed first'); return; }
      var rec = saveAwaiting();
      fn(rec.doc, $('shareHelp'));
      renderSaved();
    };
  }

  // ---------------- client accept overlay ----------------
  function openClient() {
    if (blocking().length) { toast('Fix the problems listed first'); return; }
    var rec = saveAwaiting();
    renderDocHTML(rec.doc, $('clientDoc'));
    $('accName').value = ''; $('accAgree').checked = false; $('btnAccept').disabled = true;
    $('ovDiscount').value = draft.discountPct ? draft.discountPct : ''; renderOvPrice(rec.doc);
    $('ovStart').value = draft.startDate || ''; $('ovDays').value = draft.durationDays || '';
    $('accAgreeText').textContent = ACCEPT_STATEMENT;
    $('acceptForm').hidden = false; $('acceptDone').hidden = true; acceptedRecId = null;
    $('clientOverlay').hidden = false; document.body.style.overflow = 'hidden'; sigSetup();
    $('clientOverlay').querySelector('.overlay-body').scrollTop = 0;
  }
  // ---- signature pad ----
  var sig = { has: false, drawing: false, ctx: null };
  function sigSetup() {
    var cv = $('sigPad'); var r = cv.getBoundingClientRect(); var dpr = Math.max(1, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#10223f';
    ctx.clearRect(0, 0, r.width, r.height);
    sig.ctx = ctx; sig.has = false; sig.drawing = false; updateAcceptBtn();
  }
  function sigPos(e) { var r = $('sigPad').getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function sigBind() {
    var cv = $('sigPad');
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} sig.drawing = true; var p = sigPos(e); sig.ctx.beginPath(); sig.ctx.moveTo(p.x, p.y); sig.ctx.lineTo(p.x + 0.1, p.y + 0.1); sig.ctx.stroke(); sig.last = p; sig.len = 0; });
    cv.addEventListener('pointermove', function (e) { if (!sig.drawing) return; e.preventDefault(); var p = sigPos(e); sig.ctx.beginPath(); sig.ctx.moveTo(sig.last.x, sig.last.y); sig.ctx.lineTo(p.x, p.y); sig.ctx.stroke(); sig.len += Math.hypot(p.x - sig.last.x, p.y - sig.last.y); sig.last = p; if (sig.len > 25 && !sig.has) { sig.has = true; updateAcceptBtn(); } });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { cv.addEventListener(ev, function () { sig.drawing = false; }); });
    $('btnSigClear').addEventListener('click', function () { sigSetup(); });
  }
  function sigImage() {
    // white background, trimmed-size PNG for the record and PDF
    var src = $('sigPad'); var out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
    var c = out.getContext('2d'); c.fillStyle = '#ffffff'; c.fillRect(0, 0, out.width, out.height); c.drawImage(src, 0, 0);
    var scale = Math.min(1, 600 / out.width); var o2 = document.createElement('canvas'); o2.width = Math.round(out.width * scale); o2.height = Math.round(out.height * scale);
    var c2 = o2.getContext('2d'); c2.drawImage(out, 0, 0, o2.width, o2.height);
    return o2.toDataURL('image/png');
  }
  function renderOvPrice(doc) {
    var p = doc.price;
    $('ovPrice').innerHTML = 'Price to accept: <b>' + money(p.amount) + '</b>' + (p.gstRegistered ? ' incl GST' : '') +
      (p.discountPct > 0 ? '<br><span class="small">Includes ' + fmtPct(p.discountPct) + ' discount (was ' + money(p.listPrice) + ', you save ' + money(p.discountAmount) + ')</span>' : '');
    $('ovDiscountNote').textContent = p.discountPct > 0 ? 'Discount applied: ' + fmtPct(p.discountPct) + ' off. The quote above and the signed PDF show the new price.' : 'Type a percentage and the price on the quote above updates straight away.';
  }
  function applyOvDiscount() {
    var v = Math.min(100, Math.max(0, num($('ovDiscount').value, 0)));
    if (v === (Number(draft.discountPct) || 0)) return;
    draft.discountPct = v; saveDraft(); recalc();
    $('inDiscount').value = v ? v : '';
    var rec = saveAwaiting();
    var body = $('clientOverlay').querySelector('.overlay-body'), keep = body.scrollTop;
    renderDocHTML(rec.doc, $('clientDoc')); renderOvPrice(rec.doc); body.scrollTop = keep;
    // the client must sign the final price: clear anything already signed or ticked
    if (sig.has || $('accAgree').checked) { $('accAgree').checked = false; sigSetup(); toast('Price changed – please sign again'); }
    renderSaved();
  }
  function applyOvSchedule() {
    var sd = $('ovStart').value || '', dd = $('ovDays').value === '' ? '' : Math.max(0, num($('ovDays').value, 0));
    if (sd === (draft.startDate || '') && String(dd) === String(draft.durationDays || '')) return;
    draft.startDate = sd; draft.durationDays = dd; saveDraft();
    $('qStart').value = sd; $('qDays').value = dd;
    var rec = saveAwaiting();
    var body = $('clientOverlay').querySelector('.overlay-body'), keep = body.scrollTop;
    renderDocHTML(rec.doc, $('clientDoc')); body.scrollTop = keep;
    if (sig.has || $('accAgree').checked) { $('accAgree').checked = false; sigSetup(); toast('Details changed – please sign again'); }
    renderSaved();
  }
  var acceptedRecId = null;
  function closeClient() {
    $('clientOverlay').hidden = true; document.body.style.overflow = '';
    if (acceptedRecId) { var id = acceptedRecId; acceptedRecId = null; openRecord(id); }
  }
  function updateAcceptBtn() { $('btnAccept').disabled = !($('accName').value.trim().length >= 2 && $('accAgree').checked && sig.has); }
  function doAccept() {
    var rec = findRecord(draft.ref);
    if (!rec || rec.status === 'accepted') { toast('Nothing to accept'); return; }
    var name = $('accName').value.trim();
    var now = new Date();
    var doc = clone(rec.doc);
    // refresh with the exact content the client is looking at
    var signature = sigImage();
    var base = JSON.stringify(doc) + '|' + name + '|' + now.toISOString() + '|' + ACCEPT_STATEMENT + '|' + signature;
    $('btnAccept').disabled = true;
    sha256Hex(base).then(function (hash) {
      doc.acceptance = { name: name, at: now.toISOString(), atLabel: dateTimeLabel(now), statement: ACCEPT_STATEMENT, signature: signature, hash: hash, device: navigator.userAgent };
      rec.doc = doc; rec.status = 'accepted'; rec.acceptedAt = now.toISOString(); rec.updatedAt = now.toISOString();
      rec.internal = internalSnapshot();
      if (!persistRecords()) { toast('Could not save acceptance!'); return; }
      var oldRef = draft.ref;
      // the accepted quote is locked in Saved; clear the editor so the next job starts fresh
      // (it used to keep this client under a new number, which made duplicate quotes)
      draft = newDraft(); saveDraft(); fillMeasureInputs(); fillQuoteInputs(); recalc();
      acceptedRecId = rec.id;
      renderDocHTML(doc, $('clientDoc'));
      $('acceptForm').hidden = true;
      $('acceptDone').hidden = false;
      $('acceptDone').innerHTML = '<div class="alert ok"><b>Thank you, ' + esc(name) + '.</b> Quote ' + esc(oldRef) + ' was accepted on ' + esc(doc.acceptance.atLabel) + ' and saved.</div>' +
        '<p class="small">Hand the phone back to ' + esc(profile.contactPerson || 'the contractor') + '.</p><button class="btn primary block" type="button" id="btnAfterAccept">Contractor: open accepted quote – send PDF or create invoice</button>';
      $('btnAfterAccept').onclick = function () { closeClient(); };
      $('clientOverlay').querySelector('.overlay-body').scrollTop = 0;
      renderSaved();
    });
  }

  // ---------------- SAVED view ----------------
  function renderSaved() {
    var list = records.slice().sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); });
    $('savedList').innerHTML = list.length ? list.map(function (r) {
      return '<button type="button" class="saved-item" data-rec="' + esc(r.id) + '"><div class="s-top"><span>' + esc(r.ref) + ' · ' + esc(r.doc.client.name || 'No name') + '</span><span class="badge ' + r.status + '">' + (r.status === 'accepted' ? 'Accepted' : 'Saved – not signed') + '</span></div>' +
        '<div class="s-sub">' + (r.doc.jobLabel ? '<b>' + esc(r.doc.jobLabel.charAt(0).toUpperCase() + r.doc.jobLabel.slice(1)) + '</b> · ' : '') + esc(r.doc.client.address || '') + '</div><div class="s-sub">' + money(r.doc.price.amount) + (r.doc.schedule ? ' · start ' + esc(r.doc.schedule.startDate ? dateLabel(r.doc.schedule.startDate) : 'TBC') + (r.doc.schedule.durationDays ? ', ' + r.doc.schedule.durationDays + ' day' + (r.doc.schedule.durationDays === 1 ? '' : 's') : '') : '') + ' · ' + (r.status === 'accepted' ? 'accepted by ' + esc(r.doc.acceptance.name) + ', ' + esc(r.doc.acceptance.atLabel) : 'saved ' + esc(dateTimeLabel(r.updatedAt))) + '</div></button>';
    }).join('') : '<p class="muted">No saved quotes yet. Tap 💾 Save quote on the Quote screen to keep one and finish it later. Quotes are also saved when you share or download the PDF, or when a client accepts.</p>';
  }
  var deleteArmed = false;
  // ---------------- invoices ----------------
  function nextInvoiceNo() {
    var n = (load(K.invCounter, 0) || 0) + 1;
    records.forEach(function (r) { (r.invoices || []).forEach(function (iv) { var m = /(\d+)$/.exec(iv.number); if (m && Number(m[1]) >= n) n = Number(m[1]) + 1; }); });
    save(K.invCounter, n);
    return 'INV-' + String(n).padStart(4, '0');
  }
  function invoiceOptions(r) {
    var doc = r.doc, price = doc.price.amount, done = r.invoices || [];
    var invoiced = done.reduce(function (t, iv) { return t + iv.amount; }, 0);
    var remaining = Math.round((price - invoiced) * 100) / 100;
    var dep = depositOf(doc), opts = [];
    if (remaining <= 0.004) return opts;
    if (!done.length && dep) opts.push({ kind: 'deposit', label: 'Deposit invoice (' + dep.pct + '%)', amount: dep.amount, due: todayISO(), line: 'Deposit due (' + dep.pct + '% of the agreed price)' });
    if (done.length) opts.push({ kind: 'balance', label: 'Balance invoice (what is left)', amount: remaining, due: addDays(todayISO(), 7), line: 'Balance due' });
    else opts.push({ kind: 'full', label: 'Full amount invoice', amount: price, due: addDays(todayISO(), 7), line: 'Amount due' });
    return opts;
  }
  var invSel = 0;
  function renderInvoices(r) {
    var card = $('invCard');
    if (!r || r.status !== 'accepted') { card.hidden = true; return; }
    card.hidden = false;
    var opts = invoiceOptions(r);
    var needGst = profile.gstRegistered && !profile.gstNumber;
    $('invWarn').innerHTML = needGst ? '<div class="alert error">A tax invoice must show your GST number. Add it in My business details first.<button type="button" class="fix-btn" data-fix="pGstNo">Add GST number →</button></div>'
      : (!profile.bankAccountNumber ? '<div class="alert info">Tip: add your bank account so the invoice shows where to pay.<button type="button" class="fix-btn tip" data-fix="pBankAccNo">Add it now →</button></div>' : '');
    $('invCreate').hidden = !opts.length || needGst;
    if (invSel >= opts.length) invSel = 0;
    $('invOptions').innerHTML = opts.map(function (o, i) {
      return '<label class="inv-opt' + (i === invSel ? ' sel' : '') + '"><input type="radio" name="invKind" value="' + i + '"' + (i === invSel ? ' checked' : '') + '><span><b>' + esc(o.label) + '</b><br>' + money(o.amount) + (r.doc.price.gstRegistered ? ' incl GST' : '') + '</span></label>';
    }).join('');
    if (opts.length) $('invDue').value = opts[invSel].due;
    var list = r.invoices || [];
    $('invList').innerHTML = list.length ? '<h3>Created</h3>' + list.map(function (iv, i) {
      return '<div class="inv-item"><b>' + esc(iv.number) + '</b> · ' + esc(iv.lineLabel) + ' · <b>' + money(iv.amount) + '</b><div class="small muted">Dated ' + esc(iv.dateLabel) + ' · due ' + esc(iv.dueLabel) + '</div>' +
        '<div class="inv-btns"><button type="button" class="btn primary" data-inv-share="' + i + '">📤 Share</button><button type="button" class="btn" data-inv-dl="' + i + '">⬇️ Download</button><button type="button" class="btn" data-inv-open="' + i + '">👁 Open</button></div></div>';
    }).join('') : '';
    if (!opts.length && list.length) $('invList').insertAdjacentHTML('afterbegin', '<div class="alert ok">✓ The full agreed price has been invoiced.</div>');
  }
  function createInvoice() {
    var r = currentRecord(); if (!r || r.status !== 'accepted') return;
    var o = invoiceOptions(r)[invSel]; if (!o) return;
    var doc = r.doc, p = doc.price, reg = !!p.gstRegistered;
    var now = new Date(), dateISO = todayISO(), due = $('invDue').value || dateISO;
    var gst = reg ? Math.round(o.amount * 3 / 23 * 100) / 100 : 0;
    var previous = (r.invoices || []).reduce(function (t, iv) { return t + iv.amount; }, 0);
    var inv = {
      number: nextInvoiceNo(), kind: o.kind, lineLabel: o.line, createdAt: now.toISOString(),
      date: dateISO, dateLabel: dateLabel(dateISO), due: due, dueLabel: due === dateISO ? dateLabel(due) + ' (on receipt)' : dateLabel(due),
      quoteRef: doc.ref, acceptedLabel: doc.acceptance ? dateLabel(doc.acceptance.at.slice(0, 10)) : '',
      business: businessSnapshot(), client: clone(doc.client), gstRegistered: reg,
      description: (doc.jobDesc || 'Supply and install timber paling fence') + ' at ' + (doc.client.address || 'the job address') + ', as per quote ' + doc.ref + ' accepted' + (doc.acceptance ? ' by ' + doc.acceptance.name + ' on ' + doc.acceptance.atLabel : '') + '.' + (doc.schedule && doc.schedule.startDate ? ' Agreed start date: ' + doc.schedule.startLabel + '.' : ''),
      contractPrice: p.amount, contractList: p.listPrice, discountPct: p.discountPct || 0, discountAmount: p.discountAmount || 0,
      previous: Math.round(previous * 100) / 100, amount: o.amount, gst: gst, exGst: Math.round((o.amount - gst) * 100) / 100
    };
    r.invoices = (r.invoices || []).concat([inv]); r.updatedAt = now.toISOString();
    if (!persistRecords()) { toast('Could not save the invoice!'); return; }
    invSel = 0; renderInvoices(r); renderSaved();
    $('invHelp').innerHTML = '<div class="alert ok">✓ Invoice <b>' + esc(inv.number) + '</b> created for ' + money(inv.amount) + '. Tap <b>📤 Share</b> to send it by WhatsApp or email.</div>';
    toast('Invoice ' + inv.number + ' created');
  }
  function invFile(inv) {
    var blob = P.invoiceBlob(inv), name = P.invoiceFileName(inv), file = null;
    try { file = new File([blob], name, { type: 'application/pdf', lastModified: Date.now() }); } catch (e) {}
    return { blob: blob, file: file, name: name };
  }

  function openRecord(id) {
    var r = records.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    currentRecordId = id; deleteArmed = false; $('recDelete').textContent = '🗑 Delete record';
    renderDocHTML(r.doc, $('recPreview'));
    $('recStatus').className = 'status-banner ' + r.status;
    $('recStatus').textContent = r.status === 'accepted' ? '✔ Accepted by ' + r.doc.acceptance.name + ' · ' + r.doc.acceptance.atLabel + ' · locked' : 'Awaiting acceptance · last saved ' + dateTimeLabel(r.updatedAt);
    $('recEdit').hidden = r.status === 'accepted';
    $('recAccept').hidden = r.status === 'accepted'; $('recInvJump').hidden = r.status !== 'accepted';
    $('recEdit').textContent = '✏️ Open and keep editing this quote';
    var eb = $('recEdit'); if (r.status !== 'accepted') { eb.className = 'btn primary block'; eb.parentNode.insertBefore(eb, eb.parentNode.firstChild); eb.parentNode.insertBefore($('recAccept'), eb.nextSibling); } else { eb.className = 'btn block'; }
    if (r.status === 'accepted') $('recShare').parentNode.insertBefore($('recInvJump'), $('recShare').nextSibling);
    invSel = 0; $('invHelp').innerHTML = ''; renderInvoices(r);
    $('recHelp').innerHTML = r.status === 'accepted' ? '<p class="small muted">This is the exact version the client accepted. It cannot be edited; later price or business changes do not affect it. Use "Copy into a new quote" to change anything.</p>' : '';
    go('record');
  }
  function currentRecord() { return records.filter(function (x) { return x.id === currentRecordId; })[0]; }
  function loadIntoEditor(r, asNew, thenAccept) {
    // keep whatever is on screen safe before opening another quote
    var started = String(draft.input.length || '').trim() !== '' || String(draft.deck.input.length || '').trim() !== '' || draft.client.name.trim() !== '';
    var cur = findRecord(draft.ref);
    if (started && draft.ref !== r.ref && !(cur && cur.status === 'accepted') && !draft.acceptedFrom) saveAwaiting();
    draft = normDraft(clone(r.internal.draft));
    draft.options = Object.assign(clone(D.defaults.options), draft.options || {});
    if (asNew) { draft.ref = nextRef(); draft.id = 'd' + Date.now(); draft.issueDate = todayISO(); draft.expiryDate = addDays(draft.issueDate, profile.validityDays || 30); delete draft.acceptedFrom; }
    saveDraft(); fillMeasureInputs(); fillQuoteInputs(); recalc();
    if (thenAccept) { go('send'); if ($('view-send').classList.contains('active') && !blocking().length) openClient(); return; }
    go('quote');
    toast(asNew ? 'Copied into new quote ' + draft.ref : 'Editing ' + draft.ref);
  }

  // ---------------- SETTINGS ----------------
  function fillProfile() {
    $('pTrading').value = profile.tradingName; $('pLegal').value = profile.legalName; $('pContact').value = profile.contactPerson; $('pPhone').value = profile.phone; $('pEmail').value = profile.email;
    $('pAddress').value = profile.address; $('pGstReg').checked = !!profile.gstRegistered; $('pGstNo').value = profile.gstNumber; $('pNzbn').value = profile.nzbn; $('pBankAccName').value = profile.bankAccountName || ''; $('pBankAccNo').value = profile.bankAccountNumber || ''; $('pBankName').value = profile.bankName || ''; bankHint();
    $('pPrefix').value = profile.quotePrefix; $('pValidity').value = profile.validityDays; $('pTerms').value = profile.paymentTerms; $('pExclusions').value = profile.exclusions;
    $('pGstNo').disabled = !profile.gstRegistered;
  }
  function saveProfile() {
    var oldTerms = profile.paymentTerms, oldExcl = profile.exclusions;
    profile = {
      tradingName: $('pTrading').value.trim(), legalName: $('pLegal').value.trim(), contactPerson: $('pContact').value.trim(), phone: $('pPhone').value.trim(), email: $('pEmail').value.trim(),
      address: $('pAddress').value.trim(), gstRegistered: $('pGstReg').checked, gstNumber: $('pGstNo').value.trim(), nzbn: $('pNzbn').value.trim(), bankAccountName: $('pBankAccName').value.trim(), bankAccountNumber: formatNzAcc($('pBankAccNo').value), bankName: $('pBankName').value.trim(),
      quotePrefix: $('pPrefix').value.trim() || 'Q', validityDays: Math.max(1, Math.round(num($('pValidity').value, 30))), paymentTerms: $('pTerms').value, exclusions: $('pExclusions').value
    };
    save(K.profile, profile);
    if (draft.paymentTerms === oldTerms) draft.paymentTerms = profile.paymentTerms;
    if (draft.exclusions === oldExcl) draft.exclusions = profile.exclusions;
    fillQuoteInputs(); recalc();
    $('profileSaved').textContent = '✓ Saved ' + dateTimeLabel(new Date()) + '. Changes save automatically. Accepted quotes keep their original details.';
  }
  function allPriceItems() {
    var cat = catalogue();
    var dc = cat.deck;
    return [['#', 'Fences']].concat(cat.palings.map(function (x) { return ['Paling', x]; }), cat.posts.map(function (x) { return ['Post', x]; }), cat.rails.map(function (x) { return ['Rail', x]; }), [['Paling nails', cat.nails], ['Rail fixings', cat.railFix], ['Concrete (fences & decks)', cat.concrete]],
      [['#', 'Decks']], dc.boards.map(function (x) { return ['Decking', x]; }), dc.joists.map(function (x) { return ['Joist timber', x]; }), dc.bearers.map(function (x) { return ['Bearer', x]; }), dc.piles.map(function (x) { return ['Pile', x]; }),
      [['Decking screws', dc.screws]], dc.hangers.map(function (x) { return ['Joist hanger', x]; }), [['Joist ties', dc.ties], ['Wire dogs', dc.wireDogs], ['Stringer bolts', dc.bolts], ['Deck nails', dc.nails]]);
  }
  function renderPrices() {
    $('priceIntro').innerHTML = 'Bunnings NZ and Mitre 10 NZ public retail prices, <b>GST-inclusive</b>, checked ' + esc(D.priceCheckedLabel) + '. <span class="tag verified">checked</span> read from the store website. <span class="tag derived">derived</span> worked out from a checked price (e.g. a 6 m length ÷ 6 = price per metre). <span class="tag estimate">estimate</span> not sold online: ask your supplier and type the price. You can also change the supplier name. Your prices are saved on this phone.';
    $('priceList').innerHTML = allPriceItems().map(function (pair) {
      var kind = pair[0], it = pair[1];
      if (kind === '#') return '<h3 class="price-group">' + esc(it) + '</h3>';
      var extra = '', customBoard = customBoards.some(function (c) { return c.id === it.id; });
      if (it.perPack != null && it.unit === 'pack') extra = '<label class="small">Qty per pack <input type="number" inputmode="numeric" data-pack-id="' + esc(it.id) + '" value="' + esc(it.perPack) + '"></label>';
      if (it.yieldM3 != null) extra = '<label class="small">Yield per bag (m³) <input type="number" inputmode="decimal" step="0.0005" data-yield-id="' + esc(it.id) + '" value="' + esc(it.yieldM3) + '"></label>';
      return '<div class="price-row"><div class="pr-top"><div><b>' + esc(kind) + ':</b> ' + esc(it.name) + '</div></div>' +
        '<div class="small">' + (it.item ? 'I/N ' + esc(it.item) + ' · ' : '') + '<a href="' + esc(it.url || '#') + '" target="_blank" rel="noopener">' + esc(it.url || 'no link') + '</a></div>' +
        '<div class="small muted">' + esc(it.note || '') + '</div>' +
        '<div class="row-gap">' + statusTag(it) + ' <span class="small">Researched ' + money(it.researchedPrice) + (it.unit === 'lm' ? '/m' : '') + '</span> <label class="small">Your price $<input type="number" inputmode="decimal" step="0.01" data-price-id="' + esc(it.id) + '" value="' + Number(it.price).toFixed(2) + '">' + (it.unit === 'lm' ? ' per metre' : '') + '</label>' + extra +
        ' <label class="small">Supplier <input type="text" list="supplierList" data-sup-id="' + esc(it.id) + '" value="' + esc(it.supplier || '') + '" style="width:130px"></label>' +
        (it.overridden || (priceOverrides[it.id] || {}).supplier ? '<button type="button" class="btn small ghost" data-reset-price="' + esc(it.id) + '">Reset</button>' : '') +
        (customBoard ? '<button type="button" class="btn small danger" data-del-board="' + esc(it.id) + '">Remove</button>' : '') + '</div></div>';
    }).join('');
  }
  function setOverride(id, field, val) {
    var o = priceOverrides[id] || {};
    if (val === '' || val == null || !isFinite(Number(val))) delete o[field]; else o[field] = Number(val);
    priceOverrides[id] = o; save(K.prices, priceOverrides);
  }
  function renderPalings() {
    var cat = catalogue();
    $('palingList').innerHTML = cat.palings.map(function (p) {
      var custom = customPalings.some(function (c) { return c.id === p.id; });
      return '<div class="price-row"><div class="pr-top"><div><b>' + esc(p.name) + '</b><div class="small">' + (p.lengthM * 1000) + ' mm long · ' + p.widthMm + ' mm wide · ' + money(p.price) + ' each' + (p.supplier ? ' · ' + esc(p.supplier) : '') + (p.item ? ' · ' + esc(p.item) : '') + '</div></div>' +
        (custom ? '<button type="button" class="btn small danger" data-del-paling="' + esc(p.id) + '">Remove</button>' : '<span class="tag verified">built-in</span>') + '</div></div>';
    }).join('');
  }
  var lastPalingId = null;
  function addPaling(o) {
    var len = num(o.length_mm, 0), w = num(o.width_mm, 150), pr = num(o.price, NaN);
    if (!(len >= 300 && len <= 6000)) return 'length_mm must be 300–6000';
    if (!(w >= 50 && w <= 300)) return 'width_mm must be 50–300';
    if (!(pr >= 0)) return 'price missing';
    var newId = 'c' + Date.now() + Math.floor(Math.random() * 1000); lastPalingId = newId;
    customPalings.push({ id: newId, name: String(o.name || (w + ' × ' + len + ' mm paling')).trim(), item: String(o.item || '').trim(), supplier: String(o.supplier || '').trim() || 'Custom', url: String(o.url || '').trim(), lengthM: len / 1000, widthMm: w, price: pr, unit: 'each', status: 'verified', checked: dateLabel(todayISO()), note: 'Added by you.' });
    save(K.palings, customPalings);
    return null;
  }
  function parseCSV(text) {
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim(); }); });
  }
  function importCSV(text) {
    var rows = parseCSV(text); if (rows.length < 2) return 'Need a header row and at least one paling.';
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    if (head.indexOf('length_mm') < 0 || head.indexOf('price') < 0) return 'Header must include length_mm and price.';
    var ok = 0, bad = [];
    rows.slice(1).forEach(function (r, i) { var o = {}; head.forEach(function (h, j) { o[h] = (r[j] || '').trim(); }); var err = addPaling(o); if (err) bad.push('row ' + (i + 2) + ': ' + err); else ok++; });
    return 'Imported ' + ok + ' paling' + (ok === 1 ? '' : 's') + '.' + (bad.length ? ' Skipped ' + bad.join('; ') : '');
  }
  function renderRules() {
    $('rulesList').innerHTML = D.sources.concat([{ head: 'Decks' }], D.deckSources).map(function (s) {
      if (s.head) return '<h3 class="price-group">' + esc(s.head) + '</h3>';
      return '<div class="rule-item"><span class="tag ' + (s.kind === 'rule' ? 'consent' : 'design') + '">' + (s.kind === 'rule' ? 'Rule / official' : 'Guidance') + '</span> <a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a><div class="small">' + esc(s.summary) + '</div></div>';
    }).join('') + '<p class="small muted">Sources checked 23 Nov 2026. Auckland rules differ by zone, overlay and precinct: check the property on Auckland Council GeoMaps. Not legal advice.</p>';
    $('assumptionList').innerHTML = D.assumptions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');
    $('deckAssumptionList').innerHTML = D.deckAssumptions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');
  }
  function renderStorageInfo() {
    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    var bytes = 0; try { for (var k in localStorage) if (k.indexOf('fq_') === 0) bytes += (localStorage.getItem(k) || '').length; } catch (e) {}
    var html = '<p>' + (storageOk ? '✓ Storage working.' : '⚠️ Storage is blocked in this browser mode (private browsing?). Records will not be kept.') + ' Running ' + (standalone ? '<b>as Home Screen app</b>' : 'in the <b>browser</b>') + '. ' + records.length + ' saved quote(s), ~' + Math.max(1, Math.round(bytes / 1024)) + ' KB.</p>';
    $('storageInfo').innerHTML = html;
    if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(function (p) { $('storageInfo').innerHTML += '<p>' + (p ? '✓ Browser has granted persistent storage.' : 'Browser may clear data if the phone runs low on space or the site goes unused for a long time: export backups.') + '</p>'; });
  }
  function backupObj() { return { app: 'fence-quote-nz', version: APP_VERSION, exportedAt: new Date().toISOString(), profile: profile, draft: draft, prices: priceOverrides, palings: customPalings, boards: customBoards, records: records }; }
  function backupFile() {
    var name = 'fence-quote-backup-' + todayISO() + '.json';
    var blob = new Blob([JSON.stringify(backupObj(), null, 1)], { type: 'application/json' });
    return { blob: blob, name: name };
  }
  function importBackup(text) {
    var o; try { o = JSON.parse(text); } catch (e) { return 'Not a valid backup file.'; }
    if (!o || o.app !== 'fence-quote-nz' || !Array.isArray(o.records)) return 'This is not a Fence Quote NZ backup.';
    var added = 0, kept = 0;
    o.records.forEach(function (r) {
      var ex = records.filter(function (x) { return x.id === r.id || (x.ref === r.ref && x.status === 'accepted'); })[0];
      if (!ex) { records.push(r); added++; }
      else if (ex.status !== 'accepted' && r.status === 'accepted') { records[records.indexOf(ex)] = r; added++; }
      else kept++;
    });
    if (o.profile) profile = Object.assign(clone(D.defaults.profile), o.profile);
    if (o.prices) priceOverrides = o.prices;
    if (Array.isArray(o.palings)) { var ids = customPalings.map(function (p) { return p.id; }); o.palings.forEach(function (p) { if (ids.indexOf(p.id) < 0) customPalings.push(p); }); }
    if (Array.isArray(o.boards)) { var bids = customBoards.map(function (p) { return p.id; }); o.boards.forEach(function (p) { if (bids.indexOf(p.id) < 0) customBoards.push(p); }); }
    save(K.profile, profile); save(K.prices, priceOverrides); save(K.palings, customPalings); save(K.boards, customBoards); persistRecords();
    fillProfile(); fillMeasureInputs(); recalc(); renderSaved();
    return 'Imported: ' + added + ' quote(s) added, ' + kept + ' already on this phone (accepted records are never overwritten). Business profile and prices restored.';
  }

  // ---------------- navigation ----------------
  // Required details: never let the quote move on to Send without them.
  function missingRequired() {
    var m = [];
    if (!draft.jobs.fence && !draft.jobs.deck) m.push({ id: 'jobFence', view: 'measure', label: 'job type (Fence or Deck)' });
    if (draft.jobs.fence && !(Number(draft.input.length) > 0)) m.push({ id: 'inLength', view: 'measure', label: 'fence length' });
    if (draft.jobs.deck && !(Number(draft.deck.input.length) > 0)) m.push({ id: 'dLength', view: 'measure', label: 'deck length' });
    if (draft.jobs.deck && !(Number(draft.deck.input.width) > 0)) m.push({ id: 'dWidth', view: 'measure', label: 'deck width' });
    if (!draft.client.name.trim()) m.push({ id: 'cName', view: 'quote', label: "client's name" });
    if (!draft.client.address.trim()) m.push({ id: 'cAddress', view: 'quote', label: 'job address' });
    return m;
  }
  function showMissing(m) {
    var labels = m.map(function (x) { return x.label; });
    var txt = labels.length === 1 ? labels[0] : labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
    var first = m[0];
    go(first.view, true);
    m.forEach(function (x) { var el = $(x.id); if (el) el.classList.add('missing'); });
    var q = m.filter(function (x) { return x.view === 'quote'; });
    if (q.length) { $('clientMissing').hidden = false; $('clientMissing').textContent = '⚠ Please enter the ' + q.map(function (x) { return x.label; }).join(' and ') + ' before you can preview, send or get it signed.'; }
    var el = $(first.id);
    setTimeout(function () { el.scrollIntoView({ block: 'center' }); try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }, 60);
    toast('Enter the ' + txt + ' first');
  }
  function clearMissing() {
    ['inLength', 'dLength', 'dWidth', 'cName', 'cAddress'].forEach(function (id) { var el = $(id); if (el && el.value.trim()) el.classList.remove('missing'); });
    var m = missingRequired().filter(function (x) { return x.view === 'quote'; });
    if (!m.length) $('clientMissing').hidden = true;
    else if (!$('clientMissing').hidden) $('clientMissing').textContent = '⚠ Please enter the ' + m.map(function (x) { return x.label; }).join(' and ') + ' before you can preview, send or get it signed.';
  }
  // ---------------- voice dictation (Web Speech API) ----------------
  // Phones end a recognition session after a short pause, so we keep restarting
  // it until the tradie taps stop (or leaves the screen).
  var dict = { on: false, rec: null, btn: null, target: null, label: '', restarts: [], fatal: false };
  function speechCtor() { return window.SpeechRecognition || window.webkitSpeechRecognition || null; }
  function setLive(text) { var el = dict.btn && dict.btn.parentNode.querySelector('.dictate-live'); if (el) { el.textContent = text || ''; el.hidden = !text; } }
  function stopDictation() {
    if (!dict.on) return;
    dict.on = false;
    if (dict.rec) { try { dict.rec.stop(); } catch (e) {} }
    finishDictation();
  }
  function finishDictation() {
    if (dict.btn) { dict.btn.classList.remove('listening'); dict.btn.textContent = dict.label; }
    setLive('');
    dict.rec = null; dict.on = false;
  }
  function appendSpoken(ta, text) {
    text = String(text || '').trim(); if (!text) return;
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text)) text += '.';
    var cur = ta.value.replace(/\s+$/, '');
    if (ta.id === 'qExclusions') ta.value = (cur ? cur + '\n' : '') + text;
    else ta.value = cur ? cur + (/[.!?:]$/.test(cur) ? ' ' : '. ') + text : text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function startSession() {
    var Ctor = speechCtor(), ta = dict.target, rec;
    try { rec = new Ctor(); } catch (e) { return false; }
    rec.lang = 'en-NZ'; rec.interimResults = true; rec.maxAlternatives = 1;
    // Android Chrome ignores 'continuous' (and repeats earlier words if it's on), so there we take
    // one sentence per session and restart straight away until the tradie taps stop.
    rec.continuous = !/Android/i.test(navigator.userAgent || '');
    rec.onresult = function (ev) {
      var interim = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) appendSpoken(ta, ev.results[i][0].transcript);
        else interim += ev.results[i][0].transcript;
      }
      setLive(interim ? '“' + interim.trim() + '…”' : '');
      dict.short = 0;
    };
    rec.onerror = function (ev) {
      var fatal = { 'not-allowed': 'Microphone blocked: allow the microphone for this app in your phone settings, or use the 🎤 key on your keyboard', 'service-not-allowed': 'Voice not allowed here: use the 🎤 key on your keyboard', 'audio-capture': 'No microphone found', 'network': 'Voice needs internet – or use the 🎤 key on your keyboard', 'language-not-supported': 'Voice not available for NZ English here – use the 🎤 key on your keyboard' }[ev.error];
      if (fatal) { dict.fatal = true; toast(fatal); }
      // 'no-speech' and 'aborted' are normal pauses: onend restarts
    };
    rec.onend = function () {
      if (dict.rec !== rec) return;
      setLive('');
      if (!dict.on || dict.fatal) { finishDictation(); return; }
      // only give up if sessions keep dying instantly (broken mic/permission), not on normal pauses
      dict.short = (Date.now() - rec.__t0 < 1000) ? (dict.short || 0) + 1 : 0;
      if (dict.short >= 5) { var b5 = dict.btn; finishDictation(); keyboardDictation(b5, 'The voice button keeps stopping on this phone.'); return; }
      setTimeout(function () { if (dict.on && dict.rec === rec) { if (!startSession()) { var b6 = dict.btn; finishDictation(); keyboardDictation(b6, 'Voice stopped on this phone.'); } } }, 150);
    };
    try { rec.start(); } catch (e) { return false; }
    rec.__t0 = Date.now();
    dict.rec = rec;
    return true;
  }
  function isIOS() { var ua = navigator.userAgent || ''; return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  // iPhone: Safari's built-in voice API stops after a few seconds and can't be restarted
  // without another tap, so use the phone's own keyboard dictation, which keeps going.
  function keyboardDictation(btn, why) {
    var ta = $(btn.getAttribute('data-dictate'));
    var v = ta.value.replace(/\s+$/, '');
    if (v && ta.value !== v + '\n') { ta.value = v + '\n'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) { ta.focus(); }
    var help = btn.parentNode.querySelector('.dictate-help');
    if (help) {
      help.innerHTML = (why ? '<b>' + esc(why) + '</b><br>' : '') + 'Now tap the <b>🎤 microphone key</b> on your keyboard (Samsung: in the row along the top of the keyboard; iPhone: bottom right) and talk. It keeps listening until you tap the keyboard again or tap Done. Your words go straight into the box.';
      help.hidden = false;
    }
  }
  function toggleDictation(btn) {
    if (dict.on) { var same = dict.btn === btn; stopDictation(); if (same) return; }
    var ta = $(btn.getAttribute('data-dictate'));
    if (isIOS() || !speechCtor()) { keyboardDictation(btn); return; }
    if (!btn.getAttribute('data-label')) btn.setAttribute('data-label', btn.textContent);
    dict = { on: true, rec: null, btn: btn, target: ta, label: btn.getAttribute('data-label'), restarts: [], fatal: false };
    if (!startSession()) { finishDictation(); toast('Voice not available: use the 🎤 key on your keyboard'); return; }
    btn.classList.add('listening'); btn.textContent = '■ Listening… tap to stop';
  }

  var bizReturnTo = null;
  function go(view, skipCheck) {
    stopDictation();
    if (view === 'send' && !skipCheck) { var miss = missingRequired(); if (miss.length) { showMissing(miss); return; } }
    document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + view); });
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-goto') === view || (view === 'record' && t.getAttribute('data-goto') === 'saved')); });
    if (view === 'send') renderSend();
    if (view === 'saved') renderSaved();
    if (view === 'settings') { renderPrices(); renderPalings(); renderRules(); renderStorageInfo(); }
    window.scrollTo(0, 0);
  }
  function setTab(name) {
    document.querySelectorAll('.seg-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-settab') === name); });
    document.querySelectorAll('.settab').forEach(function (s) { s.classList.toggle('active', s.id === 'set-' + name); });
    if (name === 'data') renderStorageInfo();
  }
  var toastTimer;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200); }

  // ---------------- events ----------------
  function bind() {
    document.addEventListener('click', function (e) {
      var sq = e.target.closest('[data-savequote]');
      if (sq) {
        var started = String(draft.input.length || '').trim() !== '' || String(draft.deck.input.length || '').trim() !== '' || draft.client.name.trim() !== '';
        if (!started) { toast('Nothing to save yet – enter a length or client name first'); return; }
        var rs = saveAwaiting(); renderSaved();
        sq.textContent = '✓ Saved'; sq.classList.add('saved-flash');
        setTimeout(function () { sq.textContent = '💾 Save quote – finish it later'; sq.classList.remove('saved-flash'); }, 2500);
        toast('✓ Quote ' + rs.ref + ' saved. Find it under Saved to carry on later.');
        return;
      }
      var dk = e.target.closest('[data-dictate]');
      if (dk) { toggleDictation(dk); return; }
      var be = e.target.closest('[data-bizedit]');
      if (be) {
        bizReturnTo = document.querySelector('.view.active').id.replace('view-', '');
        go('settings'); setTab('profile'); fillProfile();
        $('btnBizReturn').hidden = !(bizReturnTo === 'measure' || bizReturnTo === 'quote' || bizReturnTo === 'send');
        $('btnBizReturn').textContent = '← Back to your quote (' + ({ measure: 'Measure', quote: 'Quote', send: 'Send' }[bizReturnTo] || '') + ')';
        return;
      }
      var fx = e.target.closest('[data-fix]');
      if (fx) {
        var id = fx.getAttribute('data-fix');
        var view = { cName: 'quote', cAddress: 'quote', qScope: 'quote', inLength: 'measure', dLength: 'measure', dWidth: 'measure', jobFence: 'measure', pTrading: 'settings', pBankAccNo: 'settings', pGstNo: 'settings' }[id];
        if (id === 'cName' || id === 'cAddress') { var mm = missingRequired().filter(function (x) { return x.id === id; }); if (!mm.length) mm = [{ id: id, view: view, label: id === 'cName' ? "client's name" : 'job address' }]; showMissing(mm.concat(missingRequired().filter(function (x) { return x.id !== id && x.view === 'quote'; }))); return; }
        var from = document.querySelector('.view.active').id.replace('view-', ''); go(view, true); if (view === 'settings') { setTab('profile'); fillProfile(); bizReturnTo = from; $('btnBizReturn').hidden = false; $('btnBizReturn').textContent = '← Back to your quote'; }
        var target = $(id); target.classList.add('missing');
        setTimeout(function () { target.scrollIntoView({ block: 'center' }); try { target.focus({ preventScroll: true }); } catch (er) { target.focus(); } }, 60);
        return;
      }
      var g = e.target.closest('[data-goto]');
      if (g) { go(g.getAttribute('data-goto')); var st = g.getAttribute('data-settab'); if (st && g.classList.contains('btn')) setTab(st); return; }
      var s = e.target.closest('.seg-btn'); if (s) { setTab(s.getAttribute('data-settab')); return; }
      var rp = e.target.closest('[data-remove-person]'); if (rp) { draft.labour.splice(Number(rp.getAttribute('data-remove-person')), 1); renderLabour(); recalc(); return; }
      var re = e.target.closest('[data-remove-extra]'); if (re) { draft.extras.splice(Number(re.getAttribute('data-remove-extra')), 1); renderExtras(); recalc(); return; }
      var rec = e.target.closest('[data-rec]'); if (rec) { openRecord(rec.getAttribute('data-rec')); return; }
      var rs = e.target.closest('[data-reset-price]'); if (rs) { delete priceOverrides[rs.getAttribute('data-reset-price')]; save(K.prices, priceOverrides); renderPrices(); fillPalingSelect(); fillDeckSelects(); recalc(); return; }
      var db = e.target.closest('[data-del-board]'); if (db) { var bid = db.getAttribute('data-del-board'); customBoards = customBoards.filter(function (p) { return p.id !== bid; }); save(K.boards, customBoards); if (draft.deck.options.boardId === bid) draft.deck.options.boardId = D.deckDefaults.options.boardId; renderPrices(); fillDeckSelects(); recalc(); return; }
      var dp = e.target.closest('[data-del-paling]'); if (dp) { var id = dp.getAttribute('data-del-paling'); customPalings = customPalings.filter(function (p) { return p.id !== id; }); save(K.palings, customPalings); if (draft.options.palingId === id) draft.options.palingId = 'auto'; renderPalings(); fillPalingSelect(); recalc(); return; }
    });
    // measure inputs
    $('inLength').addEventListener('input', function () { draft.input.length = this.value; recalc(); });
    $('inHeight').addEventListener('input', function () { draft.input.height = this.value; recalc(); });
    $('selPaling').addEventListener('change', function () { draft.options.palingId = this.value; recalc(); });
    $('btnShowNewPaling').addEventListener('click', function () { $('newPalingBox').hidden = false; this.hidden = true; if (!$('qpLen').value && Number(draft.input.height) > 0) $('qpLen').value = Math.ceil(((Number(draft.input.height) - (Number(draft.options.groundClearance) || 0)) * 1000) / 300) * 300; setTimeout(function () { $('qpName').focus(); }, 30); });
    $('btnCancelNewPaling').addEventListener('click', function () { $('newPalingBox').hidden = true; $('btnShowNewPaling').hidden = false; });
    $('btnSaveNewPaling').addEventListener('click', function () {
      var len = $('qpLen').value, w = $('qpWidth').value || 150;
      var err = !$('qpPrice').value ? 'enter the price each' : addPaling({ name: $('qpName').value || (w + ' × ' + len + ' mm paling'), length_mm: len, width_mm: w, price: $('qpPrice').value, supplier: $('qpSupplier').value, item: $('qpItem').value });
      if (err) { toast('Not saved: ' + err); return; }
      draft.options.palingId = lastPalingId;
      ['qpName', 'qpLen', 'qpPrice', 'qpSupplier', 'qpItem'].forEach(function (id) { $(id).value = ''; });
      $('newPalingBox').hidden = true; $('btnShowNewPaling').hidden = false;
      fillPalingSelect(); renderPalings(); recalc();
      toast('✓ New paling saved and selected');
    });
    // ---- jobs & deck ----
    function jobChange() { draft.jobs.fence = $('jobFence').checked; draft.jobs.deck = $('jobDeck').checked; if (!draft.scopeEdited) draft.scope = ''; recalc(); if (!draft.scopeEdited) $('qScope').value = draft.scope; this.classList && this.classList.remove('missing'); clearMissing(); }
    $('jobFence').addEventListener('change', jobChange); $('jobDeck').addEventListener('change', jobChange);
    [['dLength', 'length'], ['dWidth', 'width'], ['dHeight', 'height']].forEach(function (p) { $(p[0]).addEventListener('input', function () { draft.deck.input[p[1]] = this.value; recalc(); }); });
    $('dAttached').addEventListener('change', function () { draft.deck.options.attached = this.checked; recalc(); });
    $('dBoard').addEventListener('change', function () { draft.deck.options.boardId = this.value; recalc(); });
    $('dCentres').addEventListener('change', function () { draft.deck.options.joistCentres = Number(this.value); recalc(); });
    $('dJoist').addEventListener('change', function () { draft.deck.options.joistId = this.value; recalc(); });
    $('dBearer').addEventListener('change', function () { draft.deck.options.bearerId = this.value; recalc(); });
    var dOptMap = { dCant: ['cantilever', 1], dGap: ['boardGapMm', 1], dEmbed: ['pileEmbed', 0.001], dHoleDia: ['pileHoleDia', 0.001], dBoardWaste: ['boardWastePct', 1], dTimberWaste: ['timberWastePct', 1], dFixWaste: ['fixingWastePct', 1], dScrews: ['screwsPerCrossing', 1], dTies: ['tiesPerCrossing', 1], dDogs: ['wireDogsPerPile', 1], dBolts: ['boltCentres', 1] };
    Object.keys(dOptMap).forEach(function (id) { $(id).addEventListener('input', function () { var m = dOptMap[id]; draft.deck.options[m[0]] = this.value === '' ? D.deckDefaults.options[m[0]] : num(this.value, 0) * m[1]; recalc(); }); });
    $('dFront').addEventListener('change', function () { draft.deck.options.frontBoundary = this.checked; recalc(); });
    $('dCoastal').addEventListener('change', function () { draft.deck.options.coastal = this.checked; recalc(); });
    $('btnResetDeckOpts').addEventListener('click', function () { var keep = { attached: draft.deck.options.attached, boardId: draft.deck.options.boardId, joistCentres: draft.deck.options.joistCentres, joistId: draft.deck.options.joistId, bearerId: draft.deck.options.bearerId }; draft.deck.options = Object.assign(clone(D.deckDefaults.options), keep); fillDeckInputs(); recalc(); toast('Deck options reset'); });
    $('btnShowNewBoard').addEventListener('click', function () { $('newBoardBox').hidden = false; this.hidden = true; setTimeout(function () { $('dnbName').focus(); }, 30); });
    $('btnCancelNewBoard').addEventListener('click', function () { $('newBoardBox').hidden = true; $('btnShowNewBoard').hidden = false; });
    $('btnSaveNewBoard').addEventListener('click', function () {
      var w = num($('dnbWidth').value, 0), th = num($('dnbThick').value, 32), pr = num($('dnbPrice').value, NaN);
      if (!(w >= 40 && w <= 300)) { toast('Not saved: enter the board width in mm (40–300)'); return; }
      if (!(pr >= 0)) { toast('Not saved: enter the price per metre'); return; }
      var id = 'cb' + Date.now();
      customBoards.push({ id: id, name: ($('dnbName').value.trim() || (w + ' × ' + th + ' decking')), widthMm: w, thicknessMm: th, price: pr, unit: 'lm', supplier: $('dnbSupplier').value.trim() || 'Custom', item: $('dnbItem').value.trim(), url: '', status: 'verified', checked: dateLabel(todayISO()), note: 'Added by you.' });
      save(K.boards, customBoards); draft.deck.options.boardId = id;
      ['dnbName', 'dnbWidth', 'dnbThick', 'dnbPrice', 'dnbSupplier', 'dnbItem'].forEach(function (x) { $(x).value = ''; });
      $('newBoardBox').hidden = true; $('btnShowNewBoard').hidden = false; fillDeckSelects(); recalc(); toast('✓ New decking board saved and selected');
    });
    var optMap = { optMaxCentres: ['maxCentres', 1], optEmbedment: ['embedment', 1], optHoleDia: ['holeDiameter', 0.001], optClearance: ['groundClearance', 0.001], optGap: ['palingGapMm', 1], optWaste: ['palingWastePct', 1], optFixWaste: ['fixingWastePct', 1], optNailsPer: ['nailsPerPalingPerRail', 1] };
    Object.keys(optMap).forEach(function (id) { $(id).addEventListener('input', function () { var m = optMap[id]; draft.options[m[0]] = this.value === '' ? this.value : num(this.value, 0) * m[1]; recalc(); }); });
    $('optRailRows').addEventListener('change', function () { draft.options.railRows = this.value; recalc(); });
    $('optRail').addEventListener('change', function () { draft.options.railId = this.value; recalc(); });
    ['optExposure', 'optGround', 'optSpecial'].forEach(function (id) { $(id).addEventListener('change', function () { draft.options[{ optExposure: 'exposure', optGround: 'ground', optSpecial: 'special' }[id]] = this.value; recalc(); }); });
    $('optFront').addEventListener('change', function () { draft.options.frontYard = this.checked; recalc(); });
    $('btnResetOpts').addEventListener('click', function () { var pid = draft.options.palingId; draft.options = clone(D.defaults.options); draft.options.palingId = pid; fillMeasureInputs(); recalc(); toast('Options reset'); });
    // price edits (takeoff and settings)
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-sup-id')) { var so = priceOverrides[t.getAttribute('data-sup-id')] || {}; if (t.value.trim()) so.supplier = t.value.trim(); else delete so.supplier; priceOverrides[t.getAttribute('data-sup-id')] = so; save(K.prices, priceOverrides); fillPalingSelect(); fillDeckSelects(); recalc(); toast('Supplier saved'); }
      if (t.hasAttribute('data-price-id')) { setOverride(t.getAttribute('data-price-id'), 'price', t.value); fillPalingSelect(); fillDeckSelects(); recalc(); if ($('view-settings').classList.contains('active')) renderPrices(); toast('Price saved for future quotes'); }
      if (t.hasAttribute('data-pack-id')) { setOverride(t.getAttribute('data-pack-id'), 'perPack', t.value); recalc(); }
      if (t.hasAttribute('data-yield-id')) { setOverride(t.getAttribute('data-yield-id'), 'yieldM3', t.value); recalc(); }
    });
    // labour & extras
    $('labourList').addEventListener('input', function (e) {
      var card = e.target.closest('[data-i]'); if (!card) return; var i = Number(card.getAttribute('data-i')); var f = e.target.getAttribute('data-f');
      draft.labour[i][f] = f === 'name' ? e.target.value : e.target.value; recalc();
    });
    $('btnAddPerson').addEventListener('click', function () { draft.labour.push({ name: '', hours: '', rate: '' }); renderLabour(); recalc(); var ins = $('labourList').querySelectorAll('[data-f="name"]'); ins[ins.length - 1].focus(); });
    $('extrasList').addEventListener('input', function (e) {
      var card = e.target.closest('[data-ei]'); if (!card) return; var i = Number(card.getAttribute('data-ei')); var f = e.target.getAttribute('data-f');
      draft.extras[i][f] = e.target.value; recalc();
    });
    $('btnAddExtra').addEventListener('click', function () { draft.extras.push({ desc: '', amount: '' }); renderExtras(); recalc(); });
    $('inMargin').addEventListener('input', function () { draft.marginPct = num(this.value, 0); recalc(); });
    $('inDiscount').addEventListener('input', function () { draft.discountPct = Math.min(100, Math.max(0, num(this.value, 0))); recalc(); });
    $('inRound').addEventListener('change', function () { draft.roundTo = Number(this.value); recalc(); });
    // client & quote doc fields
    [['cName', 'name'], ['cAddress', 'address'], ['cPhone', 'phone'], ['cEmail', 'email']].forEach(function (p) { $(p[0]).addEventListener('input', function () { draft.client[p[1]] = this.value; saveDraft(); }); });
    ['cName', 'cAddress', 'inLength', 'dLength', 'dWidth', 'qScope', 'pTrading'].forEach(function (id) { var el = $(id); if (el) el.addEventListener('input', function () { if (this.value.trim()) this.classList.remove('missing'); clearMissing(); }); });
    $('qRef').addEventListener('change', function () { var v = this.value.trim(); var r = findRecord(v); if (!v || (r && r.status === 'accepted')) { toast(v ? 'Ref ' + v + ' is already accepted. Pick another.' : 'Ref required'); this.value = draft.ref; return; } draft.ref = v; saveDraft(); $('refBadge').textContent = v; });
    $('qIssue').addEventListener('change', function () { draft.issueDate = this.value; draft.expiryDate = addDays(this.value, profile.validityDays || 30); $('qExpiry').value = draft.expiryDate; saveDraft(); });
    $('qExpiry').addEventListener('change', function () { draft.expiryDate = this.value; saveDraft(); });
    $('qScope').addEventListener('input', function () { draft.scope = this.value; draft.scopeEdited = true; saveDraft(); });
    $('btnRegenScope').addEventListener('click', function (e) { e.preventDefault(); draft.scopeEdited = false; draft.scope = buildScope(); $('qScope').value = draft.scope; saveDraft(); toast('Scope rebuilt from takeoff'); });
    $('qExclusions').addEventListener('input', function () { draft.exclusions = this.value; saveDraft(); });
    $('qTerms').addEventListener('input', function () { draft.paymentTerms = this.value; saveDraft(); });
    // send
    $('btnShare').addEventListener('click', sendAction(shareDoc));
    $('btnDownload').addEventListener('click', sendAction(downloadDoc));
    $('btnOpenPdf').addEventListener('click', sendAction(function (doc) { openDoc(doc); }));
    $('btnEmailDraft').addEventListener('click', sendAction(emailDraft));
    $('btnClientAccept').addEventListener('click', openClient);
    // client overlay
    $('btnCloseClient').addEventListener('click', closeClient);
    $('ovDiscount').addEventListener('input', applyOvDiscount);
    $('ovStart').addEventListener('change', applyOvSchedule); $('ovDays').addEventListener('input', applyOvSchedule);
    $('qStart').addEventListener('change', function () { draft.startDate = this.value || ''; saveDraft(); renderSendIfVisible(); });
    $('qDays').addEventListener('input', function () { draft.durationDays = this.value === '' ? '' : Math.max(0, num(this.value, 0)); saveDraft(); renderSendIfVisible(); });
    $('accName').addEventListener('input', updateAcceptBtn);
    $('accAgree').addEventListener('change', updateAcceptBtn);
    $('btnAccept').addEventListener('click', doAccept);
    sigBind();
    // saved / record
    function startNew() { $('newDlg').hidden = true; document.querySelectorAll('.missing').forEach(function (el) { el.classList.remove('missing'); }); $('clientMissing').hidden = true; draft = newDraft(); saveDraft(); fillMeasureInputs(); fillQuoteInputs(); recalc(); renderSaved(); go('measure'); window.scrollTo(0, 0); toast('New quote ' + draft.ref + ' started'); }
    function askNew() {
      var started = String(draft.input.length || '').trim() !== '' || String(draft.deck.input.length || '').trim() !== '' || draft.client.name.trim() !== '' || draft.client.address.trim() !== '';
      if (!started) { startNew(); return; }
      var rec = findRecord(draft.ref);
      if (!rec && draft.acceptedFrom) rec = findRecord(draft.acceptedFrom);
      var who = draft.client.name.trim() ? ' for ' + draft.client.name.trim() : '';
      $('newDlgText').textContent = rec && rec.status === 'accepted'
        ? 'Quote ' + rec.ref + who + ' is already accepted and kept in Saved quotes. Your screen will be cleared for a new quote.'
        : 'The quote on screen (' + draft.ref + who + ') will be cleared. Save it first so you can open it again later from Saved quotes.';
      $('newDlgSave').hidden = !!(rec && rec.status === 'accepted');
      $('newDlgDiscard').textContent = rec && rec.status === 'accepted' ? 'Start new quote' : (rec ? 'Start new (keep the last saved copy)' : 'Start new without saving');
      $('newDlg').hidden = false;
    }
    $('btnNewQuote').addEventListener('click', askNew);
    $('btnNewTop').addEventListener('click', askNew);
    $('newDlgSave').addEventListener('click', function () { var r = saveAwaiting(); startNew(); toast('Saved ' + r.ref + '. New quote ' + draft.ref + ' started'); });
    $('newDlgDiscard').addEventListener('click', startNew);
    $('newDlgCancel').addEventListener('click', function () { $('newDlg').hidden = true; });
    $('newDlg').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });
    $('invMake').addEventListener('click', createInvoice);
    $('invOptions').addEventListener('change', function (e) { if (e.target.name === 'invKind') { invSel = Number(e.target.value); renderInvoices(currentRecord()); } });
    $('invList').addEventListener('click', function (e) {
      var r = currentRecord(); if (!r) return;
      var t = e.target.closest('[data-inv-share],[data-inv-dl],[data-inv-open]'); if (!t) return;
      var inv = r.invoices[Number(t.getAttribute('data-inv-share') || t.getAttribute('data-inv-dl') || t.getAttribute('data-inv-open'))];
      var f = invFile(inv);
      if (t.hasAttribute('data-inv-share')) shareFile(f, $('invHelp'));
      else if (t.hasAttribute('data-inv-dl')) { downloadBlob(f.blob, f.name); $('invHelp').innerHTML = '<div class="alert info">Downloaded <b>' + esc(f.name) + '</b>. Android: Files → Downloads.</div>'; }
      else { var url = URL.createObjectURL(f.blob); if (!window.open(url, '_blank')) downloadBlob(f.blob, f.name); setTimeout(function () { URL.revokeObjectURL(url); }, 120000); }
    });
    $('recShare').addEventListener('click', function () { var r = currentRecord(); if (r) shareDoc(r.doc, $('recHelp')); });
    $('recDownload').addEventListener('click', function () { var r = currentRecord(); if (r) downloadDoc(r.doc, $('recHelp')); });
    $('recOpenPdf').addEventListener('click', function () { var r = currentRecord(); if (r) openDoc(r.doc); });
    $('recEmailDraft').addEventListener('click', function () { var r = currentRecord(); if (r) emailDraft(r.doc, $('recHelp')); });
    $('recEdit').addEventListener('click', function () { var r = currentRecord(); if (r && r.status !== 'accepted') loadIntoEditor(r, false); });
    $('recAccept').addEventListener('click', function () { var r = currentRecord(); if (r && r.status !== 'accepted') loadIntoEditor(r, false, true); });
    $('recInvJump').addEventListener('click', function () { $('invCard').scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    $('recDuplicate').addEventListener('click', function () { var r = currentRecord(); if (r) loadIntoEditor(r, true); });
    $('recDelete').addEventListener('click', function () {
      var r = currentRecord(); if (!r) return;
      if (!deleteArmed) { deleteArmed = true; this.textContent = r.status === 'accepted' ? 'Tap again to permanently delete this ACCEPTED record' : 'Tap again to delete'; return; }
      records = records.filter(function (x) { return x.id !== r.id; }); persistRecords(); toast('Deleted ' + r.ref); go('saved');
    });
    // settings
    var savedFlashTimer = null;
    $('btnSaveProfile').addEventListener('click', function () {
      saveProfile();
      // read it back from the phone's storage to confirm it really saved
      var stored = null; try { stored = JSON.parse(localStorage.getItem(K.profile)); } catch (e) {}
      var ok = stored && stored.tradingName === profile.tradingName && stored.bankAccountNumber === profile.bankAccountNumber && stored.phone === profile.phone;
      var box = $('profileSavedBox'), btn = this;
      box.hidden = false;
      box.className = 'alert saved-box ' + (ok ? 'ok' : 'error');
      box.innerHTML = ok ? '✓ Your business details are saved on this phone.<br><span class="small" style="font-weight:400">They will show on every new quote and PDF.</span>' + (bizReturnTo ? '<button type="button" class="fix-btn" style="background:var(--ok)" id="btnSavedReturn">← Back to your quote</button>' : '')
        : '✕ Could not save your details on this phone. Check the phone isn\'t in private browsing, then try again.';
      if (ok && bizReturnTo) $('btnSavedReturn').onclick = function () { $('btnBizReturn').click(); };
      btn.textContent = ok ? '✓ Saved' : 'Try saving again'; btn.classList.toggle('saved-flash', ok);
      toast(ok ? '✓ Business details saved' : 'Could not save');
      clearTimeout(savedFlashTimer);
      savedFlashTimer = setTimeout(function () { btn.textContent = 'Save my business details'; btn.classList.remove('saved-flash'); }, 2500);
      setTimeout(function () { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 30);
    });
    $('pBankAccNo').addEventListener('input', bankHint);
    $('pBankAccNo').addEventListener('blur', function () { var f = formatNzAcc(this.value); if (f !== this.value) { this.value = f; saveProfile(); } bankHint(); });
    var profTimer = null;
    $('set-profile').addEventListener('input', function (e) { if (!e.target.matches('input, textarea')) return; clearTimeout(profTimer); profTimer = setTimeout(saveProfile, 500); });
    $('set-profile').addEventListener('change', function (e) { if (e.target.id === 'pGstReg') saveProfile(); });
    $('btnBizReturn').addEventListener('click', function () { saveProfile(); var to = bizReturnTo || 'quote'; this.hidden = true; bizReturnTo = null; recalc(); if (to === 'record' && currentRecordId) openRecord(currentRecordId); else go(to, true); toast('Back to your quote'); });
    $('pGstReg').addEventListener('change', function () { $('pGstNo').disabled = !this.checked; });
    $('btnResetPrices').addEventListener('click', function () { priceOverrides = {}; save(K.prices, priceOverrides); renderPrices(); fillPalingSelect(); fillDeckSelects(); recalc(); toast('Prices reset to researched values'); });
    $('btnAddPaling').addEventListener('click', function () {
      var err = addPaling({ name: $('npName').value, length_mm: $('npLen').value, width_mm: $('npWidth').value, price: $('npPrice').value, supplier: $('npSupplier').value, item: $('npItem').value, url: $('npUrl').value });
      if (err) { toast('Not added: ' + err); return; }
      ['npName', 'npLen', 'npPrice', 'npSupplier', 'npItem', 'npUrl'].forEach(function (id) { $(id).value = ''; });
      renderPalings(); fillPalingSelect(); recalc(); toast('Paling added');
    });
    $('btnImportCsv').addEventListener('click', function () { $('csvResult').textContent = importCSV($('csvText').value); renderPalings(); fillPalingSelect(); recalc(); });
    $('csvFile').addEventListener('change', function () { var f = this.files[0]; if (!f) return; f.text().then(function (t) { $('csvText').value = t; $('csvResult').textContent = importCSV(t); renderPalings(); fillPalingSelect(); recalc(); }); });
    $('btnExport').addEventListener('click', function () { var b = backupFile(); downloadBlob(b.blob, b.name); $('dataResult').textContent = 'Downloaded ' + b.name + '. Keep it somewhere safe (email to yourself, Drive or iCloud).'; });
    $('btnShareBackup').addEventListener('click', function () {
      var b = backupFile(); var f; try { f = new File([b.blob], b.name, { type: 'application/json' }); } catch (e) {}
      if (canShareFiles(f)) navigator.share({ files: [f], title: b.name }).catch(function () {}); else { downloadBlob(b.blob, b.name); $('dataResult').textContent = 'Sharing not available here; downloaded ' + b.name + ' instead.'; }
    });
    $('importFile').addEventListener('change', function () { var f = this.files[0]; if (!f) return; f.text().then(function (t) { $('dataResult').textContent = importBackup(t); }); this.value = ''; });
  }

  // ---------------- init ----------------
  function init() {
    $('appVersion').textContent = 'v' + APP_VERSION;
    $('pricesChecked').textContent = D.priceCheckedLabel;
    fillProfile(); fillMeasureInputs(); fillQuoteInputs(); bind(); recalc(); renderSaved();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  window.FQApp = { get draft() { return draft; }, get records() { return records; }, get pricing() { return pricing; }, get calc() { return calc; }, buildDoc: function () { return buildDoc(); }, pdfFile: pdfFile };
  init();
})();
