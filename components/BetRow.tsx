
import React, { useState, useEffect } from 'react';
import { Bet, BetStatus, Language, Currency } from '../types';
import { translations, currencySymbols } from '../i18n';

interface BetRowProps {
  bet: Bet;
  onUpdateStatus: (id: string, status: BetStatus) => void;
  onUpdateProfit: (id: string, profit: number) => void;
  onDelete: (id: string) => void;
  onEdit: (bet: Bet) => void;
  lang: Language;
  currency: Currency;
}

const BetRow: React.FC<BetRowProps> = ({ bet, onUpdateStatus, onUpdateProfit, onDelete, onEdit, lang, currency }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditingProfit, setIsEditingProfit] = useState(false);
  const [tempProfit, setTempProfit] = useState<string>(bet.profit.toString());
  
  const t = translations[lang];
  const symbol = currencySymbols[currency];

  useEffect(() => {
    setTempProfit(bet.profit.toString());
  }, [bet.profit]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const [y, m, d] = dateStr.split('-');
    return lang === 'pt' ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
  };

  const handleToggleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirmingDelete) {
      onDelete(bet.id);
    } else {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000);
    }
  };

  const handleSaveProfit = () => {
    const parsed = parseFloat(tempProfit.replace(',', '.'));
    if (!isNaN(parsed)) {
      onUpdateProfit(bet.id, parsed);
    }
    setIsEditingProfit(false);
  };

  const isRTL = lang === 'ar';

  return (
    <tr className="flex flex-col md:table-row p-4 md:p-0 border-b border-slate-100 dark:border-slate-800 md:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
      {/* Date and actions toggle row for mobile */}
      <td className="flex justify-between items-center md:table-cell px-0 md:px-6 py-2 md:py-4 text-xs font-medium text-slate-500 dark:text-slate-400 align-top">
        <span className="md:hidden font-bold uppercase text-[9px] text-slate-400">{t.tableDate}</span>
        <span>{formatDisplayDate(bet.date)}</span>
      </td>

      <td className="block md:table-cell px-0 md:px-6 py-2 md:py-4 align-top">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 leading-tight uppercase">{bet.type}</span>
            {bet.subGames && (
              <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{t.multiple}</span>
            )}
          </div>
          <span className="text-[10px] md:text-xs font-bold text-blue-500 dark:text-blue-400 uppercase">{bet.match}</span>
          
          {bet.subGames && (
            <div className="mt-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3 space-y-1">
              {bet.subGames.map((game, i) => (
                <div key={i} className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400">• {game.event}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">@{game.odd.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </td>

      {/* Stats group for mobile */}
      <div className="flex md:contents gap-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t border-slate-50 dark:border-slate-800 md:border-t-0">
        <td className="flex-1 md:table-cell px-0 md:px-6 py-1 md:py-4 text-sm font-mono font-bold text-slate-700 dark:text-slate-300 align-top">
          <span className="md:hidden block text-[9px] text-slate-400 uppercase mb-0.5 font-black">{t.tableOdds}</span>
          {bet.odds.toFixed(2)}
        </td>
        <td className="flex-1 md:table-cell px-0 md:px-6 py-1 md:py-4 text-sm font-mono text-slate-600 dark:text-slate-400 align-top whitespace-nowrap">
          <span className="md:hidden block text-[9px] text-slate-400 uppercase mb-0.5 font-black">{t.tableStake}</span>
          {symbol} {bet.stake.toFixed(2)}
        </td>
        <td className={`flex-1 md:table-cell px-0 md:px-6 py-1 md:py-4 text-sm font-bold align-top whitespace-nowrap ${
          bet.profit > 0 ? 'text-green-600 dark:text-green-400' : bet.profit < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-600'
        }`}>
          <span className="md:hidden block text-[9px] text-slate-400 uppercase mb-0.5 font-black">{t.tableProfit}</span>
          {isEditingProfit ? (
            <div className="flex items-center gap-1">
              <input 
                type="text" 
                value={tempProfit} 
                onChange={(e) => setTempProfit(e.target.value)}
                onBlur={handleSaveProfit}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveProfit()}
                autoFocus
                className="w-16 px-1 py-0.5 bg-white dark:bg-slate-800 border border-blue-500 rounded text-xs font-mono outline-none"
              />
              <button onClick={handleSaveProfit} className="text-blue-600 dark:text-blue-400">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          ) : (
            bet.status === BetStatus.PENDING ? '--' : `${symbol} ${bet.profit.toFixed(2)}`
          )}
        </td>
      </div>

      {/* Seção de Ações com centralização mobile */}
      <td className="block md:table-cell px-0 md:px-6 py-3 md:py-4 align-top text-center md:text-right">
        {/* Label AÇÕES visível apenas no mobile e centralizado */}
        <span className="md:hidden block text-[9px] text-slate-400 uppercase mb-2 font-black text-center">{t.tableActions}</span>
        
        <div className={`flex items-center gap-3 ${isRTL ? 'justify-center md:justify-start' : 'justify-center md:justify-end'}`}>
          {bet.status === BetStatus.PENDING ? (
            <div className="flex gap-1">
              <button type="button" onClick={() => onUpdateStatus(bet.id, BetStatus.WIN)} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded text-[10px] font-bold hover:bg-green-600 hover:text-white transition-colors">{t.win}</button>
              <button type="button" onClick={() => onUpdateStatus(bet.id, BetStatus.LOSS)} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded text-[10px] font-bold hover:bg-red-600 hover:text-white transition-colors">{t.loss}</button>
              <button type="button" onClick={() => onUpdateStatus(bet.id, BetStatus.VOID)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded text-[10px] font-bold hover:bg-slate-500 hover:text-white transition-colors">{t.void}</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                bet.status === BetStatus.WIN ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                bet.status === BetStatus.LOSS ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>{t[bet.status.toLowerCase() as keyof typeof t] || bet.status}</span>
              <button type="button" onClick={() => onUpdateStatus(bet.id, BetStatus.PENDING)} className="text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors" title={t.resetStatus}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          )}
          
          {/* Botão de Editar Aposta (Configurações Gerais) */}
          <button 
            type="button" 
            onClick={() => onEdit(bet)}
            className="text-slate-300 dark:text-slate-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-all"
            title={t.editBet}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* NOVO: Botão de Cashout / Ajuste de Lucro Manual */}
          <button 
            type="button" 
            onClick={() => setIsEditingProfit(!isEditingProfit)}
            className={`p-1.5 rounded-lg transition-all ${isEditingProfit ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
            title={t.cashoutLabel}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button 
            type="button"
            onClick={handleToggleDelete}
            className={`transition-all p-1.5 rounded-lg ${
              isConfirmingDelete 
              ? 'bg-red-600 text-white scale-110 shadow-lg' 
              : 'text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
            }`}
            title={isConfirmingDelete ? t.confirmDelete : t.tableActions}
          >
            {isConfirmingDelete ? (
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
};

export default BetRow;
