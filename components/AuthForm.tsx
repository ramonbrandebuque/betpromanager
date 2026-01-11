
import React, { useState } from 'react';
import { Language, User } from '../types';
import { translations } from '../i18n';

interface AuthFormProps {
  lang: Language;
  onAuth: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ lang, onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Recupera usuários do localStorage
    const savedUsers = JSON.parse(localStorage.getItem('betpro_users') || '[]');

    if (isLogin) {
      const user = savedUsers.find((u: any) => u.email === email && u.password === password);
      if (user) {
        onAuth({ email: user.email, name: user.name });
      } else {
        setError(t.authError);
      }
    } else {
      if (savedUsers.some((u: any) => u.email === email)) {
        setError("Email already registered");
        return;
      }
      
      const newUser = { email, password, name };
      savedUsers.push(newUser);
      localStorage.setItem('betpro_users', JSON.stringify(savedUsers));
      onAuth({ email, name });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10 backdrop-blur-sm">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-800 dark:text-white text-center mb-2">
          {isLogin ? t.loginTitle : t.registerTitle}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8 font-medium">
          {isLogin ? "Professional management for your bankroll" : "Start managing your bets like a pro today"}
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold mb-6 border border-red-100 dark:border-red-900/50 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1">{t.nameLabel}</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
                required 
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1">{t.emailLabel}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
              required 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 ml-1">{t.passwordLabel}</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
              required 
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] mt-4">
            {isLogin ? t.loginButton : t.createAccountButton}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {isLogin ? t.noAccount : t.hasAccount} <span className="text-blue-600 dark:text-blue-400 font-black ml-1">{isLogin ? t.createAccountButton : t.loginButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
