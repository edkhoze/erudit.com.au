export const ETF_URLS: Record<string, string> = {
    // Vanguard
    VAP: "https://www.vanguard.com.au/personal/investments/products/VAP/overview",
    VGS: "https://www.vanguard.com.au/personal/investments/products/VGS/overview",
    VEU: "https://www.vanguard.com.au/personal/investments/products/VEU/overview",
    VTS: "https://www.vanguard.com.au/personal/investments/products/VTS/overview",
    VEQ: "https://www.vanguard.com.au/personal/investments/products/VEQ/overview",

    // State Street (SPDR)
    DJRE: "https://www.ssga.com/au/en_gb/individual/etfs/funds/spdr-dow-jones-global-real-estate-esg-select-etf-djre",

    // Magellan
    MGOC: "https://www.magellangroup.com.au/funds/magellan-global-fund-open-class-asx-mgoc/",
    OPPT: "https://www.magellangroup.com.au/funds/magellan-global-opportunities-fund-oppt/",
    MICH: "https://www.magellangroup.com.au/funds/magellan-infrastructure-currency-hedged-fund-mich/",

    // Intelligent Investor
    INIF: "https://www.intelligentinvestor.com.au/invest-with-us/income-fund/inif",
    IIGF: "https://www.intelligentinvestor.com.au/invest-with-us/growth-fund/iigf",
    IISV: "https://www.intelligentinvestor.com.au/invest-with-us/select-value-share-fund/iisv",

    // iShares (BlackRock)
    IEM: "https://www.blackrock.com/au/individual/products/251341/ishares-msci-emerging-markets-etf",

    // BetaShares
    A200: "https://www.betashares.com.au/fund/australia-200-etf/",
    F100: "https://www.betashares.com.au/fund/ftse-100-etf/",
    INCM: "https://www.betashares.com.au/fund/global-income-leaders-etf/",
    ASIA: "https://www.betashares.com.au/fund/asia-technology-tigers-etf/",

    // L1 Capital
    LSF: "https://l1capital.com.au/l1-long-short-fund-limited-asx-lsf/",

    // Wilson Asset Management
    WGB: "https://www.wilsonassetmanagement.com.au/listed-investment-companies/wam-global/",
};

export const ETF_SECTORS = [
    "Technology",
    "Consumer Discretionary",
    "Communications",
    "Materials",
    "Industrials",
    "Health Care",
    "Consumer Staples",
    "Financials",
    "Utilities",
    "Real Estate",
    "Energy",
    "Cash",
] as const;
