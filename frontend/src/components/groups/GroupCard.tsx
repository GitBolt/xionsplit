import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  ArrowRightIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';
import { usePrice } from '@/lib/PriceContext';
import { formatAmountToUSD } from '@/lib/price';

interface GroupCardProps {
  id: number;
  name: string;
  members: string[];
  totalExpenses?: number;
  expenseCount?: number;
}

export default function GroupCard({ 
  id, 
  name, 
  members,
  totalExpenses = 0,
  expenseCount = 0 
}: GroupCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const { xionPrice, loading } = usePrice();
  
  const handleClick = () => {
    router.push(`/groups/${id}`);
  };
  
  // Generate a consistent color based on the group name
  const getGroupColor = useMemo(() => {
    // Simple hash function
    const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    
    // Generate a pastel color with high saturation but not too dark
    const h = hash % 360;
    const s = 70 + (hash % 20); // 70-90%
    const l = 80 - (hash % 15); // 65-80%
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  }, [name]);
  
  // Get a darker version of the color for the header
  const getGroupDarkColor = useMemo(() => {
    // Simple hash function
    const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    
    // Generate a darker version of the color
    const h = hash % 360;
    const s = 70 + (hash % 20); // 70-90%
    const l = 40 - (hash % 15); // 25-40%
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  }, [name]);
  
  // Display only the first 5 members, indicate if there are more
  const displayMembers = members.slice(0, 5);
  const hasMoreMembers = members.length > 5;
  const additionalMembersCount = members.length - 5;
  
  // Format the total expenses
  const formattedTotalExpenses = formatCurrency(totalExpenses.toString());
  const usdTotalExpenses = xionPrice ? formatAmountToUSD(totalExpenses, xionPrice) : null;

  return (
    <div 
      className={`discord-card overflow-hidden cursor-pointer transition-all duration-200 ${
        isHovered ? 'shadow-lg scale-[1.02]' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header with background color */}
      <div 
        className="h-24 relative overflow-hidden" 
        style={{ backgroundColor: getGroupColor }}
      >
        {/* Abstract pattern */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('/mesh-gradient.png')]"></div>
        
        {/* Decorative elements */}
        <div 
          className="absolute bottom-0 right-0 w-24 h-24 rounded-full blur-xl opacity-40" 
          style={{ backgroundColor: getGroupDarkColor }}
        ></div>
        
        {/* Group Icon */}
        <div className="absolute left-4 bottom-0 translate-y-1/2 bg-background p-3 rounded-xl shadow-md">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <UserGroupIcon className="h-6 w-6" />
          </div>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4 pt-9">
        {/* Group name and ID */}
        <h3 className="text-xl font-bold mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground">Group ID: {id}</p>
        
        {/* Stats */}
        <div className="mt-4 flex justify-between items-center">
          {/* Member count */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-secondary/50 text-foreground/80">
              <UserGroupIcon className="h-4 w-4" />
            </div>
            <span className="text-sm">{members.length} members</span>
          </div>
          
          {/* Expense count if available */}
          {expenseCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-secondary/50 text-foreground/80">
                <ReceiptRefundIcon className="h-4 w-4" />
              </div>
              <span className="text-sm">{expenseCount} expenses</span>
            </div>
          )}
        </div>
        
        {/* Total expenses if available */}
        {totalExpenses > 0 && (
          <div className="mt-3 p-3 bg-secondary/20 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total expenses:</span>
              <div>
                <div className="text-right font-semibold">{formattedTotalExpenses}</div>
                {usdTotalExpenses && (
                  <div className="text-xs text-muted-foreground text-right">
                    ≈ {usdTotalExpenses}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* View button */}
        <button 
          className="mt-4 w-full py-2 flex items-center justify-center gap-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          onClick={(e) => { 
            e.stopPropagation(); 
            handleClick(); 
          }}
        >
          <span>View Group</span>
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 