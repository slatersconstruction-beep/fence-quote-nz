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
    for (var i = 0; i < postStock.length; i++) if (postStock[i].lengthM + EPS >= reqPostLen) { post = postStock[i]; break; }
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

  return { takeoff: takeoff, price: price, r2: r2, GST_RATE: GST_RATE };
});
