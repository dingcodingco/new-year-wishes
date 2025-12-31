'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wish } from '@/lib/supabase';

interface LanternProps {
  wish: Wish;
  onBurn: (wishId: string) => void;
}

export default function Lantern({ wish, onBurn }: LanternProps) {
  const [isBurning, setIsBurning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // 이미 태워진 소원은 표시하지 않음
  useEffect(() => {
    if (wish.burned_at) {
      setIsVisible(false);
    }
  }, [wish.burned_at]);

  // 랜덤한 애니메이션 지속 시간 (10-20초)
  const duration = 10 + Math.random() * 10;

  // 시작 위치 (화면 하단)
  const startX = wish.position_x * 100;
  const startY = 100;

  // 끝 위치 (화면 상단을 넘어서)
  const endX = startX + (Math.random() - 0.5) * 30; // 좌우로 약간 움직임
  const endY = -20;

  // 풍등을 클릭하면 태워짐
  const handleClick = () => {
    if (!wish.burned_at && !isBurning) {
      setIsBurning(true);
      setTimeout(() => {
        onBurn(wish.id);
        setIsVisible(false);
      }, 1500); // 타는 애니메이션이 끝난 후 제거
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: `${startX}vw`, y: `${startY}vh`, opacity: 0, scale: 0 }}
        animate={{
          x: `${endX}vw`,
          y: `${endY}vh`,
          opacity: isBurning ? 0 : [0, 1, 1, 1],
          scale: isBurning ? 1.5 : [0, 1, 1, 1],
        }}
        transition={{
          duration: isBurning ? 1.5 : duration,
          ease: 'linear',
          opacity: {
            times: isBurning ? [0, 1] : [0, 0.1, 0.9, 1],
            duration: isBurning ? 1.5 : duration,
          },
        }}
        className="absolute cursor-pointer"
        onClick={handleClick}
        style={{
          filter: isBurning ? 'brightness(2)' : 'none',
        }}
      >
        {/* 풍등 */}
        <div className="relative flex flex-col items-center">
          {/* 불꽃 효과 (타는 중일 때) */}
          {isBurning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, times: [0, 0.5, 1] }}
              className="absolute inset-0 bg-orange-500 rounded-full blur-2xl"
              style={{ transform: 'scale(2)' }}
            />
          )}

          {/* 풍등 본체 */}
          <div
            className={`relative w-20 h-28 rounded-full bg-gradient-to-b ${
              isBurning
                ? 'from-orange-400 to-red-600'
                : 'from-amber-200 via-orange-300 to-red-400'
            } shadow-xl transition-all duration-500`}
          >
            {/* 풍등 빛 효과 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-100/60 to-transparent"></div>
            <div className="absolute inset-0 rounded-full shadow-inner"></div>

            {/* 소원 내용 */}
            <div className="absolute inset-2 flex items-center justify-center p-1.5">
              <p className="text-[10px] leading-tight text-center text-gray-900 font-medium line-clamp-4 break-all">
                {wish.content}
              </p>
            </div>

            {/* 풍등 하단 */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-14 h-2.5 bg-gradient-to-b from-orange-400 to-orange-500 rounded-b-full shadow-md"></div>

            {/* 불꽃 */}
            {!isBurning && (
              <motion.div
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 w-3 h-5 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full blur-sm"
              ></motion.div>
            )}
          </div>

          {/* 작성자 이름 - 항상 보이도록 */}
          {wish.author && wish.author !== '익명' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mt-2 bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap border border-white/20 shadow-lg"
            >
              {wish.author}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
