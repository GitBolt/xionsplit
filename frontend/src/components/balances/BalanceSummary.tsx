import React from 'react';
import { BalanceSummary as BalanceSummaryType } from '@/lib/types';
import { formatCurrency, formatAddress } from '@/lib/contract';
import { ArrowUpIcon, ArrowDownIcon, BanknotesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';

type BalanceSummaryProps = {
  summary: BalanceSummaryType;
  currentUser?: string;
  onSettleDebt: (toAddress: string, amount: string) => void;
  onSettleAll: (totalAmount: string) => void;
  isSettling: boolean;
  isSettlingAll?: boolean;
};

export default function BalanceSummary({
  summary,
  currentUser,
  onSettleDebt,
  onSettleAll,
  isSettling,
  isSettlingAll = false
}: BalanceSummaryProps) {
  // Sort balances: first show what user owes, then what others owe to user
  const sortedBalances = summary.balances && summary.balances.length > 0 
    ? [...summary.balances].sort((a, b) => a.direction - b.direction)
    : [];
  
  // Check if we have any balances to display
  const hasBalances = sortedBalances && sortedBalances.length > 0;
  
  // Total owed to others
  const totalOwed = summary.total_owed;
  const totalOwedNum = parseInt(totalOwed);
  
  // Total owed by others
  const totalOwedTo = summary.total_owed_to;
  const totalOwedToNum = parseInt(totalOwedTo);
  
  // Net balance (positive means others owe you more than you owe)
  const netBalance = summary.net_balance;
  const netBalanceNum = parseInt(netBalance);
  
  return (
    <div className="discord-card">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-primary/90 to-indigo-500/90 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/mesh-gradient.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1 flex items-center">
            <SparklesIcon className="h-5 w-5 mr-2" />
            Balance Summary
          </h2>
          <p className="text-sm opacity-90">Track your group expenses</p>
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 p-6 gap-4">
        <div className="flex flex-col bg-secondary/30 rounded-xl p-4 transition-all border border-border/20 animate-pop">
          <p className="text-xs font-medium text-muted-foreground mb-1">You Owe</p>
          <p className={`text-xl font-bold flex items-center ${totalOwedNum > 0 ? 'text-destructive' : ''}`}>
            {totalOwedNum > 0 && <ArrowUpIcon className="h-4 w-4 mr-1 flex-shrink-0" />}
            {formatCurrency(totalOwed)}
          </p>
        </div>
        
        <div className="flex flex-col bg-secondary/30 rounded-xl p-4 transition-all border border-border/20 animate-pop" style={{ animationDelay: '50ms' }}>
          <p className="text-xs font-medium text-muted-foreground mb-1">Others Owe</p>
          <p className={`text-xl font-bold flex items-center ${totalOwedToNum > 0 ? 'text-emerald-500' : ''}`}>
            {totalOwedToNum > 0 && <ArrowDownIcon className="h-4 w-4 mr-1 flex-shrink-0" />}
            {formatCurrency(totalOwedTo)}
          </p>
        </div>
        
        <div className="flex flex-col bg-secondary/30 rounded-xl p-4 transition-all border border-border/20 animate-pop" style={{ animationDelay: '100ms' }}>
          <p className="text-xs font-medium text-muted-foreground mb-1">Net Balance</p>
          <p className={`text-xl font-bold flex items-center ${
            netBalanceNum > 0 ? 'text-emerald-500' : 
            netBalanceNum < 0 ? 'text-destructive' : ''
          }`}>
            {netBalanceNum > 0 && <ArrowDownIcon className="h-4 w-4 mr-1 flex-shrink-0" />}
            {netBalanceNum < 0 && <ArrowUpIcon className="h-4 w-4 mr-1 flex-shrink-0" />}
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>
      
      {/* Settle All button if you owe money */}
      {totalOwedNum > 0 && (
        <div className="px-6 pb-6">
          <button 
            className="w-full bg-gradient-to-r from-primary/90 to-indigo-500/90 text-white font-medium py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center btn-coming-soon"
            disabled={true}
          >
            <BanknotesIcon className="h-5 w-5 mr-2" />
            Settle All Debts ({formatCurrency(totalOwed)})
          </button>
        </div>
      )}
      
      {/* Divider */}
      {(hasBalances || totalOwedNum > 0) && (
        <div className="mx-6 border-t border-border/30 my-2"></div>
      )}
      
      {/* Detailed Balances Section */}
      <div className="p-6 pt-4">
        <h3 className="text-md font-semibold mb-4 text-foreground/90 flex items-center">
          <CheckCircleIcon className="h-4 w-4 mr-1.5 text-primary" />
          Detailed Balances
        </h3>
        
        {!hasBalances ? (
          <div className="bg-secondary/30 rounded-xl p-6 text-center border border-border/20 animate-pulse-subtle">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 animate-float">
              <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="font-medium mb-1">All settled up!</p>
            <p className="text-sm text-muted-foreground">No outstanding balances in this group</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* What you owe to others */}
            {sortedBalances.filter(b => b.direction === 0).map((balance, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-rose-50/30 dark:bg-rose-950/20 rounded-xl transition-all border border-rose-200/30 dark:border-rose-800/30 animate-slide-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/50 border border-rose-200 dark:border-rose-800 text-rose-500 flex items-center justify-center shadow-sm">
                    <ArrowUpIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-rose-700 dark:text-rose-300">You owe {formatAddress(balance.other_user)}</p>
                    <p className="text-lg font-bold text-destructive">{formatCurrency(balance.amount)}</p>
                  </div>
                </div>
                <button 
                  className="h-10 px-5 rounded-lg flex items-center justify-center transition-all bg-rose-500 text-white font-medium shadow-sm btn-coming-soon"
                  disabled={true}
                >
                  Settle
                </button>
              </div>
            ))}
            
            {/* What others owe to you */}
            {sortedBalances.filter(b => b.direction === 1).map((balance, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl transition-all border border-emerald-200/30 dark:border-emerald-800/30 animate-slide-in" style={{ animationDelay: `${(index + sortedBalances.filter(b => b.direction === 0).length) * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/50 border border-emerald-200 dark:border-emerald-800 text-emerald-500 flex items-center justify-center shadow-sm">
                    <ArrowDownIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{formatAddress(balance.other_user)} owes you</p>
                    <p className="text-lg font-bold text-emerald-500">{formatCurrency(balance.amount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 