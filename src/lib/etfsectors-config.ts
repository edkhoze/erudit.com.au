export type EtfSectorsSectionId = 'cba' | 'nab';

export type EtfSectorsDefaultRow = {
  label?: string;
  ticker?: string;
  url?: string;
  /** Market value in AUD (no FX conversion). Used for portfolio-weighted sector totals. */
  sum?: number;
  enabled?: boolean;
};

export type EtfSectorsSectionDefaults = {
  id: EtfSectorsSectionId;
  title: string;
  description?: string;
  etfs: EtfSectorsDefaultRow[];
};

export const ETFSECTORS_DEFAULTS: EtfSectorsSectionDefaults[] = [
  {
    id: 'cba',
    title: 'CBA',
    description: 'ETFs held via CBA',
    etfs: [
      { ticker: 'VAP', sum: 28382, url: 'https://www.vanguard.com.au/personal/invest-with-us/etf?portId=8206' },
      { ticker: 'VGS', sum: 12426, url: 'https://www.vanguard.com.au/personal/invest-with-us/etf?portId=8212' },
      { ticker: 'VEU', sum: 11624, url: 'https://www.vanguard.com.au/personal/invest-with-us/etf?portId=0991' },
      { ticker: 'VTS', sum: 23709, url: 'https://www.vanguard.com.au/personal/invest-with-us/etf?portId=0970' },
      { ticker: 'A200', sum: 30747, url: 'https://www.betashares.com.au/fund/australia-200-etf/' },
      { ticker: 'INCM', sum: 12253, url: 'https://www.betashares.com.au/fund/global-income-leaders-etf/' },
      { ticker: 'ASIA', sum: 10733, url: 'https://www.betashares.com.au/fund/asia-technology-tigers-etf/' },
      { ticker: 'VEQ', sum: 12466, url: 'https://www.vanguard.com.au/personal/invest-with-us/etf?portId=8214' },
    ],
  },
  {
    id: 'nab',
    title: 'NAB',
    description: 'ETFs held via NAB',
    etfs: [],
  },
];
