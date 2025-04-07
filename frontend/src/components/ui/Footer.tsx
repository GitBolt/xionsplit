import React from 'react';
import { motion } from 'framer-motion';
import { slideUp } from '@/lib/animations';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <motion.footer 
      className="mt-12 mb-8 pt-8 border-t border-zinc-200 dark:border-zinc-800"
      initial="hidden"
      animate="visible"
      variants={slideUp}
      transition={{ delay: 0.6 }}
    >
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-4">
        <motion.div 
          className="flex items-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <motion.div 
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md flex items-center justify-center mr-3 overflow-hidden"
            whileHover={{ rotate: 5 }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
            </svg>
          </motion.div>
          <div>
            <div className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              Public Thoughts Ledger
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              &copy; {currentYear} XION Network
            </p>
          </div>
        </motion.div>
        
        <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <motion.a 
            href="#" 
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center"
            whileHover={{ scale: 1.05, y: -1 }}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Docs
          </motion.a>
          <motion.a 
            href="#" 
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center"
            whileHover={{ scale: 1.05, y: -1 }}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            FAQ
          </motion.a>
          <motion.a 
            href="#" 
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center"
            whileHover={{ scale: 1.05, y: -1 }}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            Contact
          </motion.a>
          <motion.a 
            href="https://github.com/burnt-labs/xion" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center"
            whileHover={{ scale: 1.05, y: -1 }}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </motion.a>
        </div>
      </div>
      
      <motion.div 
        className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 text-center text-xs text-zinc-400 dark:text-zinc-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Powered by{' '}
        <a 
          href="https://www.burnt.com/xion" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
        >
          XION Network
        </a>{' '}
        - The next-generation web3 platform for developers
        
        <div className="mt-2 flex justify-center gap-x-4">
          <motion.div
            className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-3 h-3 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Carbon Neutral
          </motion.div>
          <motion.div
            className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-3 h-3 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            Secure & Private
          </motion.div>
          <motion.div
            className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-3 h-3 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Community-Driven
          </motion.div>
        </div>
      </motion.div>
    </motion.footer>
  );
};

export default Footer; 