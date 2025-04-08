"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
  useModal,
  Abstraxion
} from "@burnt-labs/abstraxion";
import Layout from "@/components/ui/Layout";
import ExpenseItem from "@/components/expenses/ExpenseItem";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import TransactionAlert from "@/components/ui/TransactionAlert";
import GroupActions from "@/components/groups/GroupActions";
import { getGroup, getGroupExpenses, addExpense } from "@/lib/contract";
import { Group, Expense } from "@/lib/types";
import { PlusIcon, ReceiptPercentIcon } from "@heroicons/react/24/outline";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { useToast } from "@/lib/ToastContext";

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = parseInt(params.id as string);
  
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();
  const [, setShowModal] = useModal();
  const { showToast } = useToast();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  
  // Transaction alert state
  const [txAlert, setTxAlert] = useState({
    show: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
    txHash: '',
  });
  
  // Fetch group details and expenses 
  const fetchGroupData = useCallback(async () => {
    if (!queryClient) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch group details
      const groupResult = await getGroup(queryClient, groupId);
      if (groupResult) {
        setGroup(groupResult);
      }
      
      // Fetch group expenses
      const expensesResult = await getGroupExpenses(queryClient, groupId);
      if (expensesResult) {
        setExpenses(expensesResult.expenses);
      }
    } catch (error: any) {
      console.error("Error fetching group data:", error);
      setError(error.message || "Failed to load group data. Please try again.");
      
      // Show error toast
      showToast({
        type: 'error',
        title: 'Failed to Load Group Data',
        message: "There was an error loading the group data. Please try again.",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [queryClient, groupId, showToast]);
  
  // Fetch group details and expenses
  useEffect(() => {
    if (queryClient) {
      fetchGroupData();
    }
  }, [queryClient, groupId, fetchGroupData]);
  
  const handleAddExpense = () => {
    if (!account?.bech32Address) {
      setShowModal(true);
      return;
    }
    
    setShowExpenseForm(true);
  };
  
  const handleSubmitExpense = async (description: string, amount: string, splitBetween: string[]) => {
    if (!client || !account?.bech32Address) {
      setShowModal(true);
      return;
    }
    
    setSubmittingExpense(true);
    setError(null);
    
    // Generate a unique reference ID for this expense addition flow
    const actionRef = `add-expense-${Date.now()}`;
    
    // Show info toast that expense is being added
    showToast({
      type: 'info',
      title: 'Adding Expense',
      message: `Adding expense "${description}" for ${parseInt(amount)/1000000} XION...`,
      autoClose: false,
      referenceId: actionRef
    });
    
    try {
      const result = await addExpense(
        client, 
        account.bech32Address, 
        groupId, 
        description, 
        amount,
        splitBetween
      );
      
      if (result) {
        // Show success transaction alert
        setTxAlert({
          show: true,
          type: 'success',
          title: 'Expense Added Successfully',
          message: `You have successfully added the expense "${description}" for ${parseInt(amount)/1000000} XION.`,
          txHash: result.transactionHash,
        });
        
        // Show success toast
        showToast({
          type: 'success',
          title: 'Expense Added Successfully',
          message: `You have added the expense "${description}" for ${parseInt(amount)/1000000} XION.`,
          txHash: result.transactionHash,
          duration: 7000,
          referenceId: actionRef
        });
        
        // Refresh expenses
        if (queryClient) {
          const expensesResult = await getGroupExpenses(queryClient, groupId);
          if (expensesResult) {
            setExpenses(expensesResult.expenses);
          }
        }
        
        // Hide the form
        setShowExpenseForm(false);
      }
    } catch (error: any) {
      console.error("Error adding expense:", error);
      setError(error.message || "Failed to add expense. Please try again.");
      
      // Show error transaction alert
      setTxAlert({
        show: true,
        type: 'error',
        title: 'Error Adding Expense',
        message: error.message || "Failed to add expense. Please try again.",
        txHash: '',
      });
      
      // Show error toast
      showToast({
        type: 'error',
        title: 'Failed to Add Expense',
        message: error.message || "There was an error adding the expense. Please try again.",
        duration: 8000,
        referenceId: actionRef
      });
    } finally {
      setSubmittingExpense(false);
    }
  };
  
  const sortedExpenses = [...expenses].sort((a, b) => b.created_at - a.created_at);
  
  return (
    <Layout
      groupId={groupId}
      groupName={group?.name}
      members={group?.members?.map(address => ({ address }))}
      onAddExpense={handleAddExpense}
    >
      <div className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 border-t-2 border-l-2 border-primary rounded-full animate-spin"></div>
              <p className="mt-3 text-muted-foreground">Loading group data...</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6 border border-destructive/20">
                <p>{error}</p>
              </div>
            )}
            
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent animate-slide-in">
                  {group?.name || 'Group'} Expenses
                </h1>
                <p className="text-muted-foreground">Track and manage shared expenses</p>
              </div>
              
              {/* Group actions for larger screens */}
              <div className="w-full md:w-auto">
                {group && account?.bech32Address && (
                  <GroupActions
                    groupId={groupId}
                    groupName={group.name}
                    memberCount={group.members?.length || 0}
                    client={client as SigningCosmWasmClient | null}
                    address={account.bech32Address}
                    onSuccess={() => {
                      // Refetch group data
                      if (queryClient) {
                        fetchGroupData();
                      }
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Add group actions button for mobile */}
            <div className="lg:hidden mb-6 flex">
              <button 
                className="ml-auto flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-all shadow-sm active:scale-95"
                onClick={handleAddExpense}
              >
                <PlusIcon className="h-5 w-5" />
                Add Expense
              </button>
            </div>
            
            {showExpenseForm && group && group.members && (
              <div className="mb-6 bg-card rounded-xl overflow-hidden shadow-lg transform transition-all hover:shadow-xl">
                <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 p-1">
                  <ExpenseForm
                    groupId={groupId}
                    members={group.members.map(address => ({ address }))}
                    currentUser={account?.bech32Address}
                    onSubmit={handleSubmitExpense}
                    onCancel={() => setShowExpenseForm(false)}
                    isSubmitting={submittingExpense}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {sortedExpenses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {sortedExpenses.map(expense => (
                    <div key={expense.id} className="transform transition-all hover:scale-[1.01]">
                      <ExpenseItem
                        id={expense.id}
                        description={expense.description}
                        amount={expense.amount}
                        paidBy={expense.paid_by}
                        createdAt={expense.created_at}
                        splitBetween={expense.split_between}
                        currentUser={account?.bech32Address}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card text-card-foreground border rounded-lg p-8 text-center">
                  <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <ReceiptPercentIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Expenses Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Add your first expense to start tracking shared costs in this group.
                  </p>
                  <button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-all inline-flex items-center"
                    onClick={handleAddExpense}
                  >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Add Expense
                  </button>
                </div>
              )}
            </div>
            
            {/* Add GroupActions for mobile at bottom */}
            <div className="lg:hidden mt-8">
              {group && account?.bech32Address && (
                <GroupActions
                  groupId={groupId}
                  groupName={group.name}
                  memberCount={group.members?.length || 0}
                  client={client as SigningCosmWasmClient | null}
                  address={account.bech32Address}
                  onSuccess={() => {
                    // Refetch group data
                    if (queryClient) {
                      fetchGroupData();
                    }
                  }}
                />
              )}
            </div>
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