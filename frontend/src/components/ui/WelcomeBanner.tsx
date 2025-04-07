import { useState } from 'react';
import Link from 'next/link';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { formatAddress } from '@/lib/utils';

interface WelcomeBannerProps {
  username?: string;
  onCreateGroup?: () => void;
  onJoinGroup?: () => void;
}

export default function WelcomeBanner({ username, onCreateGroup, onJoinGroup }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  return (
    <div className="discord-card mb-8 overflow-hidden animate-slide-in">
      <div className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/90 via-indigo-500/90 to-violet-500/90"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/mesh-gradient.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        
        {/* Content */}
        <div className="relative z-10 p-6 md:p-8 text-white">
          <button 
            onClick={() => setDismissed(true)} 
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <SparklesIcon className="h-8 w-8" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                Welcome {username ? `back, ${formatAddress(username)}` : 'to XionSplitter'}!
              </h2>
              <p className="text-white/80 max-w-2xl mb-4">
                Track shared expenses, split bills with friends, and settle debts easily. 
                Create a new group to get started or join an existing one.
              </p>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <button 
                  onClick={onCreateGroup}
                  className="flex items-center gap-2 bg-white text-primary font-medium rounded-md py-2.5 px-4 shadow-lg hover:bg-white/90 transition-all active:scale-95"
                >
                  <PlusIcon className="h-5 w-5" />
                  Create Group
                </button>
                
                <button 
                  onClick={onJoinGroup}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-md py-2.5 px-4 shadow-md hover:bg-white/30 transition-all active:scale-95"
                >
                  <UserGroupIcon className="h-5 w-5" />
                  Join Group
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/20 text-sm text-white/70 flex flex-wrap justify-between items-center gap-4">
            <div>
              Powered by <a href="https://burnt.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Burnt Finance</a> on the XION blockchain
            </div>
      
          </div>
        </div>
      </div>
    </div>
  );
} 