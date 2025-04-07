"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useModal,
  Abstraxion
} from "@burnt-labs/abstraxion";
import Layout from "@/components/ui/Layout";
import JoinGroupForm from "@/components/groups/JoinGroupForm";
import { joinGroup } from "@/lib/contract";
import { useToast } from "@/lib/ToastContext";

export default function JoinGroupPage() {
  const router = useRouter();
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const [, setShowModal] = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  const handleJoinGroup = async (groupId: number) => {
    if (!client || !account?.bech32Address) {
      setShowModal(true);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    // Generate a unique reference ID for this join group flow
    const actionRef = `join-group-${Date.now()}`;
    
    // Show info toast when joining a group
    showToast({
      type: 'info',
      title: 'Joining Group',
      message: `Attempting to join group #${groupId}...`,
      autoClose: false,
      referenceId: actionRef
    });
    
    try {
      const result = await joinGroup(client, account.bech32Address, groupId);
      
      if (result) {
        // Show success toast
        showToast({
          type: 'success',
          title: 'Group Joined Successfully',
          message: `You have successfully joined group #${groupId}.`,
          txHash: result.transactionHash,
          duration: 7000,
          referenceId: actionRef
        });
        
        // Navigate to the group page
        router.push(`/groups/${groupId}`);
      }
    } catch (error: any) {
      console.error("Error joining group:", error);
      setError(error.message || "Failed to join group. Please try again.");
      
      // Show error toast
      showToast({
        type: 'error',
        title: 'Failed to Join Group',
        message: error.message || "Failed to join group. Please try again.",
        duration: 8000,
        referenceId: actionRef
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            <p>{error}</p>
          </div>
        )}
        
        <JoinGroupForm 
          onSubmit={handleJoinGroup}
          isSubmitting={isSubmitting}
        />
      </div>
      
      <Abstraxion onClose={() => setShowModal(false)} />
    </Layout>
  );
} 