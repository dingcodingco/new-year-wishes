'use client';

import { useState, useEffect } from 'react';
import { supabase, Wish } from '@/lib/supabase';
import Lantern from '@/components/Lantern';

export default function Home() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [newWish, setNewWish] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 초기 소원 목록 가져오기
    fetchWishes();

    // Realtime 구독 설정
    const channel = supabase
      .channel('wishes_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishes',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWishes((current) => [...current, payload.new as Wish]);
          } else if (payload.eventType === 'UPDATE') {
            setWishes((current) =>
              current.map((wish) =>
                wish.id === (payload.new as Wish).id ? (payload.new as Wish) : wish
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setWishes((current) =>
              current.filter((wish) => wish.id !== (payload.old as Wish).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWishes = async () => {
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishes:', error);
    } else {
      setWishes(data || []);
    }
  };

  // 효과음 재생 함수
  const playLaunchSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 마법 같은 소리 (올라가는 톤)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWish.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase.from('wishes').insert({
      content: newWish,
      author: author || '익명',
      position_x: Math.random(),
      position_y: Math.random(),
    });

    if (error) {
      console.error('Error creating wish:', error);
      alert('소원을 작성하는데 실패했습니다. 다시 시도해주세요.');
    } else {
      // 효과음 재생
      playLaunchSound();
      setNewWish('');
      setAuthor('');
    }

    setIsSubmitting(false);
  };

  const handleBurn = async (wishId: string) => {
    const { error } = await supabase
      .from('wishes')
      .update({ burned_at: new Date().toISOString() })
      .eq('id', wishId);

    if (error) {
      console.error('Error burning wish:', error);
    }
  };

  // 날아가지 않은 풍등만 필터링
  const activeWishes = wishes.filter(wish => !wish.burned_at);
  // 최근 소원 5개 (burned_at 없는 것만)
  const recentWishes = activeWishes.slice(0, 5);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
      {/* 별 배경 */}
      <div className="absolute inset-0 bg-[url('/stars.svg')] opacity-40"></div>

      {/* 빛나는 효과 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"></div>

      {/* 풍등들 */}
      <div className="absolute inset-0 pb-64">
        {activeWishes.map((wish) => (
          <Lantern key={wish.id} wish={wish} onBurn={handleBurn} />
        ))}
      </div>

      {/* 제목 - 상단 고정 */}
      <div className="relative z-10 pt-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 drop-shadow-lg">
          새해 소원 🏮
        </h1>
        <p className="text-white/70 text-sm md:text-base">
          2026년 새해, 당신의 소원을 하늘로 날려보세요
        </p>
      </div>

      {/* 최근 소원 리스트 - 오른쪽 상단 */}
      {recentWishes.length > 0 && (
        <div className="fixed top-24 right-4 z-20 w-64 max-h-96 overflow-y-auto">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl">
            <h3 className="text-white/90 font-semibold mb-3 text-sm">최근 소원 ✨</h3>
            <div className="space-y-2">
              {recentWishes.map((wish) => (
                <div
                  key={wish.id}
                  className="bg-white/5 rounded-lg p-2 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <p className="text-white/80 text-xs line-clamp-2">{wish.content}</p>
                  {wish.author && wish.author !== '익명' && (
                    <p className="text-white/50 text-[10px] mt-1">- {wish.author}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 소원 작성 폼 - 하단 고정 */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/10 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* 이름 입력 */}
              <div className="flex-shrink-0 md:w-32">
                <input
                  type="text"
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="이름 (선택)"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all text-sm"
                  maxLength={50}
                />
              </div>

              {/* 소원 입력 */}
              <div className="flex-1">
                <textarea
                  id="wish"
                  value={newWish}
                  onChange={(e) => setNewWish(e.target.value)}
                  placeholder="2025년에 이루고 싶은 소원을 적어주세요..."
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent resize-none transition-all text-sm"
                  rows={2}
                  maxLength={200}
                  required
                />
                <div className="text-right text-white/50 text-xs mt-1">
                  {newWish.length}/200
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="flex-shrink-0 md:w-32">
                <button
                  type="submit"
                  disabled={isSubmitting || !newWish.trim()}
                  className="w-full h-full py-2 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold text-sm hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-pink-500/50"
                >
                  {isSubmitting ? '전송 중...' : '✨ 날리기'}
                </button>
              </div>
            </div>

            {/* 통계 */}
            <div className="mt-3 text-center">
              <p className="text-xs text-white/60">
                지금까지{' '}
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                  {wishes.length}
                </span>
                개의 소원이 하늘로 올라갔습니다
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
