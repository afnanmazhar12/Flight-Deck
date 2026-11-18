export const PRESETS = {
  b777: {
    exact: '777-300ER',
    fdv: 'B777',
    ls: 'B773',
    fvSub: 'HEAVY AIRCRAFT OPERATIONS',
    fvFoot: 'HEAVY FUEL VOUCHER',
    cat: '(WIDE-BODY LONG RANGE)',
    taxi: 500,
    fuelCap: 145500,
    capAlt: '320,800 LBS',
    config: 'F8C42Y304 / C28Y368',
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
  }
};
