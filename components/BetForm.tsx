
import React, { useState, useMemo, useEffect } from 'react';
import { BetStatus, Bet, Language } from '../types';
import { translations } from '../i18n';

interface BetFormProps {
  onAdd: (bet: Omit<Bet, 'id' | 'profit'>) => void;
  onUpdate: (bet: Bet) => void;
  onCancelEdit: () => void;
  editingBet: Bet | null;
  lang: Language;
}

const BetForm: React.FC<BetFormProps> = ({ onAdd, onUpdate, onCancelEdit, editingBet, lang }) => {
  const [games, setGames] = useState<{ event: string; odd: string }[]>([{ event: '', odd: '' }]);
  const [type, setType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [stake, setStake] = useState<string>('');
  
  const t = translations[lang];

  useEffect(() => {
    if (editingBet) {
      setType(editingBet.type);
      setDate(editingBet.date);
      setStake(editingBet.stake.toString());
      if (editingBet.subGames && editingBet.subGames.length > 0) {
        setGames(editingBet.subGames.map(g => ({ event: g.event, odd: g.odd.toString() })));
      } else {
        setGames([{ event: editingBet.match, odd: editingBet.odds.toString() }]);
      }
    } else {
      setGames([{ event: '', odd: '' }]);
      setType('');
      setDate(new Date().toISOString().split('T')[0]);
      setStake('');
    }
  }, [editingBet]);

  const totalOdds = useMemo(() => {
    const validOdds = games
      .map(g => parseFloat(g.odd))
      .filter(o => !isNaN(o) && o > 0);
    
    if (validOdds.length === 0) return 0;
    return validOdds.reduce((acc, curr) => acc * curr, 1);
  }, [games]);

  const handleAddGameField = () => {
    setGames([...games, { event: '', odd: '' }]);
    if (games.length === 1 && !type) setType(t.multiple);
  };

  const handleRemoveGameField = (index: number) => {
    if (games.length > 1) {
      const newList = [...games];
      newList.splice(index, 1);
      setGames(newList);
    }
  };

  const handleGameChange = (index: number, field: 'event' | 'odd', value: string) => {
    const newList = [...games];
    if (field === 'odd') {
      const sanitized = value.replace(',', '.');
      newList[index][field] = sanitized;
    } else {
      newList[index][field] = value;
    }
    setGames(newList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedStake = parseFloat(stake.replace(',', '.'));
    if (isNaN(parsedStake) || parsedStake <= 0) return;
    const hasInvalidGames = games.some(g => !g.event || isNaN(parseFloat(g.odd)));
    if (hasInvalidGames || !type) return;

    const betMatch = games.length > 1 ? `${t.multiple} (${games.length})` : games[0].event;
    const betOdds = totalOdds || 1;
    const betSubGames = games.length > 1 ? games.map(g => ({ event: g.event, odd: parseFloat(g.odd) })) : undefined;

    if (editingBet) {
      onUpdate({
        ...editingBet,
        match: betMatch,
        type,
        date,
        odds: betOdds,
        stake: parsedStake,
        subGames: betSubGames
      });
    } else {
      onAdd({
        match: betMatch,
        type,
        date,
        odds: betOdds,
        stake: parsedStake,
        status: BetStatus.PENDING,
        subGames: betSubGames
      });
    }

    setGames([{ event: '', odd: '' }]);
    setType('');
    setStake('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
        {editingBet ? t.editBet : t.newBet}
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{t.betType}</label>
            <input 
              type="text" 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              placeholder={t.placeholderType}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{t.date}</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer" 
              required 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{t.stakeLabel}</label>
          <input 
            type="text" 
            inputMode="decimal"
            value={stake} 
            onChange={(e) => setStake(e.target.value)} 
            placeholder={t.placeholderStake}
            className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono placeholder:text-slate-300 dark:placeholder:text-slate-600" 
            required 
          />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{t.tableEvent}</label>
            <button type="button" onClick={handleAddGameField} className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-bold transition-colors">{t.addGame}</button>
          </div>
          <div className="space-y-3">
            {games.map((game, index) => (
              <div key={index} className="flex gap-2">
                <input 
                  type="text" 
                  value={game.event} 
                  onChange={(e) => handleGameChange(index, 'event', e.target.value)} 
                  placeholder={t.placeholderEvent}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-blue-400 outline-none transition-all" 
                  required 
                />
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={game.odd} 
                  onChange={(e) => handleGameChange(index, 'odd', e.target.value)} 
                  placeholder={t.placeholderOdd}
                  className="w-20 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md text-sm font-mono placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-blue-400 outline-none transition-all" 
                  required 
                />
                {games.length > 1 && (
                  <button type="button" onClick={() => handleRemoveGameField(index)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {totalOdds > 0 && (
            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500 dark:text-slate-400 uppercase">{t.totalOdds}</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">@{totalOdds.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-6">
        <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-md active:scale-[0.98]">
          {editingBet ? t.updateButton : t.registerButton}
        </button>
        {editingBet && (
          <button 
            type="button" 
            onClick={onCancelEdit}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-3 rounded-lg transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {t.cancelButton}
          </button>
        )}
      </div>
    </form>
  );
};

export default BetForm;
