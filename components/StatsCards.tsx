
import React from 'react';
import { Bet, BetStatus, Language, Currency } from '../types';
import { translations, currencySymbols } from '../i18n';

interface StatsCardsProps {
  bets: Bet[];
  lang: Language;
  currency: Currency;
}

const StatsCards: React.FC<StatsCardsProps> = ({ bets, lang, currency }) => {
  const t = translations[lang];
  const symbol = currencySymbols[currency];

  const totalProfit = bets.reduce((acc, bet) => acc + bet.profit, 0);
  const totalStake = bets.reduce((acc, bet) => acc + bet.stake, 0);
  const finishedBets = bets.filter(b => b.status !== BetStatus.PENDING);
  const winRate = finishedBets.length > 0 ? (bets.filter(b => b.status === BetStatus.WIN).length / finishedBets.length) * 100 : 0;
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;

  const cards = [
    { label: t.totalProfit, value: `${symbol} ${totalProfit.toFixed(2)}`, color: totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
    { label: t.roi, value: `${roi.toFixed(1)}%`, color: roi >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400' },
    { label: t.winRate, value: `${winRate.toFixed(1)}%`, color: 'text-indigo-600 dark:text-indigo-400' },
    { label: t.activeBets, value: bets.filter(b => b.status === BetStatus.PENDING).length, color: 'text-slate-600 dark:text-slate-400' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{card.label}</p>
          <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
