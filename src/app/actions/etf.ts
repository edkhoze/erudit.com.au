'use server';

import FirecrawlApp from '@mendable/firecrawl-js';
import { ETF_URLS } from '@/lib/etf-data';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'etf_auth';
const PASSWORD = 'YouShallNotPass!';
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

interface EtfDataRequest {
    ticker?: string;
    url?: string;
    captchaToken: string;
}

interface SectorData {
    sector: string;
    weight: number;
}

interface EtfResponse {
    success: boolean;
    data?: SectorData[];
    sourceUrl?: string;
    error?: string;
}

// Normalize sector names to match the requested list
const SECTOR_MAPPING: Record<string, string> = {
    'Information Technology': 'Technology',
    'Tech': 'Technology',
    'Consumer Cyclical': 'Consumer Discretionary',
    'Communication Services': 'Communications',
    'Telecommunications': 'Communications',
    'Basic Materials': 'Materials',
    'Industrial': 'Industrials',
    'Healthcare': 'Health Care',
    'Consumer Defensive': 'Consumer Staples',
    'Financial Services': 'Financials',
    'Real Estate': 'Real Estate',
    'Energy': 'Energy',
    'Utilities': 'Utilities',
    'Cash': 'Cash',
    'Liquidity': 'Cash',
    'Others': 'Others'
};

const REQUESTED_SECTORS = [
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
];

export async function getEtfData({ ticker, url, captchaToken }: EtfDataRequest): Promise<EtfResponse> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

    if (!apiKey) {
        return { success: false, error: "Server configuration error: Missing Firecrawl API Key." };
    }
    // Verify Captcha (Skip in Development)
    if (process.env.NODE_ENV !== 'development') {
        if (!recaptchaSecret) {
            return { success: false, error: "Server configuration error: Missing reCAPTCHA Secret." };
        }

        if (!captchaToken) {
            return { success: false, error: "Please complete the captcha." };
        }

        try {
            const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${captchaToken}`;
            const captchaRes = await fetch(verifyUrl, { method: 'POST' });
            const captchaData = await captchaRes.json();

            if (!captchaData.success) {
                console.error("Captcha verification failed:", captchaData);
                return { success: false, error: "Captcha verification failed. Please try again." };
            }
        } catch (err) {
            console.error("Captcha verification error:", err);
            return { success: false, error: "Failed to verify captcha." };
        }
    }

    let targetUrl = url;

    if (ticker) {
        const cleanTicker = ticker.toUpperCase().replace('.AX', '').trim();
        if (ETF_URLS[cleanTicker]) {
            targetUrl = ETF_URLS[cleanTicker];
        } else if (!url) {
            // If we don't have a map and no URL is provided, fail.
            return { success: false, error: `Unknown ticker "${ticker}". Please provide a Direct URL.` };
        }
    }

    if (!targetUrl) {
        return { success: false, error: "No URL provided." };
    }

    // Check for Auth Cookie (Skip in Development)
    if (process.env.NODE_ENV !== 'development') {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
        if (!authCookie || authCookie.value !== 'true') {
            return { success: false, error: "Unauthorized. Session expired." };
        }
    }

    try {
        const app = new FirecrawlApp({ apiKey });

        // Scrape the URL
        const scrapeResult = await app.scrape(targetUrl, {
            formats: ['markdown', 'links'],
        });

        if (!scrapeResult.markdown) {
            return { success: false, error: "Failed to scrape content from the page." };
        }

        let sectors = parseScrapedMarkdown(scrapeResult.markdown);
        let finalSourceUrl = targetUrl;

        // Fallback: Check for Fact Sheet PDF if no data found
        if (sectors.length === 0) {
            console.log("No data on page. Looking for Fact Sheet...");

            // Strategy 1: Look for Markdown links with "Fact Sheet" text
            const mdLinkRegex = /\[[^\]]*?Fact\s?Sheet[^\]]*?\]\((.*?)\)/i;
            const mdMatch = scrapeResult.markdown.match(mdLinkRegex);

            // Strategy 2: Look for links in the 'links' list that match heuristic
            // We use 'as any' because the type definition might not explicitly show 'links' depending on version
            const links = (scrapeResult as any).links || [];

            let pdfUrl = mdMatch ? mdMatch[1] : links.find((l: string) =>
                l.toLowerCase().includes('factsheet') && l.toLowerCase().endsWith('.pdf')
            );

            if (pdfUrl) {
                try {
                    // unexpected partial urls
                    const absolutePdfUrl = new URL(pdfUrl, targetUrl).href;

                    console.log(`Found PDF: ${absolutePdfUrl}. Scraping...`);
                    const pdfResult = await app.scrape(absolutePdfUrl, {
                        formats: ['markdown'],
                    });

                    if (pdfResult.markdown) {
                        const pdfSectors = parseScrapedMarkdown(pdfResult.markdown);
                        if (pdfSectors.length > 0) {
                            sectors = pdfSectors;
                            finalSourceUrl = absolutePdfUrl;
                        }
                    }
                } catch (e) {
                    console.warn("PDF Fallback failed:", e);
                }
            }
        }

        if (sectors.length === 0) {
            return { success: false, error: "Could not find sector breakdown data on this page or linked Fact Sheet.", sourceUrl: finalSourceUrl };
        }

        return { success: true, data: sectors, sourceUrl: finalSourceUrl };

    } catch (err) {
        console.error("Scraping error:", err);
        return { success: false, error: "An error occurred while fetching data." };
    }
}

function parseScrapedMarkdown(markdown: string): SectorData[] {
    const lines = markdown.split('\n');
    const results: SectorData[] = [];

    // This is a heuristic parser. It looks for lines that resemble sector data.
    // Patterns to look for:
    // 1. | Sector | Weight | (Markdown tables)
    // 2. "Financials 20.5%"
    // 3. "Technology: 15.2%"

    // Regex for extracting percentage: (\d{1,3}(?:\.\d{1,2})?)%?

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Try to match a known sector name at the start of the line or cell
        for (const requestedSector of REQUESTED_SECTORS.concat(Object.keys(SECTOR_MAPPING))) {
            // Create a regex that looks for the sector name followed by a number
            // Matches: "Financials 23.4%", "| Financials | 23.4% |", "Financials... 23.4"
            const regex = new RegExp(`(?:\\|?\\s*)(${requestedSector})\\s*(?:\\|?|:?)\\s*(\\d{1,3}(?:\\.\\d{1,2})?)%?`, 'i');
            const match = trimmed.match(regex);

            if (match) {
                const sectorNameRaw = match[1]; // The matched sector name (e.g. "Financial Services")
                const weightStr = match[2];

                const normalizedName = normalizeSector(sectorNameRaw);
                const weight = parseFloat(weightStr) / 100; // Convert 23.4 to 0.234

                // Check if we already have this sector (avoid duplicates from multiple table rows if headers repeat)
                if (!results.find(s => s.sector === normalizedName)) {
                    results.push({ sector: normalizedName, weight });
                }
            }
        }
    }

    // Fallback: If no structured table found, try to look for lines that strictly only contain "SectorName Percentage"
    if (results.length === 0) {
        // Implement a second pass if needed, but the loop above captures "Sector 99%" well.
    }

    // Filter to only include the requested 12 sectors + others? 
    // The user requested SPECIFIC list. 
    // If we found "Information Technology" mapped to "Technology", it's good.

    return results.filter(r => REQUESTED_SECTORS.includes(r.sector as any)).sort((a, b) => b.weight - a.weight);
}

function normalizeSector(raw: string): string {
    // Basic cleaning
    let cleaned = raw.trim();
    // Check direct map
    if (SECTOR_MAPPING[cleaned]) return SECTOR_MAPPING[cleaned];

    // Case insensitive check
    const lower = cleaned.toLowerCase();
    for (const [key, val] of Object.entries(SECTOR_MAPPING)) {
        if (key.toLowerCase() === lower) return val;
    }

    // Check against requested list
    for (const req of REQUESTED_SECTORS) {
        if (req.toLowerCase() === lower) return req;
    }

    return cleaned; // Fallback
}

export async function verifyPassword(password: string) {
    if (password === PASSWORD) {
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE_NAME, 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60, // 15 minutes in seconds
            path: '/',
        });
        return { success: true };
    }
    return { success: false, error: "Incorrect password" };
}

export async function checkSession() {
    if (process.env.NODE_ENV === 'development') return true;
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
    return !!authCookie && authCookie.value === 'true';
}
