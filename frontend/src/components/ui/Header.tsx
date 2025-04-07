import React from 'react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Button from './Button';
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { formatAddress } from "@/lib/contract";
import { UserCircleIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal] = useModal();
  
  const isConnected = !!account?.bech32Address;
  const formattedAddress = isConnected ? formatAddress(account.bech32Address) : '';

  return (
    <div className="flex items-center justify-between h-full w-full">
      <div className="flex items-center">
        <h1 className="font-bold text-xl">Expense Splitter</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {isConnected ? (
          <div className="flex items-center gap-2 py-1.5 px-3 rounded-md bg-secondary/80 cursor-pointer hover:bg-secondary" onClick={() => setShowModal(true)}>
            <UserCircleIcon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{formattedAddress}</span>
          </div>
        ) : (
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-primary btn-sm"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
} 