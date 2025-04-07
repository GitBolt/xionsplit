import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  PlusCircleIcon, 
  ReceiptPercentIcon, 
  UsersIcon, 
  BanknotesIcon, 
  ChartPieIcon 
} from '@heroicons/react/24/outline';
import { formatAddress } from '@/lib/contract';

type ChannelSidebarProps = {
  groupId?: number;
  groupName?: string;
  members?: string[];
  currentUser?: string;
  onAddExpense?: () => void;
};

export default function ChannelSidebar({ 
  groupId, 
  groupName = 'Home',
  members = [],
  currentUser,
  onAddExpense
}: ChannelSidebarProps) {
  const pathname = usePathname();
  
  // Display home channels if no group is selected
  if (!groupId) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-zinc-700">
          <h2 className="font-bold text-xl">{groupName}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-4">
            <h3 className="sidebar-section uppercase tracking-wider">Dashboard</h3>
            <div className="space-y-0.5 mt-1">
              <Link href="/" className={`channel-item ${pathname === '/' ? 'active' : ''}`}>
                <HomeIcon className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link href="/create" className={`channel-item ${pathname === '/create' ? 'active' : ''}`}>
                <PlusCircleIcon className="h-4 w-4" />
                <span>Create Group</span>
              </Link>
              <Link href="/join" className={`channel-item ${pathname === '/join' ? 'active' : ''}`}>
                <UsersIcon className="h-4 w-4" />
                <span>Join Group</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-zinc-700">
        <h2 className="font-bold text-xl">{groupName}</h2>
        <p className="text-xs text-muted-foreground">ID: {groupId}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <h3 className="sidebar-section uppercase tracking-wider">Expenses</h3>
          <div className="space-y-0.5 mt-1">
            <Link href={`/groups/${groupId}`} className={`channel-item ${pathname === `/groups/${groupId}` ? 'active' : ''}`}>
              <ReceiptPercentIcon className="h-4 w-4" />
              <span>All Expenses</span>
            </Link>
            <div className="channel-item cursor-pointer" onClick={onAddExpense}>
              <PlusCircleIcon className="h-4 w-4 text-primary" />
              <span className="text-primary">Add Expense</span>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="sidebar-section uppercase tracking-wider">Finances</h3>
          <div className="space-y-0.5 mt-1">
            <Link href={`/groups/${groupId}/balances`} className={`channel-item ${pathname === `/groups/${groupId}/balances` ? 'active' : ''}`}>
              <ChartPieIcon className="h-4 w-4" />
              <span>Balances</span>
            </Link>
            <Link href={`/groups/${groupId}/settle`} className={`channel-item ${pathname === `/groups/${groupId}/settle` ? 'active' : ''}`}>
              <BanknotesIcon className="h-4 w-4" />
              <span>Settle Up</span>
            </Link>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="sidebar-section uppercase tracking-wider">Members</h3>
          <div className="space-y-0.5 mt-1">
            {members.map((member, index) => (
              <div key={index} className="user-item">
                <div className={`h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs ${member === currentUser ? 'bg-primary text-primary-foreground' : ''}`}>
                  {member.charAt(4).toUpperCase()}
                </div>
                <span className="text-sm truncate">
                  {formatAddress(member)} 
                  {member === currentUser && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 