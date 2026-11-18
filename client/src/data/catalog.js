const V = (l, i) => ({ l, i });

export const CATALOG = [
  { g: 'Boeing 777', make: 'Boeing', tpl: 'b777', vars: [V('777-200', 'B772'), V('777-200ER', 'B772'), V('777-200LR', 'B77L'), V('777-300', 'B773'), V('777-300ER', 'B77W'), V('777F', 'B77L')] },
  { g: 'Boeing 737', make: 'Boeing', tpl: 'b737', vars: [V('737-700', 'B737'), V('737-800', 'B738'), V('737-900ER', 'B739'), V('737 MAX 8', 'B38M'), V('737 MAX 9', 'B39M')] },
  { g: 'Airbus A320 family', make: 'Airbus', tpl: 'a320', vars: [V('A318', 'A318'), V('A319', 'A319'), V('A320-200', 'A320'), V('A320neo', 'A20N'), V('A321-200', 'A321'), V('A321neo', 'A21N'), V('A321XLR', 'A21N')] },
  { g: 'Boeing 787', make: 'Boeing', tpl: 'b777', vars: [V('787-8', 'B788'), V('787-9', 'B789'), V('787-10', 'B78X')] },
  { g: 'Airbus A350', make: 'Airbus', tpl: 'b777', vars: [V('A350-900', 'A359'), V('A350-1000', 'A35K')] },
  { g: 'Airbus A330', make: 'Airbus', tpl: 'b777', vars: [V('A330-200', 'A332'), V('A330-300', 'A333'), V('A330-800neo', 'A338'), V('A330-900neo', 'A339')] },
  { g: 'Boeing 747', make: 'Boeing', tpl: 'b777', vars: [V('747-400', 'B744'), V('747-8I', 'B748')] },
  { g: 'Airbus A380', make: 'Airbus', tpl: 'b777', vars: [V('A380-800', 'A388')] },
  { g: 'Boeing 757', make: 'Boeing', tpl: 'b737', vars: [V('757-200', 'B752'), V('757-300', 'B753')] },
  { g: 'Boeing 767', make: 'Boeing', tpl: 'b777', vars: [V('767-300ER', 'B763'), V('767-400ER', 'B764')] },
  { g: 'Airbus A220', make: 'Airbus', tpl: 'a320', vars: [V('A220-100', 'BCS1'), V('A220-300', 'BCS3')] },
  { g: 'Embraer E-Jet', make: 'Embraer', tpl: 'a320', vars: [V('E175', 'E75L'), V('E190', 'E190'), V('E195-E2', 'E295')] }
];
