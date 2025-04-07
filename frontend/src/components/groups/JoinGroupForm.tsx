import React, { useState } from 'react';

type JoinGroupFormProps = {
  onSubmit: (groupId: number) => void;
  isSubmitting?: boolean;
};

export default function JoinGroupForm({
  onSubmit,
  isSubmitting = false
}: JoinGroupFormProps) {
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState('');
  
  const handleGroupIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '');
    setGroupId(value);
    setError('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupId.trim()) {
      setError('Please enter a group ID');
      return;
    }
    
    const numericGroupId = parseInt(groupId);
    if (isNaN(numericGroupId) || numericGroupId <= 0) {
      setError('Please enter a valid group ID');
      return;
    }
    
    onSubmit(numericGroupId);
  };
  
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Join an Existing Group</h2>
        <p className="text-sm text-muted-foreground">Enter the group ID to join an existing expense group</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="groupId" className="input-label">Group ID</label>
          <input
            type="text"
            id="groupId"
            className="input-field"
            placeholder="Enter group ID number"
            value={groupId}
            onChange={handleGroupIdChange}
            required
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        
        <div className="mt-6">
          <button 
            type="submit" 
            className="btn btn-primary btn-md w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Joining Group...' : 'Join Group'}
          </button>
        </div>
      </form>
    </div>
  );
} 