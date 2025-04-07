import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  BanknotesIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  PlusIcon,
  HashtagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
  groupId?: number;
  groupName?: string;
  members?: { address: string; name?: string }[];
  onAddExpense?: () => void;
}

export default function Layout({ 
  children, 
  groupId, 
  groupName = 'Group',
  members = [], 
  onAddExpense 
}: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const isDetailsPage = groupId && pathname === `/groups/${groupId}`;
  const isBalancesPage = groupId && pathname === `/groups/${groupId}/balances`;
  const isSettlePage = groupId && pathname === `/groups/${groupId}/settle`;
  
  const handleBack = () => {
    if (groupId) {
      router.push('/');
    } else {
      router.back();
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Global Navbar */}
      <Navbar />
      
      {/* Group Header */}
      <header className="bg-card/95 border-b sticky top-[57px] z-10 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack}
              className="p-2 rounded-full bg-secondary/50 hover:bg-secondary/80 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-bold tracking-tight truncate flex items-center">
              {groupId ? (
                <Link 
                  href={`/groups/${groupId}`}
                  className="hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                  <span className="flex-shrink-0 h-7 w-7 bg-primary/10 text-primary flex items-center justify-center rounded-full">
                    <HashtagIcon className="h-4 w-4" />
                  </span>
                  <span className="animate-slide-in">{groupName}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-primary" />
                  <span>Groups</span>
                </span>
              )}
            </h1>
          </div>
          
          {groupId && onAddExpense && (
            <button
              onClick={onAddExpense}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2 px-3.5 text-sm font-medium transition-all shadow-sm active:scale-95"
              aria-label="Add expense"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Expense</span>
            </button>
          )}
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Sidebar for group navigation */}
        {groupId && (
          <aside className="w-16 md:w-60 border-r bg-card/95 hidden sm:block">
            <nav className="p-3 sticky top-[129px]">
              <div className="px-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <BanknotesIcon className="h-4 w-4" />
                </div>
              </div>
              <ul className="space-y-0.5 mt-4">
                <li>
                  <Link
                    href={`/groups/${groupId}`}
                    className={`channel-item ${isDetailsPage ? 'active' : ''}`}
                  >
                    <HomeIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="hidden md:inline truncate">Overview</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/groups/${groupId}/balances`}
                    className={`channel-item ${isBalancesPage ? 'active' : ''}`}
                  >
                    <BanknotesIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="hidden md:inline truncate">Balances</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/groups/${groupId}/settle`}
                    className={`channel-item ${isSettlePage ? 'active' : ''}`}
                  >
                    <CreditCardIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="hidden md:inline truncate">Settle</span>
                  </Link>
                </li>
              </ul>
              
              {members.length > 0 && (
                <div className="mt-8 border-t pt-4">
                  <div className="sidebar-section">
                    <h2 className="hidden md:block">Members — {members.length}</h2>
                  </div>
                  <div className="mt-2">
                    <ul className="space-y-1 max-h-80 overflow-y-auto pr-2">
                      {members.map((member, index) => (
                        <li 
                          key={member.address}
                          className="user-item group"
                          title={member.address}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium overflow-hidden border border-border/50">
                              {index + 1}
                            </div>
                            <span className="status-dot online absolute bottom-0 right-0 ring-2 ring-card"></span>
                          </div>
                          <div className="hidden md:flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium truncate">
                                {member.name || `Member ${index + 1}`}
                              </span>
                              <button
                                onClick={() => navigator.clipboard.writeText(member.address)}
                                className="opacity-0 group-hover:opacity-100 text-xs px-1.5 py-0.5 rounded bg-secondary/40 hover:bg-secondary/70 transition-colors"
                                title="Copy address"
                              >
                                Copy
                              </button>
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {member.address}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </nav>
          </aside>
        )}
        
        {/* Mobile navigation for groups */}
        {groupId && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t sm:hidden z-10 shadow-lg">
            <nav className="flex justify-around items-center h-16">
              <Link
                href={`/groups/${groupId}`}
                className={`flex flex-col items-center justify-center h-full w-full transition-colors ${
                  isDetailsPage ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <HomeIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Overview</span>
              </Link>
              <Link
                href={`/groups/${groupId}/balances`}
                className={`flex flex-col items-center justify-center h-full w-full transition-colors ${
                  isBalancesPage ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <BanknotesIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Balances</span>
              </Link>
              <Link
                href={`/groups/${groupId}/settle`}
                className={`flex flex-col items-center justify-center h-full w-full transition-colors ${
                  isSettlePage ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <CreditCardIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Settle</span>
              </Link>
            </nav>
          </div>
        )}
        
        {/* Main content */}
        <main className="flex-1 pb-20 sm:pb-6 animate-slide-in">
          <div className="container mx-auto p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 