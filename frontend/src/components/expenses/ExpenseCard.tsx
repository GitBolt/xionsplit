import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  UserIcon, 
  ChevronDownIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatAddress } from '@/lib/utils';
import { usePrice } from '@/lib/PriceContext';
import { formatAmountToUSD } from '@/lib/price';

export interface ExpenseCardProps {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
  createdAt: string;
  splitBetween: string[];
  currentUser?: string;
}

export default function ExpenseCard({
  id,
  description,
  amount,
  paidBy,
  createdAt,
  splitBetween,
  currentUser
}: ExpenseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { xionPrice, loading } = usePrice();
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const formattedAmount = formatCurrency(amount.toString());
  const usdAmount = xionPrice ? formatAmountToUSD(amount.toString(), xionPrice) : null;
  
  const isPaidByMe = currentUser && paidBy.toLowerCase() === currentUser.toLowerCase();
  const amIIncluded = currentUser && splitBetween.some(addr => addr.toLowerCase() === currentUser.toLowerCase());
  
  // Calculate amount per person
  const amountPerPerson = splitBetween.length > 0 ? amount / splitBetween.length : amount;
  const formattedAmountPerPerson = formatCurrency(amountPerPerson.toString());
  const usdAmountPerPerson = xionPrice ? formatAmountToUSD(amountPerPerson.toString(), xionPrice) : null;

  // Safely format the date
  const formatDate = () => {
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  return (
    <div 
      className={`discord-card overflow-hidden transition-all duration-200 ${
        isHovered ? 'shadow-md scale-[1.01]' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isPaidByMe ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-500'
            }`}>
              <ReceiptRefundIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">{description}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-semibold text-lg ${isPaidByMe ? 'text-primary' : ''}`}>
              {formattedAmount}
            </div>
            {usdAmount && (
              <div className="text-xs text-muted-foreground">
                ≈ {usdAmount}
              </div>
            )}
            {loading && (
              <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
                Loading USD value...
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-secondary/50 text-foreground/80">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
            <div className="text-sm">
              {formatAddress(paidBy)}
            </div>
          </div>
          
          <button 
            onClick={toggleExpand}
            className="text-sm flex items-center gap-1 p-1.5 rounded hover:bg-secondary/50 transition-colors"
          >
            <span>{splitBetween.length} people</span>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border animate-in fade-in-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Split between</span>
              </div>
              <div className={`text-sm font-medium ${amIIncluded ? 'text-orange-500' : ''}`}>
                {formattedAmountPerPerson}
                {usdAmountPerPerson && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (≈ {usdAmountPerPerson})
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2 mt-2">
              {splitBetween.map((address, index) => (
                <div key={index} className="text-sm flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentUser && address.toLowerCase() === currentUser.toLowerCase() 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-secondary/50 text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-xs sm:text-sm overflow-hidden text-ellipsis">
                      {address}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="text-xs px-1.5 py-0.5 rounded bg-secondary/30 hover:bg-secondary/60 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-3 flex justify-end">
              <div className="text-xs text-muted-foreground">
                Expense ID: {id}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 