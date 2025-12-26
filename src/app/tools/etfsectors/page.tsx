'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { checkSession, getEtfData, verifyCaptcha, verifyPassword } from '@/app/actions/etf';
import { ETF_SECTORS } from '@/lib/etf-data';
import { ETFSECTORS_DEFAULTS, type EtfSectorsSectionId } from '@/lib/etfsectors-config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import ReCAPTCHA from "react-google-recaptcha";

type EditableEtfRow = {
    id: string;
    ticker: string;
    url: string;
    /** Market value in AUD (no FX conversion). */
    sum: string;
};

type EtfSourceStage = 'direct' | 'factsheet' | 'search' | 'candidate' | 'candidate-factsheet';
type EtfSourceAttempt = {
    stage: EtfSourceStage;
    url: string;
    ok: boolean;
    note?: string;
    error?: string;
};

type SectorDatum = { sector: string; weight: number };

type EtfFinalResult = {
    rowId: string;
    ok: boolean;
    sourceUrl?: string;
    sectors?: SectorDatum[];
    sources?: EtfSourceAttempt[];
    error?: string;
    fetchedAt: number;
};

type SectionState = {
    rows: EditableEtfRow[];
    running: boolean;
    error: string | null;
    resultsByRowId: Record<string, EtfFinalResult>;
    statusByRowId: Record<string, 'idle' | 'queued' | 'running' | 'succeeded' | 'failed'>;
    progress: { total: number; completed: number; inFlight: number };
};

type PersistedDraftV1 = {
    version: 1;
    // v1 rows did not include sum
    sections: Record<string, Array<{ id: string; ticker: string; url: string }>>;
};

type PersistedDraftV2 = {
    version: 2;
    sections: Record<EtfSectorsSectionId, EditableEtfRow[]>;
};

const STORAGE_KEY_V1 = 'etfsectors:draft:v1';
const STORAGE_KEY = 'etfsectors:draft:v2';
const CONCURRENCY_LIMIT = 3;

export default function EtfToolPage() {
    // Bypass captcha in development
    const isDev = process.env.NODE_ENV === 'development';
    const [captchaToken, setCaptchaToken] = useState<string | null>(isDev ? "dev-bypass" : null);
    const [isVerifiedHuman, setIsVerifiedHuman] = useState(isDev);

    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    const defaultSections = useMemo(() => {
        return ETFSECTORS_DEFAULTS.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            rows: (s.etfs || []).map((r) => ({
                id: crypto.randomUUID(),
                ticker: (r.ticker || '').trim(),
                url: (r.url || '').trim(),
                sum: r.sum != null ? String(r.sum) : '',
            })),
        }));
    }, []);

    const [sections, setSections] = useState<Record<EtfSectorsSectionId, SectionState>>(() => {
        const initial: Record<EtfSectorsSectionId, SectionState> = {
            cba: { rows: [], running: false, error: null, resultsByRowId: {}, statusByRowId: {}, progress: { total: 0, completed: 0, inFlight: 0 } },
            nab: { rows: [], running: false, error: null, resultsByRowId: {}, statusByRowId: {}, progress: { total: 0, completed: 0, inFlight: 0 } },
        };
        return initial;
    });

    // Initialize rows from localStorage (override) or config defaults.
    useEffect(() => {
        const defaults: PersistedDraftV2['sections'] = {
            cba: defaultSections.find((s) => s.id === 'cba')?.rows ?? [],
            nab: defaultSections.find((s) => s.id === 'nab')?.rows ?? [],
        };

        const persisted = loadDraft();
        const merged: PersistedDraftV2['sections'] = persisted?.sections
            ? {
                cba: hydrateRowsFromDefaults(persisted.sections.cba ?? [], defaults.cba),
                nab: hydrateRowsFromDefaults(persisted.sections.nab ?? [], defaults.nab),
            }
            : defaults;

        setSections((prev) => {
            const next = { ...prev };
            (Object.keys(next) as EtfSectorsSectionId[]).forEach((id) => {
                next[id] = {
                    ...next[id],
                    rows: merged[id] ?? [],
                    running: false,
                    error: null,
                    resultsByRowId: {},
                    statusByRowId: {},
                    progress: { total: 0, completed: 0, inFlight: 0 },
                };
            });
            return next;
        });
    }, [defaultSections]);

    // Persist row edits to localStorage
    useEffect(() => {
        saveDraft({
            version: 2,
            sections: {
                cba: sections.cba.rows,
                nab: sections.nab.rows,
            },
        });
    }, [sections.cba.rows, sections.nab.rows]);

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
        } catch {
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

    const ensureHumanVerified = async (): Promise<{ ok: boolean; error?: string }> => {
        if (isDev || isVerifiedHuman) return { ok: true };
        if (!captchaToken) return { ok: false, error: 'Please complete the captcha.' };

        const res = await verifyCaptcha(captchaToken);
        if (res.success) {
            setIsVerifiedHuman(true);
            return { ok: true };
        }
        return { ok: false, error: res.error || 'Failed to verify captcha.' };
    };

    const addRow = (sectionId: EtfSectorsSectionId) => {
        setSections((prev) => {
            const next = { ...prev };
            const row: EditableEtfRow = { id: crypto.randomUUID(), ticker: '', url: '', sum: '' };
            next[sectionId] = { ...next[sectionId], rows: [...next[sectionId].rows, row] };
            return next;
        });
    };

    const updateRow = (sectionId: EtfSectorsSectionId, rowId: string, patch: Partial<EditableEtfRow>) => {
        setSections((prev) => {
            const next = { ...prev };
            next[sectionId] = {
                ...next[sectionId],
                rows: next[sectionId].rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
            };
            return next;
        });
    };

    const deleteRow = (sectionId: EtfSectorsSectionId, rowId: string) => {
        setSections((prev) => {
            const next = { ...prev };
            next[sectionId] = { ...next[sectionId], rows: next[sectionId].rows.filter((r) => r.id !== rowId) };
            return next;
        });
    };

    const resetSectionToDefaults = (sectionId: EtfSectorsSectionId) => {
        const defaults = defaultSections.find((s) => s.id === sectionId)?.rows ?? [];
        setSections((prev) => {
            const next = { ...prev };
            next[sectionId] = {
                ...next[sectionId],
                rows: defaults.map((r) => ({ ...r, id: crypto.randomUUID() })),
                running: false,
                error: null,
                resultsByRowId: {},
                statusByRowId: {},
                progress: { total: 0, completed: 0, inFlight: 0 },
            };
            return next;
        });
    };

    const runSection = async (sectionId: EtfSectorsSectionId) => {
        const preflight = await ensureHumanVerified();
        if (!preflight.ok) {
            setSections((prev) => ({
                ...prev,
                [sectionId]: { ...prev[sectionId], error: preflight.error || 'Captcha required.' },
            }));
            // reset captcha UI on captcha errors
            if ((preflight.error || '').toLowerCase().includes('captcha')) {
                setIsVerifiedHuman(false);
                setCaptchaToken(null);
                recaptchaRef.current?.reset();
            }
            return;
        }

        const rows = sections[sectionId].rows
            .map((r) => ({ ...r, ticker: r.ticker.trim(), url: r.url.trim() }))
            .filter((r) => r.ticker.length > 0 || r.url.length > 0);

        if (rows.length === 0) {
            setSections((prev) => ({
                ...prev,
                [sectionId]: { ...prev[sectionId], error: 'Please add at least one ETF (ticker and/or URL).' },
            }));
            return;
        }

        setSections((prev) => {
            const next = { ...prev };
            const statusByRowId: SectionState['statusByRowId'] = {};
            rows.forEach((r) => (statusByRowId[r.id] = 'queued'));
            next[sectionId] = {
                ...next[sectionId],
                running: true,
                error: null,
                resultsByRowId: {},
                statusByRowId,
                progress: { total: rows.length, completed: 0, inFlight: 0 },
            };
            return next;
        });

        await runWithConcurrency(rows, CONCURRENCY_LIMIT, async (row) => {
            setSections((prev) => {
                const next = { ...prev };
                next[sectionId] = {
                    ...next[sectionId],
                    statusByRowId: { ...next[sectionId].statusByRowId, [row.id]: 'running' },
                    progress: { ...next[sectionId].progress, inFlight: next[sectionId].progress.inFlight + 1 },
                };
                return next;
            });

            try {
                const res = await getEtfData({
                    ticker: row.ticker || undefined,
                    url: row.url || undefined,
                    // backend may ignore if already verified via cookie
                    captchaToken: isVerifiedHuman ? undefined : (captchaToken || undefined),
                });

                const final: EtfFinalResult = {
                    rowId: row.id,
                    ok: !!(res.success && res.data),
                    sourceUrl: res.sourceUrl,
                    sectors: res.success ? res.data : undefined,
                    sources: res.sources,
                    error: res.success ? undefined : (res.error || 'Failed to fetch data.'),
                    fetchedAt: Date.now(),
                };

                if (res.success) {
                    setIsVerifiedHuman(true);
                }

                setSections((prev) => {
                    const next = { ...prev };
                    const completed = next[sectionId].progress.completed + 1;
                    const inFlight = Math.max(0, next[sectionId].progress.inFlight - 1);
                    next[sectionId] = {
                        ...next[sectionId],
                        resultsByRowId: { ...next[sectionId].resultsByRowId, [row.id]: final },
                        statusByRowId: { ...next[sectionId].statusByRowId, [row.id]: final.ok ? 'succeeded' : 'failed' },
                        progress: { ...next[sectionId].progress, completed, inFlight },
                    };
                    return next;
                });

                if (!final.ok && (final.error || '').toLowerCase().includes('captcha')) {
                    setIsVerifiedHuman(false);
                    setCaptchaToken(null);
                    recaptchaRef.current?.reset();
                }
            } catch (err) {
                const final: EtfFinalResult = {
                    rowId: row.id,
                    ok: false,
                    error: err instanceof Error ? err.message : 'An unexpected error occurred.',
                    fetchedAt: Date.now(),
                };

                setSections((prev) => {
                    const next = { ...prev };
                    const completed = next[sectionId].progress.completed + 1;
                    const inFlight = Math.max(0, next[sectionId].progress.inFlight - 1);
                    next[sectionId] = {
                        ...next[sectionId],
                        resultsByRowId: { ...next[sectionId].resultsByRowId, [row.id]: final },
                        statusByRowId: { ...next[sectionId].statusByRowId, [row.id]: 'failed' },
                        progress: { ...next[sectionId].progress, completed, inFlight },
                    };
                    return next;
                });
            }
        });

        setSections((prev) => {
            const next = { ...prev };
            next[sectionId] = { ...next[sectionId], running: false };
            return next;
        });
    };

    return (
        <div className="container max-w-4xl py-12 px-4 mx-auto">
            <div className="mb-8">
                <Link href="/tools" className="text-sm text-muted-foreground hover:underline mb-2 block">← Back to Tools</Link>
                <h1 className="text-3xl font-bold tracking-tight mb-2">ETF Sector Analysis</h1>
                <p className="text-muted-foreground">
                    Configure your ETFs per broker, then run a sector breakdown batch.
                </p>
            </div>

            <Card className="p-6 mb-8">
                <div className="flex justify-between items-center">
                    {isVerifiedHuman ? (
                        <div className="text-xs text-green-600 font-medium border border-green-200 bg-green-50 px-3 py-2 rounded flex items-center gap-2">
                            ✓ Verified Human
                        </div>
                    ) : (
                        <ReCAPTCHA
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                            onChange={(token) => setCaptchaToken(token)}
                            ref={recaptchaRef}
                        />
                    )}
                    <div className="text-xs text-muted-foreground">
                        Concurrency: {CONCURRENCY_LIMIT} • Candidates: top 5
                    </div>
                </div>
            </Card>

            <div className="space-y-8">
                {defaultSections.map((s) => (
                    <BrokerSection
                        key={s.id}
                        title={s.title}
                        description={s.description}
                        section={sections[s.id]}
                        onAddRow={() => addRow(s.id)}
                        onReset={() => resetSectionToDefaults(s.id)}
                        onRun={() => runSection(s.id)}
                        onUpdateRow={(rowId, patch) => updateRow(s.id, rowId, patch)}
                        onDeleteRow={(rowId) => deleteRow(s.id, rowId)}
                    />
                ))}
            </div>
        </div >
    );
}

function BrokerSection({
    title,
    description,
    section,
    onAddRow,
    onReset,
    onRun,
    onUpdateRow,
    onDeleteRow,
}: {
    title: string;
    description?: string;
    section: SectionState;
    onAddRow: () => void;
    onReset: () => void;
    onRun: () => void;
    onUpdateRow: (rowId: string, patch: Partial<EditableEtfRow>) => void;
    onDeleteRow: (rowId: string) => void;
}) {
    const aggregate = useMemo(() => computeSectorAggregate(section), [section]);
    const pieSlices = useMemo(() => toPieSlices(aggregate), [aggregate]);

    return (
        <Card className="p-6">
            <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={onReset} disabled={section.running}>
                        Reset
                    </Button>
                    <Button type="button" onClick={onAddRow} disabled={section.running}>
                        Add ETF
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left table-fixed">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-3 py-3 rounded-l-lg w-28">Ticker</th>
                            <th scope="col" className="px-3 py-3 text-right w-40">Market Value (AUD)</th>
                            <th scope="col" className="px-3 py-3">URL</th>
                            <th scope="col" className="px-3 py-3 w-40">Status</th>
                            <th scope="col" className="px-3 py-3 rounded-r-lg text-right w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.rows.map((row) => {
                            const status = section.statusByRowId[row.id] || 'idle';
                            const result = section.resultsByRowId[row.id];
                            return (
                                <tr key={row.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-800">
                                    <td className="px-3 py-2 align-top">
                                        <input
                                            type="text"
                                            placeholder="e.g. A200"
                                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={row.ticker}
                                            onChange={(e) => onUpdateRow(row.id, { ticker: e.target.value })}
                                            disabled={section.running}
                                        />
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="e.g. 30747"
                                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-right tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={row.sum}
                                            onChange={(e) => onUpdateRow(row.id, { sum: e.target.value })}
                                            disabled={section.running}
                                        />
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                        <input
                                            type="url"
                                            placeholder="https://... (optional)"
                                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={row.url}
                                            onChange={(e) => onUpdateRow(row.id, { url: e.target.value })}
                                            disabled={section.running}
                                        />
                                        {result?.sourceUrl && (
                                            <a
                                                href={result.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                                            >
                                                Source Data ↗
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                        <StatusBadge status={status} />
                                        {result?.error && (
                                            <div className="text-xs text-red-500 mt-2 whitespace-pre-wrap">{result.error}</div>
                                        )}
                                        {result?.sources && result.sources.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {result.sources.map((a, idx) => (
                                                    <div key={idx} className="text-xs text-muted-foreground">
                                                        <span className="font-medium">[{a.stage}]</span>{' '}
                                                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
                                                            {a.url}
                                                        </a>
                                                        {a.ok ? (
                                                            <span className="ml-2 text-green-600">ok</span>
                                                        ) : (
                                                            <span className="ml-2 text-red-500">fail</span>
                                                        )}
                                                        {(a.note || a.error) && (
                                                            <span className="ml-2">{a.note || a.error}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 align-top text-right">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => onDeleteRow(row.id)}
                                            disabled={section.running}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                        {section.rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                    No ETFs configured.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4 gap-4">
                <div className="text-sm text-muted-foreground">
                    Progress: {section.progress.completed}/{section.progress.total}{' '}
                    {section.running ? (
                        <span className="ml-2">(in flight: {section.progress.inFlight})</span>
                    ) : null}
                </div>
                <Button type="button" onClick={onRun} disabled={section.running}>
                    {section.running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit
                </Button>
            </div>

            {section.error && (
                <div className="mt-4 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                    {section.error}
                </div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="overflow-x-auto">
                    <h3 className="text-lg font-semibold mb-2">Sector Breakdown</h3>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Sector</th>
                                <th className="px-4 py-3 text-right">Value (AUD)</th>
                                <th className="px-4 py-3 rounded-r-lg text-right">% Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aggregate.rows.map((r) => (
                                <tr key={r.sector} className="bg-white border-b dark:bg-gray-900 dark:border-gray-800">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.sector}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{formatAud(r.value)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{formatPercent(r.percent)}</td>
                                </tr>
                            ))}
                            {aggregate.rows.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                                        Run the section to see aggregated sectors.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {aggregate.totalValue > 0 && (
                        <div className="text-xs text-muted-foreground mt-2 tabular-nums">
                            Included portfolio value: {formatAud(aggregate.totalValue)}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Portfolio Pie</h3>
                    <SectorPieChart slices={pieSlices} />
                </div>
            </div>
        </Card>
    );
}

function StatusBadge({ status }: { status: 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' }) {
    if (status === 'running') {
        return <div className="text-xs inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Running</div>;
    }
    if (status === 'queued') {
        return <div className="text-xs text-muted-foreground">Queued</div>;
    }
    if (status === 'succeeded') {
        return <div className="text-xs text-green-600 font-medium">Success</div>;
    }
    if (status === 'failed') {
        return <div className="text-xs text-red-500 font-medium">Failed</div>;
    }
    return <div className="text-xs text-muted-foreground">Idle</div>;
}

function computeSectorAggregate(section: SectionState): { rows: { sector: string; value: number; percent: number }[]; totalValue: number } {
    const sums = new Map<string, number>();
    for (const s of ETF_SECTORS) sums.set(s, 0);

    const valueByRowId = new Map<string, number>();
    for (const row of section.rows) {
        valueByRowId.set(row.id, parseAudNumber(row.sum));
    }

    let totalValue = 0;

    for (const [rowId, res] of Object.entries(section.resultsByRowId)) {
        if (!res.ok || !res.sectors) continue;
        const rowValue = valueByRowId.get(rowId) || 0;
        if (rowValue <= 0) continue;
        totalValue += rowValue;

        for (const datum of res.sectors) {
            if (!sums.has(datum.sector)) continue;
            sums.set(datum.sector, (sums.get(datum.sector) || 0) + rowValue * datum.weight);
        }
    }

    const rows = Array.from(sums.entries())
        .map(([sector, value]) => ({ sector, value, percent: totalValue > 0 ? value / totalValue : 0 }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value);

    return { rows, totalValue };
}

type PieSlice = { key: string; label: string; value: number; percent: number; colorVar: string };

function toPieSlices(aggregate: { rows: { sector: string; value: number; percent: number }[]; totalValue: number }): PieSlice[] {
    const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
    return aggregate.rows.map((r, idx) => ({
        key: r.sector,
        label: r.sector,
        value: r.value,
        percent: r.percent,
        colorVar: palette[idx % palette.length],
    }));
}

function SectorPieChart({ slices }: { slices: PieSlice[] }) {
    const total = slices.reduce((acc, s) => acc + s.value, 0);
    const radius = 45;
    const center = 50;
    const stroke = 'var(--border)';

    if (!slices.length || total <= 0) {
        return (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground border border-border rounded-md">
                No data
            </div>
        );
    }

    const paths = slices.reduce<{ paths: { slice: PieSlice; d: string }[]; cumulative: number }>(
        (acc, slice) => {
            const start = acc.cumulative / total;
            const cumulativeNext = acc.cumulative + slice.value;
            const end = cumulativeNext / total;
            return {
                paths: [...acc.paths, { slice, d: arcPath(center, center, radius, start * 360, end * 360) }],
                cumulative: cumulativeNext,
            };
        },
        { paths: [], cumulative: 0 }
    ).paths;

    return (
        <div className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" className="w-56 h-56 shrink-0">
                {paths.map(({ slice, d }) => (
                    <path
                        key={slice.key}
                        d={d}
                        style={{ fill: slice.colorVar, stroke, strokeWidth: 0.5 }}
                    />
                ))}
                <circle cx={center} cy={center} r={24} style={{ fill: 'var(--card)' }} />
            </svg>
            <div className="flex-1">
                <div className="space-y-2">
                    {slices.slice(0, 12).map((s) => (
                        <div key={s.key} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.colorVar }} />
                                <span className="truncate">{s.label}</span>
                            </div>
                            <div className="text-muted-foreground whitespace-nowrap tabular-nums">{formatPercent(s.percent)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
        `M ${cx} ${cy}`,
        `L ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        'Z',
    ].join(' ');
}

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number): { x: number; y: number } {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians),
    };
}

function loadDraft(): PersistedDraftV2 | null {
    try {
        const rawV2 = localStorage.getItem(STORAGE_KEY);
        if (rawV2) {
            const parsedV2 = JSON.parse(rawV2) as PersistedDraftV2;
            if (parsedV2.version === 2 && parsedV2.sections) return parsedV2;
        }

        const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
        if (!rawV1) return null;
        const parsedV1 = JSON.parse(rawV1) as PersistedDraftV1;
        if (parsedV1.version !== 1 || !parsedV1.sections) return null;

        const migrated: PersistedDraftV2 = {
            version: 2,
            sections: {
                cba: (parsedV1.sections['cba'] || []).map((r) => ({ ...r, sum: '' })),
                nab: (parsedV1.sections['nab'] || []).map((r) => ({ ...r, sum: '' })),
            },
        };
        return migrated;
    } catch {
        return null;
    }
}

function saveDraft(draft: PersistedDraftV2) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
        // ignore
    }
}

function parseAudNumber(value: string): number {
    const cleaned = value.replace(/[$,\s]/g, '').trim();
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

function hydrateRowsFromDefaults(persistedRows: EditableEtfRow[], defaultRows: EditableEtfRow[]): EditableEtfRow[] {
    const byTicker = new Map<string, EditableEtfRow>();
    const byUrl = new Map<string, EditableEtfRow>();
    for (const r of defaultRows) {
        const t = (r.ticker || '').trim().toUpperCase();
        if (t) byTicker.set(t, r);
        const u = (r.url || '').trim();
        if (u) byUrl.set(u, r);
    }

    return persistedRows.map((r) => {
        if (parseAudNumber(r.sum) > 0) return r;
        const t = (r.ticker || '').trim().toUpperCase();
        const match = (t && byTicker.get(t)) || (r.url && byUrl.get(r.url.trim())) || undefined;
        if (!match) return r;
        return { ...r, sum: match.sum };
    });
}

function formatAud(value: number): string {
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercent(fraction: number): string {
    if (!Number.isFinite(fraction) || fraction <= 0) return '0.00%';
    return `${(fraction * 100).toFixed(2)}%`;
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
    let nextIndex = 0;

    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (true) {
            const idx = nextIndex++;
            if (idx >= items.length) return;
            await worker(items[idx]);
        }
    });

    await Promise.all(runners);
}
