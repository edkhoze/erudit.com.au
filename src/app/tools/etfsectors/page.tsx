'use client';

import { useState, useEffect } from 'react';
import { getEtfData, verifyPassword, checkSession } from '@/app/actions/etf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import ReCAPTCHA from "react-google-recaptcha";
import { useRef } from 'react';

export default function EtfToolPage() {
    const [ticker, setTicker] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<{ sector: string; weight: number }[] | null>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);

    // Bypass captcha in development
    const isDev = process.env.NODE_ENV === 'development';
    const [captchaToken, setCaptchaToken] = useState<string | null>(isDev ? "dev-bypass" : null);

    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        checkSession().then((isAuth) => {
            setIsAuthenticated(isAuth);
            setAuthLoading(false);
        });
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');

        try {
            const result = await verifyPassword(password);
            if (result.success) {
                setIsAuthenticated(true);
            } else {
                setAuthError(result.error || "Invalid password");
            }
        } catch (e) {
            setAuthError("An error occurred");
        } finally {
            setAuthLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="container max-w-md py-24 px-4 mx-auto">
                <Card className="p-8">
                    <div className="flex flex-col items-center mb-6">
                        <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-6 w-6 text-gray-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Protected Tool</h1>
                        <p className="text-sm text-muted-foreground text-center mt-2">
                            Please enter the password to access this tool.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Password"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {authError && <p className="text-sm text-red-500">{authError}</p>}
                        <Button type="submit" className="w-full" disabled={authLoading}>
                            {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Unlock
                        </Button>
                    </form>
                </Card>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker && !url) {
            setError("Please provide either a Ticker or a Direct URL.");
            return;
        }

        if (!captchaToken) {
            setError("Please complete the captcha.");
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);
        setSourceUrl(null);

        try {
            const result = await getEtfData({ ticker, url, captchaToken });
            if (result.success && result.data) {
                setData(result.data);
                if (result.sourceUrl) setSourceUrl(result.sourceUrl);
            } else {
                setError(result.error || "Failed to fetch data.");
                if (result.sourceUrl) setSourceUrl(result.sourceUrl);
            }
        } catch (e) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
            if (!isDev) {
                recaptchaRef.current?.reset();
                setCaptchaToken(null);
            }
        }
    };

    return (
        <div className="container max-w-4xl py-12 px-4 mx-auto">
            <div className="mb-8">
                <Link href="/tools" className="text-sm text-muted-foreground hover:underline mb-2 block">← Back to Tools</Link>
                <h1 className="text-3xl font-bold tracking-tight mb-2">ETF Sector Analysis</h1>
                <p className="text-muted-foreground">
                    Enter an ASX ETF ticker (e.g., VAP, A200) or a direct URL to the product page to analyze its sector breakdown.
                </p>
            </div>

            <Card className="p-6 mb-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="ticker" className="text-sm font-medium">ETF Ticker (ASX)</label>
                            <input
                                id="ticker"
                                type="text"
                                placeholder="e.g. VAP, A200"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="url" className="text-sm font-medium">Direct URL (Optional)</label>
                            <input
                                id="url"
                                type="url"
                                placeholder="https://..."
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        {isDev ? (
                            <div className="text-xs text-muted-foreground italic border px-3 py-2 rounded">
                                (ReCAPTCHA Bypassed in Dev)
                            </div>
                        ) : (
                            <ReCAPTCHA
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                                onChange={(token) => setCaptchaToken(token)}
                                ref={recaptchaRef}
                            />
                        )}
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Analyze
                        </Button>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                            <p>{error}</p>
                            {sourceUrl && (
                                <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-2"
                                >
                                    Source Data ↗
                                </a>
                            )}
                        </div>
                    )}
                </form>
            </Card>

            {
                data && (
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Sector Breakdown</h3>
                            {sourceUrl && (
                                <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                >
                                    Source Data ↗
                                </a>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 rounded-l-lg">Sector</th>
                                        <th scope="col" className="px-6 py-3 rounded-r-lg text-right">Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, index) => (
                                        <tr key={index} className="bg-white border-b dark:bg-gray-900 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {row.sector}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {row.weight.toFixed(4)} <span className="text-xs text-muted-foreground ml-1">({(row.weight * 100).toFixed(2)}%)</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                                No matching sector data found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )
            }
        </div >
    );
}
