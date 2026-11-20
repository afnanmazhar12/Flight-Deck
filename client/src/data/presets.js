export const PRESETS = {
  b777: {
    exact: '777-300ER',
    fdv: 'B777',
    ls: 'B773',
    fvSub: 'HEAVY WIDEBODY OPERATIONS',
    fvFoot: 'HEAVY FUEL VOUCHER',
    cat: '(WIDE-BODY LONG RANGE)',
    taxi: 500,
    fuelCap: 145500,
    capAlt: '320,800 LBS',
    config: 'F8C42Y304 / C28Y368',
    defaultEngine: 'GE90-115B',
    limits: { mrw: '352441', mtow: '351534', mlw: '251290', mzfw: '237682' },
    tanks: [
      { name: 'Left Main Tank', max: '31300' },
      { name: 'Center Main Tank', max: '82900' },
      { name: 'Right Main Tank', max: '31300' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd Pallets)', limit: '25000', group: 1 },
      { name: 'Hold 2 (Fwd Container)', limit: '21000', group: 1 },
      { name: 'Hold 3 (Aft Container)', limit: '18000', group: 2 },
      { name: 'Hold 4 (Aft Loose/Bulk)', limit: '3000', group: 2 }
    ],
    zones: [
      { name: 'Zone A (First / Business)' },
      { name: 'Zone B (Business / Premium)' },
      { name: 'Zone C (Economy Fwd)' },
      { name: 'Zone D (Economy Mid)' },
      { name: 'Zone E (Economy Aft)' }
    ],
    cargo: ['Cargo / Pallets (Hold 1 + Hold 2)', 'Cargo / Pallets (Hold 3 + Hold 4 + Bulk)'],
    holdTitle: '4. LOWER DECK CARGO COMPARTMENTS',
    trim: 'STAB TRIM UNITS',
    sig: [
      ['REFUELING OPERATOR / AGENT', 'Print Name'],
      ['AIRCRAFT MAINTENANCE / ENGINEER', 'Staff ID'],
      ['CAPTAIN / FIRST OFFICER', 'Licence No']
    ]
  },
  b737: {
    exact: '737-800',
    fdv: 'B738',
    ls: 'B738',
    fvSub: 'NARROWBODY OPERATIONS',
    fvFoot: 'FUEL DELIVERY VOUCHER',
    cat: '(NARROW-BODY MEDIUM RANGE)',
    taxi: 200,
    fuelCap: 20890,
    capAlt: '46,060 LBS',
    config: 'Y189 / C12Y150',
    defaultEngine: 'CFM56-7B26',
    limits: { mrw: '79242', mtow: '79015', mlw: '66361', mzfw: '62731' },
    tanks: [
      { name: 'Main Tank 1 (Left)', max: '3915' },
      { name: 'Center Tank', max: '13060' },
      { name: 'Main Tank 2 (Right)', max: '3915' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd)', limit: '1361', group: 1 },
      { name: 'Hold 2 (Fwd)', limit: '2041', group: 1 },
      { name: 'Hold 3 (Aft)', limit: '2268', group: 2 },
      { name: 'Hold 4 (Aft / Bulk)', limit: '1247', group: 2 }
    ],
    zones: [
      { name: 'Zone A (Rows 1-6)' },
      { name: 'Zone B (Rows 7-15)' },
      { name: 'Zone C (Rows 16-24)' },
      { name: 'Zone D (Rows 25-33)' }
    ],
    cargo: ['Cargo (Hold 1 + Hold 2)', 'Cargo (Hold 3 + Hold 4)'],
    holdTitle: '4. CARGO HOLD DISTRIBUTION',
    trim: 'STAB TRIM SETTING',
    sig: [
      ['FUELING OPERATOR', 'ID No'],
      ['GROUND HANDLING / MECHANIC', 'Stamp / ID'],
      ['CAPTAIN / FLIGHT CREW', 'Licence No']
    ]
  },
  a320: {
    exact: 'A320-200',
    fdv: 'A320',
    ls: 'A320',
    fvSub: 'COMMERCIAL FLEET OPERATIONS',
    fvFoot: 'FUEL DELIVERY VOUCHER',
    cat: '(SINGLE-AISLE NARROW-BODY)',
    taxi: 150,
    fuelCap: 18720,
    capAlt: '24,210 L',
    config: 'Y180 / C12Y138',
    defaultEngine: 'CFM56-5B4/P',
    limits: { mrw: '77400', mtow: '77000', mlw: '66000', mzfw: '62500' },
    tanks: [
      { name: 'Outer + Inner Left', max: '6250' },
      { name: 'Center Tank', max: '6470' },
      { name: 'Inner + Outer Right', max: '6250' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd)', limit: '2270', group: 1 },
      { name: 'Hold 3 (Aft)', limit: '1900', group: 2 },
      { name: 'Hold 4 (Aft)', limit: '1502', group: 2 },
      { name: 'Hold 5 (Bulk / Loose)', limit: '1497', group: 2 }
    ],
    zones: [
      { name: 'Zone OA (Rows 1-6)' },
      { name: 'Zone OB (Rows 7-13)' },
      { name: 'Zone OC (Rows 14-22)' },
      { name: 'Zone OD (Rows 23-30)' }
    ],
    cargo: ['Cargo / Luggage (Hold 1 + 2)', 'Cargo / Luggage (Hold 3 + 4 + 5)'],
    holdTitle: '4. CARGO HOLD DISTRIBUTION',
    trim: 'THS TRIM SETTING (UP/DN)',
    sig: [
      ['FUEL SUPPLIER / TECHNICIAN', 'Name / ID'],
      ['GROUND HANDLING ENGINEER', 'Licence No'],
      ['COMMANDER / PILOT FLYING', 'Staff ID']
    ]
  },
  b787: {
    exact: '787-9',
    fdv: 'B787',
    ls: 'B789',
    fvSub: 'DREAMLINER LONG-HAUL OPERATIONS',
    fvFoot: 'LONG RANGE FUEL VOUCHER',
    cat: '(WIDE-BODY TWIN-AISLE)',
    taxi: 400,
    fuelCap: 101450,
    capAlt: '223,650 LBS',
    config: 'C30W21Y247 / C42Y238',
    defaultEngine: 'GEnx-1B74/75',
    limits: { mrw: '254465', mtow: '254011', mlw: '192776', mzfw: '181436' },
    tanks: [
      { name: 'Left Main Tank', max: '15020' },
      { name: 'Center Tank', max: '71410' },
      { name: 'Right Main Tank', max: '15020' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd LD-3)', limit: '18500', group: 1 },
      { name: 'Hold 2 (Fwd LD-3)', limit: '16000', group: 1 },
      { name: 'Hold 3 (Aft Container)', limit: '14000', group: 2 },
      { name: 'Hold 4 (Bulk Compartment)', limit: '2400', group: 2 }
    ],
    zones: [
      { name: 'Zone A (Business Premier)' },
      { name: 'Zone B (Premium Economy)' },
      { name: 'Zone C (Economy Forward)' },
      { name: 'Zone D (Economy Aft)' }
    ],
    cargo: ['Forward Holds (Hold 1 + 2)', 'Aft & Bulk Holds (Hold 3 + 4)'],
    holdTitle: '4. LOWER DECK CARGO DISTRIBUTION',
    trim: 'STAB TRIM UNITS',
    sig: [
      ['REFUELING AGENT', 'Licence / Staff ID'],
      ['AVIONICS / AME INSPECTOR', 'GACA / FAA A&P'],
      ['COMMANDER / CAPTAIN', 'Licence No']
    ]
  },
  a350: {
    exact: 'A350-900',
    fdv: 'A350',
    ls: 'A359',
    fvSub: 'EXTRA WIDE BODY OPERATIONS',
    fvFoot: 'XWB LONG-HAUL FUEL VOUCHER',
    cat: '(WIDE-BODY ADVANCED COMPOSITE)',
    taxi: 450,
    fuelCap: 110520,
    capAlt: '243,650 LBS',
    config: 'C36W39Y214 / C42Y277',
    defaultEngine: 'Trent XWB-84',
    limits: { mrw: '280900', mtow: '280000', mlw: '207000', mzfw: '195700' },
    tanks: [
      { name: 'Outer + Inner Left Tank', max: '26500' },
      { name: 'Center Tank', max: '57520' },
      { name: 'Inner + Outer Right Tank', max: '26500' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd Cargo)', limit: '21000', group: 1 },
      { name: 'Hold 3 (Aft Cargo)', limit: '18500', group: 2 },
      { name: 'Hold 4 (Aft Containers)', limit: '12000', group: 2 },
      { name: 'Hold 5 (Bulk)', limit: '2400', group: 2 }
    ],
    zones: [
      { name: 'Zone 1 (Qsuite / Business)' },
      { name: 'Zone 2 (Premium Economy)' },
      { name: 'Zone 3 (Economy Mid)' },
      { name: 'Zone 4 (Economy Aft)' }
    ],
    cargo: ['Cargo Forward (Hold 1)', 'Cargo Aft & Bulk (Hold 3 + 4 + 5)'],
    holdTitle: '4. LOWER DECK CARGO DISTRIBUTION',
    trim: 'THS TRIM SETTING (UP/DN)',
    sig: [
      ['REFUELING ENGINEER', 'ID No'],
      ['LINE MAINTENANCE SUPERVISOR', 'EASA Part-66'],
      ['COMMANDER / PILOT FLYING', 'Staff ID']
    ]
  },
  a330: {
    exact: 'A330-300',
    fdv: 'A330',
    ls: 'A333',
    fvSub: 'WIDE-BODY OPERATIONS',
    fvFoot: 'FUEL DELIVERY VOUCHER',
    cat: '(TWIN-AISLE MEDIUM/LONG RANGE)',
    taxi: 350,
    fuelCap: 77500,
    capAlt: '170,850 LBS',
    config: 'C30Y265 / C36Y241',
    defaultEngine: 'Trent 772B-60',
    limits: { mrw: '242900', mtow: '242000', mlw: '187000', mzfw: '175000' },
    tanks: [
      { name: 'Left Wing Tank', max: '33100' },
      { name: 'Center Tank', max: '11300' },
      { name: 'Right Wing Tank', max: '33100' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd Pallets)', limit: '18800', group: 1 },
      { name: 'Hold 2 (Fwd Container)', limit: '15400', group: 1 },
      { name: 'Hold 3 (Aft Container)', limit: '14200', group: 2 },
      { name: 'Hold 4 (Aft Bulk)', limit: '3468', group: 2 }
    ],
    zones: [
      { name: 'Zone A (Business)' },
      { name: 'Zone B (Economy Fwd)' },
      { name: 'Zone C (Economy Mid)' },
      { name: 'Zone D (Economy Aft)' }
    ],
    cargo: ['Forward Compartments (Hold 1 + 2)', 'Aft & Bulk Compartments (Hold 3 + 4)'],
    holdTitle: '4. CARGO COMPARTMENTS',
    trim: 'THS PITCH TRIM',
    sig: [
      ['REFUELING TECHNICIAN', 'Name / ID'],
      ['LICENSED AIRCRAFT ENGINEER', 'Licence No'],
      ['CAPTAIN / FIRST OFFICER', 'Licence No']
    ]
  },
  b747: {
    exact: '747-8I',
    fdv: 'B748',
    ls: 'B748',
    fvSub: 'QUEEN OF THE SKIES HEAVY OPS',
    fvFoot: 'JUMBO FUEL DELIVERY VOUCHER',
    cat: '(FOUR-ENGINE INTERCONTINENTAL)',
    taxi: 800,
    fuelCap: 172900,
    capAlt: '381,200 LBS',
    config: 'F8C80W32Y244',
    defaultEngine: 'GEnx-2B67',
    limits: { mrw: '449056', mtow: '447696', mlw: '312072', mzfw: '295289' },
    tanks: [
      { name: 'Reserve Tanks 1 & 4', max: '7500' },
      { name: 'Main Tanks 1 & 4', max: '28600' },
      { name: 'Main Tanks 2 & 3', max: '52200' },
      { name: 'Center Wing Tank', max: '74600' },
      { name: 'Horizontal Stabilizer Tank', max: '10000' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd LD-1)', limit: '28000', group: 1 },
      { name: 'Hold 2 (Fwd Pallets)', limit: '24000', group: 1 },
      { name: 'Hold 3 (Aft LD-1)', limit: '22000', group: 2 },
      { name: 'Hold 4 (Aft Bulk)', limit: '4800', group: 2 }
    ],
    zones: [
      { name: 'Main Deck Zone A (First Class Nose)' },
      { name: 'Upper Deck (Business Lounge & Suites)' },
      { name: 'Main Deck Zone B (Business Mid)' },
      { name: 'Main Deck Zone C (Premium Economy)' },
      { name: 'Main Deck Zone D (Economy Main)' },
      { name: 'Main Deck Zone E (Economy Aft)' }
    ],
    cargo: ['Main Deck & Forward Holds (Hold 1 + 2)', 'Aft Lower Holds (Hold 3 + 4)'],
    holdTitle: '4. LOWER DECK CARGO DISTRIBUTION',
    trim: 'STAB TRIM UNITS',
    sig: [
      ['REFUELING SUPERVISOR', 'Staff Stamp'],
      ['HEAVY MRO RELEASE ENGINEER', 'Part-66 / A&P'],
      ['COMMANDER / CAPTAIN', 'Licence No']
    ]
  },
  a380: {
    exact: 'A380-800',
    fdv: 'A388',
    ls: 'A388',
    fvSub: 'SUPER HEAVY INTERCONTINENTAL OPERATIONS',
    fvFoot: 'SUPER JUMBO FUEL DELIVERY VOUCHER',
    cat: '(DOUBLE-DECK FOUR-ENGINE SUPER)',
    taxi: 1000,
    fuelCap: 254000,
    capAlt: '560,000 LBS',
    config: 'F14C76W56Y399 / C58Y557',
    defaultEngine: 'Trent 970-84',
    limits: { mrw: '577000', mtow: '575000', mlw: '394000', mzfw: '369000' },
    tanks: [
      { name: 'Outer Wing Tanks 1 & 4', max: '19400' },
      { name: 'Mid Wing Tanks', max: '71600' },
      { name: 'Inner Wing Tanks', max: '88200' },
      { name: 'Feed Tanks', max: '51200' },
      { name: 'Trim Tank (Horizontal Tail)', max: '23600' }
    ],
    holds: [
      { name: 'Hold 1 (Forward Cargo)', limit: '32000', group: 1 },
      { name: 'Hold 2 (Forward Bulk)', limit: '26000', group: 1 },
      { name: 'Hold 3 (Aft Cargo)', limit: '24000', group: 2 },
      { name: 'Hold 4 (Bulk Compartment)', limit: '5400', group: 2 }
    ],
    zones: [
      { name: 'Upper Deck Zone 1 (First Suites)' },
      { name: 'Upper Deck Zone 2 (Business Cabin)' },
      { name: 'Main Deck Zone A (Economy Fwd)' },
      { name: 'Main Deck Zone B (Economy Mid)' },
      { name: 'Main Deck Zone C (Economy Aft)' }
    ],
    cargo: ['Forward Compartments (Hold 1 + 2)', 'Aft & Bulk Compartments (Hold 3 + 4)'],
    holdTitle: '4. CARGO COMPARTMENTS',
    trim: 'THS PITCH TRIM',
    sig: [
      ['SUPER-HEAVY FUEL CONTROLLER', 'Staff ID'],
      ['AME / CHIEF INSPECTOR', 'Licence No'],
      ['CAPTAIN / COMMANDER', 'Licence No']
    ]
  },
  b757: {
    exact: '757-200',
    fdv: 'B752',
    ls: 'B752',
    fvSub: 'NARROWBODY LONG-HAUL OPERATIONS',
    fvFoot: 'FUEL DELIVERY VOUCHER',
    cat: '(STANDARD-BODY LONG RANGE)',
    taxi: 250,
    fuelCap: 34500,
    capAlt: '76,060 LBS',
    config: 'C16Y160',
    defaultEngine: 'RB211-535E4',
    limits: { mrw: '116120', mtow: '115660', mlw: '95250', mzfw: '85270' },
    tanks: [
      { name: 'Left Main Tank', max: '6800' },
      { name: 'Center Tank', max: '20900' },
      { name: 'Right Main Tank', max: '6800' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd)', limit: '4800', group: 1 },
      { name: 'Hold 2 (Fwd Compartment)', limit: '4200', group: 1 },
      { name: 'Hold 3 (Aft)', limit: '5100', group: 2 },
      { name: 'Hold 4 (Bulk)', limit: '1800', group: 2 }
    ],
    zones: [
      { name: 'Zone A (First / Business)' },
      { name: 'Zone B (Economy Fwd)' },
      { name: 'Zone C (Economy Aft)' }
    ],
    cargo: ['Forward Holds (Hold 1 + 2)', 'Aft & Bulk Holds (Hold 3 + 4)'],
    holdTitle: '4. CARGO COMPARTMENTS',
    trim: 'STAB TRIM UNITS',
    sig: [
      ['REFUELING AGENT', 'Name / ID'],
      ['LINE MECHANIC', 'Licence No'],
      ['COMMANDER / CAPTAIN', 'Licence No']
    ]
  },
  b767: {
    exact: '767-300ER',
    fdv: 'B763',
    ls: 'B763',
    fvSub: 'WIDE-BODY TRANSATLANTIC OPS',
    fvFoot: 'FUEL DELIVERY VOUCHER',
    cat: '(TWIN-AISLE MEDIUM/LONG RANGE)',
    taxi: 350,
    fuelCap: 73380,
    capAlt: '161,780 LBS',
    config: 'C30Y188 / C24Y204',
    defaultEngine: 'CF6-80C2B7F',
    limits: { mrw: '187330', mtow: '186880', mlw: '147870', mzfw: '136070' },
    tanks: [
      { name: 'Left Wing Tank', max: '18300' },
      { name: 'Center Tank', max: '36780' },
      { name: 'Right Wing Tank', max: '18300' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd LD-2)', limit: '14000', group: 1 },
      { name: 'Hold 2 (Fwd)', limit: '12000', group: 1 },
      { name: 'Hold 3 (Aft Container)', limit: '13500', group: 2 },
      { name: 'Hold 4 (Bulk)', limit: '2900', group: 2 }
    ],
    zones: [
      { name: 'Zone A (Business)' },
      { name: 'Zone B (Economy Fwd)' },
      { name: 'Zone C (Economy Aft)' }
    ],
    cargo: ['Forward Holds (Hold 1 + 2)', 'Aft & Bulk Holds (Hold 3 + 4)'],
    holdTitle: '4. LOWER DECK CARGO DISTRIBUTION',
    trim: 'STAB TRIM UNITS',
    sig: [
      ['FUEL TECHNICIAN', 'Name / ID'],
      ['AIRFRAME ENGINEER', 'Licence No'],
      ['CAPTAIN / FIRST OFFICER', 'Licence No']
    ]
  },
  a220: {
    exact: 'A220-300',
    fdv: 'BCS3',
    ls: 'BCS3',
    fvSub: 'REGIONAL MAINLINE OPERATIONS',
    fvFoot: 'FUEL DELIVERY VOUCHER',
    cat: '(SINGLE-AISLE ADVANCED REGIONAL)',
    taxi: 120,
    fuelCap: 17200,
    capAlt: '37,920 LBS',
    config: 'Y145 / C12Y125',
    defaultEngine: 'PW1524G',
    limits: { mrw: '70900', mtow: '70500', mlw: '60300', mzfw: '56700' },
    tanks: [
      { name: 'Left Wing Tank', max: '5400' },
      { name: 'Center Tank', max: '6400' },
      { name: 'Right Wing Tank', max: '5400' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd Compartment)', limit: '2400', group: 1 },
      { name: 'Hold 2 (Aft Compartment)', limit: '2600', group: 2 }
    ],
    zones: [
      { name: 'Zone A (Rows 1-8)' },
      { name: 'Zone B (Rows 9-18)' },
      { name: 'Zone C (Rows 19-28)' }
    ],
    cargo: ['Forward Compartment (Hold 1)', 'Aft Compartment (Hold 2)'],
    holdTitle: '4. CARGO COMPARTMENTS',
    trim: 'THS PITCH TRIM',
    sig: [
      ['REFUELING AGENT', 'Name / ID'],
      ['LINE MECHANIC', 'Licence No'],
      ['PILOT FLYING', 'Licence No']
    ]
  },
  regional: {
    exact: 'E195-E2',
    fdv: 'E295',
    ls: 'E295',
    fvSub: 'REGIONAL JET OPERATIONS',
    fvFoot: 'FUEL DELIVERY VOUCHER',
    cat: '(REGIONAL TWIN-TURBOFAN)',
    taxi: 100,
    fuelCap: 13300,
    capAlt: '29,320 LBS',
    config: 'Y132 / C12Y108',
    defaultEngine: 'PW1900G',
    limits: { mrw: '61800', mtow: '61500', mlw: '54000', mzfw: '51200' },
    tanks: [
      { name: 'Left Main Wing Tank', max: '5150' },
      { name: 'Center Surge Tank', max: '3000' },
      { name: 'Right Main Wing Tank', max: '5150' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd Cargo)', limit: '1850', group: 1 },
      { name: 'Hold 2 (Aft Cargo)', limit: '2150', group: 2 }
    ],
    zones: [
      { name: 'Zone A (Rows 1-6)' },
      { name: 'Zone B (Rows 7-16)' },
      { name: 'Zone C (Rows 17-26)' }
    ],
    cargo: ['Forward Hold', 'Aft Hold'],
    holdTitle: '4. CARGO COMPARTMENTS',
    trim: 'STAB TRIM UNITS',
    sig: [
      ['FUELING AGENT', 'Name / ID'],
      ['AME TECHNICIAN', 'Licence No'],
      ['CAPTAIN', 'Licence No']
    ]
  }
};

/**
 * Returns complete, authentic specifications for any aircraft group, variant, or ICAO code.
 * Ensures no aircraft variant in the fleet ever starts with blank limits or empty fuel tanks.
 */
export function getAircraftSpec(catalogItem = {}, variantItem = {}) {
  const g = (catalogItem.g || catalogItem.group || '').toUpperCase();
  const v = (variantItem.l || variantItem.variant || '').toUpperCase();
  const icao = (variantItem.i || variantItem.icao || '').toUpperCase();

  // Match key
  let key = 'a320';
  if (/777|B77/i.test(g) || /B77/i.test(icao)) key = 'b777';
  else if (/737|B73|B38M|B39M/i.test(g) || /B73|B38M|B39M/i.test(icao)) key = 'b737';
  else if (/787|B78|DREAMLINER/i.test(g) || /B78/i.test(icao)) key = 'b787';
  else if (/747|B74/i.test(g) || /B74/i.test(icao)) key = 'b747';
  else if (/A350|A35/i.test(g) || /A35/i.test(icao)) key = 'a350';
  else if (/A330|A33/i.test(g) || /A33/i.test(icao)) key = 'a330';
  else if (/A380|A38/i.test(g) || /A38/i.test(icao)) key = 'a380';
  else if (/757|B75/i.test(g) || /B75/i.test(icao)) key = 'b757';
  else if (/767|B76/i.test(g) || /B76/i.test(icao)) key = 'b767';
  else if (/A220|BCS/i.test(g) || /BCS/i.test(icao)) key = 'a220';
  else if (/EMBRAER|E-JET|E17|E19|E29/i.test(g) || /E75|E19|E29/i.test(icao)) key = 'regional';
  else if (/320|321|319|318|A20N|A21N/i.test(g) || /A31|A32|A20|A21/i.test(icao)) key = 'a320';

  const base = PRESETS[key] || PRESETS.a320;
  const spec = JSON.parse(JSON.stringify(base));

  // Variant-specific fine-tuning
  if (/A321/i.test(v)) {
    spec.exact = v;
    spec.config = /NEO|XLR/i.test(v) ? 'C16Y204 / Y220' : 'C16Y184 / Y212';
    spec.limits = { mrw: '97400', mtow: '97000', mlw: '79200', mzfw: '75600' };
    spec.fuelCap = /XLR/i.test(v) ? 32900 : (/NEO/i.test(v) ? 23700 : 18720);
    spec.defaultEngine = /NEO|XLR/i.test(v) ? 'CFM LEAP-1A32' : 'CFM56-5B3/P';
  } else if (/A319/i.test(v)) {
    spec.exact = v;
    spec.config = 'Y150 / C8Y128';
    spec.limits = { mrw: '75900', mtow: '75500', mlw: '62500', mzfw: '58500' };
    spec.fuelCap = 18720;
    spec.defaultEngine = 'CFM56-5B6/P';
  } else if (/737-700/i.test(v)) {
    spec.exact = v;
    spec.config = 'Y149 / C8Y126';
    spec.limits = { mrw: '70300', mtow: '70080', mlw: '58600', mzfw: '55200' };
    spec.defaultEngine = 'CFM56-7B24';
  } else if (/737 MAX 8|B38M/i.test(v)) {
    spec.exact = v;
    spec.config = 'Y189 / C16Y156';
    spec.limits = { mrw: '82417', mtow: '82190', mlw: '69308', mzfw: '65952' };
    spec.defaultEngine = 'LEAP-1B28';
  } else if (/787-8/i.test(v)) {
    spec.exact = v;
    spec.config = 'C24Y218';
    spec.limits = { mrw: '228383', mtow: '227930', mlw: '172365', mzfw: '161025' };
    spec.fuelCap = 101450;
    spec.defaultEngine = 'GEnx-1B70';
  } else if (/787-10/i.test(v)) {
    spec.exact = v;
    spec.config = 'C32Y298';
    spec.limits = { mrw: '254465', mtow: '254011', mlw: '201848', mzfw: '192776' };
    spec.fuelCap = 101450;
    spec.defaultEngine = 'GEnx-1B76';
  } else if (/A350-1000/i.test(v)) {
    spec.exact = v;
    spec.config = 'C46Y334';
    spec.limits = { mrw: '316900', mtow: '316000', mlw: '236000', mzfw: '223000' };
    spec.fuelCap = 124000;
    spec.defaultEngine = 'Trent XWB-97';
  } else if (/747-400/i.test(v)) {
    spec.exact = v;
    spec.config = 'F14C52Y310';
    spec.limits = { mrw: '397800', mtow: '396890', mlw: '295740', mzfw: '246070' };
    spec.fuelCap = 163000;
    spec.defaultEngine = 'CF6-80C2B1F';
  }

  return spec;
}
