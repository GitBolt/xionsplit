import type { SigningCosmWasmClient, CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import {
  Group,
  Expense,
  Debt,
  BalanceSummary,
  PaginationParams,
  GroupsResponse,
  ExpensesResponse,
  DebtsResponse,
  ExecuteResultOrUndefined
} from "./types";

// Constants
export const CONTRACT_ADDRESS = "xion16rk62lsp89g8ehm9yf3fs0nsdxd4aqydmz9vah4lfncg8pp8nzqqmwwnun"; // Replace with your actual contract address
export const EXPLORER_URL = "https://explorer.burnt.com/xion-testnet-2";

// Format address for display (first 6 and last 4 chars)
export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Format currency
export const formatCurrency = (amount: string): string => {
  try {
    const numericAmount = parseInt(amount) / 1000000; // Convert uxion to XION
    return numericAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  } catch (error) {
    console.error("Error formatting currency:", error);
    return amount;
  }
};

// Format date for display
export const formatDate = (timestamp: number): string => {
  if (!timestamp) return "";

  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Format time elapsed since creation
export const formatTimeAgo = (timestamp: number): string => {
  if (!timestamp) return "";

  const now = Math.floor(Date.now() / 1000);
  const seconds = now - timestamp;

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

  return formatDate(timestamp);
};

// Get a single group by ID
export const getGroup = async (client: CosmWasmClient | null, id: number): Promise<Group | null> => {
  if (!client) return null;

  try {
    const response = await client.queryContractSmart(CONTRACT_ADDRESS, {
      get_group: { id }
    });

    return response.group;
  } catch (error) {
    console.error("Error fetching group:", error);
    return null;
  }
};

// Get user's groups with pagination
export const getUserGroups = async (
  client: CosmWasmClient | null,
  user: string,
  params: PaginationParams = {}
): Promise<GroupsResponse | null> => {
  if (!client) return null;

  try {
    const response = await client.queryContractSmart(CONTRACT_ADDRESS, {
      get_user_groups: {
        user,
        ...params
      }
    });

    return response;
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return null;
  }
};

// Get a single expense by ID
export const getExpense = async (client: CosmWasmClient | null, id: number): Promise<Expense | null> => {
  if (!client) return null;

  try {
    const response = await client.queryContractSmart(CONTRACT_ADDRESS, {
      get_expense: { id }
    });

    return response.expense;
  } catch (error) {
    console.error("Error fetching expense:", error);
    return null;
  }
};

// Get group expenses with pagination
export const getGroupExpenses = async (
  client: CosmWasmClient | null,
  groupId: number,
  params: PaginationParams = {}
): Promise<ExpensesResponse | null> => {
  if (!client) return null;

  try {
    const response = await client.queryContractSmart(CONTRACT_ADDRESS, {
      get_group_expenses: {
        group_id: groupId,
        ...params
      }
    });

    return response;
  } catch (error) {
    console.error("Error fetching group expenses:", error);
    return null;
  }
};

// Get all debts in a group
export const getDebts = async (client: CosmWasmClient | null, groupId: number): Promise<any> => {
  if (!client) return null;

  try {
    console.log(`Fetching debts for group ${groupId}`);
    const response = await client.queryContractSmart(CONTRACT_ADDRESS, {
      get_debts: {
        group_id: groupId
      }
    });

    console.log("Raw debts response:", JSON.stringify(response));

    // Handle different response formats
    // 1. Standard { debts: [...] } format
    if (response && response.debts) {
      console.log("Standard debts object format detected");
      return response;
    }

    // 2. Direct array format
    if (Array.isArray(response)) {
      console.log("Direct debts array format detected");
      return response; // Return the array directly
    }

    // 3. Empty or unexpected format
    console.warn("Unexpected debt response format:", response);
    return { debts: [] };
  } catch (error) {
    console.error("Error fetching debts:", error);
    return null;
  }
};

// Get balance summary for a user in a group
export async function getBalanceSummary(client: CosmWasmClient, groupId: number, address: string): Promise<BalanceSummary | null> {
  try {
    console.log(`Fetching balance summary for group ${groupId} and user ${address}`);
    const response = await client.queryContractSmart(CONTRACT_ADDRESS, {
      get_balance_summary: {
        group_id: groupId,
        user: address
      }
    });

    console.log("Raw balance summary response:", JSON.stringify(response));

    // The API can return the summary in different formats
    let summary: BalanceSummary | null = null;

    // Format 1: { data: { summary: { ... } } }
    if (response?.summary) {
      console.log("Format 1: response.summary");
      summary = response.summary;
    }
    // Format 2: { data: { balances: [...], total_owed: "...", etc } }
    else if (response?.data && response.data.balances) {
      console.log("Format 2: response.data with balances");
      summary = {
        total_owed: response.data.total_owed,
        total_owed_to: response.data.total_owed_to,
        net_balance: response.data.net_balance,
        balances: response.data.balances
      };
    }
    // Format 3: Direct { balances: [...], total_owed: "...", etc }
    else if (response?.balances) {
      console.log("Format 3: direct balances object");
      summary = {
        total_owed: response.total_owed,
        total_owed_to: response.total_owed_to,
        net_balance: response.net_balance,
        balances: response.balances
      };
    }

    if (summary) {
      console.log("Parsed balance summary:", summary);
      return summary;
    } else {
      console.warn("No balance summary found in response:", response);
      // Return a default balance summary with zero values when data not available
      return {
        total_owed: "0",
        total_owed_to: "0",
        net_balance: "0",
        balances: []
      };
    }
  } catch (error) {
    console.error("Error fetching balance summary:", error);
    return null;
  }
}

// Create a new group
export const createGroup = async (
  client: SigningCosmWasmClient | null,
  sender: string,
  name: string,
  members: string[]
): Promise<ExecuteResultOrUndefined> => {
  if (!client || !sender) {
    throw new Error("Client or sender address not available");
  }

  const msg = {
    create_group: {
      name,
      members: Array.from(new Set([...members, sender])) // Ensure sender is included
    }
  };

  try {
    return await client.execute(
      sender,
      CONTRACT_ADDRESS,
      msg,
      "auto"
    );
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

// Join a group
export const joinGroup = async (
  client: SigningCosmWasmClient | null,
  sender: string,
  groupId: number
): Promise<ExecuteResultOrUndefined> => {
  if (!client || !sender) {
    throw new Error("Client or sender address not available");
  }

  const msg = {
    join_group: {
      group_id: groupId
    }
  };

  try {
    return await client.execute(
      sender,
      CONTRACT_ADDRESS,
      msg,
      "auto"
    );
  } catch (error) {
    console.error("Error joining group:", error);
    throw error;
  }
};

// Leave a group
export const leaveGroup = async (
  client: SigningCosmWasmClient | null,
  sender: string,
  groupId: number
): Promise<ExecuteResultOrUndefined> => {
  if (!client || !sender) {
    throw new Error("Client or sender address not available");
  }

  const msg = {
    leave_group: {
      group_id: groupId
    }
  };

  try {
    return await client.execute(
      sender,
      CONTRACT_ADDRESS,
      msg,
      "auto"
    );
  } catch (error) {
    console.error("Error leaving group:", error);
    throw error;
  }
};

// Add an expense
export const addExpense = async (
  client: SigningCosmWasmClient | null,
  sender: string,
  groupId: number,
  description: string,
  amount: string,
  splitBetween: string[] = []
): Promise<ExecuteResultOrUndefined> => {
  if (!client || !sender) {
    throw new Error("Client or sender address not available");
  }

  const msg = {
    add_expense: {
      group_id: groupId,
      description,
      amount,
      split_between: splitBetween
    }
  };

  try {
    return await client.execute(
      sender,
      CONTRACT_ADDRESS,
      msg,
      "auto"
    );
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

// Check if a debt exists
export const checkDebtExists = async (
  client: CosmWasmClient | null,
  groupId: number,
  from: string,
  to: string
): Promise<boolean> => {
  if (!client) {
    console.error("Client not available");
    return false;
  }

  try {
    // Query for debts in this group
    const queryMsg = {
      get_debts: {
        group_id: groupId
      }
    };

    const result = await client.queryContractSmart(CONTRACT_ADDRESS, queryMsg);
    console.log("Raw debt query result:", result);

    // Check for debts field
    const debts = result.debts || [];

    // Find any debt that matches exactly the same from, to, and has non-zero amount
    const foundDebt = debts.find((debt: any) => {
      // Check different possible formats
      if (debt.from && debt.to) {
        return debt.from === from && debt.to === to && debt.amount && debt.amount !== "0";
      } else if (debt.debtor && debt.creditor) {
        return debt.debtor === from && debt.creditor === to && debt.amount && debt.amount !== "0";
      }
      return false;
    });

    console.log("Debt exists check:", !!foundDebt, "details:", foundDebt);

    return !!foundDebt;
  } catch (error) {
    console.error("Error checking if debt exists:", error);
    return false;
  }
};
// Settle a debt
export const settleDebt = async (
  client: SigningCosmWasmClient | null,
  sender: string,
  groupId: number,
  to: string,
  amount: string
): Promise<ExecuteResultOrUndefined> => {
  if (!client || !sender) {
    throw new Error("Client or sender address not available");
  }
  
  console.log(`Settling debt: sender=${sender}, group=${groupId}, to=${to}, amount=${amount}`);
  
  // First check if the debt exists in the contract
  const debtExists = await checkDebtExists(client, groupId, sender, to);
  if (!debtExists) {
    throw new Error(
      "No debt exists from you to this recipient in the contract. The debt may have already been settled or never existed."
    );
  }
  
  const msg = {
    settle_debt: {
      group_id: groupId,
      to:"xion1zfp2dpahyn3w0zff8ugppn649yzu59jnpgym56",
      amount
    }
  };
  
  try {
    // Add the funds parameter to send the uxion tokens with the transaction
    const funds = [
      {
        denom: "uxion",
        amount: amount
      }
    ];
    
    console.log(`Executing settle_debt with funds:`, funds);
    console.log("🚀 About to settle debt as:", sender);
    console.log("🧾 Debt details:", { debtor: sender, creditor: to, amount });
    

    // Execute the transaction with the included funds and gas options
    
    const result = await client.execute(
      sender,
      CONTRACT_ADDRESS,
      msg,
      "auto", // Use custom gas options instead of "auto"
      undefined, // memo
      funds // Include the tokens with the transaction
    );
    
    console.log("Settle debt result:", result);
    return result;
  } catch (error: any) {
    console.error("Error settling debt:", error);
    
    // Provide more detailed error information for debugging
    if (error.message) {
      console.error("Original error message:", error.message);
      
      // Try to extract the detailed error from the Cosmos SDK response
      const errorMatch = error.message.match(/with error: (.*?)(,|$)/);
      if (errorMatch && errorMatch[1]) {
        console.error("Contract error details:", errorMatch[1]);
      }
    }
    
    // Provide more helpful error messages to the user
    if (error.message && error.message.includes("unauthorized")) {
      throw new Error(
        "Unauthorized: You may not be the debtor for this debt, or you don't have permission to settle it."
      );
    } else if (error.message && error.message.includes("insufficient funds")) {
      throw new Error(
        "Insufficient funds: You don't have enough XION tokens to settle this debt."
      );
    } else if (error.message && error.message.includes("no debt exists")) {
      throw new Error(
        "No debt exists: The contract did not find any debt from you to this recipient."
      );
    }
    
    throw error;
  }
};
// Settle all debts in a group
export const settleAllDebts = async (
  client: SigningCosmWasmClient | null,
  sender: string,
  groupId: number,
  totalAmount?: string // Made optional
): Promise<ExecuteResultOrUndefined> => {
  if (!client || !sender) {
    throw new Error("Client or sender address not available");
  }

  console.log(`Settling all debts: sender=${sender}, group=${groupId}`);

  // If totalAmount is not provided, get all debts and calculate total
  let fundsToSend = totalAmount;

  if (!fundsToSend) {
    try {
      // Query debts to calculate total amount owed
      const debtsResult = await getDebts(client, groupId);
      let allDebts: any[] = [];

      if (Array.isArray(debtsResult)) {
        allDebts = debtsResult;
      } else if (debtsResult && Array.isArray(debtsResult.debts)) {
        allDebts = debtsResult.debts;
      }

      // Calculate total amount sender owes
      let total = BigInt(0);

      for (const debt of allDebts) {
        const debtor = debt.from || debt.debtor;
        if (debtor === sender && debt.amount) {
          total += BigInt(debt.amount);
        }
      }

      fundsToSend = total.toString();
      console.log(`Calculated total amount to send: ${fundsToSend}`);
    } catch (error) {
      console.error("Error calculating total debt amount:", error);
      throw new Error("Failed to calculate total debt amount. Please provide the amount manually.");
    }
  }

  if (!fundsToSend || fundsToSend === "0") {
    throw new Error("No debts to settle or total amount is zero.");
  }

  const msg = {
    settle_all_debts: {
      group_id: groupId
    }
  };

  try {
    // Add the funds parameter to send the uxion tokens with the transaction
    const funds = [
      {
        denom: "uxion",
        amount: fundsToSend
      }
    ];

    console.log(`Executing settle_all_debts with funds:`, funds);

    // Execute the transaction with the included funds
    const result = await client.execute(
      sender,
      CONTRACT_ADDRESS,
      msg,
      "auto",
      undefined, // memo
      funds      // Include the tokens with the transaction
    );

    console.log("Settle all debts result:", result);
    return result;
  } catch (error: any) {
    console.error("Error settling all debts:", error);

    // Provide more helpful error messages
    if (error.message && error.message.includes("unauthorized")) {
      throw new Error(
        "Unauthorized: You may not have permission to settle these debts."
      );
    } else if (error.message && error.message.includes("insufficient funds")) {
      throw new Error(
        "Insufficient funds: You don't have enough XION tokens to settle all debts."
      );
    } else if (error.message && error.message.includes("no debt exists")) {
      throw new Error(
        "No debts to settle: You don't have any outstanding debts in this group."
      );
    }

    throw error;
  }
};

// Helper functions
export const getBlockExplorerUrl = (txHash?: string): string => {
  return txHash
    ? `${EXPLORER_URL}/tx/${txHash}`
    : EXPLORER_URL;
}; 