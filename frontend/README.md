# XION Content Pass dApp

A dApp built on the XION Network that demonstrates a walletless subscription model for premium content. Users can subscribe to different tiers to access exclusive content.

## Features

- Connect to the XION Network with Abstraxion Wallet (walletless login)
- View premium content when subscribed
- Subscribe to different tiers (basic and premium)
- View subscription status and expiration date
- See community stats (number of subscribers)
- View transaction details

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Blockchain**: XION Network (Cosmos-based chain)
- **Wallet Integration**: Abstraxion (@burnt-labs/abstraxion)

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How It Works

1. The app connects to XION Network via the Abstraxion wallet provider
2. Users can connect their wallet by clicking "Connect" (using Google login)
3. Once connected, users can see their subscription status
4. If not subscribed, users can select a tier (basic or premium) and subscribe
5. Subscribers can access premium content
6. Subscription status and community stats are displayed

## Contract Commands

Here are some basic commands for interacting with the content subscription contract:

```bash
# Query content URI
xiond query wasm contract-state smart $CONTRACT '{"get_content":{}}' --output json --node $NODE

# Subscribe (basic tier)
xiond tx wasm execute $CONTRACT '{"subscribe":{"tier":"basic"}}' --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT -y --node $NODE --chain-id $CHAIN_ID

# Subscribe (premium tier)
xiond tx wasm execute $CONTRACT '{"subscribe":{"tier":"premium"}}' --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT -y --node $NODE --chain-id $CHAIN_ID

# Check your subscription
SUBSCRIBER=$(xiond keys show -a $WALLET)
xiond query wasm contract-state smart $CONTRACT '{"get_subscription":{"subscriber":"'$SUBSCRIBER'"}}' --output json --node $NODE

# Get subscriber count
xiond query wasm contract-state smart $CONTRACT '{"get_subscriber_count":{}}' --output json --node $NODE
```

## Auto-Execution Feature

The contract leverages XION's auto-execution feature to automatically manage subscriptions:
- Checks subscription statuses every 30 days
- Extends access for active subscribers by updating expiration timestamps
- Revokes access for expired subscriptions

## Development

You can customize and extend this dApp by modifying:

- `src/app/page.tsx`: Main application UI and logic
- `src/app/layout.tsx`: Layout configuration including Abstraxion provider
- `src/app/globals.css`: Global styles and Tailwind customizations

## Resources

- [XION Network Documentation](https://docs.xion.burnt.com/)
- [Abstraxion Wallet Documentation](https://github.com/burnt-labs/abstraxion)
- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
