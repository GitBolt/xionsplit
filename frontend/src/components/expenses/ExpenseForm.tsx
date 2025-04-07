import { useState } from "react";
import {
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

interface Member {
  address: string;
  name?: string;
}

interface ExpenseFormProps {
  groupId: number;
  members: Member[];
  currentUser?: string;
  onSubmit: (description: string, amount: string, splitBetween: string[]) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function ExpenseForm({
  groupId,
  members,
  currentUser,
  onSubmit,
  onCancel,
  isSubmitting
}: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitBetween, setSplitBetween] = useState<string[]>(
    members.map(member => member.address).filter(address => address === currentUser)
  );

  const handleToggleMember = (memberAddress: string) => {
    if (splitBetween.includes(memberAddress)) {
      setSplitBetween(splitBetween.filter(address => address !== memberAddress));
    } else {
      setSplitBetween([...splitBetween, memberAddress]);
    }
  };

  const handleSelectAll = () => {
    setSplitBetween(members.map(member => member.address));
  };

  const handleClearAll = () => {
    if (currentUser) {
      setSplitBetween([currentUser]);
    } else {
      setSplitBetween([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert amount to XION (multiply by 1,000,000)
    const amountInXion = (parseFloat(amount) * 1000000).toString();
    
    onSubmit(description, amountInXion, splitBetween);
  };

  const isFormValid = description.trim() !== "" && 
    parseFloat(amount) > 0 && 
    splitBetween.length > 0;

  const getAmountPerPerson = () => {
    if (splitBetween.length === 0 || !amount || isNaN(parseFloat(amount))) {
      return "0";
    }
    return (parseFloat(amount) / splitBetween.length).toFixed(2);
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground">Add New Expense</h3>
        <button 
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent/20 transition-colors"
          aria-label="Close form"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">
                Description
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this expense for?"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-muted-foreground">
                Amount (XION)
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.000001"
                step="0.000001"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-muted-foreground">
                Split Between ({splitBetween.length} selected)
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="bg-accent/10 p-4 rounded-lg mb-2">
              <p className="text-sm text-accent-foreground">
                <span className="font-medium text-black">Each person pays: {getAmountPerPerson()} XION</span> 
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              {members.map((member) => (
                <div 
                  key={member.address} 
                  className={`flex items-center justify-between p-3 transition-colors ${
                    splitBetween.includes(member.address) 
                      ? "bg-primary/5 hover:bg-primary/10" 
                      : "hover:bg-accent/5"
                  }`}
                >
                  <div className="flex-1 truncate">
                    <p className="font-medium truncate">
                      {member.name || member.address.substring(0, 10) + "..."}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.address}
                      {member.address === currentUser && (
                        <span className="ml-2 text-primary">(You)</span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMember(member.address)}
                    className={`ml-2 p-1.5 rounded-full transition-colors ${
                      splitBetween.includes(member.address)
                        ? "bg-primary/20 text-primary hover:bg-primary/30"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {splitBetween.includes(member.address) ? (
                      <MinusIcon className="h-4 w-4" />
                    ) : (
                      <PlusIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-input bg-background text-foreground hover:bg-accent/10 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-emerald-500 text-white font-medium transition-all ${
                isFormValid && !isSubmitting
                  ? "hover:opacity-90 hover:shadow-md"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </div>
              ) : (
                "Add Expense"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 