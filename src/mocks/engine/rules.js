import { L, localizeDeep } from '@/shared/lib/localized'

export const ENGINE_VERSION = 'mock-engine-0.4.0'
export const PRICE_SNAPSHOT_ID = 'ps-2026-10-01'

export const PHASE_NAMES = {
  P0: L('Pre-construction', 'Mbere y’ubwubatsi', 'Pré-construction'),
  P1: L('Site preparation', 'Gutegura urubuga', 'Préparation du terrain'),
  P2: L('Foundations', 'Imisingi', 'Fondations'),
  P3: L('Structure', 'Inkingi n’imiterere', 'Structure'),
  P4: L('Walls, windows & roof', 'Inkuta, amadirishya n’igisenge', 'Murs, fenêtres et toiture'),
  P5: L('Partitions & services rough-in', 'Ibyagabanyije n’imiyoboro y’ibanze', 'Cloisons et réseaux en attente'),
  P6: L('Plaster & screed', 'Gusiga sima', 'Enduits et chapes'),
  P7: L('Finishes & fit-off', 'Isura n’ibikoresho bya nyuma', 'Finitions et pose'),
  P8: L('External works', 'Imirimo yo hanze', 'Aménagements extérieurs'),
  P9: L('Handover', 'Gushyikiriza', 'Réception'),
}

export const ELEMENT_NAMES = {
  structure: L('Structure', 'Inkingi n’imiterere', 'Structure'),
  walls: L('Walls', 'Inkuta', 'Murs'),
  roof: L('Roof', 'Igisenge', 'Toiture'),
  windows: L('Windows', 'Amadirishya', 'Fenêtres'),
  doors: L('Doors', 'Inzugi', 'Portes'),
  floors: L('Floors', 'Hasi', 'Sols'),
  wallFinish: L('Wall finish', 'Isura y’inkuta', 'Finition des murs'),
  ceilings: L('Ceilings', 'Ibisenge byo mu nzu', 'Plafonds'),
  sanitary: L('Sanitary', 'Ibikoresho by’isuku', 'Sanitaires'),
  kitchen: L('Kitchen', 'Igikoni', 'Cuisine'),
  electrical: L('Electrical', 'Amashanyarazi', 'Électricité'),
  hvac: L('HVAC', 'Guhumeka n’ubukonje (HVAC)', 'CVC'),
  external: L('External', 'Hanze', 'Extérieurs'),
}

export const VAT_PCT = 18
export const FEES_PCT = 8

export const DEFAULT_CONFIG = {
  version: 1,
  updatedAt: '2026-10-01T00:00:00.000Z',
  updatedBy: 'factory defaults',
  branding: {
    appName: 'Construction Cost & BOQ',
    shortName: 'CostBOQ',
    tagline: L(
      'Instant for clients, auditable for professionals.',
      'Ako kanya ku bakiriya, bigenzurwa ku banyamwuga.',
      'Instantané pour les clients, vérifiable pour les professionnels.',
    ),
    region: 'Rwanda',
    currency: 'RWF',
    supportEmail: 'support@costboq.rw',
    footerDisclaimer: L(
      'Rough budgets and preliminary estimates are indicative ranges, not quotations. Professional BOQs are unverified until signed by a quantity surveyor.',
      'Ingengo y’imari igereranyije n’ibigereranyo by’ibanze ni imbibi z’ibiciro, si ibiciro byemewe. BOQ z’abanyamwuga ntizemezwa kugeza zishyizweho umukono n’umubaruzi w’ibikoresho.',
      'Les budgets approximatifs et les estimations préliminaires sont des fourchettes indicatives, pas des devis. Les BOQ professionnels ne sont validés qu’une fois signés par un métreur.',
    ),
  },
  homepage: {
    eyebrow: L(
      'Construction cost · Bills of quantities · Feasibility',
      'Ikiguzi cy’ubwubatsi · Urutonde rw’ibikoresho · Ishoboka',
      'Coût de construction · Devis quantitatifs · Faisabilité',
    ),
    headline: L(
      'Know what the building will cost before the first footing is poured.',
      'Menya ikiguzi cy’inyubako mbere y’uko umusingi wa mbere usukwa.',
      'Sachez ce que coûtera le bâtiment avant de couler la première fondation.',
    ),
    subheadline: L(
      'A deterministic estimating engine for Rwanda: instant ranges for owners, traceable quantities and rates for architects, quantity surveyors and contractors.',
      'Moteri ibara ibiciro by’ubwubatsi mu Rwanda: imbibi z’ibiciro ako kanya ku ba nyir’inyubako, ingano n’ibiciro bikurikiranwa ku ba architecte, ababaruzi b’ibikoresho n’abarwubatsi.',
      'Un moteur d’estimation déterministe pour le Rwanda : des fourchettes instantanées pour les propriétaires, des quantités et des prix traçables pour les architectes, métreurs et entrepreneurs.',
    ),
    primaryCta: L('Start an estimate', 'Tangira igereranya', 'Commencer une estimation'),
    stats: [
      { value: '16', label: L('work packages', 'ibice by’imirimo', 'lots de travaux') },
      { value: '10', label: L('construction phases', 'ibyiciro by’ubwubatsi', 'phases de construction') },
      { value: '4', label: L('finish levels', 'inzego z’imyubakire', 'niveaux de finition') },
      { value: '8', label: L('districts priced', 'uturere dufite ibiciro', 'districts tarifés') },
    ],
    steps: [
      {
        title: L('Describe the building', 'Sobanura inyubako', 'Décrivez le bâtiment'),
        text: L(
          'Type, district, floor area, floors and finish. Four steps, under ninety seconds.',
          'Ubwoko, akarere, ubuso, amagorofa n’imyubakire. Intambwe enye, munsi y’amasegonda mirongo cyenda.',
          'Type, district, surface, étages et finition. Quatre étapes, en moins de quatre-vingt-dix secondes.',
        ),
      },
      {
        title: L('The engine measures it', 'Moteri irayipima', 'Le moteur la mesure'),
        text: L(
          'Parametric quantities per package, priced from a dated snapshot of material, labour and plant rates for your district.',
          'Ingano zibarwa kuri buri gice cy’imirimo, zishyirwaho ibiciro bivuye ku rutonde rw’ibiciro by’ibikoresho, abakozi n’imashini rufite itariki, rw’akarere kawe.',
          'Des quantités paramétriques par lot, chiffrées à partir d’un relevé daté des prix des matériaux, de la main-d’œuvre et du matériel pour votre district.',
        ),
      },
      {
        title: L('Read the range, not a number', 'Soma imbibi, si umubare umwe', 'Lisez la fourchette, pas un chiffre'),
        text: L(
          'Every figure carries its class, its assumptions and a trace back to the inputs and price records behind it.',
          'Buri mubare ufite urwego rwawo, ibyo ushingiyeho n’inzira igaruka ku byinjijwe no ku biciro byawukozeho.',
          'Chaque chiffre porte sa classe, ses hypothèses et une trace jusqu’aux données saisies et aux prix qui le fondent.',
        ),
      },
      {
        title: L('Save, refine, hand over', 'Bika, nonosora, shyikiriza', 'Enregistrez, affinez, transmettez'),
        text: L(
          'Sign in to keep the project, compare scenarios, and promote it to a measured Bill of Quantities with your own rates.',
          'Injira kugira ngo ubike umushinga, ugereranye uburyo butandukanye, uwuzamure ube urutonde rw’ibikoresho rwapimwe rufite ibiciro byawe.',
          'Connectez-vous pour conserver le projet, comparer des scénarios et le promouvoir en devis quantitatif mesuré avec vos propres prix.',
        ),
      },
    ],
    showClassesTable: true,
    professional: {
      title: L(
        'From the client’s first range to a signed Bill of Quantities.',
        'Kuva ku mbibi za mbere z’umukiriya kugeza ku rutonde rw’ibikoresho rushyizweho umukono.',
        'De la première fourchette du client au devis quantitatif signé.',
      ),
      text: L(
        'Architects, quantity surveyors and contractors pick up the same model the client saw, then measure it, price it with their own rates, review it and issue it. Nothing is hidden along the way.',
        'Ba architecte, ababaruzi b’ibikoresho n’abarwubatsi bakomereza ku cyitegererezo kimwe umukiriya yabonye, bakagipima, bakagishyiraho ibiciro byabo, bakakigenzura bakanagitanga. Nta kintu gihishwa.',
        'Architectes, métreurs et entrepreneurs reprennent le même modèle que le client a vu, puis le mesurent, le chiffrent avec leurs propres prix, le vérifient et l’émettent. Rien n’est caché en chemin.',
      ),
      bullets: [
        L(
          'Every quantity shows its formula and the source it came from',
          'Buri ngano yerekana inzira yabazwemo n’aho yavuye',
          'Chaque quantité affiche sa formule et sa source',
        ),
        L(
          'Every rate carries its supplier, date and confidence grade',
          'Buri giciro gifite uwagitanze, itariki n’urwego rw’icyizere',
          'Chaque prix indique son fournisseur, sa date et son niveau de confiance',
        ),
        L(
          'Overrides are recorded with a reason and an author',
          'Impinduka zandikwa hamwe n’impamvu n’uwazikoze',
          'Les modifications sont consignées avec un motif et un auteur',
        ),
        L(
          'Draft, review, approve and issue, with numbered revisions',
          'Umushinga w’agateganyo, igenzura, kwemeza no gutanga, hamwe n’impinduka zifite nimero',
          'Brouillon, revue, approbation et émission, avec des révisions numérotées',
        ),
        L(
          'Exports stay locked while any price in the bill is stale',
          'Kohereza hanze bigumaho ingufuri igihe hari igiciro gishaje mu rutonde',
          'L’export reste bloqué tant qu’un prix du devis est périmé',
        ),
        L(
          'Client, QS and management reports from one price snapshot',
          'Raporo z’umukiriya, iz’umubaruzi n’iz’ubuyobozi zivuye ku rutonde rumwe rw’ibiciro',
          'Rapports client, métreur et direction à partir d’un même relevé de prix',
        ),
      ],
      cta: L('Open the professional workspace', 'Fungura ahakorerwa n’abanyamwuga', 'Ouvrir l’espace professionnel'),
    },
    example: { typology: 'house', locationId: 'kigali', gfa: 150, storeys: 1, quality: 'STD' },
  },
  typologies: [
    { id: 'house', label: L('House', 'Inzu', 'Maison'), enabled: true, baseRatePerM2: 420_000 },
    { id: 'apartments', label: L('Apartments', 'Apartema', 'Appartements'), enabled: true, baseRatePerM2: 480_000 },
    { id: 'shop', label: L('Shop', 'Iduka', 'Boutique'), enabled: true, baseRatePerM2: 380_000 },
    { id: 'office', label: L('Office', 'Ibiro', 'Bureaux'), enabled: true, baseRatePerM2: 450_000 },
    { id: 'hotel', label: L('Hotel', 'Hoteli', 'Hôtel'), enabled: true, baseRatePerM2: 650_000 },
    { id: 'school', label: L('School', 'Ishuri', 'École'), enabled: true, baseRatePerM2: 360_000 },
    { id: 'other', label: L('Other', 'Ibindi', 'Autre'), enabled: true, baseRatePerM2: 420_000 },
  ],
  qualities: [
    {
      id: 'ECO',
      label: L('Economy', 'Isanzwe', 'Économique'),
      description: L(
        'Hollow blocks · metal sheets · screed or basic ceramic · basic fittings',
        'Amatafari y’ubusa · amabati · sima cyangwa karo isanzwe · ibikoresho bisanzwe',
        'Blocs creux · tôles · chape ou céramique de base · équipements de base',
      ),
      multiplier: 0.8,
    },
    {
      id: 'STD',
      label: L('Standard', 'Hagati', 'Standard'),
      description: L(
        'Pre-painted roof with ceiling · ceramic 60×60 · fitted kitchen',
        'Igisenge cy’amabati asize irangi n’ikibaho cyo hejuru · karo 60×60 · igikoni cyuzuye',
        'Toiture prépeinte avec plafond · céramique 60×60 · cuisine équipée',
      ),
      multiplier: 1.0,
    },
    {
      id: 'PRM',
      label: L('Premium', 'Iyo hejuru', 'Premium'),
      description: L(
        'Clay brick features · concrete tile roof · porcelain floors · split AC',
        'Amatafari y’ibumba · igisenge cy’amategura ya beto · hasi ha porselene · AC',
        'Briques de terre cuite · toiture en tuiles béton · sols en grès cérame · climatisation split',
      ),
      multiplier: 1.4,
    },
    {
      id: 'LUX',
      label: L('Luxury', 'Iy’akataraboneka', 'Luxe'),
      description: L(
        'Stone or cladding · engineered roof · natural stone · bespoke everything',
        'Amabuye cyangwa ibyometseho · igisenge cyateguwe · amabuye karemano · byose ku bushake bwawe',
        'Pierre ou bardage · toiture conçue sur mesure · pierre naturelle · tout sur mesure',
      ),
      multiplier: 2.0,
    },
  ],
  elementMultipliers: {
    hvac: { ECO: 0, STD: 1, PRM: 3, LUX: 5 },
    external: { ECO: 0.5, STD: 1, PRM: 1.8, LUX: 3.5 },
    kitchen: { ECO: 0.6, STD: 1, PRM: 1.8, LUX: 3.2 },
    windows: { ECO: 0.7, STD: 1, PRM: 1.6, LUX: 2.6 },
  },
  elementLabels: ELEMENT_NAMES,
  packages: [
    {
      code: '00',
      name: L(
        'Pre-construction & statutory',
        'Mbere y’ubwubatsi n’ibyemezo',
        'Pré-construction et démarches réglementaires',
      ),
      phase: 'P0',
      share: 0.02,
      element: null,
    },
    {
      code: '01',
      name: L(
        'Preliminaries & site management',
        'Imirimo y’ibanze n’imicungire y’urubuga',
        'Installations de chantier et gestion',
      ),
      phase: 'spread',
      share: 0.05,
      element: null,
    },
    {
      code: '02',
      name: L(
        'Site preparation & earthworks',
        'Gutegura urubuga n’imirimo y’ubutaka',
        'Préparation du terrain et terrassements',
      ),
      phase: 'P1',
      share: 0.02,
      element: null,
    },
    {
      code: '03',
      name: L('Substructure', 'Umusingi', 'Infrastructure (fondations)'),
      phase: 'P2',
      share: 0.12,
      element: 'structure',
    },
    {
      code: '04',
      name: L('Superstructure frame', 'Inkingi n’imikoro yo hejuru', 'Ossature de superstructure'),
      phase: 'P3',
      share: 0.1,
      element: 'structure',
    },
    {
      code: '05',
      name: L(
        'Envelope: external walls & openings',
        'Inkuta zo hanze n’imyanya ifunguye',
        'Enveloppe : murs extérieurs et ouvertures',
      ),
      phase: 'P4',
      share: 0.09,
      element: 'walls',
    },
    {
      code: '05W',
      name: L('Windows & glazing', 'Amadirishya n’ibirahure', 'Fenêtres et vitrages'),
      phase: 'P4',
      share: 0.05,
      element: 'windows',
    },
    {
      code: '05D',
      name: L('External & internal doors', 'Inzugi zo hanze n’izo mu nzu', 'Portes extérieures et intérieures'),
      phase: 'P7',
      share: 0.03,
      element: 'doors',
    },
    { code: '06', name: L('Roof', 'Igisenge', 'Toiture'), phase: 'P4', share: 0.09, element: 'roof' },
    {
      code: '07',
      name: L('Internal walls & partitions', 'Inkuta zo imbere n’ibyagabanyije', 'Murs intérieurs et cloisons'),
      phase: 'P5',
      share: 0.02,
      element: null,
    },
    {
      code: '08',
      name: L(
        'Services rough-in',
        'Imiyoboro y’ibanze (amazi n’amashanyarazi)',
        'Réseaux en attente (plomberie, électricité)',
      ),
      phase: 'P5',
      share: 0.04,
      element: 'electrical',
    },
    {
      code: '08H',
      name: L('HVAC provisions', 'Ibikoresho byo guhumeka n’ubukonje', 'Provisions CVC'),
      phase: 'P5',
      share: 0.02,
      element: 'hvac',
    },
    {
      code: '09',
      name: L('Wet-trade finishes', 'Gusiga sima n’ibindi bikoreshwa n’amazi', 'Finitions humides (enduits, chapes)'),
      phase: 'P6',
      share: 0.06,
      element: 'wallFinish',
    },
    {
      code: '10',
      name: L('Floor finishes', 'Isura ya hasi', 'Revêtements de sol'),
      phase: 'P7',
      share: 0.07,
      element: 'floors',
    },
    {
      code: '10C',
      name: L('Ceilings & painting', 'Ibisenge byo mu nzu n’amarangi', 'Plafonds et peinture'),
      phase: 'P7',
      share: 0.03,
      element: 'ceilings',
    },
    {
      code: '11',
      name: L('Joinery & kitchen', 'Ububaji n’igikoni', 'Menuiserie et cuisine'),
      phase: 'P7',
      share: 0.04,
      element: 'kitchen',
    },
    {
      code: '12',
      name: L('Sanitary fit-off', 'Gushyiraho ibikoresho by’isuku', 'Pose des sanitaires'),
      phase: 'P7',
      share: 0.05,
      element: 'sanitary',
    },
    {
      code: '12E',
      name: L(
        'Electrical fit-off & lighting',
        'Gushyiraho amashanyarazi n’amatara',
        'Appareillage électrique et éclairage',
      ),
      phase: 'P7',
      share: 0.02,
      element: 'electrical',
    },
    {
      code: '13',
      name: L('External works', 'Imirimo yo hanze', 'Aménagements extérieurs'),
      phase: 'P8',
      share: 0.07,
      element: 'external',
    },
    {
      code: '14',
      name: L(
        'Testing, commissioning & handover',
        'Kugerageza, kwemeza no gushyikiriza',
        'Essais, mise en service et réception',
      ),
      phase: 'P9',
      share: 0.01,
      element: null,
    },
  ],
  phaseNames: PHASE_NAMES,
  features: [
    {
      id: 'solar',
      label: L('Solar PV + water heating', 'Imirasire y’izuba n’amazi ashyushye', 'Solaire PV + eau chaude'),
      enabled: true,
      fixed: 5_500_000,
      perBedroom: null,
      pctOfBase: null,
      boostGroup: null,
      boostPct: null,
    },
    {
      id: 'generator',
      label: L('Standby generator', 'Jenerateri', 'Groupe électrogène'),
      enabled: true,
      fixed: 4_000_000,
      perBedroom: null,
      pctOfBase: null,
      boostGroup: null,
      boostPct: null,
    },
    {
      id: 'pool',
      label: L('Swimming pool', 'Piscine', 'Piscine'),
      enabled: true,
      fixed: 28_000_000,
      perBedroom: null,
      pctOfBase: null,
      boostGroup: null,
      boostPct: null,
    },
    {
      id: 'ac',
      label: L('Air conditioning', 'Ubukonje (AC)', 'Climatisation'),
      enabled: true,
      fixed: null,
      perBedroom: 1_200_000,
      pctOfBase: null,
      boostGroup: null,
      boostPct: null,
    },
    {
      id: 'smartHome',
      label: L('Smart home package', 'Inzu y’ubwenge', 'Pack maison connectée'),
      enabled: true,
      fixed: 6_000_000,
      perBedroom: null,
      pctOfBase: null,
      boostGroup: null,
      boostPct: null,
    },
    {
      id: 'bigWindows',
      label: L('Large glazed openings', 'Amadirishya manini y’ibirahure', 'Grandes baies vitrées'),
      enabled: true,
      fixed: null,
      perBedroom: null,
      pctOfBase: null,
      boostGroup: 'windows',
      boostPct: 35,
    },
    {
      id: 'premiumKitchen',
      label: L('Premium kitchen', 'Igikoni cyo hejuru', 'Cuisine haut de gamme'),
      enabled: true,
      fixed: null,
      perBedroom: null,
      pctOfBase: null,
      boostGroup: 'kitchen',
      boostPct: 60,
    },
    {
      id: 'landscaping',
      label: L('Landscaping', 'Gutunganya ubusitani', 'Aménagement paysager'),
      enabled: true,
      fixed: null,
      perBedroom: null,
      pctOfBase: 0.03,
      boostGroup: null,
      boostPct: null,
    },
    {
      id: 'boundaryWall',
      label: L('Boundary wall & gate', 'Uruzitiro n’irembo', 'Clôture et portail'),
      enabled: true,
      fixed: 9_000_000,
      perBedroom: null,
      pctOfBase: null,
      boostGroup: null,
      boostPct: null,
    },
  ],
  locations: [
    { id: 'kigali', name: 'Kigali', province: 'City of Kigali', factor: 1.0, enabled: true },
    { id: 'bugesera', name: 'Bugesera', province: 'Eastern', factor: 1.04, enabled: true },
    { id: 'muhanga', name: 'Muhanga', province: 'Southern', factor: 1.05, enabled: true },
    { id: 'huye', name: 'Huye', province: 'Southern', factor: 1.06, enabled: true },
    { id: 'musanze', name: 'Musanze', province: 'Northern', factor: 1.08, enabled: true },
    { id: 'rubavu', name: 'Rubavu', province: 'Western', factor: 1.1, enabled: true },
    { id: 'nyagatare', name: 'Nyagatare', province: 'Eastern', factor: 1.12, enabled: true },
    { id: 'rusizi', name: 'Rusizi', province: 'Western', factor: 1.15, enabled: true },
  ],
  classes: [
    {
      level: 1,
      label: L('Rough budget', 'Ingengo y’imari igereranyije', 'Budget approximatif'),
      rangePct: 15,
      contingencyPct: 10,
    },
    {
      level: 2,
      label: L('Preliminary estimate', 'Igereranya ry’ibanze', 'Estimation préliminaire'),
      rangePct: 10,
      contingencyPct: 8,
    },
    {
      level: 3,
      label: L(
        'Design-stage estimate',
        'Igereranya ryo mu cyiciro cy’igishushanyo',
        'Estimation au stade de la conception',
      ),
      rangePct: 7,
      contingencyPct: 6,
    },
    {
      level: 4,
      label: L(
        'Professional BOQ (unverified until signed)',
        'BOQ y’abanyamwuga (itaremezwa kugeza ishyizweho umukono)',
        'BOQ professionnel (non vérifié avant signature)',
      ),
      rangePct: 4,
      contingencyPct: 5,
    },
    { level: 5, label: L('Tender BOQ', 'BOQ y’ipiganwa', 'BOQ d’appel d’offres'), rangePct: 2, contingencyPct: 3 },
  ],
  financial: {
    feesPct: FEES_PCT,
    vatPct: VAT_PCT,
    defaultOverheadPct: 0,
    defaultContingencyPct: 8,
    storeyFactorPct: 4,
    slopeFactors: { gentle: 1.02, steep: 1.06 },
  },
  workflow: {
    stalePriceDays: 90,
    anomalyThresholdPct: 25,
    blockExportOnStalePrices: true,
    requireOverrideReason: true,
    approveBoqRoles: ['qs', 'contractor', 'company_admin'],
    maxEssentialQuestions: 3,
  },
  localization: { defaultLocale: 'en', enabledLocales: ['en', 'rw', 'fr'] },
  changelog: [
    {
      version: 1,
      at: '2026-10-01T00:00:00.000Z',
      by: 'factory defaults',
      note: 'Initial rule set from Requirements v0.1 sample data.',
    },
  ],
}

/** The configuration with every localized text resolved for `lang` (English fallback). */
export const resolveConfig = (c, lang = 'en') => localizeDeep(c, lang)

/** Rules in the shape the engine consumes. Derived from a PlatformConfig, with names in `lang`. */
export function rulesFromConfig(config, lang = 'en') {
  const c = resolveConfig(config, lang)
  const classes = {}
  for (const k of c.classes)
    classes[k.level] = { label: k.label, rangePct: k.rangePct, contingencyPct: k.contingencyPct }
  return {
    version: c.version,
    lang,
    rulesVersion: `rules-v${c.version}`,
    baseRate: Object.fromEntries(c.typologies.map((t) => [t.id, t.baseRatePerM2])),
    qualityMultiplier: Object.fromEntries(c.qualities.map((q) => [q.id, q.multiplier])),
    elementMultipliers: c.elementMultipliers,
    elementNames: c.elementLabels,
    packages: c.packages,
    phaseNames: c.phaseNames,
    features: Object.fromEntries(c.features.map((f) => [f.id, f])),
    classes,
    feesPct: c.financial.feesPct,
    vatPct: c.financial.vatPct,
    defaultOverheadPct: c.financial.defaultOverheadPct,
    defaultContingencyPct: c.financial.defaultContingencyPct,
    storeyFactorPct: c.financial.storeyFactorPct,
    slopeFactors: c.financial.slopeFactors,
    stalePriceDays: c.workflow.stalePriceDays,
    anomalyThresholdPct: c.workflow.anomalyThresholdPct,
    blockExportOnStalePrices: c.workflow.blockExportOnStalePrices,
  }
}

export const DEFAULT_RULES = rulesFromConfig(DEFAULT_CONFIG)
/** Kept for callers that only need the package list (BOQ bill names), in English. */
export const PACKAGES = DEFAULT_RULES.packages
