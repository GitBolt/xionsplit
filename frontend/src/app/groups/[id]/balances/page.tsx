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
import Layout from "@/components/ui/Layout";
import BalanceSummary from "@/components/balances/BalanceSummary";
import TransactionAlert from "@/components/ui/TransactionAlert";
import { 
  getGroup, 
  getGroupExpenses, 
  getDebts,
  getBalanceSummary, 
  settleDebt, 
  settleAllDebts, 
  CONTRACT_ADDRESS
} from "@/lib/contract";
import { Group, BalanceSummary as BalanceSummaryType, Expense, Debt } from "@/lib/types";
import { useToast } from "@/lib/ToastContext";

export default function GroupBalancesPage() {
  const params = useParams();
  const groupId = parseInt(params.id as string);
  
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();
  const [, setShowModal] = useModal();
  const { showToast } = useToast();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settlingDebt, setSettlingDebt] = useState(false);
  const [settlingAll, setSettlingAll] = useState(false);
  
  // Transaction alert state
  const [txAlert, setTxAlert] = useState({
    show: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
    txHash: '',
  });
  
  // Fetch group details, expenses, debts and balance summary
  useEffect(() => {
    const fetchData = async () => {
      if (!queryClient || !account?.bech32Address) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch group details
        const groupDetails = await getGroup(queryClient, groupId);
        if (groupDetails) {
          setGroup(groupDetails);
          console.log("Group details:", groupDetails);
        } else {
          console.error("No group details returned");
        }
        
        // Fetch expenses
        const expensesResult = await getGroupExpenses(queryClient, groupId);
        if (expensesResult && expensesResult.expenses) {
          setExpenses(expensesResult.expenses);
          console.log("Expenses:", expensesResult.expenses);
        } else {
          console.error("No expenses returned");
        }
        
        // Fetch debts
        const debtsResult = await getDebts(queryClient, groupId);
        if (debtsResult) {
          console.log("Raw debts result:", debtsResult);
          
          // Handle different debt response formats
          let formattedDebts: Debt[] = [];
          
          if (Array.isArray(debtsResult.debts) && debtsResult.debts.length > 0) {
            // Standard format with from/to fields
            if ('from' in debtsResult.debts[0]) {
              formattedDebts = debtsResult.debts;
            } 
            // Alternative format with debtor/creditor fields
            else if ('debtor' in debtsResult.debts[0]) {
              formattedDebts = debtsResult.debts.map((debt: any) => ({
                from: debt.debtor,
                to: debt.creditor,
                amount: debt.amount
              }));
            }
          } else if (Array.isArray(debtsResult) && debtsResult.length > 0) {
            // Direct array format
            if ('debtor' in debtsResult[0]) {
              formattedDebts = debtsResult.map((debt: any) => ({
                from: debt.debtor,
                to: debt.creditor,
                amount: debt.amount
              }));
            }
          }
          
          console.log("Formatted debts:", formattedDebts);
          setDebts(formattedDebts);
        } else {
          console.error("No debts returned");
        }
        
        // Fetch balance summary
        const summary = await getBalanceSummary(queryClient, groupId, account.bech32Address);
        if (summary) {
          setBalanceSummary(summary);
          console.log("Balance summary:", summary);
        } else {
          console.error("No balance summary returned");
          
          // If we have expenses, always try to calculate a balance summary
          if (expensesResult && Array.isArray(expensesResult.expenses) && expensesResult.expenses.length > 0) {
            console.log("Calculating balance summary from expenses");
            
            // Calculate the balance summary from expenses directly
            const expenses = expensesResult.expenses;
            
            // Track the balances between users
            const balances: Record<string, bigint> = {};
            
            for (const expense of expenses) {
              const paidBy = expense.paid_by;
              const splitBetween = expense.split_between;
              const amount = BigInt(expense.amount);
              
              if (splitBetween.length === 0) continue;
              
              // Calculate amount per person
              const amountPerPerson = amount / BigInt(splitBetween.length);
              
              // For each person in split, if not the payer, they owe the payer
              for (const person of splitBetween) {
                if (person !== paidBy) {
                  // Get unique key for this relationship (always smaller address first)
                  const key = [paidBy, person].sort().join('-');
                  
                  if (!balances[key]) {
                    balances[key] = BigInt(0);
                  }
                  
                  // If current user is the payer, they are owed money
                  if (paidBy === account.bech32Address) {
                    balances[key] = balances[key] + amountPerPerson;
                  } 
                  // If current user is the person who owes, subtract
                  else if (person === account.bech32Address) {
                    balances[key] = balances[key] - amountPerPerson;
                  }
                }
              }
            }
            
            console.log("Calculated raw balances:", balances);
            
            // Convert balances to the summary format
            const balanceSummaries = [];
            let totalOwed = BigInt(0);
            let totalOwedTo = BigInt(0);
            
            for (const [key, amount] of Object.entries(balances)) {
              // Skip zero balances
              if (amount === BigInt(0)) continue;
              
              // Find the other user in this relationship
              const [user1, user2] = key.split('-');
              const otherUser = user1 === account.bech32Address ? user2 : user1;
              
              // Determine if the current user owes money or is owed money
              const direction = amount < BigInt(0) ? 0 : 1; // 0 = you owe, 1 = they owe you
              const absAmount = amount < BigInt(0) ? -amount : amount;
              
              if (direction === 0) {
                totalOwed = totalOwed + absAmount;
              } else {
                totalOwedTo = totalOwedTo + absAmount;
              }
              
              balanceSummaries.push({
                other_user: otherUser,
                amount: absAmount.toString(),
                direction
              });
            }
            
            const netBalance = totalOwedTo - totalOwed;
            
            const fallbackSummary = {
              total_owed: totalOwed.toString(),
              total_owed_to: totalOwedTo.toString(),
              net_balance: netBalance.toString(),
              balances: balanceSummaries
            };
            
            console.log("Created fallback balance summary:", fallbackSummary);
            setBalanceSummary(fallbackSummary);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load balance data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    if (queryClient && account?.bech32Address) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [queryClient, account?.bech32Address, groupId]);
  
  const handleSettleDebt = async (toAddress: string, amount: string) => {
    if (!client || !account?.bech32Address) {
      setShowModal(true);
      return;
    }
    
    setSettlingDebt(true);
    setError(null);
    
    try {
      console.log(`Settling debt to ${toAddress} for ${amount}`);
      console.log(`Sender: ${account.bech32Address}, Group: ${groupId}`);
      console.log(`Current balances:`, balanceSummary);
      
      // Check if user has sufficient balance
      const balanceCheck = await queryClient?.getBalance(account.bech32Address, "uxion");
      if (balanceCheck && BigInt(balanceCheck.amount) < BigInt(amount)) {
        throw new Error(`Insufficient funds: You need at least ${parseInt(amount)/1000000} XION to settle this debt.`);
      }
      
      // Verify this debt is relevant to current user by checking balances
      const relevantBalance = balanceSummary?.balances?.find(
        b => b.other_user === toAddress && b.direction === 0 && b.amount === amount
      );
      
      if (!relevantBalance) {
        console.warn("Warning: Attempting to settle a debt that is not in your balance summary!");
        throw new Error("Cannot settle this debt: It doesn't appear in your current balance summary.");
      }

      const group = await queryClient!.queryContractSmart(CONTRACT_ADDRESS, {
        get_group: { group_id: groupId }
      });
      console.log("🧑‍🤝‍🧑 Group members:", group.members);
  
      console.log("✅ Sender in group?", group.members.includes(account.bech32Address));
      console.log("✅ Recipient in group?", group.members.includes(toAddress));

      
      const result = await settleDebt(
        client,
        account.bech32Address,
        groupId,
        toAddress,
        amount
      );
      
      if (result) {
        console.log("Settle debt result:", result);
        
        // Show success notification
        setTxAlert({
          show: true,
          type: 'success',
          title: 'Debt Settled Successfully',
          message: `You have successfully settled your debt of ${parseInt(amount)/1000000} XION to ${toAddress.substring(0, 8)}...`,
          txHash: result.transactionHash,
        });
        
        // Refresh balance summary
        if (queryClient) {
          console.log("Refreshing balance summary after settling debt");
          const summary = await getBalanceSummary(queryClient, groupId, account.bech32Address);
          if (summary) {
            console.log("New balance summary:", summary);
            setBalanceSummary(summary);
          } else {
            console.log("No balance summary returned after settlement");
          }
          
          // Also refresh debts
          const debtsResult = await getDebts(queryClient, groupId);
          if (debtsResult) {
            console.log("New debts after settlement:", debtsResult.debts);
            setDebts(debtsResult.debts);
          } else {
            console.log("No debts returned after settlement");
          }
        }
      }
    } catch (error: any) {
      console.error("Error settling debt:", error);
      console.error("Error details:", error.message);
      
      setError(error.message || "Failed to settle debt. Please try again.");
      
      // Show error notification
      setTxAlert({
        show: true,
        type: 'error',
        title: 'Error Settling Debt',
        message: error.message || "Failed to settle debt. Please try again.",
        txHash: '',
      });
    } finally {
      setSettlingDebt(false);
    }
  };
  
  const handleSettleAll = async () => {
    if (!client || !account?.bech32Address || !queryClient) {
      setShowModal(true);
      return;
    }
    
    setSettlingAll(true);
    setError(null);
    
    // Generate a unique reference ID for this settle all debts flow - moved outside of try block
    const actionRef = `settle-all-balances-${Date.now()}`;
    
    try {
      console.log(`Fetching balance summary before settling all debts for group ${groupId}`);
      
      // First, get the balance summary to determine total amount owed
      const summary = await getBalanceSummary(queryClient, groupId, account.bech32Address);
      
      if (!summary) {
        throw new Error("Could not retrieve balance summary");
      }
      
      const totalOwed = summary.total_owed;
      console.log(`Total amount owed: ${totalOwed} uxion`);
      
      // Check if there are any debts to settle
      if (totalOwed === "0") {
        setTxAlert({
          show: true,
          type: 'error',
          title: 'No Debts to Settle',
          message: 'You do not have any outstanding debts in this group.',
          txHash: '',
        });
        
        // Add error toast
        showToast({
          type: 'error',
          title: 'No Debts to Settle',
          message: 'You do not have any outstanding debts in this group.',
          duration: 5000,
          referenceId: actionRef
        });
        
        setSettlingAll(false);
        return;
      }
      
      // Show info toast for debt settlement in progress
      showToast({
        type: 'info',
        title: 'Processing All Debt Settlements',
        message: `Settling all debts totaling ${parseInt(totalOwed)/1000000} XION...`,
        autoClose: false,
        referenceId: actionRef
      });
      
      console.log(`Settling all debts for group ${groupId}`);
      console.log(`Sender: ${account.bech32Address}`);
      console.log(`Amount to send: ${totalOwed} uxion`);
      
      const result = await settleAllDebts(
        client,
        account.bech32Address,
        groupId,
        totalOwed  // Pass the total owed amount to the function
      );
      
      if (result) {
        console.log("Settle all debts result:", result);
        
        // Show success notification
        setTxAlert({
          show: true,
          type: 'success',
          title: 'All Debts Settled Successfully',
          message: `You have successfully settled all your debts (${(totalOwed)} XION) in this group.`,
          txHash: result.transactionHash,
        });
        
        // Add success toast
        showToast({
          type: 'success',
          title: 'All Debts Settled Successfully',
          message: `You have successfully settled all your debts totaling ${parseInt(totalOwed)/1000000} XION.`,
          txHash: result.transactionHash,
          duration: 7000,
          referenceId: actionRef
        });
        
        // Refresh balance summary
        if (queryClient) {
          console.log("Refreshing balance summary after settling all debts");
          const updatedSummary = await getBalanceSummary(queryClient, groupId, account.bech32Address);
          if (updatedSummary) {
            console.log("New balance summary after settling all:", updatedSummary);
            setBalanceSummary(updatedSummary);
          } else {
            console.log("No balance summary returned after settling all");
          }
          
          // Also refresh debts
          const debtsResult = await getDebts(queryClient, groupId);
          if (debtsResult) {
            console.log("New debts after settling all:", debtsResult.debts);
            setDebts(debtsResult.debts);
          } else {
            console.log("No debts returned after settling all");
            setDebts([]);
          }
        }
      }
    } catch (error: any) {
      console.error("Error settling all debts:", error);
      const errorMessage = error.message || "Failed to settle all debts. Please try again.";
      setError(errorMessage);
      
      // Show error alert
      setTxAlert({
        show: true,
        type: 'error',
        title: 'Error Settling All Debts',
        message: errorMessage,
        txHash: '',
      });
      
      // Add error toast
      showToast({
        type: 'error',
        title: 'Error Settling All Debts',
        message: errorMessage,
        duration: 8000,
        referenceId: actionRef
      });
    } finally {
      setSettlingAll(false);
    }
  };
  
  // Create a message if there are no balances but there are expenses
  const noBalancesMessage = !balanceSummary && expenses.length > 0 && !loading ? (
    <div className="bg-card text-card-foreground border rounded-lg p-8 text-center max-w-md mx-auto">
      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No Balance Data</h3>
      <p className="text-muted-foreground mb-2">
        You're involved in expenses, but no balance data is available.
      </p>
      <p className="text-xs text-muted-foreground">
        This could happen if you're not directly involved in any debt relationships.
      </p>
    </div>
  ) : null;
  
  // Calculate whether the user is involved in any expenses
  const isUserInvolved = expenses.some(expense => 
    expense.paid_by === account?.bech32Address || 
    expense.split_between.includes(account?.bech32Address || '')
  );
  
  // Check if we have balance data to display
  const hasBalanceData = balanceSummary && (
    (balanceSummary.balances && balanceSummary.balances.length > 0) || 
    (parseInt(balanceSummary.total_owed) > 0) || 
    (parseInt(balanceSummary.total_owed_to) > 0)
  );
  
  // For debugging purposes
  useEffect(() => {
    if (balanceSummary) {
      console.log("Balance data check:", {
        hasBalances: balanceSummary.balances && balanceSummary.balances.length > 0,
        totalOwed: balanceSummary.total_owed,
        totalOwedTo: balanceSummary.total_owed_to,
        hasBalanceData
      });
    }
  }, [balanceSummary, hasBalanceData]);
  
  // Display message if user is not involved in any expenses
  const notInvolvedMessage = !isUserInvolved && expenses.length > 0 && !loading ? (
    <div className="bg-card text-card-foreground border rounded-lg p-8 text-center max-w-md mx-auto">
      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-accent-foreground">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">You're Not Involved Yet</h3>
      <p className="text-muted-foreground">
        You're not part of any expenses in this group yet.
      </p>
    </div>
  ) : null;
  
  return (
    <Layout
      groupId={groupId}
      groupName={group?.name}
      members={group?.members?.map(address => ({ address }))}
    >
      <div className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 border-t-2 border-l-2 border-primary rounded-full animate-spin"></div>
              <p className="mt-3 text-muted-foreground">Loading balance data...</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6 border border-destructive/20">
                <p>{error}</p>
              </div>
            )}
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                {group?.name || 'Group'} Balances
              </h1>
              <p className="text-muted-foreground">Review and settle your debts with other members</p>
            </div>
            
            {/* Show balance summary if available */}
            {hasBalanceData && account?.bech32Address ? (
              <BalanceSummary
                summary={balanceSummary}
                currentUser={account.bech32Address}
                onSettleDebt={handleSettleDebt}
                onSettleAll={handleSettleAll}
                isSettling={settlingDebt}
                isSettlingAll={settlingAll}
              />
            ) : (
              <>
                {noBalancesMessage}
                {notInvolvedMessage}
                {!expenses.length && !loading && (
                  <div className="bg-card text-card-foreground border rounded-lg p-8 text-center max-w-md mx-auto">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-muted-foreground">
                        <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                        <path d="M8 6h8" />
                        <path d="M8 10h8" />
                        <path d="M8 14h8" />
                        <path d="M8 18h8" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Expenses Yet</h3>
                    <p className="text-muted-foreground">
                      Add expenses to start tracking balances in this group.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      
      {/* Transaction Alert */}
      <TransactionAlert
        type={txAlert.type}
        title={txAlert.title}
        message={txAlert.message}
        txHash={txAlert.txHash}
        isVisible={txAlert.show}
        onClose={() => setTxAlert(prev => ({ ...prev, show: false }))}
      />
      
      <Abstraxion onClose={() => setShowModal(false)} />
    </Layout>
  );
} 