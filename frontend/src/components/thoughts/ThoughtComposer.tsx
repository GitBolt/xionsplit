import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Button from '../ui/Button';
import { MAX_CHARS } from '@/lib/contract';
import { slideUp, pulseAnimation } from '@/lib/animations';

interface ThoughtComposerProps {
  isConnected: boolean;
  isPosting: boolean;
  error: string | null;
  onPostThought: (text: string) => void;
}

const ThoughtComposer: React.FC<ThoughtComposerProps> = ({
  isConnected,
  isPosting,
  error,
  onPostThought
}) => {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const progressControls = useAnimation();
  const containerControls = useAnimation();
  const textareaContainerControls = useAnimation();
  
  // Calculate remaining characters
  const remainingChars = MAX_CHARS - text.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 20 && remainingChars > 0;
  const charactersPercent = Math.min((text.length / MAX_CHARS) * 100, 100);
  
  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS + 20) { // Allow typing a bit over to show error state
      setText(value);
    }
  };
  
  // Handle enter key (post on Ctrl+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handlePostClick();
    }
  };
  
  // Handle focus state
  const handleFocus = () => {
    setIsFocused(true);
    textareaContainerControls.start({
      boxShadow: "0 0 0 1px rgba(16, 185, 129, 0.1), 0 2px 8px rgba(16, 185, 129, 0.05)",
      backgroundColor: "rgba(16, 185, 129, 0.02)",
      transition: { duration: 0.3 }
    });
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    textareaContainerControls.start({
      boxShadow: "none",
      backgroundColor: "transparent",
      transition: { duration: 0.3 }
    });
  };
  
  // Handle post button click
  const handlePostClick = () => {
    if (text.trim() && isConnected && !isPosting && !isOverLimit) {
      // Create subtle flash animation
      containerControls.start({
        backgroundColor: ["rgba(16, 185, 129, 0.05)", "rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.05)"],
        transition: { duration: 0.5 }
      });
      
      onPostThought(text);
      setText("");
      
      // Return focus to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  };
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);
  
  // Animate character count
  useEffect(() => {
    const progress = Math.min(text.length / MAX_CHARS, 1);
    
    progressControls.start({
      width: `${progress * 100}%`,
      backgroundColor: progress > 0.9 
        ? "#ef4444" 
        : progress > 0.75 
          ? "#f59e0b" 
          : "#10b981",
      transition: { duration: 0.3 }
    });
    
    // Add container animation based on text content
    if (isFocused && text.length > 0) {
      containerControls.start({
        borderColor: progress > 0.9 
          ? ["rgba(239, 68, 68, 0.3)", "rgba(239, 68, 68, 0.5)", "rgba(239, 68, 68, 0.3)"] 
          : progress > 0.75 
            ? ["rgba(245, 158, 11, 0.3)", "rgba(245, 158, 11, 0.5)", "rgba(245, 158, 11, 0.3)"]
            : ["rgba(16, 185, 129, 0.3)", "rgba(16, 185, 129, 0.5)", "rgba(16, 185, 129, 0.3)"],
        transition: { duration: 1.5, repeat: Infinity }
      });
    } else {
      containerControls.start({
        borderColor: "rgba(228, 228, 231, 0.5)",
        transition: { duration: 0.3 }
      });
    }
  }, [text.length, progressControls, containerControls, isFocused]);

  return (
    <motion.div 
      className="mb-8"
      initial="hidden"
      animate="visible"
      variants={slideUp}
    >
      <motion.div 
        className="bg-white dark:bg-zinc-800/80 rounded-xl shadow-lg backdrop-blur-sm p-4 overflow-hidden"
        animate={containerControls}
        initial={{ borderColor: "rgba(228, 228, 231, 0.5)" }}
        style={{ borderWidth: '1px', borderStyle: 'solid' }}
        whileHover={{ 
          boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
          y: -2
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Decorative Elements */}
        <div className="flex items-center space-x-1.5 mb-6">
          <motion.div 
            className="w-3 h-3 rounded-full bg-rose-500 dark:bg-rose-600"
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
          <motion.div 
            className="w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-600"
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
          <motion.div 
            className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-600"
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
          <div className="ml-2 text-xs text-zinc-400 dark:text-zinc-500 font-mono">Compose your thought</div>
        </div>
        
        {/* Textarea with floating label */}
        <div className="relative mt-8">
          <motion.div 
            className={`absolute pointer-events-none transition-all duration-200 ${
              text.length > 0 || isFocused
                ? '-top-6 left-0 text-xs text-emerald-600 dark:text-emerald-400 font-medium'
                : 'top-0 left-0 text-zinc-400 dark:text-zinc-500'
            }`}
            animate={{
              y: text.length > 0 || isFocused ? 0 : 2,
            }}
          >
            {isConnected 
              ? "What's on your mind? Keep it short & sweet (100 chars max)" 
              : "Connect your account to share thoughts..."}
          </motion.div>
          
          <motion.div
            className="rounded-lg overflow-hidden"
            animate={textareaContainerControls}
            initial={{ boxShadow: "none", backgroundColor: "transparent" }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder=""
              disabled={!isConnected || isPosting}
              className="w-full resize-none bg-transparent border-none p-3 focus:ring-0 focus:outline-none text-zinc-700 dark:text-zinc-300 min-h-[100px] outline-none selection:bg-emerald-100 dark:selection:bg-emerald-900/20 selection:text-emerald-800 dark:selection:text-emerald-300 rounded-lg transition-all duration-200"
              rows={3}
              style={{
                caretColor: "#10b981",
                boxShadow: "none"
              }}
            />
          </motion.div>
        </div>
        
        {/* Character Count & Progress Bar */}
        <div className="mt-3 mb-2">
          <div className="relative h-1.5 w-full bg-zinc-100 dark:bg-zinc-700/50 rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 h-full rounded-full"
              animate={progressControls}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <motion.div 
              className={`text-xs font-medium ${
                isOverLimit 
                  ? 'text-red-500' 
                  : isNearLimit 
                    ? 'text-amber-500' 
                    : 'text-emerald-600 dark:text-emerald-400'
              }`}
              animate={{
                scale: isOverLimit ? [1, 1.1, 1] : 1,
                transition: { repeat: isOverLimit ? Infinity : 0, duration: 0.5 }
              }}
            >
              {isOverLimit ? `${Math.abs(remainingChars)} over limit` : `${remainingChars} characters left`}
            </motion.div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500">
              {charactersPercent.toFixed(0)}%
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-700/50">
          {/* Date Display */}
          <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            {new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          
          <motion.div
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={handlePostClick}
              disabled={!isConnected || isPosting || text.trim().length === 0 || isOverLimit}
              isLoading={isPosting}
              variant="primary"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
                </svg>
              }
            >
              Post Thought
            </Button>
          </motion.div>
        </div>
        
        {error && (
          <motion.div 
            className="mt-3 text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-md"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {error}
            </div>
          </motion.div>
        )}
        
        {/* Keyboard shortcut hint */}
        <motion.div 
          className="mt-2 text-xs text-right text-zinc-400 dark:text-zinc-500 flex items-center justify-end"
          whileHover={{ 
            color: "#10b981",
            transition: { duration: 0.2 }
          }}
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          Press Ctrl+Enter to post
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ThoughtComposer; 