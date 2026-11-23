/* Fence Quote NZ — researched catalogue, defaults and sources.
   Prices are Bunnings NZ public retail shelf prices, GST-inclusive, as shown online (not trade pricing).
   status: 'verified' = read from the live product page on the checked date;
           'derived'  = calculated from a verified per-metre price on a sibling product page;
           'estimate' = could not be read from the retailer; enter your current price. */
var FQ_DATA = {
  version: '2026-11-24',
  priceCheckedLabel: '24 Nov 2026 (NZDT)',
  palings: [
    { id: 'bn-0308537', name: '150 × 19 × 1800 mm H3.2 fence paling', item: '0308537', supplier: 'Bunnings NZ',
      url: 'https://www.bunnings.co.nz/150-x-19-x-1800mm-h3-2-fence-paling_p0308537',
      lengthM: 1.8, widthMm: 150, thicknessMm: 19, treatment: 'H3.2', price: 5.17, unit: 'each', status: 'verified', checked: '24 Nov 2026',
      note: 'Verified: Bunnings NZ online price $5.17 each (24 Nov 2026).' },
    { id: 'bn-0308556', name: '150 × 19 × 2400 mm H3.2 fence paling', item: '0308556', supplier: 'Bunnings NZ',
      url: 'https://www.bunnings.co.nz/150-x-19-x-2400mm-h3-2-fence-paling_p0308556',
      lengthM: 2.4, widthMm: 150, thicknessMm: 19, treatment: 'H3.2', price: 8.43, unit: 'each', status: 'verified', checked: '24 Nov 2026',
      note: 'Verified: Bunnings NZ online price $8.43 each (24 Nov 2026).' }
  ],
  posts: [
    { id: 'bn-0308640', name: '125 × 75 × 1800 mm post grade treated pine H4', item: '0308640', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-1800mm-post-grade-treated-pine-h4-1800mm_p0308640', lengthM: 1.8, widthMm: 125, depthMm: 75, treatment: 'H4', price: 24.19, unit: 'each', status: 'derived', checked: '23 Nov 2026', note: 'Derived: $13.44/lm (verified on the 2.7 m page) × 1.8 m. Confirm on the link.' },
    { id: 'bn-0308643', name: '125 × 75 × 2100 mm post grade treated pine H4', item: '0308643', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-2100mm-post-grade-treated-pine-h4_p0308643', lengthM: 2.1, widthMm: 125, depthMm: 75, treatment: 'H4', price: 18.26, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ online price $18.26 each (24 Nov 2026).' },
    { id: 'bn-0308676', name: '125 × 75 × 2400 mm post grade treated pine H4', item: '0308676', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-2400mm-post-grade-treated-pine-h4_p0308676', lengthM: 2.4, widthMm: 125, depthMm: 75, treatment: 'H4', price: 31.21, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ online price $31.21 each (24 Nov 2026).' },
    { id: 'bn-0308649', name: '125 × 75 × 2700 mm post grade treated pine H4', item: '0308649', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-2700mm-post-grade-treated-pine-h4_p0308649', lengthM: 2.7, widthMm: 125, depthMm: 75, treatment: 'H4', price: 36.29, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ online price $36.29 each (24 Nov 2026).' },
    { id: 'bn-0308652', name: '125 × 75 × 3000 mm post grade treated pine H4', item: '0308652', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-3000mm-post-grade-treated-pine-h4_p0308652', lengthM: 3.0, widthMm: 125, depthMm: 75, treatment: 'H4', price: 25.90, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ online price $25.90 each on 24 Nov 2026 – cheaper than the 2.4 m and 2.7 m posts that day (probably a special). The app uses the cheapest post that is long enough.' },
    { id: 'bn-0308637', name: '100 × 100 × 3600 mm grade sawn fence post (H4)', item: '0308637', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/100-x-100-x-3600mm-grade-sawn-fence-post_p0308637', lengthM: 3.6, widthMm: 100, depthMm: 100, treatment: 'H4', price: 42.25, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ online price $42.25 each (24 Nov 2026).' }
  ],
  rails: [
    { id: 'bn-0308502', name: '75 × 50 mm 4.8 m F2 H3.2 radiata timber fence rail', item: '0308502', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/75-x-50mm-4-8m-f2-h3-2-radiata-timber-fence-rail_p0308502', lengthM: 4.8, widthMm: 75, depthMm: 50, treatment: 'H3.2', price: 21.93, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ online price $21.93 each (24 Nov 2026).' },
    { id: 'bn-0308505', name: '75 × 50 mm 6.0 m H3.2 radiata timber fence rail', item: '0308505', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/75-x-50mm-6-0m-h3-2-radiata-timber-fence-rail_p0308505', lengthM: 6.0, widthMm: 75, depthMm: 50, treatment: 'H3.2', price: 27.33, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ online price $27.33 each (24 Nov 2026).' }
  ],
  nails: { id: 'bn-0800934', name: 'NZ Nails 60 mm galvanised timber paling flat head nail (ring shank), 500 g pack', item: '0800934', supplier: 'Bunnings NZ',
    url: 'https://www.bunnings.co.nz/nz-nails-60mm-galvanised-timber-paling-flat-head-nail-500g-pack_p0800934',
    price: 15.85, unit: 'pack', perPack: 150, status: 'verified', checked: '23 Nov 2026',
    note: 'Price verified. Nails per 500 g pack is NOT stated by Bunnings; ~150 is my estimate (≈3.3 g per 60 × 2.8 mm nail). Adjust if your pack count differs.' },
  railFix: { id: 'bn-0579091', name: 'Titan 14g × 100 mm CL3 galvanised bugle batten screw, 100 pack', item: '0579091', supplier: 'Bunnings NZ',
    url: 'https://www.bunnings.co.nz/titan-14g-x-100mm-cl3-gal-bugle-batten-screw-100-pack_p0579091',
    price: 29.95, unit: 'pack', perPack: 100, status: 'verified', checked: '23 Nov 2026',
    note: 'Class 3 galvanised (external use). Use Class 4 / stainless within 500 m of the sea.' },
  concrete: { id: 'bn-0241402', name: 'Cemix 20 kg Fastcrete (post concrete)', item: '0241402', supplier: 'Bunnings NZ',
    url: 'https://bunnings.co.nz/cemix-20kg-fastcrete_p0241402',
    price: 12.54, unit: 'bag', yieldM3: 0.009, status: 'verified', checked: '24 Nov 2026',
    note: 'Price verified on Bunnings NZ 24 Nov 2026 (was $12.29 on 23 Nov). Bunnings/Cemix state "2 × 20 kg bags per post" for posts up to 1.2 m high but give no m³ yield; 0.009 m³ (9 L) per 20 kg bag is my estimate (≈2,200 kg/m³ placed). Adjust if needed.' }
};

FQ_DATA.defaults = {
  options: {
    maxCentres: 1.8, embedment: 0.6, holeDiameter: 0.25, railRows: 'auto', groundClearance: 0.05,
    palingGapMm: 0, palingWastePct: 10, fixingWastePct: 10, nailsPerPalingPerRail: 2, railFixingsPerConnection: 2,
    postAboveFence: 0, extraHoleDepth: 0, palingId: 'auto', railId: '', exposure: 'normal', ground: 'firm', special: 'none', frontYard: false
  },
  profile: {
    tradingName: 'Slaters Construction', legalName: '', contactPerson: 'Karl', phone: '', email: '', address: '',
    gstRegistered: true, gstNumber: '', nzbn: '', bankAccountName: '', bankAccountNumber: '', bankName: '', quotePrefix: 'SC', validityDays: 30,
    paymentTerms: '50% deposit on acceptance to secure materials and booking. Balance due within 7 days of completion invoice. Payment by bank transfer.',
    exclusions: [
      'Removal and disposal of any existing fence, vegetation or rubbish (unless listed in scope)',
      'Gates, hardware, retaining walls, steps or changes in ground level',
      'Staining, painting or sealing',
      'Locating the legal boundary or surveying (client to confirm boundary position)',
      'Building or resource consents, if required',
      'Damage to underground services not marked or disclosed before work starts',
      'Rock, concrete or other obstructions found when digging (charged as a variation)'
    ].join('\n')
  },
  labour: [{ name: 'Karl (owner)', hours: 8, rate: 75 }]
};

/* Sources shown in the app. kind: 'rule' = legal / consent / planning requirement; 'guide' = non-statutory guidance. */
FQ_DATA.sources = [
  { kind: 'rule', title: 'Building Act 2004, Schedule 1 – fences and hoardings exemption (MBIE guidance page 9.1)',
    url: 'https://www.building.govt.nz/projects-and-consents/planning-a-successful-build/scope-and-design/check-if-you-need-consents/building-work-that-doesnt-need-a-building-consent/technical-requirements-for-exempt-building-work/9-fencing-and-restrictions/9-1-fences-hoardings',
    summary: 'Fences up to 2.5 m high do not need a building consent; over 2.5 m they do. Fences to swimming pools need consent. (The MBIE page and Act text could not be read automatically on 23 Nov 2026; the 2.5 m limit and pool rule were confirmed via the Hutt City Council summary below.)' },
  { kind: 'rule', title: 'Hutt City Council – Building fences and walls',
    url: 'https://www.huttcity.govt.nz/property-and-building/property/building-fences',
    summary: '"if you\'re building a fence or wall that is more than 2.5 metres high you need to apply for a building consent." Fences to swimming pools need building consent.' },
  { kind: 'rule', title: 'MBIE – Building work that does not need a building consent (guidance PDF)',
    url: 'https://building.govt.nz/assets/Uploads/projects-and-consents/building-work-consent-not-required-guidance.pdf',
    summary: '"Exempt building work must comply with the Building Code." The building owner is responsible for checking whether consent is required.' },
  { kind: 'rule', title: 'MBIE – New building consent exemptions',
    url: 'https://www.building.govt.nz/new-building-consent-exemptions/',
    summary: 'Exempt work "must still comply with the Building Code and other legislative requirements, such as those under the Resource Management Act 1991".' },
  { kind: 'rule', title: 'NZ Building Code B2 Durability – timber treatment overview (MBIE)',
    url: 'https://building.govt.nz/building-code-compliance/b-stability/b2-durability/pink-is-tough/overview-of-timber-treatment-for-radiata-pine-and-douglas-fir',
    summary: 'H4: framing such as fence posts exposed to weather and in contact with the ground. H3.2: framing exposed to weather and above ground (rails, palings).' },
  { kind: 'rule', title: 'Auckland Unitary Plan H4 Mixed Housing Suburban – standard H4.6.14 Front, side and rear fences and walls',
    url: 'https://unitaryplan.aucklandcouncil.govt.nz/Images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H4%20Residential%20-%20Mixed%20Housing%20Suburban%20Zone.pdf',
    summary: 'Measured from ground level at the boundary. Front yard: 1.4 m; or 1.8 m for no more than 50% of frontage; or 1.8 m if at least 50% visually open. Side and rear: 2 m. Other zones (H5, H3 etc.) have similar standards; check the site zone on Auckland Council GeoMaps.' },
  { kind: 'guide', title: 'Auckland Design Manual – Design Element R2 Fencing and Walls (non-statutory)',
    url: 'https://content.aucklanddesignmanual.co.nz:443/regulations/design-for-the-rules/Documents/Design_Element_R2-Fencing_and_Walls.pdf',
    summary: 'Best-practice guide, not a rule. Recommends solid street fences at or below 1.2 m and combined fence + retaining on side/rear boundaries no more than 2 m.' },
  { kind: 'guide', title: 'Cemix Fastcrete product page (Bunnings NZ)',
    url: 'https://bunnings.co.nz/cemix-20kg-fastcrete_p0241402',
    summary: 'Manufacturer guidance: 2 × 20 kg bags per post for posts up to 1.2 m high. Used only as a sanity check.' }
];

/* Estimating assumptions (NOT legal requirements) shown in the app */
FQ_DATA.assumptions = [
  'One straight run on level ground; no gates, corners, steps or slopes.',
  'Post centres = length ÷ number of bays, where bays = length ÷ max centres rounded up. End posts included. Default maximum 1.8 m (Slaters standard; common NZ practice is 1.8–2.4 m, there is no Building Code maximum for an exempt fence).',
  'Post length needed = finished height + embedment; the cheapest stock length that is long enough is chosen (usually the shortest; a longer post is used if it is on special).',
  'Finished height = top of palings above ground. Paling length needed = finished height − ground clearance. A paling shorter than that is rejected, never used.',
  'Rail rows: 2 up to 1.2 m high, 3 above (adjustable). Rail joints land on posts; each stock length spans as many whole bays as fit. Rail stock is auto-picked (4.8 m or 6.0 m) for the lowest cost unless you choose one.',
  'Palings butted (0 mm gap) unless you set a gap (+) or overlap (−). Waste % added for splits and offcuts.',
  'Paling nails: 2 per paling per rail. Rail fixings: 2 screws per rail-to-post connection, with extra at joint posts.',
  'Concrete: hole volume (π × r² × depth) less the buried post volume, ÷ bag yield. Part bags can be shared between holes.',
  'Embedment rule of thumb: at least 600 mm and at least one third of the height above ground. This is a trade rule of thumb, not a Building Code requirement.',
  'Bunnings / Mitre 10 retail prices include 15% GST. Trade accounts and timber merchants will differ; override prices as needed.'
];

/* ================= DECKS =================
   Same price rules as fences: public retail shelf prices incl GST, read on the date shown.
   unit 'lm' = price per linear metre (timber is bought in stock lengths: lengths[] in metres).
   Every item has id, supplier, item (product code) and url, so a supplier's price list (CSV) can later
   be matched by code or id and simply override price + supplier. */
FQ_DATA.deck = {
  piles: [
    { id: 'm10-2053019', name: '125 × 125 mm H5 house pile 600 mm', item: '2053019', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/2053019', lengthM: 0.6, price: 19.80, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Mitre 10 NZ online price.' },
    { id: 'm10-2053020', name: '125 × 125 mm H5 house pile 750 mm', item: '2053020', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/2053020', lengthM: 0.75, price: 24.35, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Mitre 10 NZ online price.' },
    { id: 'm10-2053021', name: '125 × 125 mm H5 house pile 900 mm', item: '2053021', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/2053021', lengthM: 0.9, price: 29.50, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Mitre 10 NZ online price.' },
    { id: 'm10-2053022', name: '125 × 125 mm H5 house pile 1200 mm', item: '2053022', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/2053022', lengthM: 1.2, price: 39.00, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Mitre 10 NZ online price.' },
    { id: 'm10-2053023', name: '125 × 125 mm H5 pile 1500 mm', item: '2053023', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/2053023', lengthM: 1.5, price: 48.80, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Mitre 10 NZ online price (sold as anchor pile).' },
    { id: 'm10-2053024', name: '125 × 125 mm H5 pile 1800 mm', item: '2053024', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/2053024', lengthM: 1.8, price: 59.80, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Mitre 10 NZ online price (sold as anchor pile).' },
    { id: 'm10-2053025', name: '125 × 125 mm H5 pile 2100 mm', item: '2053025', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/2053025', lengthM: 2.1, price: 69.50, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Mitre 10 NZ online price (sold as anchor pile).' },
    { id: 'bn-0276414', name: '125 × 125 mm H5 pile 2400 mm', item: '0276414', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-125mm-2-4m-square-h5-anchor-pile_p0276414', lengthM: 2.4, price: 64.85, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ online price (Mitre 10 2.4 m was $79.50).' }
  ],
  joists: [
    { id: 'bn-0616262', name: '140 × 45 SG8 H3.2 framing (green)', depthMm: 140, widthMm: 45, item: '0616262', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/140-x-45mm-sg8-h3-2-treated-green-radiata-timber-framing-6m_p0616262', price: 11.82, unit: 'lm', lengths: [2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.0], status: 'derived', checked: '24 Nov 2026', note: 'Bunnings NZ 6.0 m length $70.91 = $11.82/m (Mitre 10 NZ 150×50 wet: $12.11/m).' },
    { id: 'bn-0616628', name: '190 × 45 SG8 H3.2 framing (green)', depthMm: 190, widthMm: 45, item: '0616628', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/190-x-45mm-sg8-h3-2-treated-green-radiata-timber-framing-6m_p0616628', price: 18.02, unit: 'lm', lengths: [2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.0], status: 'derived', checked: '24 Nov 2026', note: 'Bunnings NZ 6.0 m $108.12 and 4.8 m $86.50 = $18.02/m (Mitre 10 NZ 200×50 wet: $18.50/m).' },
    { id: 'bn-0616612', name: '240 × 45 SG8 H3.2 framing (green)', depthMm: 240, widthMm: 45, item: '0616612', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/240-x-45mm-sg8-h3-2-treated-green-radiata-timber-framing-6m_p0616612', price: 23.00, unit: 'lm', lengths: [2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.0], status: 'derived', checked: '24 Nov 2026', note: 'Bunnings NZ 6.0 m $138.00 = $23.00/m (Mitre 10 NZ 250×50 wet 5.4 m $147 = $27.22/m).' }
  ],
  bearers: [
    { id: 'est-bearer-140x70', name: '140 × 70 H3.2 bearer', size: '140x70', depthMm: 140, widthMm: 70, item: '', supplier: 'Timber merchant', url: '', price: 18.40, unit: 'lm', lengths: [2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.0], status: 'estimate', checked: '24 Nov 2026', note: 'ESTIMATE – not sold online at Bunnings or Mitre 10. Worked out from 140×45 at $11.82/m × 70/45. Ask your merchant and enter the price.' },
    { id: 'bu-bearer-2x140x45', name: '2/140 × 45 H3.2 nailed together (as 140 × 90 bearer)', size: '140x90', depthMm: 140, widthMm: 90, item: '0616262 ×2', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/140-x-45mm-sg8-h3-2-treated-green-radiata-timber-framing-6m_p0616262', price: 23.64, unit: 'lm', lengths: [2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.0], status: 'derived', checked: '24 Nov 2026', note: 'Two 140×45 at $11.82/m. Spans taken as a solid 140×90 bearer: confirm a nailed-up bearer is OK for your job.' },
    { id: 'est-bearer-190x70', name: '190 × 70 H3.2 bearer', size: '190x70', depthMm: 190, widthMm: 70, item: '', supplier: 'Timber merchant', url: '', price: 28.05, unit: 'lm', lengths: [2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.0], status: 'estimate', checked: '24 Nov 2026', note: 'ESTIMATE – not sold online at Bunnings or Mitre 10. Worked out from 190×45 at $18.02/m × 70/45. Ask your merchant and enter the price.' }
  ],
  boards: [
    { id: 'bn-0199671', name: '88 × 32 H3.2 pine decking, premium smooth', widthMm: 88, thicknessMm: 32, item: '0199671', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/88-x-32mm-h3-2-premium-smooth-decking-random-lengths_p0199671', price: 6.65, unit: 'lm', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ $6.65 per metre, random lengths.' },
    { id: 'bn-0199668', name: '88 × 32 H3.2 pine decking, merchant grade', widthMm: 88, thicknessMm: 32, item: '0199668', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/88-x-32mm-h3-2-wet-smooth-random-merch-decking_p0199668', price: 4.14, unit: 'lm', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ $4.14 per metre. Merchant grade has more knots and wane.' },
    { id: 'bn-0333819', name: '138 × 32 H3.2 pine decking, merchant grade smooth', widthMm: 138, thicknessMm: 32, item: '0333819', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/138-x-32mm-h3-2-wet-smooth-random-merch-decking_p0333819', price: 5.42, unit: 'lm', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ $5.42 per metre.' },
    { id: 'bn-0333820', name: '138 × 32 H3.2 pine decking, merchant grade griptread', widthMm: 138, thicknessMm: 32, item: '0333820', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/138-x-32mm-h3-2-merch-griptread-decking_p0333820', price: 5.69, unit: 'lm', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Bunnings NZ $5.69 per metre.' },
    { id: 'm10-392348', name: '90 × 32 radiata decking, premium smooth', widthMm: 90, thicknessMm: 32, item: '392348', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/392348', price: 7.61, unit: 'lm', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Mitre 10 NZ $7.61 per metre (griptread same price).' },
    { id: 'm10-392349', name: '140 × 32 radiata decking, premium smooth', widthMm: 140, thicknessMm: 32, item: '392349', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/392349', price: 11.20, unit: 'lm', status: 'verified', checked: '24 Nov 2026', note: 'Verified: Mitre 10 NZ $11.20 per metre (griptread same price).' }
  ],
  screws: { id: 'bn-0658849', name: 'Titan 10g × 65 mm 304 stainless decking screws, 500 pack', item: '0658849', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/titan-10g-x-65mm-wide-head-decking-screw-304-stainless-steel-500-pack_p0658849', price: 84.95, unit: 'pack', perPack: 500, status: 'verified', checked: '24 Nov 2026', note: 'Verified. Within 500 m of the sea use 316 stainless (Bunnings 0379643, 500 pack $116).' },
  hangers: [
    { id: 'bn-0818094', name: 'Lumberlok 47 × 90 joist hanger, hot-dip galv', fitsMm: 90, item: '0818094', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/lumberlok-joist-hanger-47x90mm-hot-dip-galvanised-jh4790dg_p0818094', price: 5.23, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified.' },
    { id: 'bn-0818112', name: 'Lumberlok 47 × 120 joist hanger, hot-dip galv', fitsMm: 140, item: '0818112', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/lumberlok-joist-hanger-47x120mm-hot-dip-galvanised-jh47120dg_p0818112', price: 5.73, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified. Used for 140 joists (no 47×140 hanger listed online) – check with the hanger maker.' },
    { id: 'bn-0818124', name: 'Lumberlok 47 × 190 joist hanger, hot-dip galv', fitsMm: 240, item: '0818124', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/lumberlok-47-x-190mm-hot-dip-galvanised-joist-hanger_p0818124', price: 6.43, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified. For 190 joists (also used for 240 – check).' }
  ],
  ties: { id: 'm10-182447', name: 'Lumberlok cyclone tie 400 mm, galv (joist to bearer)', item: '182447', supplier: 'Mitre 10 NZ', url: 'https://www.mitre10.co.nz/shop/x/p/182447', price: 3.14, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified. Use stainless (Mitre 10 279659, $5.57) near the sea.' },
  wireDogs: { id: 'bn-0639999', name: 'Lumberlok wire dogs, galv, 10 pack (bearer to pile)', item: '0639999', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/lumberlok-wire-dog-right-hand-zinc-galvanised-10pk-wdrh-r_p0639999', price: 7.27, unit: 'pack', perPack: 10, status: 'verified', checked: '24 Nov 2026', note: 'Verified.' },
  bolts: { id: 'bn-0235082', name: 'Zenith M12 × 200 galv coach bolt & nut (stringer)', item: '0235082', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/zenith-m12-x-200mm-galvanised-coach-head-bolt-and-nut_p0235082', price: 2.33, unit: 'each', status: 'verified', checked: '24 Nov 2026', note: 'Verified. Bolts through the stringer into the house boundary joist. Fixing into concrete needs anchors instead.' },
  nails: { id: 'bn-0317918', name: 'NZ Nails 90 × 3.55 galv flat head nails, 500 g', item: '0317918', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/nz-nails-90-x-3-55mm-500g-galvanised-flat-head-nails_p0317918', price: 8.45, unit: 'pack', perPack: 70, status: 'verified', checked: '24 Nov 2026', note: 'Price verified. Nails per 500 g pack not stated: ~70 is my estimate (≈7 g each).' }
};

/* NZS 3604:2011 numbers as quoted by Northpine span tables (Aug 2023), BRANZ and PlaceMakers – see Rules tab. */
FQ_DATA.deckRules = {
  centres: [400, 450, 600],
  // Table 7.1(b) joists, SG8 wet in service, 2 kPa: max span (m) at 400 / 450 / 600 mm centres
  joistSpan: { 90: [1.6, 1.5, 1.3], 140: [2.5, 2.35, 2.05], 190: [3.4, 3.2, 2.75], 240: [4.3, 4.05, 3.5] },
  // Table 7.2 joist cantilever (m) at 400 / 450 / 600 mm centres
  joistCantilever: { 90: [0.7, 0.65, 0.55], 140: [1.15, 1.1, 0.9], 190: [1.6, 1.5, 1.3], 240: [2.05, 1.9, 1.65] },
  // Table 6.4(b) bearers, SG8 wet, 2 kPa: bearer span (pile spacing, m) -> max loaded dimension (m)
  bearerSpan: { '140x70': [[1.3, 2.3], [1.65, 1.4]], '140x90': [[1.3, 3.0], [1.65, 1.8], [2.0, 1.2]], '190x70': [[1.3, 4.3], [1.65, 2.7], [2.0, 1.8]] }
};

FQ_DATA.deckDefaults = {
  input: { length: '', width: '', height: 0.6 },
  options: {
    attached: true, joistCentres: 450, joistId: 'auto', bearerId: 'auto', boardId: 'bn-0199671', boardGapMm: 4,
    cantilever: 0, boardWastePct: 10, timberWastePct: 0, fixingWastePct: 10, screwsPerCrossing: 2, tiesPerCrossing: 1,
    pileEmbed: 0.45, pileHoleDia: 0.3, wireDogsPerPile: 2, boltCentres: 0.8, frontBoundary: true, coastal: false
  }
};

FQ_DATA.deckSources = [
  { kind: 'rule', title: 'BRANZ – Designing a deck (NZS 3604 spans, footings, stringers, gaps)', url: 'https://www.branz.co.nz/design-build/articles/designing-a-deck',
    summary: 'Ordinary pile footings 260 mm dia × 200 mm deep minimum; braced piles 400 mm dia × 450 mm deep. Joists 140×45 cantilever 1.15 m and 190×45 1.6 m at 400 centres. 3–6 mm gaps between boards; 12 mm gap from stringer and cladding to decking for drainage.' },
  { kind: 'rule', title: 'Northpine – SG8/SG10 span tables (NZS 3604 Table 7.1(b), 7.2, 6.4(b))', url: 'https://archipro.co.nz/assets/MemberUploads/Span-Tables-SG8-SG10-2023-booklet-updated-Aug-2023.pdf',
    summary: 'Wet-in-service SG8 joists at 400/450/600 centres: 140×45 2.50/2.35/2.05 m; 190×45 3.40/3.20/2.75 m; 240×45 4.30/4.05/3.50 m. Bearers by span and loaded dimension (used by the deck calculator).' },
  { kind: 'rule', title: 'BRANZ – Free-standing timber decks (piles and bracing)', url: 'https://www.branz.co.nz/design-build/articles/free-standing-timber-decks',
    summary: 'Cantilevered piles up to 1.2 m above cleared ground; anchor piles 600 mm; braced piles up to 3.0 m. Bracing demand about 15 BU/m² (zone 3, soil E). Bearers H3.2, jointed only over piles.' },
  { kind: 'rule', title: 'MBIE – Exempt building work: decks, platforms and bridges', url: 'https://www.building.govt.nz/projects-and-consents/planning-a-successful-build/scope-and-design/check-if-you-need-consents/building-work-that-doesnt-need-a-building-consent/',
    summary: 'A deck from which you cannot fall more than 1.5 m (even if it collapses) does not need building consent, but must still meet the Building Code. Building Code F4 needs a barrier where someone could fall 1 m or more. (Not read automatically here – check the page.)' }
];

FQ_DATA.deckAssumptions = [
  'One rectangular deck on level ground. Length = along the house; width = out from the house.',
  'Boards run along the length. Joists run out from the house at the joist spacing you pick (450 mm default). Joist and bearer sizes are picked for the lowest material cost that meets the NZS 3604 span tables.',
  'Attached deck: a stringer (same size as the joists) is bolted to the house with M12 bolts at 0.8 m centres and the joists hang off it in joist hangers. Free-standing deck: an extra row of bearers and piles replaces the stringer.',
  'Piles: 125×125 H5 ordinary piles in 300 mm holes, 450 mm in the ground, concreted. Pile height = deck height − board − joist − bearer. No braced or anchor piles are counted: add them if the deck needs bracing.',
  'Decking: rows = width ÷ (board width + gap), bought by the metre + waste. 2 stainless screws per board at each joist.',
  'Fixings: 1 cyclone tie per joist/bearer crossing, 2 wire dogs per pile, 2 skew nails per crossing plus 3 nails per joist end at the boundary joist.',
  'Timber lengths are rounded up to stock lengths (2.4 to 6.0 m); long runs are joined over a bearer or pile.',
  'No steps, handrails, barriers, stairs, staining or ramps. Add them as extras.'
];

if (typeof module === 'object' && module.exports) module.exports = FQ_DATA;
