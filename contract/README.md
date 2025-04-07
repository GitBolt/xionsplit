# XION Expense Splitter Smart Contract

A CosmWasm smart contract for a decentralized expense splitting and bill management application on the XION blockchain. This contract allows users to create groups, track shared expenses, and settle debts with XION tokens.

## Features

- Create expense groups with multiple members
- Record expenses and automatically calculate debt allocation
- Settle debts with on-chain XION token transfers
- Track group expense history and balances
- Join and leave groups as needed
- Get summaries of who owes what to whom
- No gas fees thanks to XION's fee-free architecture

## Contract Structure

- **Group**: Represents a collection of users who share expenses
- **Expense**: Represents a single expense with payer, amount, and split details
- **Debt**: Tracks who owes what to whom within a group

## Contract Methods

### Execute Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `create_group` | Creates a new expense group | `name`: Group name<br>`members`: Array of member addresses |
| `add_expense` | Records a new expense and calculates debts | `group_id`: Group ID<br>`description`: Expense description<br>`amount`: Amount in uxion<br>`split_between`: Members to split expense (empty for all members) |
| `settle_debt` | Settles a specific debt with another user | `group_id`: Group ID<br>`to`: Address to pay<br>`amount`: Amount to pay in uxion |
| `settle_all_debts` | Settles all debts in a group at once | `group_id`: Group ID |
| `join_group` | Joins an existing group | `group_id`: Group ID |
| `leave_group` | Leaves a group (requires no outstanding debts) | `group_id`: Group ID |

### Query Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `get_group` | Gets details of a specific group | `id`: Group ID |
| `get_user_groups` | Gets all groups a user belongs to | `user`: User address<br>`limit`: Result limit (optional)<br>`start_after`: Pagination (optional) |
| `get_expense` | Gets details of a specific expense | `id`: Expense ID |
| `get_group_expenses` | Gets all expenses for a group | `group_id`: Group ID<br>`limit`: Result limit (optional)<br>`start_after`: Pagination (optional) |
| `get_debts` | Gets all debts in a group | `group_id`: Group ID |
| `get_balance_summary` | Gets a user's balance summary in a group | `group_id`: Group ID<br>`user`: User address |

## Deployment and Usage

### Deploying the Contract

```bash
# Deploy a new contract
./deploy.sh deploy your-wallet-name
```

### Using an Existing Contract

```bash
# Use an existing contract
./deploy.sh use your-wallet-name contract-address
```

### Interactive Usage

The deploy script provides an interactive menu to:
- Create and manage groups
- Add expenses
- Settle debts
- Query balances
- And more!

## Example Workflow

1. **Create a Group**
   ```bash
   # Create a group "Apartment 42"
   ./deploy.sh use my-wallet
   # Select option 1 to create a group
   # Enter name: Apartment 42
   # Enter members: xion1abc... xion2def...
   ```

2. **Add an Expense**
   ```bash
   # Select option 2 to add an expense
   # Enter group ID: 1
   # Enter description: Groceries
   # Enter amount: 150000 (in uxion)
   ```

3. **Check Balances**
   ```bash
   # Select option 12 to view balance summary
   # Enter group ID: 1
   # Enter user address: (or press enter for your wallet)
   ```

4. **Settle a Debt**
   ```bash
   # Select option 3 to settle a debt
   # Enter group ID: 1
   # Enter recipient address: xion1abc...
   # Enter amount: 50000 (in uxion)
   ```

## CLI Usage

You can also interact with the contract directly via the `xiond` CLI:

### Creating a Group

```bash
xiond tx wasm execute $CONTRACT '{"create_group":{"name":"Apartment Expenses","members":["xion1...","xion2..."]}}' \
  --from $WALLET --gas-prices 0.025uxion --gas auto --gas-adjustment 1.3 -y \
  --node https://rpc.xion-testnet-2.burnt.com:443 --chain-id xion-testnet-2
```

### Adding an Expense

```bash
xiond tx wasm execute $CONTRACT '{"add_expense":{"group_id":1,"description":"Groceries","amount":"150000","split_between":[]}}' \
  --from $WALLET --gas-prices 0.025uxion --gas auto --gas-adjustment 1.3 -y \
  --node https://rpc.xion-testnet-2.burnt.com:443 --chain-id xion-testnet-2
```

### Settling a Debt

```bash
xiond tx wasm execute $CONTRACT '{"settle_debt":{"group_id":1,"to":"xion1...","amount":"50000"}}' \
  --from $WALLET --gas-prices 0.025uxion --gas auto --gas-adjustment 1.3 --amount 50000uxion -y \
  --node https://rpc.xion-testnet-2.burnt.com:443 --chain-id xion-testnet-2
```

### Querying Balances

```bash
xiond query wasm contract-state smart $CONTRACT '{"get_balance_summary":{"group_id":1,"user":"xion1..."}}' \
  --output json --node https://rpc.xion-testnet-2.burnt.com:443
```

## Understanding Debt Tracking

When a group member adds an expense:
1. The amount is split evenly among the specified members (or all members if none specified)
2. Each member who didn't pay now "owes" their share to the payer
3. The contract automatically calculates and records these debts

For example:
- Alice creates a group with Bob and Charlie
- Alice adds a 150 uxion grocery expense
- The contract records that Bob owes Alice 50 uxion and Charlie owes Alice 50 uxion
- Later, Bob adds a 90 uxion utility expense
- Now Alice owes Bob 30 uxion and Charlie owes Bob 30 uxion
- The net result: Bob owes Alice 20 uxion, Charlie owes Alice 50 uxion and Bob 30 uxion

## License

This project is licensed under the MIT License.
