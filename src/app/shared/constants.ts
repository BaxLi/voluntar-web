export const KIV_ZONES = [
  {
    label: 'Centru',
    value: 'centru',
  },
  {
    label: 'Botanica',
    value: 'botanica',
  },
  {
    label: 'Buiucani',
    value: 'buiucani',
  },
  {
    label: 'Ciocana',
    value: 'ciocana',
  },
  {
    label: 'Rîșcani',
    value: 'riscani',
  },
  {
    label: 'Suburbii',
    value: 'suburbii',
  },
];

export const KIV_ZONES_MAP = KIV_ZONES.reduce((acc, zone) => {
  acc[zone.value] = zone.label;
  return acc;
}, {});

export enum VOLUNTEER_STATUS {}

export enum VOLUNTEER_STATUS {}

// TODO: rename to VolunteerRole
export enum VOLUNTEER_ROLES {
  delivery = 'Livrare',
  copilot = 'Copilot',
  packing = 'Împachetare',
  supply = 'Aprovizionare',
  operator = 'Operator',
}

export enum VOLUNTEER_ROLES_ICONS {
  delivery = 'transport',
  copilot = 'copilot',
  packing = 'impachetare',
  supply = 'aprovizionare',
  operator = 'operator',
}

export enum ZONES {
  botanica = 'botanica',
  buiucani = 'buiucani',
  centru = 'centru',
  ciocana = 'ciocana',
  riscani = 'riscani',
  telecentru = 'telecentru',
  suburbii = 'suburbii',
}

export enum DAYS_OF_WEEK {
  monday = 'Luni',
  tuesday = 'Marți',
  wednesday = 'Miercuri',
  thursday = 'Joi',
  friday = 'Vineri',
  saturday = 'Sambata',
  sunday = 'Duminica',
}

export const volunteerRoles = Object.values(VOLUNTEER_ROLES);

// TODO: rename to Zone
export enum ZONES {
  botanica = 'botanica',
  buiucani = 'buiucani',
  centru = 'centru',
  ciocana = 'ciocana',
  riscani = 'riscani',
  telecentru = 'telecentru',
  suburbii = 'suburbii',
}

export const zones = Object.values(ZONES);

export const SPECIAL_CONDITIONS = [
  {
    label: 'Disability',
    value: 'disability',
  },
  {
    label: 'Deaf-mute',
    value: 'deafmute',
  },
  {
    label: 'Blind/Weak-seer',
    value: 'blind_weak_seer',
  },
];

export const SPECIAL_CONDITIONS_MAP = SPECIAL_CONDITIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});
