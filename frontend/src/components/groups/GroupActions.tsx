import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { leaveGroup } from '@/lib/contract';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { useToast } from "@/lib/ToastContext";

interface GroupActionsProps {
  groupId: number;
  groupName: string;
  memberCount: number;
  client: SigningCosmWasmClient | null;
  address: string;
  onSuccess?: () => void;
}

export default function GroupActions({ 
  groupId, 
  groupName,
  memberCount,
  client, 
  address,
  onSuccess
}: GroupActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const { showToast } = useToast();
  
  // Handle leave group action directly
  const handleLeaveGroup = async () => {
    if (!client || !address) {
      setError("Wallet not connected. Please connect your wallet to leave this group.");
      
      // Show error toast
      showToast({
        type: 'error',
        title: 'Wallet Not Connected',
        message: "Please connect your wallet to leave this group.",
        duration: 5000
      });
      
      return;
    }

    if (window.confirm(`Are you sure you want to leave the group "${groupName}"? You may need to be invited back to rejoin.`)) {
      setIsLeaving(true);
      setError(null);
      
      // Generate a unique reference ID for this leave group flow
      const actionRef = `leave-group-${Date.now()}`;
      
      // Show info toast
      showToast({
        type: 'info',
        title: 'Leaving Group',
        message: `Leaving group "${groupName}"...`,
        autoClose: false,
        referenceId: actionRef
      });

      try {
        const result = await leaveGroup(client, address, groupId);
        
        // Show success toast
        showToast({
          type: 'success',
          title: 'Left Group Successfully',
          message: `You have successfully left the group "${groupName}".`,
          txHash: result ? result.transactionHash : undefined,
          duration: 7000,
          referenceId: actionRef
        });
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        // Navigate back to homepage
        router.push('/');
      } catch (error: any) {
        console.error("Error leaving group:", error);
        setError(error.message || "Failed to leave group. Please try again.");
        
        // Show error toast
        showToast({
          type: 'error',
          title: 'Failed to Leave Group',
          message: error.message || "Failed to leave group. Please try again.",
          duration: 8000,
          referenceId: actionRef
        });
      } finally {
        setIsLeaving(false);
      }
    }
  };

  return (
    <div className="bg-card border rounded-md shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-primary/90 to-indigo-500/90 p-3 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/mesh-gradient.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 flex items-center justify-between">
          <h2 className="font-bold flex items-center text-sm">
            <SparklesIcon className="h-4 w-6 mr-1.5" />
            Group Actions
          </h2>
          
          <button 
            className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            title="Refresh group data"
            onClick={onSuccess}
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      <div className="p-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <UserGroupIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{groupName}</h3>
            <p className="text-xs text-muted-foreground">{memberCount} members</p>
          </div>
        </div>
        
        <button
          onClick={handleLeaveGroup}
          disabled={isLeaving}
          className="w-full flex items-center justify-center gap-1.5 p-2 rounded-md text-xs text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all border border-destructive/20"
        >
          {isLeaving ? (
            <>
              <ArrowPathIcon className="h-4 w-4 flex-shrink-0 animate-spin" />
              <span>Leaving...</span>
            </>
          ) : (
            <>
              <ArrowRightOnRectangleIcon className="h-4 w-4 flex-shrink-0" />
              <span>Leave Group</span>
            </>
          )}
        </button>
        
        {error && (
          <div className="mt-2 p-2 bg-destructive/10 text-destructive text-xs rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 