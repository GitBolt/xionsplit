#!/bin/bash

set -e

# Configuration
CHAIN_ID="xion-testnet-2"
NODE="https://rpc.xion-testnet-2.burnt.com:443"
GAS_PRICE="0.025uxion"
GAS_ADJUSTMENT="1.3"
BINARY="./artifacts/expense_splitter.wasm"

# Usage information
show_usage() {
  echo "Usage:"
  echo "  ./deploy.sh deploy <wallet-name>        # Deploy a new contract"
  echo "  ./deploy.sh use <wallet-name> [address] # Use an existing contract"
  exit 1
}

# Check command line arguments
if [ "$#" -lt 2 ]; then
  show_usage
fi

MODE=$1
WALLET=$2
CONTRACT_ADDRESS=$3

# Process based on mode
case $MODE in
  deploy)
    echo "Deploying new contract with wallet: $WALLET"
    
    # Step 1: Optimize contract
    echo "Optimizing contract..."
    docker run --rm -v "$(pwd)":/code \
      --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
      --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
      cosmwasm/optimizer:0.16.0
    
    if [ ! -f "$BINARY" ]; then
      echo "Error: Contract binary not found at $BINARY"
      echo "Please check if the optimization was successful"
      exit 1
    fi
    
    # Step 2: Upload contract to blockchain
    echo "Uploading contract to blockchain..."
    RES=$(xiond tx wasm store $BINARY \
      --chain-id $CHAIN_ID \
      --gas-adjustment $GAS_ADJUSTMENT \
      --gas-prices $GAS_PRICE \
      --gas auto \
      -y --output json \
      --node $NODE \
      --from $WALLET)
      
    TXHASH=$(echo $RES | jq -r '.txhash')
    echo "Upload transaction hash: $TXHASH"
    
    echo "Waiting for transaction to be included in a block..."
    sleep 10

    # Step 3: Get the code ID
    CODE_ID=$(xiond query tx $TXHASH \
      --node $NODE \
      --output json | jq -r '.events[-1].attributes[1].value')
    echo "Code ID: $CODE_ID"

    # Step 4: Instantiate the contract
    MSG='{}'
    INIT_RES=$(xiond tx wasm instantiate $CODE_ID "$MSG" \
      --from $WALLET \
      --label "expense-splitter" \
      --gas-prices $GAS_PRICE \
      --gas auto \
      --gas-adjustment $GAS_ADJUSTMENT \
      -y --no-admin \
      --chain-id $CHAIN_ID \
      --node $NODE \
      --output json)

    INIT_TXHASH=$(echo $INIT_RES | jq -r '.txhash')
    echo "Instantiate transaction hash: $INIT_TXHASH"

    echo "Waiting for transaction to be included in a block..."
    sleep 10

    # Step 5: Get the contract address
    CONTRACT=$(xiond query tx $INIT_TXHASH \
      --node $NODE \
      --output json | jq -r '.events[] | select(.type == "instantiate") | .attributes[] | select(.key == "_contract_address") | .value')
    echo "Contract address: $CONTRACT"
    
    echo $CONTRACT > contract_address.txt
    echo "Contract address saved to contract_address.txt"
    
    echo "Deployment complete!"
    echo "Entering interactive mode with the new contract..."
    ;;
    
  use)
    echo "Using existing contract with wallet: $WALLET"
    
    if [ -n "$CONTRACT_ADDRESS" ]; then
      CONTRACT=$CONTRACT_ADDRESS
    else
      if [ -f "contract_address.txt" ]; then
        CONTRACT=$(cat contract_address.txt)
      fi
    fi

    if [ -z "$CONTRACT" ]; then
      echo "Contract address not found. Please enter it manually:"
      read CONTRACT
      echo $CONTRACT > contract_address.txt
    fi
    ;;
    
  *)
    echo "Invalid mode: $MODE"
    show_usage
    ;;
esac

echo "Using contract address: $CONTRACT"
echo ""

echo "You can set these environment variables in your shell:"
echo "export WALLET=$WALLET"
echo "export CONTRACT=$CONTRACT"
echo "export CHAIN_ID=$CHAIN_ID"
echo "export NODE=$NODE"
echo "export GAS_PRICE=$GAS_PRICE"
echo "export GAS_ADJUSTMENT=$GAS_ADJUSTMENT"
echo ""

# Define functions for common operations
create_group() {
  name=$1
  shift
  members_json="["
  first=true
  for member in "$@"; do
    if [ "$first" = true ]; then
      first=false
    else
      members_json="$members_json,"
    fi
    members_json="$members_json\"$member\""
  done
  members_json="$members_json]"
  
  echo "Creating group '$name' with members: $@"
  xiond tx wasm execute $CONTRACT "{\"create_group\":{\"name\":\"$name\",\"members\":$members_json}}" \
    --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT -y --node $NODE --chain-id $CHAIN_ID
}

add_expense() {
  group_id=$1
  description=$2
  amount=$3
  shift 3
  
  if [ $# -eq 0 ]; then
    split_json="[]"
  else
    split_json="["
    first=true
    for member in "$@"; do
      if [ "$first" = true ]; then
        first=false
      else
        split_json="$split_json,"
      fi
      split_json="$split_json\"$member\""
    done
    split_json="$split_json]"
  fi
  
  echo "Adding expense '$description' for $amount to group $group_id"
  if [ $# -gt 0 ]; then
    echo "Split between specific members: $@"
  else
    echo "Split between all group members"
  fi
  
  xiond tx wasm execute $CONTRACT "{\"add_expense\":{\"group_id\":$group_id,\"description\":\"$description\",\"amount\":\"$amount\",\"split_between\":$split_json}}" \
    --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT -y --node $NODE --chain-id $CHAIN_ID
}

settle_debt() {
  group_id=$1
  to_address=$2
  amount=$3
  
  echo "Settling debt of $amount to $to_address in group $group_id..."
  xiond tx wasm execute $CONTRACT "{\"settle_debt\":{\"group_id\":$group_id,\"to\":\"$to_address\",\"amount\":\"$amount\"}}" \
    --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT --amount ${amount}uxion \
    -y --node $NODE --chain-id $CHAIN_ID
}

settle_all_debts() {
  group_id=$1
  total_debt=$2
  
  echo "Settling all debts in group $group_id (total: $total_debt uxion)..."
  xiond tx wasm execute $CONTRACT "{\"settle_all_debts\":{\"group_id\":$group_id}}" \
    --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT --amount ${total_debt}uxion \
    -y --node $NODE --chain-id $CHAIN_ID
}

join_group() {
  group_id=$1
  
  echo "Joining group $group_id..."
  xiond tx wasm execute $CONTRACT "{\"join_group\":{\"group_id\":$group_id}}" \
    --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT -y --node $NODE --chain-id $CHAIN_ID
}

leave_group() {
  group_id=$1
  
  echo "Leaving group $group_id..."
  xiond tx wasm execute $CONTRACT "{\"leave_group\":{\"group_id\":$group_id}}" \
    --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT -y --node $NODE --chain-id $CHAIN_ID
}

query_group() {
  group_id=$1
  
  echo "Querying group $group_id..."
  xiond query wasm contract-state smart $CONTRACT "{\"get_group\":{\"id\":$group_id}}" --output json --node $NODE
}

query_user_groups() {
  user=$1
  limit=${2:-10}
  start_after=${3:-null}
  
  if [ "$start_after" = "null" ]; then
    start_query="{\"get_user_groups\":{\"user\":\"$user\",\"limit\":$limit}}"
  else
    start_query="{\"get_user_groups\":{\"user\":\"$user\",\"limit\":$limit,\"start_after\":$start_after}}"
  fi
  
  echo "Querying groups for user $user (limit: $limit, start_after: $start_after)..."
  xiond query wasm contract-state smart $CONTRACT "$start_query" --output json --node $NODE
}

query_expense() {
  expense_id=$1
  
  echo "Querying expense $expense_id..."
  xiond query wasm contract-state smart $CONTRACT "{\"get_expense\":{\"id\":$expense_id}}" --output json --node $NODE
}

query_group_expenses() {
  group_id=$1
  limit=${2:-10}
  start_after=${3:-null}
  
  if [ "$start_after" = "null" ]; then
    expenses_query="{\"get_group_expenses\":{\"group_id\":$group_id,\"limit\":$limit}}"
  else
    expenses_query="{\"get_group_expenses\":{\"group_id\":$group_id,\"limit\":$limit,\"start_after\":$start_after}}"
  fi
  
  echo "Querying expenses for group $group_id (limit: $limit, start_after: $start_after)..."
  xiond query wasm contract-state smart $CONTRACT "$expenses_query" --output json --node $NODE
}

query_debts() {
  group_id=$1
  
  echo "Querying all debts in group $group_id..."
  xiond query wasm contract-state smart $CONTRACT "{\"get_debts\":{\"group_id\":$group_id}}" --output json --node $NODE
}

query_balance() {
  group_id=$1
  user=$2
  
  echo "Querying balance summary for $user in group $group_id..."
  result=$(xiond query wasm contract-state smart $CONTRACT "{\"get_balance_summary\":{\"group_id\":$group_id,\"user\":\"$user\"}}" --output json --node $NODE)
  
  # Display the full JSON response
  echo "$result"
  
  echo ""
  echo "BALANCE SUMMARY EXPLANATION:"
  echo "============================"
  
  # Extract data
  total_owed=$(echo "$result" | jq -r '.data.total_owed')
  total_owed_to=$(echo "$result" | jq -r '.data.total_owed_to')
  net_balance=$(echo "$result" | jq -r '.data.net_balance')
  
  echo "Total you owe to others: $total_owed uxion"
  echo "Total others owe to you: $total_owed_to uxion"
  echo "Your net balance: $net_balance uxion"
  
  echo ""
  echo "DETAILED BALANCES:"
  balances=$(echo "$result" | jq -r '.data.balances')
  count=$(echo "$balances" | jq 'length')
  
  if [ "$count" -eq "0" ]; then
    echo "No outstanding balances."
  else
    echo "$balances" | jq -c '.[]' | while read -r balance; do
      other_user=$(echo "$balance" | jq -r '.other_user')
      amount=$(echo "$balance" | jq -r '.amount')
      direction=$(echo "$balance" | jq -r '.direction')
      
      if [ "$direction" -eq "1" ]; then
        echo "- $other_user owes you $amount uxion"
      else
        echo "- You owe $other_user $amount uxion"
      fi
    done
  fi
}

# Show contract usage examples
show_examples() {
  echo ""
  echo "EXPENSE SPLITTER CONTRACT - USAGE EXAMPLES"
  echo "=========================================="
  echo ""
  echo "Create a group with members:"
  echo "xiond tx wasm execute $CONTRACT '{\"create_group\":{\"name\":\"Apartment Expenses\",\"members\":[\"xion1...\",\"xion2...\"]}}' --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT -y --node $NODE --chain-id $CHAIN_ID"
  echo ""
  echo "Add an expense (split among all members):"
  echo "xiond tx wasm execute $CONTRACT '{\"add_expense\":{\"group_id\":1,\"description\":\"Groceries\",\"amount\":\"1000000\",\"split_between\":[]}}' --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT -y --node $NODE --chain-id $CHAIN_ID"
  echo ""
  echo "Settle a debt (replace TO_ADDRESS and AMOUNT with actual values):"
  echo "xiond tx wasm execute $CONTRACT '{\"settle_debt\":{\"group_id\":1,\"to\":\"TO_ADDRESS\",\"amount\":\"AMOUNT\"}}' --from $WALLET --gas-prices $GAS_PRICE --gas auto --gas-adjustment $GAS_ADJUSTMENT --amount AMOUNTuxion -y --node $NODE --chain-id $CHAIN_ID"
  echo ""
  echo "Query your balance in a group:"
  echo "ADDR=\$(xiond keys show -a $WALLET)"
  echo "xiond query wasm contract-state smart $CONTRACT '{\"get_balance_summary\":{\"group_id\":1,\"user\":\"'\$ADDR'\"}}' --output json --node $NODE"
  echo ""
  echo "Query all debts in a group:"
  echo "xiond query wasm contract-state smart $CONTRACT '{\"get_debts\":{\"group_id\":1}}' --output json --node $NODE"
}

# Menu system
show_menu() {
  echo ""
  echo "Expense Splitter Contract Commands"
  echo "=================================="
  echo ""
  echo "EXECUTE COMMANDS:"
  echo "1) Create a group"
  echo "2) Add an expense"
  echo "3) Settle a debt"
  echo "4) Settle all debts"
  echo "5) Join a group"
  echo "6) Leave a group"
  echo ""
  echo "QUERY COMMANDS:"
  echo "7) Query a group"
  echo "8) Query user's groups"
  echo "9) Query an expense"
  echo "10) Query group expenses"
  echo "11) Query all debts in a group"
  echo "12) Query balance summary"
  echo ""
  echo "OTHER:"
  echo "13) Show usage examples"
  echo "14) Exit"
  echo ""
  echo "Enter your choice: "
}

# Example addresses for quick use
EXAMPLE_ADDR1="xion1vng7gkz6j5m4xhrxec9r2jpjkjrukjklhvgztu"
EXAMPLE_ADDR2="xion1zfp2dpahyn3w0zff8ugppn649yzu59jnpgym56"

# Print welcome message and examples if just deployed
if [ "$MODE" = "deploy" ]; then
  show_examples
fi

# Main execution loop
while true; do
  show_menu
  read choice
  
  case $choice in
    1)
      echo "Enter group name:"
      read name
      echo "Enter member addresses (space-separated, or press enter for none):"
      read -a members
      create_group "$name" "${members[@]}"
      ;;
    2)
      echo "Enter group ID:"
      read group_id
      echo "Enter expense description:"
      read description
      echo "Enter amount (in uxion):"
      read amount
      echo "Enter addresses to split between (space-separated, or press enter for all members):"
      read -a split_between
      add_expense $group_id "$description" $amount "${split_between[@]}"
      ;;
    3)
      echo "Enter group ID:"
      read group_id
      echo "Enter recipient address:"
      read to_address
      echo "Enter amount (in uxion):"
      read amount
      settle_debt $group_id "$to_address" $amount
      ;;
    4)
      echo "Enter group ID:"
      read group_id
      echo "Enter total debt amount to settle (in uxion):"
      read total_amount
      settle_all_debts $group_id $total_amount
      ;;
    5)
      echo "Enter group ID to join:"
      read group_id
      join_group $group_id
      ;;
    6)
      echo "Enter group ID to leave:"
      read group_id
      leave_group $group_id
      ;;
    7)
      echo "Enter group ID:"
      read group_id
      query_group $group_id
      ;;
    8)
      echo "Enter user address (or press enter for $WALLET):"
      read user
      user=${user:-$WALLET}
      echo "Enter limit (or press enter for default 10):"
      read limit
      limit=${limit:-10}
      echo "Enter start_after ID (or press enter for none):"
      read start_after
      start_after=${start_after:-null}
      query_user_groups "$user" $limit $start_after
      ;;
    9)
      echo "Enter expense ID:"
      read expense_id
      query_expense $expense_id
      ;;
    10)
      echo "Enter group ID:"
      read group_id
      echo "Enter limit (or press enter for default 10):"
      read limit
      limit=${limit:-10}
      echo "Enter start_after ID (or press enter for none):"
      read start_after
      start_after=${start_after:-null}
      query_group_expenses $group_id $limit $start_after
      ;;
    11)
      echo "Enter group ID:"
      read group_id
      query_debts $group_id
      ;;
    12)
      echo "Enter group ID:"
      read group_id
      echo "Enter user address (or press enter for $WALLET):"
      read user
      user=${user:-$WALLET}
      query_balance $group_id "$user"
      ;;
    13)
      show_examples
      ;;
    14)
      echo "Exiting..."
      exit 0
      ;;
    *)
      echo "Invalid choice. Please try again."
      ;;
  esac
done 