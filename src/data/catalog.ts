/**
 * Mercedes-Benz T1 (Bremer) Parts Catalog Data
 *
 * Community-contributed data for the Mercedes-Benz T1 van (W601/W602/W603)
 * produced 1977–1995. Part numbers are for reference only.
 *
 * Licensed under CC BY-SA 4.0
 */

export interface Vehicle {
  id: string;
  name: string;
  series: string;
  years: string;
  engine: string;
  description: string;
  image?: string;
}

export interface PartGroup {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  subgroups: PartSubgroup[];
}

export interface PartSubgroup {
  id: string;
  name: string;
  nameEn: string;
  /** Path(s) to exploded-diagram images, relative to /public (e.g. /diagrams/…) */
  diagrams?: string[];
  parts: Part[];
}

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  nameEn: string;
  quantity: number;
  notes?: string;
  supersededBy?: string;
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

export const vehicles: Vehicle[] = [
  {
    id: 't1-207d',
    name: 'T1 207 D',
    series: 'W601',
    years: '1977–1995',
    engine: 'OM 616 (2.4 L Diesel)',
    description:
      'Mercedes-Benz T1 207 D – the short-wheelbase diesel panel van. ' +
      'Part of the T1 "Bremer" family produced at the Bremen plant.',
  },
  {
    id: 't1-208',
    name: 'T1 208',
    series: 'W601',
    years: '1977–1995',
    engine: 'M 102 (2.0 L Petrol)',
    description:
      'Mercedes-Benz T1 208 – the short-wheelbase petrol panel van.',
  },
  {
    id: 't1-210d',
    name: 'T1 210 D',
    series: 'W601',
    years: '1977–1995',
    engine: 'OM 616 (2.4 L Diesel)',
    description:
      'Mercedes-Benz T1 210 D – long-wheelbase diesel panel van.',
  },
  {
    id: 't1-307d',
    name: 'T1 307 D',
    series: 'W602',
    years: '1977–1995',
    engine: 'OM 616 (2.4 L Diesel)',
    description:
      'Mercedes-Benz T1 307 D – short-wheelbase diesel bus/kombi variant.',
  },
  {
    id: 't1-308',
    name: 'T1 308',
    series: 'W602',
    years: '1977–1995',
    engine: 'M 102 (2.0 L Petrol)',
    description:
      'Mercedes-Benz T1 308 – short-wheelbase petrol bus/kombi variant.',
  },
  {
    id: 't1-407d',
    name: 'T1 407 D',
    series: 'W602',
    years: '1977–1995',
    engine: 'OM 617 (3.0 L Diesel)',
    description:
      'Mercedes-Benz T1 407 D – short-wheelbase heavy-duty diesel variant.',
  },
  {
    id: 't1-410d',
    name: 'T1 410 D',
    series: 'W602',
    years: '1977–1995',
    engine: 'OM 617 (3.0 L Diesel)',
    description:
      'Mercedes-Benz T1 410 D – long-wheelbase heavy-duty diesel variant.',
  },
];

// ─── Parts Groups for T1 ─────────────────────────────────────────────────────

export const partGroups: PartGroup[] = [
  {
    id: 'engine',
    name: 'Motor',
    nameEn: 'Engine',
    icon: '⚙️',
    subgroups: [
      {
        id: 'engine-block',
        name: 'Motorblock',
        nameEn: 'Engine block',
        parts: [
          {
            id: 'eb-01',
            partNumber: '601 010 00 20',
            name: 'Zylinderkopfdichtung',
            nameEn: 'Cylinder head gasket',
            quantity: 1,
            notes: 'OM 616',
          },
          {
            id: 'eb-02',
            partNumber: '601 010 02 20',
            name: 'Zylinderkopfschrauben-Satz',
            nameEn: 'Cylinder head bolt set',
            quantity: 1,
          },
          {
            id: 'eb-03',
            partNumber: '601 010 03 01',
            name: 'Ölablassschraube',
            nameEn: 'Oil drain plug',
            quantity: 1,
          },
        ],
      },
      {
        id: 'engine-timing',
        name: 'Steuerung / Nockenwelle',
        nameEn: 'Timing / Camshaft',
        parts: [
          {
            id: 'et-01',
            partNumber: '601 052 01 05',
            name: 'Zahnriemen',
            nameEn: 'Timing belt',
            quantity: 1,
          },
          {
            id: 'et-02',
            partNumber: '601 052 02 19',
            name: 'Zahnriemenspanner',
            nameEn: 'Timing belt tensioner',
            quantity: 1,
          },
        ],
      },
      {
        id: 'engine-cooling',
        name: 'Kühlung',
        nameEn: 'Cooling system',
        parts: [
          {
            id: 'ec-01',
            partNumber: '601 200 04 03',
            name: 'Wasserpumpe',
            nameEn: 'Water pump',
            quantity: 1,
          },
          {
            id: 'ec-02',
            partNumber: '601 200 01 83',
            name: 'Thermostat',
            nameEn: 'Thermostat',
            quantity: 1,
            notes: '83 °C',
          },
          {
            id: 'ec-03',
            partNumber: '601 501 03 75',
            name: 'Kühler',
            nameEn: 'Radiator',
            quantity: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'brakes',
    name: 'Bremsen',
    nameEn: 'Brakes',
    icon: '🛑',
    subgroups: [
      {
        id: 'brakes-front',
        name: 'Vorderbremse',
        nameEn: 'Front brakes',
        parts: [
          {
            id: 'bf-01',
            partNumber: '000 421 25 10',
            name: 'Bremsbeläge vorne (Satz)',
            nameEn: 'Front brake pads (set)',
            quantity: 1,
          },
          {
            id: 'bf-02',
            partNumber: '601 421 00 12',
            name: 'Bremsscheibe vorne',
            nameEn: 'Front brake disc',
            quantity: 2,
          },
          {
            id: 'bf-03',
            partNumber: '601 420 03 61',
            name: 'Bremssattel vorne links',
            nameEn: 'Front brake caliper left',
            quantity: 1,
          },
          {
            id: 'bf-04',
            partNumber: '601 420 04 61',
            name: 'Bremssattel vorne rechts',
            nameEn: 'Front brake caliper right',
            quantity: 1,
          },
        ],
      },
      {
        id: 'brakes-rear',
        name: 'Hinterbremse',
        nameEn: 'Rear brakes',
        parts: [
          {
            id: 'br-01',
            partNumber: '601 420 08 20',
            name: 'Bremsbacken hinten (Satz)',
            nameEn: 'Rear brake shoes (set)',
            quantity: 1,
          },
          {
            id: 'br-02',
            partNumber: '601 420 09 11',
            name: 'Bremstrommel hinten',
            nameEn: 'Rear brake drum',
            quantity: 2,
          },
          {
            id: 'br-03',
            partNumber: '601 430 00 35',
            name: 'Radbremszylinder hinten links',
            nameEn: 'Rear wheel cylinder left',
            quantity: 1,
          },
          {
            id: 'br-04',
            partNumber: '601 430 01 35',
            name: 'Radbremszylinder hinten rechts',
            nameEn: 'Rear wheel cylinder right',
            quantity: 1,
          },
        ],
      },
      {
        id: 'brakes-master',
        name: 'Hauptbremszylinder / Servo',
        nameEn: 'Master cylinder / Servo',
        parts: [
          {
            id: 'bm-01',
            partNumber: '601 431 00 15',
            name: 'Hauptbremszylinder',
            nameEn: 'Brake master cylinder',
            quantity: 1,
          },
          {
            id: 'bm-02',
            partNumber: '601 430 10 30',
            name: 'Bremskraftverstärker',
            nameEn: 'Brake servo / booster',
            quantity: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'suspension',
    name: 'Fahrwerk',
    nameEn: 'Suspension',
    icon: '🔧',
    subgroups: [
      {
        id: 'suspension-front',
        name: 'Vorderachse',
        nameEn: 'Front axle',
        parts: [
          {
            id: 'sf-01',
            partNumber: '601 320 07 13',
            name: 'Stoßdämpfer vorne',
            nameEn: 'Front shock absorber',
            quantity: 2,
          },
          {
            id: 'sf-02',
            partNumber: '601 321 04 12',
            name: 'Traggelenk oben',
            nameEn: 'Upper ball joint',
            quantity: 2,
          },
          {
            id: 'sf-03',
            partNumber: '601 321 05 12',
            name: 'Traggelenk unten',
            nameEn: 'Lower ball joint',
            quantity: 2,
          },
          {
            id: 'sf-04',
            partNumber: '601 320 01 29',
            name: 'Schraubenfeder vorne',
            nameEn: 'Front coil spring',
            quantity: 2,
          },
        ],
      },
      {
        id: 'suspension-rear',
        name: 'Hinterachse',
        nameEn: 'Rear axle',
        parts: [
          {
            id: 'sr-01',
            partNumber: '601 326 05 00',
            name: 'Stoßdämpfer hinten',
            nameEn: 'Rear shock absorber',
            quantity: 2,
          },
          {
            id: 'sr-02',
            partNumber: '601 350 08 05',
            name: 'Blattfeder hinten',
            nameEn: 'Rear leaf spring',
            quantity: 2,
          },
        ],
      },
      {
        id: 'steering',
        name: 'Lenkung',
        nameEn: 'Steering',
        parts: [
          {
            id: 'st-01',
            partNumber: '601 460 02 05',
            name: 'Lenkgetriebe',
            nameEn: 'Steering gear box',
            quantity: 1,
          },
          {
            id: 'st-02',
            partNumber: '601 462 01 05',
            name: 'Spurstange rechts',
            nameEn: 'Tie rod right',
            quantity: 1,
          },
          {
            id: 'st-03',
            partNumber: '601 462 02 05',
            name: 'Spurstange links',
            nameEn: 'Tie rod left',
            quantity: 1,
          },
          {
            id: 'st-04',
            partNumber: '601 463 00 35',
            name: 'Spurstangenkopf',
            nameEn: 'Tie rod end',
            quantity: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'transmission',
    name: 'Getriebe / Antrieb',
    nameEn: 'Transmission / Drivetrain',
    icon: '⚡',
    subgroups: [
      {
        id: 'gearbox',
        name: 'Schaltgetriebe',
        nameEn: 'Manual gearbox',
        parts: [
          {
            id: 'gb-01',
            partNumber: '601 270 01 01',
            name: 'Getriebeöl (1 L)',
            nameEn: 'Gearbox oil (1 L)',
            quantity: 2,
            notes: 'SAE 80W-90 GL-4',
          },
          {
            id: 'gb-02',
            partNumber: '601 271 00 15',
            name: 'Getriebeausgangswellendichtring',
            nameEn: 'Gearbox output shaft seal',
            quantity: 1,
          },
        ],
      },
      {
        id: 'clutch',
        name: 'Kupplung',
        nameEn: 'Clutch',
        parts: [
          {
            id: 'cl-01',
            partNumber: '601 250 01 03',
            name: 'Kupplungsscheibe',
            nameEn: 'Clutch disc',
            quantity: 1,
          },
          {
            id: 'cl-02',
            partNumber: '601 250 02 04',
            name: 'Kupplungsdruckplatte',
            nameEn: 'Clutch pressure plate',
            quantity: 1,
          },
          {
            id: 'cl-03',
            partNumber: '601 250 03 15',
            name: 'Ausrücklager',
            nameEn: 'Release bearing',
            quantity: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'electrical',
    name: 'Elektrik',
    nameEn: 'Electrical',
    icon: '⚡',
    subgroups: [
      {
        id: 'electrical-ignition',
        name: 'Zündung / Anlasser',
        nameEn: 'Ignition / Starter',
        parts: [
          {
            id: 'ei-01',
            partNumber: '601 155 00 01',
            name: 'Anlasser',
            nameEn: 'Starter motor',
            quantity: 1,
          },
          {
            id: 'ei-02',
            partNumber: '601 154 02 02',
            name: 'Lichtmaschine',
            nameEn: 'Alternator',
            quantity: 1,
          },
          {
            id: 'ei-03',
            partNumber: '001 544 63 28',
            name: 'Keilriemen',
            nameEn: 'V-belt',
            quantity: 1,
          },
        ],
      },
      {
        id: 'electrical-lights',
        name: 'Beleuchtung',
        nameEn: 'Lighting',
        parts: [
          {
            id: 'el-01',
            partNumber: '601 820 01 61',
            name: 'Scheinwerfer links',
            nameEn: 'Headlight left',
            quantity: 1,
          },
          {
            id: 'el-02',
            partNumber: '601 820 02 61',
            name: 'Scheinwerfer rechts',
            nameEn: 'Headlight right',
            quantity: 1,
          },
          {
            id: 'el-03',
            partNumber: '601 820 11 21',
            name: 'Rückleuchte links',
            nameEn: 'Tail light left',
            quantity: 1,
          },
          {
            id: 'el-04',
            partNumber: '601 820 12 21',
            name: 'Rückleuchte rechts',
            nameEn: 'Tail light right',
            quantity: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'body',
    name: 'Karosserie / Dichtungen',
    nameEn: 'Body / Seals',
    icon: '🚐',
    subgroups: [
      {
        id: 'body-seals',
        name: 'Türdichtungen',
        nameEn: 'Door seals',
        parts: [
          {
            id: 'bs-01',
            partNumber: '601 725 00 65',
            name: 'Türdichtung Fahrertür',
            nameEn: "Driver's door seal",
            quantity: 1,
          },
          {
            id: 'bs-02',
            partNumber: '601 725 01 65',
            name: 'Türdichtung Beifahrertür',
            nameEn: "Passenger door seal",
            quantity: 1,
          },
          {
            id: 'bs-03',
            partNumber: '601 725 02 65',
            name: 'Türdichtung Hecktür',
            nameEn: 'Rear door seal',
            quantity: 1,
          },
        ],
      },
      {
        id: 'body-glass',
        name: 'Verglasung',
        nameEn: 'Glazing',
        parts: [
          {
            id: 'bg-01',
            partNumber: '601 670 00 21',
            name: 'Windschutzscheibe',
            nameEn: 'Windscreen',
            quantity: 1,
          },
          {
            id: 'bg-02',
            partNumber: '601 670 01 21',
            name: 'Heckscheibe',
            nameEn: 'Rear window',
            quantity: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'filters-fluids',
    name: 'Filter / Flüssigkeiten',
    nameEn: 'Filters / Fluids',
    icon: '🛢️',
    subgroups: [
      {
        id: 'filters',
        name: 'Filter',
        nameEn: 'Filters',
        parts: [
          {
            id: 'fi-01',
            partNumber: '601 180 01 09',
            name: 'Ölfilter',
            nameEn: 'Oil filter',
            quantity: 1,
            notes: 'OM 616',
          },
          {
            id: 'fi-02',
            partNumber: '601 090 15 51',
            name: 'Kraftstofffilter',
            nameEn: 'Fuel filter',
            quantity: 1,
          },
          {
            id: 'fi-03',
            partNumber: '601 094 00 04',
            name: 'Luftfilter',
            nameEn: 'Air filter',
            quantity: 1,
          },
        ],
      },
    ],
  },
];
