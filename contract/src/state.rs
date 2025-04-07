use cosmwasm_std::{Addr, Timestamp, Uint128};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
// Represents a single group of users who share expenses
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Group {
    pub id: u64,
    pub name: String,
    pub creator: Addr,
    pub members: Vec<Addr>,
    pub created_at: Timestamp,

// Represents a single expense posted by a user
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Expense {
    pub id: u64,
    pub group_id: u64,
    pub description: String,
    pub amount: Uint128,
    pub paid_by: Addr,
    pub split_between: Vec<Addr>, // Who shares this expense
    pub timestamp: Timestamp,
    pub settled: bool,
}
// Tracks a debt between two users
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Debt {
    pub debtor: Addr,    // User who owes money
    pub creditor: Addr,  // User who is owed money
    pub amount: Uint128, // Amount owed
}
// Store counters for auto-incrementing IDs
pub const GROUP_COUNT: Item<u64> = Item::new("group_count");

// Store all groups by ID

// Store all expenses by ID

// Map a user to the groups they belong to: user_addr -> Vec<group_id>

// Map a group to the expenses associated with it: group_id -> Vec<expense_id>

// Store debts by (group_id, debtor, creditor) -> amount
pub const DEBTS: Map<(u64, &Addr, &Addr), Uint128> = Map::new("debts");
