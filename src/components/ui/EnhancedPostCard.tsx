import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cva';
import InlineComments from './InlineComments';

import { Post } from '../../types';

interface EnhancedPostCardProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  isDark?: boolean;
  isMobile?: boolean;
  post?: Post;
}

/**
 * Enhanced Post Card with X-style micro-interactions
 * Features:
 * - Spring animation on hover
 * - Scale transform on tap (0.98)
 * - Shadow elevation changes
 * - Ripple effect on press
 * - Smooth transitions
 */
export const EnhancedPostCard: React.FC<EnhancedPostCardProps> = ({
  children,
  onClick,
  isDark = false,
  isMobile = false,
  post,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleIdRef = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile) {
      setIsPressed(true);

      // Create ripple effect
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;

      setRipples(prev => [...prev, { id, x, y }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 1,
      }}
      whileHover={!isMobile ? { y: -2, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)' } : undefined}
      whileTap={isMobile ? { scale: 0.98 } : undefined}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer transition-all duration-200',
        'overflow-hidden ',
        isDark ? 'hover:bg-gray-950/50' : 'hover:bg-gray-50/50',
        isPressed && !isMobile ? 'scale-[0.98]' : 'scale-100'
      )}
      style={{
        boxShadow: isPressed && !isMobile ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
      }}
    >
      {/* Ripple Effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn(
              'absolute pointer-events-none rounded-full',
              isDark ? 'bg-white/20' : 'bg-black/10'
            )}
            style={{
              width: 40,
              height: 40,
              left: ripple.x - 20,
              top: ripple.y - 20,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Content */}
      {children}

      {/* Inline Comments - shows replies to this specific post (even if it's a retweet) */}
      {post && post.replies_count > 0 && (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineComments postId={post.id} totalReplies={post.replies_count} />
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedPostCard;
