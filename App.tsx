
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { Bet, BetStatus, ViewType, FilterConfig, Language, Currency, Theme } from './types';
import { translations, currencySymbols } from './i18n';
import BetForm from './components/BetForm';
import StatsCards from './components/StatsCards';
import BetRow from './components/BetRow';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('betpro_lang') as Language) || 'pt');
  const [currency, setCurrency] = useState<Currency>(() => (localStorage.getItem('betpro_currency') as Currency) || 'BRL');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('betpro_theme') as Theme) || 'light');
  
  const [bets, setBets] = useState<Bet[]>(() => {
    const saved = localStorage.getItem('betpro_bets');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingBet, setEditingBet] = useState<Bet | null>(null);

  const [filter, setFilter] = useState<FilterConfig>({
    type: 'annual',
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];
  const symbol = currencySymbols[currency];
  const isRTL = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('betpro_bets', JSON.stringify(bets));
  }, [bets]);

  useEffect(() => {
    localStorage.setItem('betpro_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('betpro_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('betpro_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleAddBet = useCallback((betData: Omit<Bet, 'id' | 'profit'>) => {
    const newBet: Bet = {
      ...betData,
      id: Math.random().toString(36).substring(2, 11),
      profit: 0,
    };
    if (newBet.status !== BetStatus.PENDING) {
        if (newBet.status === BetStatus.WIN) {
            newBet.profit = (newBet.stake * newBet.odds) - newBet.stake;
        } else if (newBet.status === BetStatus.LOSS) {
            newBet.profit = -newBet.stake;
        }
    }
    setBets(prev => [newBet, ...prev]);
  }, []);

  const handleUpdateBet = useCallback((updatedBetData: Bet) => {
    setBets(prev => prev.map(bet => {
      if (bet.id === updatedBetData.id) {
        let profit = 0;
        if (updatedBetData.status === BetStatus.WIN) {
          profit = (updatedBetData.stake * updatedBetData.odds) - updatedBetData.stake;
        } else if (updatedBetData.status === BetStatus.LOSS) {
          profit = -updatedBetData.stake;
        }
        return { ...updatedBetData, profit };
      }
      return bet;
    }));
    setEditingBet(null);
  }, []);

  const updateBetStatus = useCallback((id: string, status: BetStatus) => {
    setBets(prev => prev.map(bet => {
      if (bet.id === id) {
        let profit = 0;
        if (status === BetStatus.WIN) {
          profit = (bet.stake * bet.odds) - bet.stake;
        } else if (status === BetStatus.LOSS) {
          profit = -bet.stake;
        } else if (status === BetStatus.VOID) {
          profit = 0;
        }
        return { ...bet, status, profit };
      }
      return bet;
    }));
  }, []);

  const deleteBet = useCallback((id: string) => {
    setBets(currentBets => currentBets.filter(b => b.id !== id));
    if (editingBet?.id === id) setEditingBet(null);
  }, [editingBet]);

  const startEditing = useCallback((bet: Bet) => {
    setEditingBet(bet);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleExport = () => {
    const dataToExport = bets.map(bet => ({
      'Date': bet.date,
      'Event': bet.match,
      'Type': bet.type,
      'Odds': bet.odds,
      'Stake': bet.stake,
      'Status': bet.status,
      'Profit': bet.profit
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bets");
    XLSX.writeFile(workbook, `betpro_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedBets: Bet[] = jsonData.map((row: any) => {
          return {
            id: Math.random().toString(36).substring(2, 11),
            date: row['Date']?.toString() || new Date().toISOString().split('T')[0],
            match: row['Event']?.toString() || 'Imported Event',
            type: row['Type']?.toString() || 'Unknown',
            odds: parseFloat(row['Odds']) || 1,
            stake: parseFloat(row['Stake']) || 0,
            status: (row['Status']?.toUpperCase() as BetStatus) || BetStatus.PENDING,
            profit: parseFloat(row['Profit']) || 0
          };
        });

        if (importedBets.length > 0) {
          setBets(prev => [...importedBets, ...prev]);
          alert(t.importSuccess);
        } else {
          alert(t.importError);
        }
      } catch (err) {
        console.error(err);
        alert(t.importError);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredBets = useMemo(() => {
    return bets.filter(bet => {
      const betDate = new Date(bet.date + 'T00:00:00');
      if (filter.type === 'annual') {
        return betDate.getFullYear() === filter.year;
      } else if (filter.type === 'monthly') {
        return betDate.getFullYear() === filter.year && betDate.getMonth() === filter.month;
      } else {
        const start = new Date(filter.startDate + 'T00:00:00');
        const end = new Date(filter.endDate + 'T23:59:59');
        return betDate >= start && betDate <= end;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bets, filter]);

  const chartData = useMemo(() => {
    let dataMap: Record<string, { label: string, profit: number, sortKey: string }> = {};
    const localeMap: Record<Language, string> = {
        en: 'en-US', pt: 'pt-BR', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', ar: 'ar-SA'
    };
    const getMonthNames = (locale: string) => Array.from({length: 12}, (_, i) => new Date(0, i).toLocaleString(locale, {month: 'short'}));
    const months = getMonthNames(localeMap[lang]);
    
    if (filter.type === 'annual') {
      for (let m = 0; m < 12; m++) {
        const key = `${filter.year}-${String(m + 1).padStart(2, '0')}`;
        dataMap[key] = { label: months[m], profit: 0, sortKey: key };
      }
      filteredBets.forEach(bet => {
        const [y, m] = bet.date.split('-');
        const key = `${y}-${m}`;
        if (dataMap[key]) dataMap[key].profit += bet.profit;
      });
    } else {
      let current: Date;
      let end: Date;
      if (filter.type === 'monthly') {
        current = new Date(filter.year, filter.month, 1);
        end = new Date(filter.year, filter.month + 1, 0);
      } else {
        current = new Date(filter.startDate + 'T00:00:00');
        end = new Date(filter.endDate + 'T00:00:00');
      }
      const temp = new Date(current);
      while (temp <= end) {
        const key = temp.toISOString().split('T')[0];
        dataMap[key] = { label: temp.getDate().toString(), profit: 0, sortKey: key };
        temp.setDate(temp.getDate() + 1);
      }
      filteredBets.forEach(bet => {
        if (dataMap[bet.date]) dataMap[bet.date].profit += bet.profit;
      });
    }
    const sortedData = Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    let cumulative = 0;
    return sortedData.map(item => {
      cumulative += item.profit;
      return { ...item, cumulativeProfit: cumulative };
    });
  }, [filteredBets, filter, lang]);

  const handleGetInsights = async () => {
    if (filteredBets.length === 0) return;
    setLoadingInsights(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const summary = filteredBets.map(b => `Match: ${b.match}, Odds: ${b.odds}, Stake: ${symbol}${b.stake}, Status: ${b.status}, Profit: ${symbol}${b.profit}`).join('\n');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${t.iaPrompt}\n\n${summary}`,
      });
      setInsights(response.text || t.iaError);
    } catch (e) {
      setInsights(t.iaError);
    }
    setLoadingInsights(false);
  };

  const totalBalance = filteredBets.reduce((a, b) => a + b.profit, 0);
  const consolidatedBalance = bets.reduce((a, b) => a + b.profit, 0);

  return (
    <div className="min-h-screen pb-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-slate-900 dark:bg-slate-900/90 dark:backdrop-blur-md text-white py-4 shadow-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-xl font-black tracking-tight hidden sm:block">{t.headerTitle}</h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-4 md:gap-8 items-center border-r border-slate-700 pr-4 mr-2 hidden md:flex">
                <div className="text-right">
                  <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-0.5">{t.periodResult}</p>
                  <p className={`text-lg font-mono font-black ${totalBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {symbol} {totalBalance.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-0.5">{t.consolidatedResult}</p>
                  <p className={`text-lg font-mono font-black ${consolidatedBalance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                    {symbol} {consolidatedBalance.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value as Language)}
                  className="bg-transparent text-white text-[10px] font-black px-1 outline-none cursor-pointer uppercase"
                >
                  <option value="pt" className="bg-slate-800">PT</option>
                  <option value="en" className="bg-slate-800">EN</option>
                  <option value="es" className="bg-slate-800">ES</option>
                  <option value="fr" className="bg-slate-800">FR</option>
                  <option value="it" className="bg-slate-800">IT</option>
                  <option value="de" className="bg-slate-800">DE</option>
                  <option value="ar" className="bg-slate-800">AR</option>
                </select>
                <div className="w-px h-3 bg-slate-700 mx-0.5" />
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="bg-transparent text-white text-[10px] font-black px-1 outline-none cursor-pointer"
                >
                  <option value="BRL" className="bg-slate-800">BRL</option>
                  <option value="USD" className="bg-slate-800">USD</option>
                  <option value="EUR" className="bg-slate-800">EUR</option>
                </select>
              </div>

              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                {theme === 'light' ? (
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-8 mb-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end transition-colors">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">{t.viewLabel}</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['annual', 'monthly', 'custom'] as ViewType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(f => ({ ...f, type }))}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    filter.type === type 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t[type]}
                </button>
              ))}
            </div>
          </div>

          {filter.type === 'annual' && (
            <div className="w-32">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">{t.year}</label>
              <input type="number" value={filter.year} onChange={(e) => setFilter(f => ({...f, year: parseInt(e.target.value) || new Date().getFullYear()}))} className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {filter.type === 'monthly' && (
            <>
              <div className="w-28">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">{t.year}</label>
                <input type="number" value={filter.year} onChange={(e) => setFilter(f => ({...f, year: parseInt(e.target.value) || new Date().getFullYear()}))} className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="w-40">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">{t.month}</label>
                <select value={filter.month} onChange={(e) => setFilter(f => ({...f, month: parseInt(e.target.value)}))} className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i} className="text-slate-900 dark:text-white">{new Date(0, i).toLocaleString(lang === 'ar' ? 'ar-SA' : (lang === 'pt' ? 'pt-BR' : 'en-US'), { month: 'long' })}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {filter.type === 'custom' && (
            <>
              <div className="w-40">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">{t.start}</label>
                <input type="date" value={filter.startDate} onChange={(e) => setFilter(f => ({...f, startDate: e.target.value}))} className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="w-40">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">{t.end}</label>
                <input type="date" value={filter.endDate} onChange={(e) => setFilter(f => ({...f, endDate: e.target.value}))} className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}

          <div className="flex gap-2 mb-[2px]">
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <button 
              onClick={handleImportClick}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all h-[38px] border border-slate-200 dark:border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="hidden sm:inline">{t.importLabel}</span>
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all h-[38px] border border-slate-200 dark:border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="hidden sm:inline">{t.exportLabel}</span>
            </button>
            <button onClick={handleGetInsights} disabled={loadingInsights || filteredBets.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all h-[38px] shadow-lg shadow-blue-500/20 active:scale-[0.98]">
              {loadingInsights ? '...' : t.iaInsights}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 space-y-8">
        <StatsCards bets={filteredBets} lang={lang} currency={currency} />

        {insights && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">{t.iaAnalysisTitle}</h3>
            </div>
            <div className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed whitespace-pre-wrap">{insights}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <BetForm 
              onAdd={handleAddBet} 
              onUpdate={handleUpdateBet} 
              onCancelEdit={() => setEditingBet(null)} 
              editingBet={editingBet} 
              lang={lang} 
            />
          </div>
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full transition-colors overflow-hidden">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t.iaAnalysisTitle}</h3>
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} reversed={isRTL} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 600 }} orientation={isRTL ? 'right' : 'left'} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }} cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }} />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar dataKey="profit" name={t.tableProfit} radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="cumulativeProfit" name="Bankroll Evolution" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: theme === 'dark' ? '#0f172a' : '#fff' }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full transition-colors mb-12">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.historyTitle}</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{filteredBets.length} {t.entries}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left block md:table">
              <thead className="bg-slate-50 dark:bg-slate-800/30 hidden md:table-header-group">
                <tr>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t.tableDate}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t.tableEvent}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t.tableOdds}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t.tableStake}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t.tableProfit}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center md:${isRTL ? 'text-left' : 'text-right'}`}>{t.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 block md:table-row-group">
                {filteredBets.length > 0 ? (
                  filteredBets.map(bet => (
                    <BetRow 
                      key={bet.id} 
                      bet={bet} 
                      onUpdateStatus={updateBetStatus} 
                      onDelete={deleteBet}
                      onEdit={startEditing}
                      lang={lang} 
                      currency={currency} 
                    />
                  ))
                ) : (
                  <tr className="block md:table-row">
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 dark:text-slate-600 font-medium block md:table-cell">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        {t.noBets}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
