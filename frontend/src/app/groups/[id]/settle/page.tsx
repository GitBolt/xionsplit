"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
  useModal,
  Abstraxion
} from "@burnt-labs/abstraxion";
import { 
  ArrowPathIcon, 
  BanknotesIcon, 
  CheckCircleIcon, 
  UserCircleIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import Layout from "@/components/ui/Layout";
import TransactionAlert from "@/components/ui/TransactionAlert";
import { getGroup, getDebts, settleDebt, getGroupExpenses, checkDebtExists, settleAllDebts } from "@/lib/contract";
import { Group, Debt } from "@/lib/types";
import { formatAddress } from "@/lib/contract";
import { useToast } from "@/lib/ToastContext";

export default function SettlePage() {
  const params = useParams();
  const groupId = parseInt(params.id as string);
  
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();
  
  const [, setShowModal] = useModal();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settlingDebt, setSettlingDebt] = useState<string | null>(null);
  const [settlingAllDebts, setSettlingAllDebts] = useState(false);
  
  // Transaction alert state
  const [txAlert, setTxAlert] = useState({
    show: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
    txHash: '',
  });
  
  const { showToast } = useToast();
  
  // Fetch group details and debts
  useEffect(() => {
    const fetchData = async () => {
      if (!queryClient) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch group details
        const groupDetails = await getGroup(queryClient, groupId);
        if (groupDetails) {
          setGroup(groupDetails);
        }
        
        // Fetch debts
        const debtsResult = await getDebts(queryClient, groupId);
        if (debtsResult) {
          // Handle different debt response formats
          let formattedDebts: Debt[] = [];
          
          if (Array.isArray(debtsResult.debts) && debtsResult.debts.length > 0) {
            // Standard format with from/to fields
            if ('from' in debtsResult.debts[0] && 'to' in debtsResult.debts[0]) {
              formattedDebts = debtsResult.debts;
            } 
            // Alternative format with debtor/creditor fields
            else if ('debtor' in debtsResult.debts[0] && 'creditor' in debtsResult.debts[0]) {
              formattedDebts = debtsResult.debts.map((debt: {debtor: string, creditor: string, amount: string}) => ({
                from: debt.debtor,
                to: debt.creditor,
                amount: debt.amount
              }));
            }
          } else if (Array.isArray(debtsResult) && debtsResult.length > 0) {
            // Direct array format with debtor/creditor fields
            if ('debtor' in debtsResult[0] && 'creditor' in debtsResult[0]) {
              formattedDebts = debtsResult.map((debt: {debtor: string, creditor: string, amount: string}) => ({
                from: debt.debtor,
                to: debt.creditor,
                amount: debt.amount
              }));
            }
          }
          
          setDebts(formattedDebts);
        } else {
          // If no debts returned, try to get expenses and calculate debts manually
          if (account?.bech32Address) {
            const expensesResult = await getGroupExpenses(queryClient, groupId);
            if (expensesResult && expensesResult.expenses && expensesResult.expenses.length > 0) {
              // Simple algorithm to calculate debts from expenses
              const calculatedDebts: Debt[] = [];
              
              for (const expense of expensesResult.expenses) {
                const paidBy = expense.paid_by;
                const splitBetween = expense.split_between;
                const amount = expense.amount;
                
                if (splitBetween.length === 0) continue;
                
                // Calculate amount per person
                const amountPerPerson = BigInt(amount) / BigInt(splitBetween.length);
                
                // For each person in split, if not the payer, they owe the payer
                for (const person of splitBetween) {
                  if (person !== paidBy) {
                    // This person owes the payer
                    calculatedDebts.push({
                      from: person,
                      to: paidBy,
                      amount: amountPerPerson.toString()
                    });
                  }
                }
              }
              
              // Consolidate debts (combine debts between same parties)
              const consolidatedDebts: { [key: string]: Debt } = {};
              
              for (const debt of calculatedDebts) {
                const key = `${debt.from}-${debt.to}`;
                if (consolidatedDebts[key]) {
                  // Add to existing debt
                  const currentAmount = BigInt(consolidatedDebts[key].amount);
                  const addAmount = BigInt(debt.amount);
                  consolidatedDebts[key].amount = (currentAmount + addAmount).toString();
                } else {
                  // New debt
                  consolidatedDebts[key] = { ...debt };
                }
              }
              
              // Convert back to array
              const finalDebts = Object.values(consolidatedDebts);
              
              if (finalDebts.length > 0) {
                setDebts(finalDebts);
              } else {
                setDebts([]);
              }
            } else {
              setDebts([]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    if (queryClient) {
      fetchData();
    }
  }, [queryClient, groupId, account?.bech32Address]);
  
  const handleSettleDebt = async (debt: Debt) => {
    if (!client || !account?.bech32Address) {
      setShowModal(true);
      return;
    }
    
    // Verify this is actually a debt you owe
    if (debt.from !== account.bech32Address) {
      setTxAlert({
        show: true,
        type: 'error',
        title: 'Cannot Settle This Debt',
        message: 'You can only settle debts where you are the debtor (the person who owes the money).',
        txHash: '',
      });
      
      // Add toast notification
      showToast({
        type: 'error',
        title: 'Cannot Settle This Debt',
        message: 'You can only settle debts where you are the debtor (the person who owes the money).',
        duration: 5000
      });
      
      return;
    }
    
    // Use a unique ID for the debt we're settling
    const debtId = `${debt.from}-${debt.to}-${debt.amount}`;
    setSettlingDebt(debtId);
    setError(null);
    
    // Generate a unique reference ID for this debt settlement flow
    const actionRef = `settle-debt-${Date.now()}`;
    
    // Show info toast that debt settlement is being processed
    showToast({
      type: 'info',
      title: 'Processing Debt Settlement',
      message: `Settling debt of ${parseInt(debt.amount)/1000000} XION to ${formatAddress(debt.to)}...`,
      autoClose: false,
      referenceId: actionRef
    });
    
    try {
      // Check if user has sufficient balance
      const balanceCheck = await queryClient?.getBalance(account.bech32Address, "uxion");
      if (balanceCheck && BigInt(balanceCheck.amount) < BigInt(debt.amount)) {
        throw new Error(`Insufficient funds: You need at least ${parseInt(debt.amount)/1000000} XION to settle this debt.`);
      }
      
      // Check if the debt actually exists in the contract
      if (queryClient) {
        const debtExists = await checkDebtExists(queryClient, groupId, account.bech32Address, debt.to);
        if (!debtExists) {
          throw new Error("No matching debt found in the contract. It may have already been settled or never existed.");
        }
      }
      
      const result = await settleDebt(
        client,
        account.bech32Address,
        groupId,
        debt.to,
        debt.amount
      );
      
      if (result) {
        // Show success alert
        setTxAlert({
          show: true,
          type: 'success',
          title: 'Debt Settled Successfully',
          message: `You have successfully settled your debt of ${parseInt(debt.amount)/1000000} XION to ${formatAddress(debt.to)}.`,
          txHash: result.transactionHash,
        });
        
        // Add success toast
        showToast({
          type: 'success',
          title: 'Debt Settled Successfully',
          message: `You have successfully settled your debt of ${parseInt(debt.amount)/1000000} XION to ${formatAddress(debt.to)}.`,
          txHash: result.transactionHash,
          duration: 7000,
          referenceId: actionRef
        });
        
        // Refresh debts and balances
        if (queryClient) {
          const debtsResult = await getDebts(queryClient, groupId);
          if (debtsResult) {
            setDebts(debtsResult.debts);
          } else {
            // Empty the debts if none returned
            setDebts([]);
          }
        }
      }
    } catch (error: any) {
      console.error("Error settling debt:", error);
      setError(error.message || "Failed to settle debt. Please try again.");
      
      // Show error alert
      setTxAlert({
        show: true,
        type: 'error',
        title: 'Error Settling Debt',
        message: error.message || "Failed to settle debt. Please try again.",
        txHash: '',
      });
      
      // Add error toast
      showToast({
        type: 'error',
        title: 'Error Settling Debt',
        message: error.message || "Failed to settle debt. Please try again.",
        duration: 8000,
        referenceId: actionRef
      });
    } finally {
      setSettlingDebt(null);
    }
  };
  
  // Filter debts to show only those relevant to the current user
  const userDebts = debts.filter(debt => 
    account?.bech32Address && 
    (debt.from === account.bech32Address || debt.to === account.bech32Address)
  );
  
  // Split debts into "you owe" and "owed to you" categories
  const youOweDebts = userDebts.filter(debt => 
    account?.bech32Address && debt.from === account.bech32Address
  );
  
  const owedToYouDebts = userDebts.filter(debt => 
    account?.bech32Address && debt.to === account.bech32Address
  );
  
  const handleSettleAllDebts = async () => {
    if (!client || !account?.bech32Address) {
      setShowModal(true);
      return;
    }
    
    if (!youOweDebts.length) {
      setError("You don't have any debts to settle.");
      
      // Add error toast
      showToast({
        type: 'error',
        title: 'No Debts to Settle',
        message: "You don't have any debts to settle.",
        duration: 5000
      });
      
      return;
    }
    
    setSettlingAllDebts(true);
    setError(null);
    
    // Get total amount needed
    const totalAmount = youOweDebts.reduce((sum, debt) => 
      BigInt(sum) + BigInt(debt.amount), BigInt(0)).toString();
    
    // Generate a unique reference ID for this settle all debts flow
    const actionRef = `settle-all-debts-${Date.now()}`;
    
    // Show info toast that all debts are being settled
    showToast({
      type: 'info',
      title: 'Processing All Debt Settlements',
      message: `Settling all debts totaling ${parseInt(totalAmount)/1000000} XION...`,
      autoClose: false,
      referenceId: actionRef
    });
    
    try {
      // Check if user has sufficient total balance
      const balanceCheck = await queryClient?.getBalance(account.bech32Address, "uxion");
      if (balanceCheck && BigInt(balanceCheck.amount) < BigInt(totalAmount)) {
        throw new Error(`Insufficient funds: You need at least ${parseInt(totalAmount)/1000000} XION to settle all debts.`);
      }
      
      // Verify debts exist in the contract
      if (queryClient) {
        for (const debt of youOweDebts) {
          const debtExists = await checkDebtExists(queryClient, groupId, account.bech32Address, debt.to);
          if (!debtExists) {
            throw new Error(`One or more debts no longer exist in the contract. Please refresh and try again.`);
          }
        }
      }
      
      // The improved settleAllDebts will calculate the total amount if not provided
      const result = await settleAllDebts(
        client,
        account.bech32Address,
        groupId
      );
      
      if (result) {
        // Show success alert
        setTxAlert({
          show: true,
          type: 'success',
          title: 'All Debts Settled Successfully',
          message: `You have successfully settled all your debts in this group.`,
          txHash: result.transactionHash,
        });
        
        // Add success toast
        showToast({
          type: 'success',
          title: 'All Debts Settled Successfully',
          message: `You have successfully settled all your debts totaling ${parseInt(totalAmount)/1000000} XION.`,
          txHash: result.transactionHash,
          duration: 7000,
          referenceId: actionRef
        });
        
        // Refresh debts
        if (queryClient) {
          const debtsResult = await getDebts(queryClient, groupId);
          if (debtsResult) {
            setDebts(debtsResult.debts);
          } else {
            // Empty the debts array since all should be settled
            setDebts([]);
          }
        }
      }
    } catch (error: any) {
      console.error("Error settling all debts:", error);
      setError(error.message || "Failed to settle all debts. Please try again.");
      
      // Show error alert
      setTxAlert({
        show: true,
        type: 'error',
        title: 'Error Settling All Debts',
        message: error.message || "Failed to settle all debts. Please try again.",
        txHash: '',
      });
      
      // Add error toast
      showToast({
        type: 'error',
        title: 'Error Settling All Debts',
        message: error.message || "Failed to settle all debts. Please try again.",
        duration: 8000,
        referenceId: actionRef
      });
    } finally {
      setSettlingAllDebts(false);
    }
  };
  
  return (
    <Layout 
      groupId={groupId}
      groupName={group?.name || `Group #${groupId}`} 
      members={group?.members?.map(address => ({ address })) || []}
    >
      <div className="max-w-4xl mx-auto">
        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-primary/90 to-indigo-500/90 p-6 rounded-xl mb-8 text-white relative overflow-hidden shadow-lg animate-slide-in">
          <div className="absolute inset-0 bg-[url('/mesh-gradient.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -bottom-12 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-2" />
              Settlement Coming Soon
            </h2>
            <p className="text-white/90 max-w-3xl">
              We&apos;re working on implementing the settlement functionality. Soon you&apos;ll be able to settle your debts with just a few clicks. Stay tuned for updates!
            </p>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Settle Your Debts</h1>
        
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-lg p-4 mb-6 text-rose-700 dark:text-rose-300 animate-pulse-subtle">
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading debts...</p>
          </div>
        ) : debts.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 animate-float">
              <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">All Settled Up!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don&apos;t have any debts to settle in this group. If you add expenses, any resulting debts will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Your debts - what you owe */}
              <div className="discord-card">
                <div className="p-5 border-b">
                  <h3 className="text-lg font-semibold flex items-center">
                    <ArrowUpIcon className="h-5 w-5 mr-2 text-rose-500" />
                    <span>You Owe</span>
                  </h3>
                </div>
                <div className="p-4">
                  {debts.filter(debt => debt.from === account?.bech32Address).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">You don&apos;t owe anyone in this group.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {debts.filter(debt => debt.from === account?.bech32Address).map((debt, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/20 animate-slide-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div>
                            <p className="text-sm font-medium">{formatAddress(debt.to)}</p>
                            <p className="text-lg font-bold">{parseInt(debt.amount)/1000000} XION</p>
                          </div>
                          <button 
                            className="h-10 px-4 rounded-md flex items-center justify-center transition-all bg-primary text-primary-foreground shadow-sm btn-coming-soon"
                            disabled={true}
                          >
                            Settle
                          </button>
                        </div>
                      ))}
                      
                      {/* Settle All Section */}
                      {debts.filter(debt => debt.from === account?.bech32Address).length > 1 && (
                        <div className="mt-6 pt-4 border-t border-border/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total You Owe</p>
                              <p className="text-xl font-bold">
                                {debts.filter(debt => debt.from === account?.bech32Address)
                                  .reduce((total, debt) => total + parseInt(debt.amount), 0) / 1000000} XION
                              </p>
                            </div>
                            <button 
                              className="h-10 px-4 rounded-md flex items-center justify-center transition-all bg-primary text-primary-foreground shadow-sm btn-coming-soon"
                              disabled={true}
                            >
                              <BanknotesIcon className="h-4 w-4 mr-2" />
                              Settle All
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Others' debts - what they owe you */}
              <div className="discord-card">
                <div className="p-5 border-b">
                  <h3 className="text-lg font-semibold flex items-center">
                    <ArrowDownIcon className="h-5 w-5 mr-2 text-emerald-500" />
                    <span>You Are Owed</span>
                  </h3>
                </div>
                <div className="p-4">
                  {debts.filter(debt => debt.to === account?.bech32Address).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No one owes you in this group.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {debts.filter(debt => debt.to === account?.bech32Address).map((debt, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/20 animate-slide-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div>
                            <p className="text-sm font-medium">{formatAddress(debt.from)}</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{parseInt(debt.amount)/1000000} XION</p>
                          </div>
                          <div className="badge badge-secondary animate-pulse-subtle">Pending</div>
                        </div>
                      ))}
                      
                      <div className="mt-6 pt-4 border-t border-border/30">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total You Are Owed</p>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {debts.filter(debt => debt.to === account?.bech32Address)
                              .reduce((total, debt) => total + parseInt(debt.amount), 0) / 1000000} XION
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Bottom Connect Wallet Banner */}
        {!account && (
          <div className="bg-secondary/50 border rounded-xl p-6 text-center mt-8 animate-pulse-subtle">
            <p className="font-medium mb-4">Connect your wallet to see and settle your debts</p>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-all shadow-sm"
            >
              Connect Wallet
            </button>
          </div>
        )}
        
        {/* Transaction Alert */}
        <TransactionAlert
          isVisible={txAlert.show}
          type={txAlert.type}
          title={txAlert.title}
          message={txAlert.message}
          txHash={txAlert.txHash}
          onClose={() => setTxAlert({...txAlert, show: false})}
        />
        
        {/* Abstraxion modal */}
        <Abstraxion onClose={() => setShowModal(false)} />
      </div>
    </Layout>
  );
} 