import React from 'react';
import ExpenseCard from './ExpenseCard';

type ExpenseItemProps = {
  id: number;
  description: string;
  amount: string;
  paidBy: string;
  createdAt: number;
  splitBetween: string[];
  currentUser?: string;
  onClick?: () => void;
};

export default function ExpenseItem({
  id,
  description,
  amount,
  paidBy,
  createdAt,
  splitBetween,
  currentUser,
  onClick
}: ExpenseItemProps) {
  // Convert string amount to number
  const numericAmount = parseInt(amount);
  
  // Convert timestamp to ISO date string - handle potential invalid timestamps
  let dateString;
  try {
    const date = new Date(createdAt * 1000);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date encountered for expense ${id}: ${createdAt}`);
      dateString = new Date().toISOString(); // Fallback to current date
    } else {
      dateString = date.toISOString();
    }
  } catch (error) {
    console.error(`Error converting date for expense ${id}:`, error);
    dateString = new Date().toISOString(); // Fallback to current date
  }
  
  // Use our new ExpenseCard component
  return (
    <div onClick={onClick} className="cursor-pointer">
      <ExpenseCard
        id={id}
        description={description}
        amount={numericAmount}
        paidBy={paidBy}
        createdAt={dateString}
        splitBetween={splitBetween}
        currentUser={currentUser}
      />
    </div>
  );
} 