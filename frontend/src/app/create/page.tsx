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
import CreateGroupForm from "@/components/groups/CreateGroupForm";
import { createGroup } from "@/lib/contract";
import { useToast } from "@/lib/ToastContext";

export default function CreateGroupPage() {
  const router = useRouter();
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const [, setShowModal] = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  const handleCreateGroup = async (name: string, members: string[]) => {
    if (!client || !account?.bech32Address) {
      setShowModal(true);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    // Generate a unique reference ID for this group creation flow
    const actionRef = `create-group-${Date.now()}`;
    
    // Show creating toast
    showToast({
      type: 'info',
      title: 'Creating Group',
      message: `Creating group "${name}" with ${members.length} members...`,
      autoClose: false,
      referenceId: actionRef
    });
    
    try {
      const result = await createGroup(client, account.bech32Address, name, members);
      
      if (result) {
        // Try to extract the group ID from the events
        let groupId: number | undefined;
        try {
          const wasmEvent = result.events.find(event => 
            event.type === 'wasm' && 
            event.attributes.some(attr => attr.key === 'group_id')
          );
          
          if (wasmEvent) {
            const groupIdAttr = wasmEvent.attributes.find(attr => attr.key === 'group_id');
            if (groupIdAttr && groupIdAttr.value) {
              groupId = parseInt(groupIdAttr.value);
            }
          }
        } catch (e) {
          console.error('Error extracting group ID:', e);
        }
        
        // Show success toast
        showToast({
          type: 'success',
          title: 'Group Created Successfully!',
          message: `Your group "${name}" has been created.${groupId ? ` Group ID: ${groupId}` : ''}`,
          txHash: result.transactionHash,
          duration: 7000,
          referenceId: actionRef
        });
        
        // Navigate to the new group page or home page
        if (groupId) {
          router.push(`/groups/${groupId}`);
        } else {
          router.push('/');
        }
      }
    } catch (error: any) {
      console.error("Error creating group:", error);
      setError(error.message || "Failed to create group. Please try again.");
      
      // Show error toast
      showToast({
        type: 'error',
        title: 'Failed to Create Group',
        message: error.message || "There was an error creating the group. Please try again.",
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
        
        <CreateGroupForm 
          onSubmit={handleCreateGroup}
          currentUser={account?.bech32Address}
          isSubmitting={isSubmitting}
        />
      </div>
      
      <Abstraxion onClose={() => setShowModal(false)} />
    </Layout>
  );
} 