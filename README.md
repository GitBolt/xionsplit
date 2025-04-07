# XION Split

XION Split is a decentralized expense splitting application built on the XION blockchain. This application allows users to create groups, track shared expenses, and settle debts using XION tokens.

## Project Overview

This project consists of two main components:

1. **Smart Contract**: A CosmWasm-based smart contract deployed on the XION blockchain that handles all expense tracking and debt calculation logic.
2. **Frontend**: A modern web application built with Next.js and React that provides an intuitive interface for users to interact with the expense splitting system.

## Key Features

- **Create Expense Groups**: Create groups with multiple members for tracking shared expenses in various contexts (roommates, trips, events, etc.)
- **Track Expenses**: Add expenses and automatically calculate how they should be split among group members
- **View Balances**: See who owes what to whom within each group with detailed balance summaries
- **Settle Debts**: Pay directly with XION tokens to settle debts with other group members
- **Join/Leave Groups**: Flexibility to join existing groups or leave groups when no longer needed
- **Walletless Experience**: Seamless login with Abstraxion wallet integration for a smooth user experience

## Smart Contract Capabilities

The core functionality is powered by a CosmWasm smart contract that provides:

- Group management (creation, membership)
- Expense tracking with customizable splitting
- Debt calculation and tracking
- Balance summaries and reporting
- Direct settlement using XION tokens

## Technology Stack

- **Blockchain**: XION Network (Cosmos-based chain)
- **Smart Contract**: CosmWasm (Rust)
- **Frontend**: Next.js, React, TailwindCSS
- **Wallet Integration**: Abstraxion (@burnt-labs/abstraxion)

## How It Works

1. Users connect to the application using the Abstraxion wallet
2. They can create new expense groups or join existing ones
3. Within groups, members can add expenses that are automatically split
4. The smart contract calculates and tracks all debts between members
5. Users can view their balance summaries to see what they owe or are owed
6. Debts can be settled directly through token transfers on the XION blockchain

## Benefits of Building on XION

- **Fee-Free Transactions**: XION's fee-free structure makes small debt settlements practical
- **Fast Settlement**: Quick transaction confirmations
- **User-Friendly**: Walletless experience for easier onboarding
- **Secure & Transparent**: All expense data and settlements recorded on-chain 