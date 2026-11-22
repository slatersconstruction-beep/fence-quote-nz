/* Fence Quote NZ — researched catalogue, defaults and sources.
   Prices are Bunnings NZ public retail shelf prices, GST-inclusive, as shown online (not trade pricing).
   status: 'verified' = read from the live product page on the checked date;
           'derived'  = calculated from a verified per-metre price on a sibling product page;
           'estimate' = could not be read from the retailer; enter your current price. */
var FQ_DATA = {
  version: '2026-11-23',
  priceCheckedLabel: '23 Nov 2026 (NZDT)',
  palings: [
    { id: 'bn-0308537', name: '150 × 19 × 1800 mm H3.2 fence paling', item: '0308537', supplier: 'Bunnings NZ',
      url: 'https://www.bunnings.co.nz/150-x-19-x-1800mm-h3-2-fence-paling_p0308537',
      lengthM: 1.8, widthMm: 150, thicknessMm: 19, treatment: 'H3.2', price: 5.20, unit: 'each', status: 'estimate', checked: '23 Nov 2026',
      note: 'ESTIMATE – Bunnings blocked automated price reads for this item. Interpolated from verified Bunnings NZ paling prices on the same day (150×12×1800 $3.64 = $2.02/lm; 150×25×2100 $7.81 = $3.72/lm). Tap the link and enter the shelf price.' },
    { id: 'bn-0308556', name: '150 × 19 × 2400 mm H3.2 fence paling', item: '0308556', supplier: 'Bunnings NZ',
      url: 'https://www.bunnings.co.nz/150-x-19-x-2400mm-h3-2-fence-paling_p0308556',
      lengthM: 2.4, widthMm: 150, thicknessMm: 19, treatment: 'H3.2', price: 6.95, unit: 'each', status: 'estimate', checked: '23 Nov 2026',
      note: 'ESTIMATE – Bunnings blocked automated price reads for this item. Interpolated at ≈$2.90/lm from verified sibling paling prices. Tap the link and enter the shelf price.' }
  ],
  posts: [
    { id: 'bn-0308640', name: '125 × 75 × 1800 mm post grade treated pine H4', item: '0308640', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-1800mm-post-grade-treated-pine-h4-1800mm_p0308640', lengthM: 1.8, widthMm: 125, depthMm: 75, treatment: 'H4', price: 24.19, unit: 'each', status: 'derived', checked: '23 Nov 2026', note: 'Derived: $13.44/lm (verified on the 2.7 m page) × 1.8 m. Confirm on the link.' },
    { id: 'bn-0308643', name: '125 × 75 × 2100 mm post grade treated pine H4', item: '0308643', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-2100mm-post-grade-treated-pine-h4_p0308643', lengthM: 2.1, widthMm: 125, depthMm: 75, treatment: 'H4', price: 28.22, unit: 'each', status: 'derived', checked: '23 Nov 2026', note: 'Derived: $13.44/lm × 2.1 m. Confirm on the link.' },
    { id: 'bn-0308676', name: '125 × 75 × 2400 mm post grade treated pine H4', item: '0308676', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-2400mm-post-grade-treated-pine-h4_p0308676', lengthM: 2.4, widthMm: 125, depthMm: 75, treatment: 'H4', price: 32.26, unit: 'each', status: 'derived', checked: '23 Nov 2026', note: 'Derived: $13.44/lm × 2.4 m. Confirm on the link.' },
    { id: 'bn-0308649', name: '125 × 75 × 2700 mm post grade treated pine H4', item: '0308649', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-2700mm-post-grade-treated-pine-h4_p0308649', lengthM: 2.7, widthMm: 125, depthMm: 75, treatment: 'H4', price: 36.29, unit: 'each', status: 'verified', checked: '23 Nov 2026', note: 'Verified: page shows $36.29 each ($13.44 per linear metre).' },
    { id: 'bn-0308652', name: '125 × 75 × 3000 mm post grade treated pine H4', item: '0308652', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/125-x-75-x-3000mm-post-grade-treated-pine-h4_p0308652', lengthM: 3.0, widthMm: 125, depthMm: 75, treatment: 'H4', price: 40.32, unit: 'each', status: 'derived', checked: '23 Nov 2026', note: 'Derived: $13.44/lm × 3.0 m. Confirm on the link.' },
    { id: 'bn-0308637', name: '100 × 100 × 3600 mm grade sawn fence post (H4)', item: '0308637', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/100-x-100-x-3600mm-grade-sawn-fence-post_p0308637', lengthM: 3.6, widthMm: 100, depthMm: 100, treatment: 'H4', price: 48.38, unit: 'each', status: 'estimate', checked: '23 Nov 2026', note: 'ESTIMATE at $13.44/lm – price could not be read. Confirm on the link.' }
  ],
  rails: [
    { id: 'bn-0308502', name: '75 × 50 mm 4.8 m F2 H3.2 radiata timber fence rail', item: '0308502', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/75-x-50mm-4-8m-f2-h3-2-radiata-timber-fence-rail_p0308502', lengthM: 4.8, widthMm: 75, depthMm: 50, treatment: 'H3.2', price: 17.95, unit: 'each', status: 'estimate', checked: '23 Nov 2026', note: 'ESTIMATE (≈$3.74/lm) – Bunnings blocked automated price reads for this item. Tap the link and enter the shelf price.' },
    { id: 'bn-0308505', name: '75 × 50 mm 6.0 m H3.2 radiata timber fence rail', item: '0308505', supplier: 'Bunnings NZ', url: 'https://www.bunnings.co.nz/75-x-50mm-6-0m-h3-2-radiata-timber-fence-rail_p0308505', lengthM: 6.0, widthMm: 75, depthMm: 50, treatment: 'H3.2', price: 22.44, unit: 'each', status: 'estimate', checked: '23 Nov 2026', note: 'ESTIMATE (≈$3.74/lm). Tap the link and enter the shelf price.' }
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
    price: 12.29, unit: 'bag', yieldM3: 0.009, status: 'verified', checked: '23 Nov 2026',
    note: 'Price verified. Bunnings/Cemix state "2 × 20 kg bags per post" for posts up to 1.2 m high but give no m³ yield; 0.009 m³ (9 L) per 20 kg bag is my estimate (≈2,200 kg/m³ placed). Adjust if needed.' }
};

FQ_DATA.defaults = {
  options: {
    maxCentres: 2.4, embedment: 0.6, holeDiameter: 0.25, railRows: 'auto', groundClearance: 0.05,
    palingGapMm: 0, palingWastePct: 10, fixingWastePct: 10, nailsPerPalingPerRail: 2, railFixingsPerConnection: 2,
    postAboveFence: 0, extraHoleDepth: 0, palingId: 'auto', railId: '', exposure: 'normal', ground: 'firm', special: 'none', frontYard: false
  },
  profile: {
    tradingName: 'Slaters Construction', legalName: '', contactPerson: 'Karl', phone: '', email: '', address: '',
    gstRegistered: true, gstNumber: '', nzbn: '', quotePrefix: 'SC', validityDays: 30,
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
  'Post centres = length ÷ number of bays, where bays = length ÷ max centres rounded up. End posts included.',
  'Post length needed = finished height + embedment; the shortest stock length that covers it is chosen.',
  'Finished height = top of palings above ground. Paling length needed = finished height − ground clearance. A paling shorter than that is rejected, never used.',
  'Rail rows: 2 up to 1.2 m high, 3 above (adjustable). Rail joints land on posts; each stock length spans as many whole bays as fit.',
  'Palings butted (0 mm gap) unless you set a gap (+) or overlap (−). Waste % added for splits and offcuts.',
  'Paling nails: 2 per paling per rail. Rail fixings: 2 screws per rail-to-post connection, with extra at joint posts.',
  'Concrete: hole volume (π × r² × depth) less the buried post volume, ÷ bag yield. Part bags can be shared between holes.',
  'Embedment rule of thumb: at least 600 mm and at least one third of the height above ground. This is a trade rule of thumb, not a Building Code requirement.',
  'Bunnings retail prices include 15% GST. Trade accounts and timber merchants will differ; override prices as needed.'
];

if (typeof module === 'object' && module.exports) module.exports = FQ_DATA;
