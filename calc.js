/* Fence Quote NZ — pure calculation engine (no DOM). Works in browser and Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FQCalc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var EPS = 1e-9;
  var GST_RATE = 0.15;

  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function ceil(n) { return Math.ceil(n - 1e-7); }

  /**
   * Materials takeoff for one straight paling fence run on level ground.
   * @param {object} inp  { length, height }  metres
   * @param {object} opt  estimating options (see DEFAULT_OPTIONS)
   * @param {object} cat  catalogue { posts:[{id,lengthM,price,...}], rails:[...], palings:[...], nails, railFix, concrete }
   */
  function takeoff(inp, opt, cat) {
    var errors = [], warnings = [], notes = [];
    var L = Number(inp.length), H = Number(inp.height);
    if (!(L > 0)) errors.push('Enter a fence length greater than 0 m.');
    if (!(H > 0)) errors.push('Enter a finished height greater than 0 m.');
    if (errors.length) return { ok: false, errors: errors, warnings: warnings, notes: notes, lines: [], total: 0 };

    var maxC = Number(opt.maxCentres);
    var embed = Number(opt.embedment);
    var holeD = Number(opt.holeDiameter);
    var clear = Number(opt.groundClearance);
    var gapMm = Number(opt.palingGapMm || 0);
    var waste = Number(opt.palingWastePct || 0) / 100;
    var fixWaste = Number(opt.fixingWastePct || 0) / 100;
    var nailsPerX = Number(opt.nailsPerPalingPerRail);
    var fixPerConn = Number(opt.railFixingsPerConnection);
    if (!(maxC > 0)) errors.push('Maximum post centres must be greater than 0.');
    if (!(embed > 0)) errors.push('Post embedment must be greater than 0.');
    if (!(holeD > 0)) errors.push('Hole diameter must be greater than 0.');
    if (clear < 0 || clear >= H) errors.push('Paling ground clearance must be at least 0 and less than the fence height.');

    // Rail rows: auto = 2 rails up to 1.2 m finished height, 3 rails above (estimating assumption)
    var rows = opt.railRows === 'auto' || !opt.railRows ? (H <= 1.2 + EPS ? 2 : 3) : Math.round(Number(opt.railRows));
    if (!(rows >= 2)) errors.push('Use at least 2 rail rows.');

    // ---------- POSTS ----------
    var bays = Math.max(1, ceil(L / maxC));
    var posts = bays + 1;
    var centres = L / bays;
    var reqPostLen = H + embed + Number(opt.postAboveFence || 0);
    var postStock = (cat.posts || []).slice().sort(function (a, b) { return a.lengthM - b.lengthM; });
    var post = null;
    // cheapest stock length that is long enough (usually the shortest; a longer post can be on special)
    for (var i = 0; i < postStock.length; i++) if (postStock[i].lengthM + EPS >= reqPostLen && (!post || Number(postStock[i].price) < Number(post.price) - 1e-9)) post = postStock[i];
    if (!post) errors.push('No post stock length in the price list is long enough: need ' + reqPostLen.toFixed(2) + ' m (height ' + H.toFixed(2) + ' m + embedment ' + embed.toFixed(2) + ' m). Add a longer post or get a site-specific design.');

    // ---------- PALINGS ----------
    var reqPalingLen = H - clear;
    var palingOpts = (cat.palings || []).slice().sort(function (a, b) { return a.lengthM - b.lengthM; });
    var paling = null, palingAuto = !opt.palingId || opt.palingId === 'auto';
    if (palingAuto) {
      for (var j = 0; j < palingOpts.length; j++) if (palingOpts[j].lengthM + EPS >= reqPalingLen) { paling = palingOpts[j]; break; }
      if (!paling) errors.push('No paling in the list is long enough: need at least ' + reqPalingLen.toFixed(3) + ' m (height ' + H.toFixed(2) + ' m − clearance ' + clear.toFixed(3) + ' m). Add a longer paling.');
    } else {
      paling = palingOpts.filter(function (p) { return p.id === opt.palingId; })[0] || null;
      if (!paling) errors.push('Selected paling not found. Choose another paling.');
      else if (paling.lengthM + EPS < reqPalingLen) {
        errors.push('PALING TOO SHORT: ' + paling.name + ' is ' + (paling.lengthM * 1000).toFixed(0) + ' mm but this fence needs at least ' + (reqPalingLen * 1000).toFixed(0) + ' mm (height − ground clearance). Choose a longer paling, lower the height or reduce clearance.');
      }
    }
    var palingWidthMm = paling ? Number(paling.widthMm || 150) : 150;
    var pitchMm = palingWidthMm + gapMm;
    if (pitchMm <= 0) errors.push('Paling gap/overlap leaves no coverage per paling.');

    // ---------- RAILS ----------
    var railStock = (cat.rails || []).slice().sort(function (a, b) { return a.lengthM - b.lengthM; });
    var rail = (opt.railId && opt.railId !== 'auto' && railStock.filter(function (r) { return r.id === opt.railId; })[0]) || null;
    if (!rail && railStock.length) {
      // auto: cheapest stock length that spans at least one bay
      var cBays = Math.max(1, Math.ceil(L / maxC - 1e-7)), cCentres = L / cBays, best = null;
      railStock.forEach(function (r) { var per = Math.floor(r.lengthM / cCentres + EPS); if (per < 1) return; var cost = Math.ceil(cBays / per - 1e-7) * Number(r.price); if (!best || cost < best.cost - 1e-9) best = { r: r, cost: cost }; });
      rail = best ? best.r : railStock[0];
    }
    if (!rail) errors.push('No rail in the price list.');

    if (errors.length) return { ok: false, errors: errors, warnings: warnings, notes: notes, lines: [], total: 0 };

    var baysPerRail = Math.floor(rail.lengthM / centres + EPS);
    var railPiecesPerRow, railCutNote = '';
    if (baysPerRail >= 1) {
      railPiecesPerRow = ceil(bays / baysPerRail);
      railCutNote = 'Each ' + rail.lengthM.toFixed(1) + ' m rail spans ' + baysPerRail + ' bay' + (baysPerRail > 1 ? 's' : '') + ' (joints land on posts).';
    } else {
      errors.push('Post centres (' + centres.toFixed(2) + ' m) are longer than the rail stock (' + rail.lengthM + ' m).');
      return { ok: false, errors: errors, warnings: warnings, notes: notes, lines: [], total: 0 };
    }
    var railQty = rows * railPiecesPerRow;
    var railJointsPerRow = railPiecesPerRow - 1;

    // ---------- PALING QUANTITIES ----------
    var palingsInstalled = ceil((L * 1000) / pitchMm);
    var palingsBuy = ceil(palingsInstalled * (1 + waste));
    var palingCut = paling.lengthM - reqPalingLen;

    // ---------- FIXINGS ----------
    var nailsQty = palingsInstalled * rows * nailsPerX;
    var nailsBuyQty = ceil(nailsQty * (1 + fixWaste));
    var nails = cat.nails;
    var nailPacks = ceil(nailsBuyQty / Number(nails.perPack));
    // rail fixings: every rail/post crossing plus extra at joints (two rail ends on one post)
    var connections = rows * (posts + railJointsPerRow);
    var railFixQty = connections * fixPerConn;
    var railFixBuyQty = ceil(railFixQty * (1 + fixWaste));
    var railFix = cat.railFix;
    var railFixPacks = ceil(railFixBuyQty / Number(railFix.perPack));

    // ---------- CONCRETE ----------
    var holeArea = Math.PI * Math.pow(holeD / 2, 2);
    var postArea = (Number(post.widthMm || 100) / 1000) * (Number(post.depthMm || 100) / 1000);
    var holeDepth = embed + Number(opt.extraHoleDepth || 0);
    var concretePerHole = Math.max(0, holeArea * holeDepth - postArea * embed);
    var conc = cat.concrete;
    var bagsPerHole = concretePerHole / Number(conc.yieldM3);
    var wholeBagsOneHole = ceil(bagsPerHole);
    var bagsTotalShared = ceil(bagsPerHole * posts);
    var bagsTotalUnshared = wholeBagsOneHole * posts;

    function line(key, label, item, qty, unitLabel, detail) {
      var unit = Number(item.price);
      return { key: key, label: label, item: item, qty: qty, unitLabel: unitLabel, unitPrice: unit, subtotal: r2(qty * unit), detail: detail };
    }
    var lines = [
      line('posts', 'H4 posts', post, posts, 'each',
        posts + ' posts · ' + bays + ' bays at ' + centres.toFixed(3) + ' m actual centres (max ' + maxC.toFixed(2) + ' m). Need ' + reqPostLen.toFixed(2) + ' m (' + H.toFixed(2) + ' m height + ' + embed.toFixed(2) + ' m embedment) → buy ' + post.lengthM.toFixed(1) + ' m stock.'),
      line('rails', 'H3.2 rails', rail, railQty, 'each',
        rows + ' rail rows × ' + railPiecesPerRow + ' lengths per row = ' + railQty + ' × ' + rail.lengthM.toFixed(1) + ' m. ' + railCutNote),
      line('palings', 'Palings', paling, palingsBuy, 'each',
        palingsInstalled + ' installed (' + (L * 1000).toFixed(0) + ' mm ÷ ' + pitchMm + ' mm pitch) + ' + (waste * 100).toFixed(0) + '% waste → buy ' + palingsBuy + '. Paling ' + (paling.lengthM * 1000).toFixed(0) + ' mm, needed ' + (reqPalingLen * 1000).toFixed(0) + ' mm' + (palingCut > 0.005 ? ' (trim ' + (palingCut * 1000).toFixed(0) + ' mm each)' : '') + '.'),
      line('nails', 'Paling nails', nails, nailPacks, 'pack',
        nailsQty + ' nails (' + palingsInstalled + ' palings × ' + rows + ' rails × ' + nailsPerX + ') + ' + (fixWaste * 100).toFixed(0) + '% = ' + nailsBuyQty + ' → ' + nailPacks + ' pack' + (nailPacks > 1 ? 's' : '') + ' of ~' + nails.perPack + '.'),
      line('railFix', 'Rail fixings', railFix, railFixPacks, 'pack',
        railFixQty + ' fixings (' + connections + ' rail-to-post connections × ' + fixPerConn + ') + ' + (fixWaste * 100).toFixed(0) + '% = ' + railFixBuyQty + ' → ' + railFixPacks + ' pack' + (railFixPacks > 1 ? 's' : '') + ' of ' + railFix.perPack + '.'),
      line('concrete', 'Concrete', conc, bagsTotalShared, 'bag',
        bagsPerHole.toFixed(2) + ' bags per hole (' + (concretePerHole * 1000).toFixed(1) + ' L: Ø' + (holeD * 1000).toFixed(0) + ' mm × ' + (holeDepth * 1000).toFixed(0) + ' mm deep less post). One hole alone needs ' + wholeBagsOneHole + ' whole bags. Sharing part bags across ' + posts + ' holes: ' + bagsTotalShared + ' bags (vs ' + bagsTotalUnshared + ' if not shared).')
    ];
    var total = r2(lines.reduce(function (s, l) { return s + l.subtotal; }, 0));

    // ---------- FLAGS (estimating & regulatory triggers) ----------
    if (H > 2.5 + EPS) warnings.push({ level: 'consent', text: 'Over 2.5 m high: the Building Act Schedule 1 fence exemption does not apply, so a building consent is needed, plus a site-specific (engineered) design.' });
    if (H > 2.0 + EPS) warnings.push({ level: 'planning', text: 'Over 2.0 m: above the usual Auckland Unitary Plan residential side/rear boundary fence limit. Check the zone; a resource consent may be needed.' });
    if (H > 1.8 + EPS && H <= 2.5 + EPS) warnings.push({ level: 'design', text: 'Over 1.8 m: higher wind load on posts. Consider closer centres, larger posts or deeper embedment; get a site-specific design if exposed.' });
    if (opt.frontYard) warnings.push({ level: 'planning', text: 'Front yard / road boundary: most Auckland residential zones limit front fences (commonly 1.4 m, or up to 1.8 m only if the part above 1.4 m is at least 50% visually open). A solid paling fence over 1.4 m may need resource consent.' });
    if (embed < 0.6 - EPS) warnings.push({ level: 'design', text: 'Embedment under 600 mm is below the usual rule of thumb for a paling fence. Estimating assumption only; check for your site.' });
    if (embed + EPS < H / 3) warnings.push({ level: 'design', text: 'Embedment is less than one third of the fence height (rule of thumb). Consider deeper holes.' });
    if (maxC > 2.4 + EPS) warnings.push({ level: 'design', text: 'Post centres over 2.4 m are wider than typical for 75×50 rails. Check rail sizing.' });
    if (maxC > 1.8 + EPS && maxC <= 2.4 + EPS) warnings.push({ level: 'design', text: 'Post centres over 1.8 m: wider than the Slaters default. Fine for many sheltered sites, but use 1.8 m or less for taller or exposed fences.' });
    if (opt.exposure === 'high') warnings.push({ level: 'design', text: 'High wind exposure: standard rules of thumb may not be adequate. Get a site-specific design (post size, centres, footing).' });
    if (opt.ground === 'soft') warnings.push({ level: 'design', text: 'Soft, filled or wet ground: footings may need to be larger or deeper. Get a site-specific design.' });
    if (opt.ground === 'rock') warnings.push({ level: 'design', text: 'Rock or hard ground: allow for core drilling / breaking out; price extra time and plant.' });
    if (opt.special === 'pool') warnings.push({ level: 'consent', text: 'Pool barrier: not covered by the fence exemption. Must meet Building Code F9 / NZS 8500-type requirements and needs a building consent. Do not quote as a standard paling fence.' });
    if (opt.special === 'retaining') warnings.push({ level: 'consent', text: 'Fence on or acting as a retaining wall: retaining over 1.5 m, or carrying surcharge, needs consent. Get a site-specific design.' });
    if (opt.special === 'other') warnings.push({ level: 'design', text: 'Special use (acoustic, fire, balustrade, boundary with drop): standard takeoff may not apply. Get a site-specific design.' });

    notes.push('Level ground, one straight run, no gates, corners or steps.');
    return {
      ok: true, errors: [], warnings: warnings, notes: notes, lines: lines, total: total,
      summary: {
        length: L, height: H, bays: bays, posts: posts, centres: centres, maxCentres: maxC, embedment: embed,
        holeDiameter: holeD, reqPostLen: reqPostLen, post: post, rail: rail, rows: rows, railPiecesPerRow: railPiecesPerRow, railQty: railQty,
        paling: paling, reqPalingLen: reqPalingLen, palingsInstalled: palingsInstalled, palingsBuy: palingsBuy,
        nailsQty: nailsQty, nailPacks: nailPacks, railFixQty: railFixQty, railFixPacks: railFixPacks,
        concretePerHoleM3: concretePerHole, bagsPerHole: bagsPerHole, wholeBagsOneHole: wholeBagsOneHole, bagsTotal: bagsTotalShared,
        clearance: clear, gapMm: gapMm
      }
    };
  }

  /**
   * Pricing. Retail material prices are GST-inclusive (NZ shelf prices).
   * Labour rates and extras are entered EXCLUDING GST.
   * registered: materials converted to ex-GST (input tax claimed), GST added once at the end.
   * not registered: materials at GST-inclusive cost (no claim), no GST charged.
   */
  function price(materialsInclGst, labour, extras, opt) {
    var registered = !!opt.gstRegistered;
    var labourLines = (labour || []).map(function (p) {
      var h = Number(p.hours) || 0, rate = Number(p.rate) || 0;
      return { name: p.name || '', hours: h, rate: rate, total: r2(h * rate) };
    });
    var labourTotal = r2(labourLines.reduce(function (s, l) { return s + l.total; }, 0));
    var extrasTotal = r2((extras || []).reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0));
    var materialsCost = registered ? r2(materialsInclGst / (1 + GST_RATE)) : r2(materialsInclGst);
    var materialsGstClaimable = registered ? r2(materialsInclGst - materialsCost) : 0;
    var cost = r2(materialsCost + labourTotal + extrasTotal);
    var marginPct = Number(opt.marginPct) || 0;
    var margin = r2(cost * marginPct / 100);
    var priceExGst = r2(cost + margin);
    var gst = registered ? r2(priceExGst * GST_RATE) : 0;
    var priceIncl = r2(priceExGst + gst);
    var roundTo = Number(opt.roundTo) || 0;
    var clientPrice = priceIncl;
    if (roundTo > 0) clientPrice = Math.ceil(priceIncl / roundTo - 1e-9) * roundTo;
    clientPrice = r2(clientPrice);
    // Discount: a % off the client price (incl GST if registered), shown to the client.
    var discountPct = Math.min(100, Math.max(0, Number(opt.discountPct) || 0));
    var listPrice = clientPrice;
    var discountAmount = r2(listPrice * discountPct / 100);
    clientPrice = r2(listPrice - discountAmount);
    var listGst = registered ? r2(listPrice * 3 / 23) : 0;
    var clientGst = registered ? r2(clientPrice * 3 / 23) : 0;
    var clientExGst = r2(clientPrice - clientGst);
    return {
      registered: registered, labourLines: labourLines, labourTotal: labourTotal, extrasTotal: extrasTotal,
      materialsInclGst: r2(materialsInclGst), materialsCost: materialsCost, materialsGstClaimable: materialsGstClaimable,
      cost: cost, marginPct: marginPct, margin: margin, priceExGst: priceExGst, gst: gst, priceIncl: priceIncl,
      roundingAdj: r2(listPrice - priceIncl), listPrice: listPrice, listExGst: r2(listPrice - listGst),
      discountPct: discountPct, discountAmount: discountAmount, discountExGst: r2(discountAmount - (listGst - clientGst)),
      clientPrice: clientPrice, clientGst: clientGst, clientExGst: clientExGst,
      profit: r2(clientExGst - cost)
    };
  }


  // ===================================================================================
  // DECK takeoff: one rectangular timber deck (NZS 3604 span tables in FQ_DATA.deckRules)
  // ===================================================================================
  // Buy timber in stock lengths: one piece if a stock length covers it, otherwise equal pieces joined over supports.
  function stockFor(needM, lengths) {
    var ls = (lengths && lengths.length ? lengths : [6.0]).slice().sort(function (a, b) { return a - b; });
    var max = ls[ls.length - 1];
    var pieces = Math.max(1, ceil(needM / max));
    var each = needM / pieces, len = max;
    for (var i = 0; i < ls.length; i++) if (ls[i] + EPS >= each) { len = ls[i]; break; }
    return { pieces: pieces, len: len, lm: pieces * len };
  }
  function centresIdx(rules, c) { var i = rules.centres.indexOf(Number(c)); return i < 0 ? 1 : i; }
  function bearerMaxSpan(rules, size, ld) {
    var rows = rules.bearerSpan[size] || [], best = 0;
    rows.forEach(function (r) { if (r[1] + EPS >= ld && r[0] > best) best = r[0]; });
    return best;
  }

  // Joist spacing 'auto': try each spacing the board allows and keep the cheapest whole deck.
  function deckTakeoff(inp, opt, cat, rules) {
    var board = (cat.boards || []).filter(function (b) { return b.id === opt.boardId; })[0] || (cat.boards || [])[0];
    var maxC = board && board.maxCentres ? Number(board.maxCentres) : 450;
    if (opt.joistCentres && opt.joistCentres !== 'auto') return deckOnce(inp, opt, cat, rules, Number(opt.joistCentres), false);
    var best = null, first = null;
    rules.centres.filter(function (c) { return c <= maxC; }).forEach(function (c) {
      var t = deckOnce(inp, opt, cat, rules, c, true); if (!first) first = t;
      if (t.ok && (!best || t.total < best.total - 1e-6)) best = t;
    });
    if (!best) return first || deckOnce(inp, opt, cat, rules, 450, true);
    best.notes.unshift('Joist spacing ' + best.summary.centres + ' mm picked automatically: the cheapest that ' + board.thicknessMm + ' mm boards allow (max ' + maxC + ' mm).');
    return best;
  }
  function deckOnce(inp, opt, cat, rules, centres, autoCentres) {
    var errors = [], warnings = [], notes = [];
    var L = Number(inp.length), W = Number(inp.width), H = Number(inp.height);
    if (!(L > 0)) errors.push('Enter the deck length (along the house) in metres.');
    if (!(W > 0)) errors.push('Enter the deck width (out from the house) in metres.');
    if (!(H > 0)) errors.push('Enter the deck height (top of the boards above the ground).');
    if (errors.length) return { ok: false, errors: errors, warnings: warnings, notes: notes, lines: [], total: 0 };
    var attached = opt.attached !== false && opt.attached !== 'false';
    var ci = centresIdx(rules, centres);
    var cant = Math.max(0, Number(opt.cantilever) || 0);
    var board = (cat.boards || []).filter(function (b) { return b.id === opt.boardId; })[0] || (cat.boards || [])[0];
    var gap = opt.boardGapMm === 'auto' || opt.boardGapMm === '' || opt.boardGapMm == null ? Number(board && board.gapMm || 4) : Number(opt.boardGapMm); if (!isFinite(gap)) gap = 4;
    var bWaste = (Number(opt.boardWastePct) || 0) / 100, tWaste = (Number(opt.timberWastePct) || 0) / 100, fWaste = (Number(opt.fixingWastePct) || 0) / 100;
    var embed = Number(opt.pileEmbed) || 0.45, holeD = Number(opt.pileHoleDia) || 0.3;

    if (!board) errors.push('No decking board in the price list. Add one.');
    var joistOpts = (cat.joists || []).filter(function (j) { return rules.joistSpan[j.depthMm]; });
    if (opt.joistId && opt.joistId !== 'auto') { joistOpts = joistOpts.filter(function (j) { return j.id === opt.joistId; }); if (!joistOpts.length) errors.push('Chosen joist size not found.'); }
    var bearerOpts = (cat.bearers || []).filter(function (b) { return rules.bearerSpan[b.size]; });
    if (opt.bearerId && opt.bearerId !== 'auto') { bearerOpts = bearerOpts.filter(function (b) { return b.id === opt.bearerId; }); if (!bearerOpts.length) errors.push('Chosen bearer size not found.'); }
    if (errors.length) return { ok: false, errors: errors, warnings: warnings, notes: notes, lines: [], total: 0 };

    var boardT = (Number(board.thicknessMm) || 32) / 1000;
    var piles = (cat.piles || []).slice();
    var joistCount = ceil(L * 1000 / centres) + 1; // includes both end joists

    // Try every joist × bearer combination and keep the cheapest that meets the span tables.
    var best = null, reasons = [], lowest = 99;
    joistOpts.forEach(function (j) {
      var maxSpan = rules.joistSpan[j.depthMm][ci], maxCant = rules.joistCantilever[j.depthMm][ci];
      if (cant > maxCant + EPS) { reasons.push(j.name + ': overhang ' + cant.toFixed(2) + ' m is more than the ' + maxCant.toFixed(2) + ' m allowed'); return; }
      var supported = W - cant;
      if (supported <= 0.3) { reasons.push('Overhang leaves no supported joist length'); return; }
      var spans = Math.max(1, ceil(supported / maxSpan));
      var span = supported / spans;
      var bearerRows = attached ? spans : spans + 1;
      // loaded dimension: internal bearer = 1 span; edge bearer = half span + overhang
      var ld = Math.max(bearerRows > 1 || !attached ? (attached || spans > 1 ? span : 0) : 0, span / 2 + cant);
      if (attached && spans === 1) ld = span / 2 + cant;
      bearerOpts.forEach(function (b) {
        var bSpan = bearerMaxSpan(rules, b.size, ld);
        if (!bSpan) { reasons.push(b.name + ' cannot carry ' + ld.toFixed(2) + ' m of joists'); return; }
        var pilesPerRow = ceil(L / bSpan) + 1;
        var pileSpacing = L / (pilesPerRow - 1);
        var pileCount = pilesPerRow * bearerRows;
        var above = H - boardT - j.depthMm / 1000 - b.depthMm / 1000;
        if (above < 0.05) { lowest = Math.min(lowest, boardT + j.depthMm / 1000 + b.depthMm / 1000); reasons.push('too low for ' + j.depthMm + ' joists on ' + b.size.replace('x', '×') + ' bearers'); return; }
        var pileNeed = Math.max(0, above) + embed;
        var pile = null;
        piles.forEach(function (p) { if (p.lengthM + EPS >= pileNeed && (!pile || Number(p.price) < Number(pile.price) - 1e-9)) pile = p; });
        var jStock = stockFor(W, j.lengths), bStock = stockFor(L, b.lengths);
        var cost = joistCount * jStock.lm * Number(j.price) + bearerRows * bStock.lm * Number(b.price) + (pile ? pileCount * Number(pile.price) : 1e9);
        var c = { joist: j, bearer: b, maxSpan: maxSpan, maxCant: maxCant, spans: spans, span: span, bearerRows: bearerRows, ld: ld, bSpan: bSpan,
          pilesPerRow: pilesPerRow, pileSpacing: pileSpacing, pileCount: pileCount, above: above, pileNeed: pileNeed, pile: pile, jStock: jStock, bStock: bStock, cost: cost };
        if (!best || cost < best.cost - 1e-6) best = c;
      });
    });
    if (!best && lowest < 99) { errors.push('Deck is too low for joists on bearers: the lowest build needs ' + Math.round(lowest * 1000 + 50) + ' mm from the top of the boards to the ground. Raise the deck height, dig out under it, or build it differently (e.g. joists straight onto piles) and price it with extras.'); return { ok: false, errors: errors, warnings: warnings, notes: notes, lines: [], total: 0 }; }
    if (!best) { errors.push('No joist and bearer combination in the price list meets the NZS 3604 span tables for this deck. ' + (reasons[0] || '') + '. Try closer joists, a smaller overhang, or get it designed.'); return { ok: false, errors: errors, warnings: warnings, notes: notes, lines: [], total: 0 }; }
    var j = best.joist, b = best.bearer;
    if (!best.pile) { errors.push('Piles would need to be ' + best.pileNeed.toFixed(2) + ' m long – longer than any pile in the price list. This deck needs a specific design (braced piles / posts).'); return { ok: false, errors: errors, warnings: warnings, notes: notes, lines: [], total: 0 }; }

    // ---------- quantities ----------
    var boardRows = ceil(W * 1000 / (Number(board.widthMm) + gap));
    var boardLm = boardRows * L, boardBuy = ceil(boardLm * (1 + bWaste) * 10) / 10;
    var jLm = joistCount * best.jStock.lm;
    var frontLm = 0, frontStock = null;
    if (opt.frontBoundary !== false && opt.frontBoundary !== 'false') { frontStock = stockFor(L, j.lengths); frontLm = frontStock.lm; }
    var stringerStock = attached ? stockFor(L, j.lengths) : null;
    var joistTimberLm = ceil((jLm + frontLm + (stringerStock ? stringerStock.lm : 0)) * (1 + tWaste) * 10) / 10;
    var bearerLm = ceil(best.bearerRows * best.bStock.lm * (1 + tWaste) * 10) / 10;
    var crossings = joistCount * best.bearerRows;
    var screws = ceil(boardRows * joistCount * (Number(opt.screwsPerCrossing) || 2) * (1 + fWaste));
    var zones = cat.zones || [];
    var zone = null; zones.forEach(function (z) { if (z.id === opt.zone) zone = z; });
    if (!zone) zone = zones[0] || { id: 'BC', label: 'Inland', fix: 'ss', screws: '304' };
    var fx = zone.fix === 'galv' || !cat.ss ? cat : cat.ss; // fixing set for this exposure zone
    var gradeName = zone.fix === 'galv' ? 'Galv' : 'Stainless';
    var screwList = zone.screws === '316' && cat.screwSizes316 && cat.screwSizes316.length ? cat.screwSizes316 : cat.screwSizes;
    var screwItem = null; (screwList || []).slice().sort(function (a, c) { return a.maxThicknessMm - c.maxThicknessMm; }).forEach(function (sc) { if (!screwItem && Number(board.thicknessMm) <= sc.maxThicknessMm) screwItem = sc; });
    screwItem = screwItem || screwList[screwList.length - 1];
    var screwPacks = ceil(screws / Number(screwItem.perPack));
    var hanger = null;
    if (attached) { (fx.hangers || []).slice().sort(function (a, c) { return a.fitsMm - c.fitsMm; }).forEach(function (h) { if (!hanger && h.fitsMm >= j.depthMm) hanger = h; }); if (!hanger) hanger = (fx.hangers || [])[fx.hangers.length - 1]; }
    var ties = ceil(crossings * (Number(opt.tiesPerCrossing) || 0));
    var dogs = ceil(best.pileCount * (Number(opt.wireDogsPerPile) || 0) * (1 + fWaste));
    var dogPacks = ceil(dogs / Number(fx.wireDogs.perPack));
    var boltCount = attached ? ceil(L / (Number(opt.boltCentres) || 0.8)) + 1 : 0;
    var nails = ceil((crossings * 2 + (frontLm ? joistCount * 3 : 0) + (attached ? joistCount * 0 : 0)) * (1 + fWaste));
    var nailPacks = ceil(nails / Number(fx.nails.perPack));
    // concrete per pile hole, same method as fence posts
    var holeArea = Math.PI * Math.pow(holeD / 2, 2), pileArea = 0.125 * 0.125;
    var perHole = Math.max(0, holeArea * embed - pileArea * embed);
    var bagsPerHole = perHole / Number(cat.concrete.yieldM3);
    var bags = ceil(bagsPerHole * best.pileCount);

    function line(key, label, item, qty, unitLabel, detail) {
      var unit = Number(item.price);
      return { key: key, label: label, item: item, qty: qty, unitLabel: unitLabel, unitPrice: unit, subtotal: r2(qty * unit), detail: detail };
    }
    function m(n) { return n.toFixed(1) + ' m'; }
    var lines = [
      line('dpiles', 'H5 piles', best.pile, best.pileCount, 'each',
        best.bearerRows + ' bearer row' + (best.bearerRows > 1 ? 's' : '') + ' × ' + best.pilesPerRow + ' piles at ' + best.pileSpacing.toFixed(2) + ' m (max ' + best.bSpan.toFixed(2) + ' m for ' + b.size.replace('x', '×') + ' carrying ' + best.ld.toFixed(2) + ' m). Pile ' + Math.round(best.above * 1000) + ' mm above ground + ' + Math.round(embed * 1000) + ' mm in the ground = ' + best.pileNeed.toFixed(2) + ' m → ' + best.pile.lengthM.toFixed(2) + ' m pile.'),
      line('dconcrete', 'Concrete (pile holes)', cat.concrete, bags, 'bag',
        bagsPerHole.toFixed(2) + ' bags per hole (Ø' + Math.round(holeD * 1000) + ' × ' + Math.round(embed * 1000) + ' mm less pile) × ' + best.pileCount + ' piles, part bags shared = ' + bags + ' bags.'),
      line('dbearers', 'Bearers', b, bearerLm, 'm',
        best.bearerRows + ' row' + (best.bearerRows > 1 ? 's' : '') + ' × ' + (best.bStock.pieces > 1 ? best.bStock.pieces + ' × ' : '') + m(best.bStock.len) + ' (deck ' + m(L) + ' long' + (best.bStock.pieces > 1 ? ', joined over a pile' : '') + ') = ' + bearerLm.toFixed(1) + ' m.'),
      line('djoists', 'Joists' + (attached ? ', stringer' : '') + (frontLm ? ' & boundary joist' : ''), j, joistTimberLm, 'm',
        joistCount + ' joists at ' + centres + ' mm centres × ' + (best.jStock.pieces > 1 ? best.jStock.pieces + ' × ' : '') + m(best.jStock.len) + ' (span ' + best.span.toFixed(2) + ' m, max ' + best.maxSpan.toFixed(2) + ' m' + (cant ? ', overhang ' + cant.toFixed(2) + ' m of max ' + best.maxCant.toFixed(2) + ' m' : '') + ')' +
        (attached ? ' + stringer ' + (stringerStock.pieces > 1 ? stringerStock.pieces + ' × ' : '') + m(stringerStock.len) : '') + (frontLm ? ' + boundary joist ' + (frontStock.pieces > 1 ? frontStock.pieces + ' × ' : '') + m(frontStock.len) : '') + ' = ' + joistTimberLm.toFixed(1) + ' m.'),
      line('dboards', 'Decking boards', board, boardBuy, 'm',
        boardRows + ' rows (' + Math.round(W * 1000) + ' mm ÷ ' + board.widthMm + ' mm board + ' + gap + ' mm gap) × ' + m(L) + ' = ' + boardLm.toFixed(1) + ' m + ' + Math.round(bWaste * 100) + '% waste → ' + boardBuy.toFixed(1) + ' m.'),
      line('dscrews', 'Decking screws (' + (zone.screws === '316' ? '316' : '304') + ' stainless)', screwItem, screwPacks, 'pack',
        boardRows + ' rows × ' + joistCount + ' joists × ' + (Number(opt.screwsPerCrossing) || 2) + ' + ' + Math.round(fWaste * 100) + '% = ' + screws + ' screws → ' + screwPacks + ' pack' + (screwPacks > 1 ? 's' : '') + ' of ' + screwItem.perPack + (board.composite ? '. Composite: use the maker\'s hidden clips if required – swap the price.' : '.'))
    ];
    if (attached) {
      lines.push(line('dhangers', gradeName + ' joist hangers', hanger, joistCount, 'each', 'One per joist at the stringer.'));
      lines.push(line('dbolts', gradeName + ' stringer bolts', fx.bolts, boltCount, 'each', 'M12 at ' + (Number(opt.boltCentres) || 0.8).toFixed(2) + ' m centres along ' + m(L) + ' = ' + boltCount + '.'));
    }
    if (ties) lines.push(line('dties', gradeName + ' joist ties', fx.ties, ties, 'each', joistCount + ' joists × ' + best.bearerRows + ' bearer row' + (best.bearerRows > 1 ? 's' : '') + ' = ' + crossings + ' crossings × ' + (Number(opt.tiesPerCrossing) || 0) + '.'));
    if (dogs) lines.push(line('ddogs', gradeName + ' wire dogs', fx.wireDogs, dogPacks, 'pack', best.pileCount + ' piles × ' + (Number(opt.wireDogsPerPile) || 0) + ' + waste = ' + dogs + ' → ' + dogPacks + ' pack' + (dogPacks > 1 ? 's' : '') + ' of ' + fx.wireDogs.perPack + '.'));
    lines.push(line('dnails', gradeName + ' nails (skew & boundary)', fx.nails, nailPacks, 'pack', crossings + ' crossings × 2 skew nails' + (frontLm ? ' + ' + joistCount + ' joist ends × 3' : '') + ' + waste = ' + nails + ' → ' + nailPacks + ' pack' + (nailPacks > 1 ? 's' : '') + ' (~' + fx.nails.perPack + ' each).'));
    var total = r2(lines.reduce(function (s, l) { return s + l.subtotal; }, 0));

    // ---------- flags ----------
    var area = L * W;
    if (H > 1.5 + EPS) warnings.push({ level: 'consent', text: 'Deck over 1.5 m above the ground: the building consent exemption does not apply (you could fall more than 1.5 m). Needs building consent and a design.' });
    if (H >= 1.0 - EPS) warnings.push({ level: 'consent', text: 'Fall of 1 m or more: Building Code F4 needs a safety barrier (balustrade). Not included in this takeoff – add it as an extra. A cantilevered balustrade needs at least 190 mm joists at 400 mm centres.' });
    if (best.above > 1.2 + EPS) warnings.push({ level: 'design', text: 'Piles stand ' + Math.round(best.above * 1000) + ' mm above ground: over 1.2 m, ordinary (cantilevered) piles are not enough – use braced piles / a specific design.' });
    if (!attached || best.above > 0.6 + EPS) warnings.push({ level: 'design', text: 'Bracing: ' + (attached ? 'with piles over 600 mm high this deck' : 'a free-standing deck') + ' needs bracing (anchor or braced piles, about ' + Math.round(area * 15) + ' BU each way at 15 BU/m² for zone 3 – check your wind/earthquake zone). Anchor/braced piles are not counted here: swap some piles or add as an extra.' });
    if (board.maxCentres && centres > Number(board.maxCentres)) warnings.push({ level: 'design', text: board.thicknessMm + ' mm boards at ' + centres + ' mm joist spacing: too far apart. The decking guides allow ' + board.maxCentres + ' mm max for this board. Set joist spacing to Auto or ' + board.maxCentres + ' mm.' });
    if (b.id === 'bu-bearer-2x140x45') warnings.push({ level: 'design', text: 'Built-up 2/140×45 bearer is costed as a solid 140×90: confirm this is acceptable for your job.' });
    if (zone.id === 'E') warnings.push({ level: 'design', text: 'Sea spray / geothermal site (zone E): NZS 3604 needs specific design of fixings here. Priced as 316 stainless – check with the engineer or fixing maker.' });
    notes.push('Fixings: ' + zone.label + ' → ' + (zone.fix === 'galv' ? 'hot-dip galvanised structural fixings' : 'stainless steel structural fixings') + ', ' + (zone.screws === '316' ? '316' : '304') + ' stainless decking screws.');
    if (attached) notes.push('Keep a 12 mm gap between the decking and the house cladding, and pack the stringer off the cladding for drainage (E2/AS1).');
    notes.push('Rectangle, level ground, no steps, stairs or handrails.');

    return {
      ok: true, errors: [], warnings: warnings, notes: notes, lines: lines, total: total,
      summary: { length: L, width: W, height: H, area: area, attached: attached, joist: j, bearer: b, board: board, pile: best.pile, centres: centres,
        joistCount: joistCount, bearerRows: best.bearerRows, pilesPerRow: best.pilesPerRow, pileCount: best.pileCount, pileSpacing: best.pileSpacing,
        span: best.span, maxSpan: best.maxSpan, cantilever: cant, boardRows: boardRows, boardBuy: boardBuy, embed: embed, holeDia: holeD, above: best.above, gapMm: gap, zone: zone }
    };
  }

  return { takeoff: takeoff, deckTakeoff: deckTakeoff, stockFor: stockFor, price: price, r2: r2, GST_RATE: GST_RATE };
});
