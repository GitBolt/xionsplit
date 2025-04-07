import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thought } from '@/lib/types';
import ThoughtItem from './ThoughtItem';
import Button from '../ui/Button';
import { createStaggerContainer } from '@/lib/animations';

interface ThoughtFeedProps {
  thoughts: Thought[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
  userAddress?: string;
  viewMode: 'all' | 'mine' | 'top';
}

const ThoughtFeed: React.FC<ThoughtFeedProps> = ({
  thoughts,
  loading,
  hasMore,
  onLoadMore,
  loadingMore,
  userAddress,
  viewMode
}) => {
  const feedRef = useRef<HTMLDivElement>(null);
  const staggerContainerVariants = createStaggerContainer();

  // Handle scroll to top
  const scrollToTop = () => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    }
  };

  // Get feed title based on view mode
  const getFeedTitle = () => {
    switch (viewMode) {
      case 'mine':
        return 'My Thoughts';
      case 'top':
        return 'Top Thoughts';
      default:
        return 'Recent Thoughts';
    }
  };

  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Feed Header with Title & Controls */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-zinc-50/80 to-white/80 dark:from-zinc-900/80 dark:to-zinc-950/80 backdrop-blur-md px-4 py-3 rounded-lg mb-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
        <div className="flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {viewMode === 'top' ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                </svg>
              ) : viewMode === 'mine' ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              )}
            </motion.div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{getFeedTitle()}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {thoughts.length > 0 ? `${thoughts.length} thoughts available` : 'No thoughts yet'}
              </p>
            </div>
          </motion.div>
          
          <div className="flex gap-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={scrollToTop}
                variant="outline"
                size="sm"
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                  </svg>
                }
              >
                Top
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onLoadMore}
                disabled={loading || !hasMore}
                isLoading={loadingMore}
                variant="secondary"
                size="sm"
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                }
              >
                Refresh
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Date display - today's date for context */}
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center">
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          Today: {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Thoughts Feed Container */}
      <motion.div 
        ref={feedRef}
        className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {loading && thoughts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div 
              className="relative w-16 h-16"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500"></div>
              <motion.div 
                className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-30"
                animate={{ scale: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              ></motion.div>
            </motion.div>
            <motion.p 
              className="mt-6 text-zinc-500 dark:text-zinc-400 font-medium animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Loading immutable thoughts...
            </motion.p>
          </div>
        ) : thoughts.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {thoughts.map((thought, index) => (
              <ThoughtItem 
                key={`${thought.id}-${thought.timestamp}`}
                thought={thought}
                index={index}
                isUserThought={userAddress === thought.author}
              />
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20 backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
              </svg>
            </motion.div>
            <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-2">No thoughts found.</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {viewMode === 'mine' 
                ? "You haven't shared any thoughts yet." 
                : viewMode === 'top'
                  ? "No thoughts have been upvoted yet."
                  : "Be the first to share your thoughts with the universe!"}
            </p>
            <motion.p 
              className="mt-4 text-xs text-emerald-600 dark:text-emerald-400"
              animate={{
                y: [0, -3, 0],
                transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              {viewMode === 'mine' 
                ? "Share your first thought above! 🚀" 
                : viewMode === 'top'
                  ? "Upvote thoughts you like! 👍"
                  : "Make history by writing the first thought 🚀"}
            </motion.p>
          </motion.div>
        )}
        
        {hasMore && thoughts.length > 0 && (
          <motion.div 
            className="pt-2 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={onLoadMore}
              disabled={loadingMore}
              isLoading={loadingMore}
              variant="outline"
              size="sm"
            >
              {loadingMore ? "Loading..." : "Load More Thoughts"}
            </Button>
          </motion.div>
        )}
      </motion.div>
      
      {/* Small floating tag */}
      <motion.div
        className="fixed bottom-4 right-4 bg-emerald-600 text-white text-xs py-1 px-3 rounded-full shadow-lg flex items-center gap-1 z-20 opacity-70 hover:opacity-100"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 0.7 }}
        transition={{ delay: 1, type: "spring" }}
        whileHover={{ scale: 1.05 }}
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
        <span>XionSplitter</span>
      </motion.div>
    </motion.div>
  );
};

export default ThoughtFeed; 