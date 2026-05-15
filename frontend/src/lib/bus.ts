// Prysmian Business Units (canonical list used across the app).
// `iconName` references a lucide-react component name resolved in the UI layer.
export interface BusinessUnit {
  id: string;
  name: string;
  short: string;
  description: string;
  iconName: string;
  hasData: boolean;
}

export const BUSINESS_UNITS: BusinessUnit[] = [
  { id: "ic",          name: "I&C",                    short: "I&C",          description: "Industrial & Construction cables — LV/MV for buildings, factories, infrastructure", iconName: "Factory",       hasData: true  },
  { id: "elevators",   name: "Elevators",              short: "Elevators",    description: "Specialty cables for elevator and crane systems",                                  iconName: "ArrowUpDown",   hasData: true  },
  { id: "automotive",  name: "Automotive",             short: "Automotive",   description: "Cables for EVs, charging infrastructure and OEM wiring",                            iconName: "Car",           hasData: true  },
  { id: "mining",      name: "Mining",                 short: "Mining",       description: "Reeling, trailing and shaft cables for mining operations",                          iconName: "Pickaxe",       hasData: true  },
  { id: "renewable",   name: "Renewable",              short: "Renewable",    description: "Solar / wind onshore & offshore cabling",                                           iconName: "Wind",          hasData: true  },
  { id: "fiber",       name: "Fiber & Optical Cable",  short: "Fiber",        description: "Optical fiber, FTTx, data-center backbones",                                        iconName: "Network",       hasData: true  },
  { id: "connectivity",name: "Connectivity",           short: "Connectivity", description: "Connectivity solutions, accessories and termination kits",                          iconName: "Cable",         hasData: true  },
  { id: "power-grid",  name: "Power Grid",             short: "Power Grid",   description: "Transmission & distribution overhead and underground HV cables",                    iconName: "Zap",           hasData: true  },
  { id: "submarine",   name: "Submarine & HVDC",       short: "Submarine",    description: "HVDC submarine interconnectors and offshore wind export cables",                    iconName: "Waves",         hasData: true  },
  { id: "building",    name: "Building & Construction",short: "B&C",          description: "Residential & non-residential building cables, CPR / LSZH ranges",                  iconName: "Building2",     hasData: true  },
  { id: "oilgas",      name: "Oil & Gas",              short: "Oil & Gas",    description: "Subsea umbilicals, flowlines and specialty cables for O&G",                         iconName: "Fuel",          hasData: false },
  { id: "railway",     name: "Railway",                short: "Railway",      description: "Railway signaling, traction and rolling-stock cables",                              iconName: "TrainFront",    hasData: false },
];

export const BU_NAMES = BUSINESS_UNITS.map((b) => b.name);

export function findBu(id: string): BusinessUnit | undefined {
  return BUSINESS_UNITS.find((b) => b.id === id);
}
