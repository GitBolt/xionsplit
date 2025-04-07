import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatAddress } from '@/lib/contract';

type CreateGroupFormProps = {
  onSubmit: (name: string, members: string[]) => void;
  currentUser?: string;
  isSubmitting?: boolean;
};

export default function CreateGroupForm({
  onSubmit,
  currentUser,
  isSubmitting = false
}: CreateGroupFormProps) {
  const [name, setName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [error, setError] = useState('');
  
  const handleAddMember = () => {
    if (!memberInput.trim()) {
      setError('Please enter a valid address');
      return;
    }
    
    // Validate Xion address (basic check - starts with xion1)
    if (!memberInput.startsWith('xion1')) {
      setError('Address must start with xion1');
      return;
    }
    
    // Check for duplicates
    if (members.includes(memberInput) || memberInput === currentUser) {
      setError('This address is already added');
      return;
    }
    
    setMembers(prev => [...prev, memberInput]);
    setMemberInput('');
    setError('');
  };
  
  const handleRemoveMember = (member: string) => {
    setMembers(prev => prev.filter(m => m !== member));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    // Include current user in members automatically
    const allMembers = currentUser 
      ? [currentUser, ...members] 
      : members;
    
    onSubmit(name, allMembers);
  };
  
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Create a New Group</h2>
        <p className="text-sm text-muted-foreground">Create a group to start tracking shared expenses</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="input-label">Group Name</label>
          <input
            type="text"
            id="name"
            className="input-field"
            placeholder="e.g., Apartment, Trip to Paris, Team Lunch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="input-label">Add Members</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="xion1..."
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
            />
            <button 
              type="button" 
              className="btn btn-secondary btn-md"
              onClick={handleAddMember}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          
          <div className="mt-3">
            <p className="text-sm mb-2">Members:</p>
            <div className="space-y-2">
              {currentUser && (
                <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                      {currentUser.charAt(4).toUpperCase()}
                    </div>
                    <span className="text-sm">{formatAddress(currentUser)} <span className="text-xs text-muted-foreground">(you)</span></span>
                  </div>
                </div>
              )}
              
              {members.map(member => (
                <div key={member} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                      {member.charAt(4).toUpperCase()}
                    </div>
                    <span className="text-sm">{formatAddress(member)}</span>
                  </div>
                  <button 
                    type="button" 
                    className="p-1 rounded-full hover:bg-secondary/80"
                    onClick={() => handleRemoveMember(member)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {members.length === 0 && !currentUser && (
                <p className="text-sm text-muted-foreground">No members added yet. You will be added automatically.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button 
            type="submit" 
            className="btn btn-primary btn-md w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Group...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
} 