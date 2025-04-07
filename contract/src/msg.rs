use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Uint128};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::state::{Group, Expense, Debt};

#[cw_serde]
pub struct InstantiateMsg {
    // No specific initialization parameters needed
}

#[cw_serde]
pub enum ExecuteMsg {
    // Create a new expense group
    CreateGroup { 
        name: String,
        members: Vec<String>, // List of member addresses
    },
    
    // Add an expense to a group
    AddExpense { 
        group_id: u64,
        description: String,
        amount: Uint128,
        split_between: Vec<String>, // Defaults to all group members if empty
    },
    
    // Settle a debt (pay money to another user)
    SettleDebt { 
        group_id: u64,
        to: String, // Address to pay
        amount: Uint128,
    },
    
    // Mark all expenses as settled in a group
    SettleAllDebts {
        group_id: u64,
    },
    
    // Join an existing group
    JoinGroup {
        group_id: u64,
    },
    
    // Leave a group
    LeaveGroup {
        group_id: u64,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    // Get a specific group by ID
    #[returns(GroupResponse)]
    GetGroup { 
        id: u64 
    },
    
    // Get all groups a user belongs to
    #[returns(GroupsResponse)]
    GetUserGroups { 
        user: String,
        limit: Option<u32>,
        start_after: Option<u64>,
    },
    
    // Get a specific expense
    #[returns(ExpenseResponse)]
    GetExpense { 
        id: u64 
    },
    
    // Get all expenses for a group
    #[returns(ExpensesResponse)]
    GetGroupExpenses { 
        group_id: u64,
        limit: Option<u32>,
        start_after: Option<u64>,
    },
    
    // Get all debts between users in a group
    #[returns(DebtsResponse)]
    GetDebts { 
        group_id: u64 
    },
    
    // Get summary of balances for a user in a group
    #[returns(BalanceSummaryResponse)]
    GetBalanceSummary { 
        group_id: u64,
        user: String,
    },
}

// Response types
#[cw_serde]
pub struct GroupResponse {
    pub group: Group,
}

#[cw_serde]
pub struct GroupsResponse {
    pub groups: Vec<Group>,
}

#[cw_serde]
pub struct ExpenseResponse {
    pub expense: Expense,
}

#[cw_serde]
pub struct ExpensesResponse {
    pub expenses: Vec<Expense>,
}

#[cw_serde]
pub struct DebtsResponse {
    pub debts: Vec<Debt>,
}

// Individual balance with another user
#[cw_serde]
pub struct Balance {
    pub other_user: Addr,
    pub amount: Uint128,  // Always a positive amount 
    pub direction: i8,    // 1 if user is owed money, -1 if user owes money
}

#[cw_serde]
pub struct BalanceSummaryResponse {
    pub balances: Vec<Balance>,
    pub total_owed: Uint128,      // Total amount user owes others
    pub total_owed_to: Uint128,   // Total amount owed to user
    pub net_balance: Uint128,     // Net balance (total_owed_to - total_owed, or 0 if negative)
}
