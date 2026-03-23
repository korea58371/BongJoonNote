'use client';

import { useUser } from '@/lib/UserContext';
import { TEAM_MEMBERS, MEMBER_COLORS, STYLES } from '@/constants';

export default function LoginScreen() {
  const { login } = useUser();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-surface">
      <div className="bg-bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
          🎮 Game Dev Hub
        </h2>
        <div>
          <label className={STYLES.label}>접속할 사용자 (클릭 시 즉시 접속)</label>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {TEAM_MEMBERS.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => login(name)}
                className="p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all cursor-pointer border-border bg-bg-input hover:border-accent hover:bg-accent/10 hover:-translate-y-1"
              >
                <div className={`w-10 h-10 rounded-full ${MEMBER_COLORS[name] || 'bg-gray-500'} flex items-center justify-center text-lg font-bold text-white`}>
                  {name[0]}
                </div>
                <span className="text-sm font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
