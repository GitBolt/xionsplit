import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

export type ExecuteResultOrUndefined = ExecuteResult | undefined;

export type Group = {
  id: number;
  name: string;
  members: string[];
  created_at: number;
  creator: string;
};

export type Expense = {
  id: number;
  group_id: number;
  description: string;
  amount: string;
  paid_by: string;
  split_between: string[];
  created_at: number;
};

export type Debt = {
  from: string;
  to: string;
  amount: string;
};

export type BalanceSummary = {
  total_owed: string;
  total_owed_to: string;
  net_balance: string;
  balances: {
    other_user: string;
    amount: string;
    direction: number; // 0 = you owe them, 1 = they owe you
  }[];
};

export type PaginationParams = {
  limit?: number;
  start_after?: number;
};

export type GroupsResponse = {
  groups: Group[];
  next_key?: number;
};

export type ExpensesResponse = {
  expenses: Expense[];
  next_key?: number;
};

export type DebtsResponse = {
  debts: Debt[];
};

export type ContractQueryMsg = 
  | { get_group: { id: number } }
  | { get_user_groups: { user: string } & PaginationParams }
  | { get_expense: { id: number } }
  | { get_group_expenses: { group_id: number } & PaginationParams }
  | { get_debts: { group_id: number } }
  | { get_balance_summary: { group_id: number, user: string } };

export type ContractExecuteMsg = 
  | { create_group: { name: string, members: string[] } }
  | { join_group: { group_id: number } }
  | { leave_group: { group_id: number } }
  | { add_expense: { group_id: number, description: string, amount: string, split_between: string[] } }
  | { settle_debt: { group_id: number, to: string, amount: string } }
  | { settle_all_debts: { group_id: number } }; 