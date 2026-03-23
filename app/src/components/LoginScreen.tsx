'use client';

import { useState } from 'react';
import { useUser } from '@/lib/UserContext';
import { TEAM_MEMBERS, MEMBER_COLORS, STYLES } from '@/constants';

export default function LoginScreen() {
  const { login } = useUser();
  const [selectedUser, setSelectedUser] = useState<typeof TEAM_MEMBERS[number]>('김현준');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(selectedUser, password)) {
      setError('비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-surface">
      <div className="bg-bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
          🎮 Game Dev Hub
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={STYLES.label}>접속할 사용자</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {TEAM_MEMBERS.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => { setSelectedUser(name); setError(''); setPassword(''); }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedUser === name 
                      ? 'border-accent bg-accent/10' 
                      : 'border-border bg-bg-input hover:border-border-light'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${MEMBER_COLORS[name] || 'bg-gray-500'} flex items-center justify-center text-sm font-bold text-white`}>
                    {name[0]}
                  </div>
                  <span className="text-sm font-medium">{name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className={STYLES.label}>비밀번호</label>
            <input 
              type="password" 
              className={STYLES.input} 
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="초기 비밀번호: 1111"
              required
            />
            {error && <p className="text-danger text-xs mt-2">{error}</p>}
          </div>

          <button type="submit" className={`${STYLES.btnPrimary} w-full mt-6`}>
            입장하기
          </button>
        </form>
      </div>
    </div>
  );
}
