"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useAbstraxionAccount,
  useAbstraxionClient,
  useModal,
  Abstraxion
} from "@burnt-labs/abstraxion";
import Layout from "@/components/ui/Layout";
import WelcomeBanner from "@/components/ui/WelcomeBanner";
import { getUserGroups } from "@/lib/contract";
import GroupCard from "@/components/groups/GroupCard";
import { Group } from "@/lib/types";
import { 
  PlusCircleIcon, 
  ArrowRightIcon, 
  UserGroupIcon, 
  BanknotesIcon,
  CalendarIcon,
  UserIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const router = useRouter();
  const { data: account } = useAbstraxionAccount();
  const { client: queryClient } = useAbstraxionClient();
  const [, setShowModal] = useModal();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch user's groups
  const fetchGroups = useCallback(async () => {
    if (!queryClient || !account?.bech32Address) return;
    
    setLoading(true);
    try {
      const result = await getUserGroups(queryClient, account.bech32Address);
      if (result) {
        setUserGroups(result.groups);
      }
    } catch (error) {
      console.error("Error fetching user groups:", error);
    } finally {
      setLoading(false);
    }
  }, [queryClient, account?.bech32Address]);
  
  // Refresh groups data
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };
  
  useEffect(() => {
    fetchGroups();
  }, [queryClient, account?.bech32Address, fetchGroups]);
  
  return (
    <Layout>
      {!account?.bech32Address ? (
        // Hero section for not logged in users
        <div className="bg-gradient-to-br from-primary/5 to-emerald-500/5 px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                Split Expenses on XION
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                The easiest way to split bills with friends, track expenses, and settle debts using XION tokens
              </p>
              
              <button 
                onClick={() => setShowModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-3 text-lg font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                Connect Wallet to Get Started
              </button>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-card rounded-xl p-6 border shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Groups</h3>
                <p className="text-muted-foreground">Easily create expense groups for trips, roommates, events, or any shared expenses</p>
              </div>
              
              <div className="bg-card rounded-xl p-6 border shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BanknotesIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Track Expenses</h3>
                <p className="text-muted-foreground">Record expenses and see who owes what in real-time with automatic calculations</p>
              </div>
              
              <div className="bg-card rounded-xl p-6 border shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <BanknotesIcon className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Settle Debts</h3>
                <p className="text-muted-foreground">Pay each other directly with XION tokens - fast, secure, and with low fees</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Dashboard for logged in users
        <div className="p-6 max-w-5xl mx-auto">
          <WelcomeBanner 
            username={account.bech32Address}
            onCreateGroup={() => router.push('/create')}
            onJoinGroup={() => router.push('/join')}
          />
        
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your Groups</h2>
              <p className="text-muted-foreground">Manage your expense groups and track shared expenses</p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-accent/10 transition-colors"
              aria-label="Refresh groups"
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {/* User's Groups */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full">
                {userGroups.length} {userGroups.length === 1 ? 'group' : 'groups'}
              </span>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => router.push('/create')}
                  className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-1.5 px-3 transition-all shadow-sm active:scale-95"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  Create Group
                </button>
                
                <button 
                  onClick={() => router.push('/join')}
                  className="flex items-center gap-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md py-1.5 px-3 transition-all shadow-sm active:scale-95"
                >
                  <UserGroupIcon className="h-4 w-4" />
                  Join Group
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
                  <p className="mt-3 text-muted-foreground">Loading your groups...</p>
                </div>
              </div>
            ) : userGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userGroups.map(group => (
                  <GroupCard
                    key={group.id}
                    id={group.id}
                    name={group.name}
                    members={group.members}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card border rounded-xl p-8 text-center animate-pulse-subtle">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-float">
                  <UserGroupIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You haven&apos;t created or joined any groups yet. Create a new group or join an existing one to get started.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button 
                    onClick={() => router.push('/create')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2 px-6 font-medium transition-all shadow-sm active:scale-95"
                  >
                    Create a Group
                  </button>
                  <button 
                    onClick={() => router.push('/join')}
                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md py-2 px-6 font-medium transition-colors"
                  >
                    Join a Group
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <Abstraxion onClose={() => setShowModal(false)} />
    </Layout>
  );
}
