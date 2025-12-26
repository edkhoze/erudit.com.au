'use server';

import FirecrawlApp from '@mendable/firecrawl-js';
import { ETF_URLS } from '@/lib/etf-data';
import { cookies } from 'next/headers';
import * as cheerio from 'cheerio';

const AUTH_COOKIE_NAME = 'etf_auth';
const HUMAN_COOKIE_NAME = 'etf_human';
const PASSWORD = 'YouShallNotPass!';
// const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

interface EtfDataRequest {
    ticker?: string;
    url?: string;
    captchaToken?: string;
}

interface SectorData {
    sector: string;
    weight: number;
}

interface EtfResponse {
    success: boolean;
    data?: SectorData[];
    sourceUrl?: string;
    sources?: EtfSourceAttempt[];
    error?: string;
}

type EtfSourceStage =
    | 'direct'
    | 'factsheet'
    | 'search'
    | 'candidate'
    | 'candidate-factsheet';

type EtfSourceAttempt = {
    stage: EtfSourceStage;
    url: string;
    ok: boolean;
    note?: string;
    error?: string;
};

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
    const sources: EtfSourceAttempt[] = [];

    if (!apiKey) {
        return { success: false, error: "Server configuration error: Missing Firecrawl API Key." };
    }
    const cookieStore = await cookies();
    // Verify Captcha (Skip in Development)
    if (process.env.NODE_ENV !== 'development') {
        const captcha = await verifyCaptchaInternal({ cookieStore, recaptchaSecret, captchaToken });
        if (!captcha.success) {
            return { success: false, error: captcha.error };
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
        const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
        if (!authCookie || authCookie.value !== 'true') {
            return { success: false, error: "Unauthorized. Session expired." };
        }
    }

    try {
        const app = new FirecrawlApp({ apiKey });

        const directAttempt = await tryScrapeWithFactsheetFallback({
            app,
            targetUrl,
            stage: 'direct',
        });
        sources.push(...directAttempt.sources);

        if (directAttempt.data.length > 0) {
            return {
                success: true,
                data: directAttempt.data,
                sourceUrl: directAttempt.sourceUrl,
                sources,
            };
        }

        // Wider-web fallback (only after direct + factsheet failed)
        // Bias to ASX-listed tickers when the user provides a ticker.
        const cleanTicker = ticker ? ticker.toUpperCase().replace('.AX', '').trim() : undefined;
        const query = [cleanTicker ? `ASX:${cleanTicker}` : undefined, 'ETF sector breakdown', 'fact sheet']
            .filter(Boolean)
            .join(' ');

        const candidates = await duckDuckGoCandidates(query);
        sources.push({
            stage: 'search',
            url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
            ok: candidates.length > 0,
            note: candidates.length > 0 ? `Found ${candidates.length} candidates` : 'No candidates found',
        });

        const topCandidates = candidates.slice(0, 5);
        for (const candidateUrl of topCandidates) {
            const candidateAttempt = await tryScrapeWithFactsheetFallback({
                app,
                targetUrl: candidateUrl,
                stage: 'candidate',
            });
            sources.push(...candidateAttempt.sources);
            if (candidateAttempt.data.length > 0) {
                return {
                    success: true,
                    data: candidateAttempt.data,
                    sourceUrl: candidateAttempt.sourceUrl,
                    sources,
                };
            }
        }

        return {
            success: false,
            error: "Could not find sector breakdown data on this page, linked Fact Sheet, or wider web search candidates.",
            sourceUrl: targetUrl,
            sources,
        };

    } catch (err) {
        console.error("Scraping error:", err);
        return { success: false, error: "An error occurred while fetching data." };
    }
}

export async function verifyCaptcha(captchaToken?: string): Promise<{ success: boolean; error?: string }> {
    if (process.env.NODE_ENV === 'development') {
        return { success: true };
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const cookieStore = await cookies();
    const result = await verifyCaptchaInternal({ cookieStore, recaptchaSecret, captchaToken });
    return result;
}

async function verifyCaptchaInternal({
    cookieStore,
    recaptchaSecret,
    captchaToken,
}: {
    cookieStore: Awaited<ReturnType<typeof cookies>>;
    recaptchaSecret: string | undefined;
    captchaToken?: string;
}): Promise<{ success: boolean; error?: string }> {
    const humanCookie = cookieStore.get(HUMAN_COOKIE_NAME);
    if (humanCookie?.value === 'true') {
        return { success: true };
    }

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

        cookieStore.set(HUMAN_COOKIE_NAME, 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 60, // 30 minutes
            path: '/',
        });

        return { success: true };
    } catch (err) {
        console.error("Captcha verification error:", err);
        return { success: false, error: "Failed to verify captcha." };
    }
}

async function duckDuckGoCandidates(query: string): Promise<string[]> {
    // Scrape-friendly HTML results page (still may be blocked occasionally)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
        },
    });

    if (!res.ok) {
        return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const hrefs: string[] = [];
    $('a.result__a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) hrefs.push(href);
    });

    // Some variants use .result__url
    $('a.result__url').each((_, el) => {
        const href = $(el).attr('href');
        if (href) hrefs.push(href);
    });

    const candidates = hrefs
        .map((href) => decodeDuckDuckGoRedirect(href))
        .filter((u): u is string => !!u)
        .filter((u) => u.startsWith('http://') || u.startsWith('https://'))
        .filter((u) => !u.includes('duckduckgo.com'))
        .filter((u) => !u.startsWith('mailto:') && !u.startsWith('tel:'));

    // Deduplicate while preserving order
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const u of candidates) {
        const normalized = stripTracking(u);
        if (!seen.has(normalized)) {
            seen.add(normalized);
            unique.push(normalized);
        }
    }

    return unique;
}

function decodeDuckDuckGoRedirect(href: string): string | null {
    try {
        const url = new URL(href, 'https://duckduckgo.com');
        const uddg = url.searchParams.get('uddg');
        if (uddg) return decodeURIComponent(uddg);
        return url.href;
    } catch {
        return null;
    }
}

function stripTracking(url: string): string {
    try {
        const u = new URL(url);
        // keep query for now; just remove common tracking params
        const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        for (const p of trackingParams) u.searchParams.delete(p);
        return u.toString();
    } catch {
        return url;
    }
}

async function tryScrapeWithFactsheetFallback({
    app,
    targetUrl,
    stage,
}: {
    app: FirecrawlApp;
    targetUrl: string;
    stage: 'direct' | 'candidate';
}): Promise<{ data: SectorData[]; sourceUrl: string; sources: EtfSourceAttempt[] }> {
    const sources: EtfSourceAttempt[] = [];

    try {
        const scrapeResult = await app.scrape(targetUrl, {
            formats: ['markdown', 'links'],
        });

        if (!scrapeResult.markdown) {
            sources.push({ stage, url: targetUrl, ok: false, error: 'No markdown returned from scrape' });
            return { data: [], sourceUrl: targetUrl, sources };
        }

        const sectors = parseScrapedMarkdown(scrapeResult.markdown);
        sources.push({ stage, url: targetUrl, ok: sectors.length > 0, note: sectors.length > 0 ? 'Parsed sectors from page' : 'No sector breakdown found on page' });

        if (sectors.length > 0) {
            return { data: sectors, sourceUrl: targetUrl, sources };
        }

        const pdfUrl = discoverFactsheetPdfUrl({
            markdown: scrapeResult.markdown,
            links: extractLinks(scrapeResult),
            baseUrl: targetUrl,
        });

        if (!pdfUrl) {
            return { data: [], sourceUrl: targetUrl, sources };
        }

        try {
            const pdfResult = await app.scrape(pdfUrl, {
                formats: ['markdown'],
            });

            if (!pdfResult.markdown) {
                sources.push({
                    stage: stage === 'direct' ? 'factsheet' : 'candidate-factsheet',
                    url: pdfUrl,
                    ok: false,
                    error: 'No markdown returned from PDF scrape',
                });
                return { data: [], sourceUrl: targetUrl, sources };
            }

            const pdfSectors = parseScrapedMarkdown(pdfResult.markdown);
            sources.push({
                stage: stage === 'direct' ? 'factsheet' : 'candidate-factsheet',
                url: pdfUrl,
                ok: pdfSectors.length > 0,
                note: pdfSectors.length > 0 ? 'Parsed sectors from factsheet PDF' : 'No sector breakdown found in factsheet PDF',
            });

            if (pdfSectors.length > 0) {
                return { data: pdfSectors, sourceUrl: pdfUrl, sources };
            }
        } catch (e) {
            sources.push({
                stage: stage === 'direct' ? 'factsheet' : 'candidate-factsheet',
                url: pdfUrl,
                ok: false,
                error: e instanceof Error ? e.message : String(e),
            });
        }

        return { data: [], sourceUrl: targetUrl, sources };
    } catch (e) {
        sources.push({ stage, url: targetUrl, ok: false, error: e instanceof Error ? e.message : String(e) });
        return { data: [], sourceUrl: targetUrl, sources };
    }
}

function discoverFactsheetPdfUrl({
    markdown,
    links,
    baseUrl,
}: {
    markdown: string;
    links: string[];
    baseUrl: string;
}): string | null {
    // Strategy 1: Look for Markdown links with "Fact Sheet" text
    const mdLinkRegex = /\[[^\]]*?Fact\s?Sheet[^\]]*?\]\((.*?)\)/i;
    const mdMatch = markdown.match(mdLinkRegex);
    if (mdMatch?.[1]) {
        try {
            return new URL(mdMatch[1], baseUrl).href;
        } catch {
            // ignore
        }
    }

    // Strategy 2: Look for PDF links in the links list
    const scored = links
        .map((l) => {
            const lower = l.toLowerCase();
            let score = 0;
            if (lower.endsWith('.pdf')) score += 2;
            if (lower.includes('factsheet') || lower.includes('fact-sheet')) score += 5;
            if (lower.includes('pds') || lower.includes('product-disclosure')) score += 1;
            if (lower.includes('download') || lower.includes('resources') || lower.includes('documents')) score += 1;
            return { l, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;

    try {
        return new URL(scored[0].l, baseUrl).href;
    } catch {
        return null;
    }
}

function extractLinks(scrapeResult: unknown): string[] {
    if (!scrapeResult || typeof scrapeResult !== 'object') return [];
    const maybeLinks = (scrapeResult as { links?: unknown }).links;
    if (!Array.isArray(maybeLinks)) return [];
    return maybeLinks.filter((l): l is string => typeof l === 'string');
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

    return results.filter(r => REQUESTED_SECTORS.includes(r.sector)).sort((a, b) => b.weight - a.weight);
}

function normalizeSector(raw: string): string {
    // Basic cleaning
    const cleaned = raw.trim();
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
