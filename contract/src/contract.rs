#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, Addr, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env, MessageInfo, 
    Response, StdError, StdResult, Uint128,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{
    ExecuteMsg, InstantiateMsg, QueryMsg, GroupResponse, GroupsResponse,
    ExpenseResponse, ExpensesResponse, DebtsResponse, Balance, BalanceSummaryResponse
};
use crate::state::{
    Group, Expense, Debt, GROUP_COUNT, EXPENSE_COUNT, GROUPS, EXPENSES, 
    USER_GROUPS, GROUP_EXPENSES, DEBTS
};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:expense-splitter";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

// Maximum length of group name
const MAX_GROUP_NAME_LENGTH: usize = 64;

// Maximum length of expense description
const MAX_EXPENSE_DESCRIPTION_LENGTH: usize = 128;

// Maximum number of members in a group
const MAX_GROUP_MEMBERS: usize = 50;

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    
    // Initialize group and expense counters to 0
    GROUP_COUNT.save(deps.storage, &0u64)?;
    EXPENSE_COUNT.save(deps.storage, &0u64)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("contract_name", CONTRACT_NAME))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateGroup { name, members } => 
            execute::create_group(deps, env, info, name, members),
        ExecuteMsg::AddExpense { group_id, description, amount, split_between } => 
            execute::add_expense(deps, env, info, group_id, description, amount, split_between),
        ExecuteMsg::SettleDebt { group_id, to, amount } => 
            execute::settle_debt(deps, env, info, group_id, to, amount),
        ExecuteMsg::SettleAllDebts { group_id } => 
            execute::settle_all_debts(deps, env, info, group_id),
        ExecuteMsg::JoinGroup { group_id } => 
            execute::join_group(deps, env, info, group_id),
        ExecuteMsg::LeaveGroup { group_id } => 
            execute::leave_group(deps, env, info, group_id),
    }
}

pub mod execute {
    use super::*;

    pub fn create_group(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        name: String,
        members: Vec<String>,
    ) -> Result<Response, ContractError> {
        // Validate group name
        if name.trim().is_empty() {
            return Err(ContractError::InvalidGroupName { 
                reason: "Group name cannot be empty".to_string() 
            });
        }
        
        if name.len() > MAX_GROUP_NAME_LENGTH {
            return Err(ContractError::InvalidGroupName { 
                reason: format!("Group name exceeds maximum length of {}", MAX_GROUP_NAME_LENGTH) 
            });
        }
        
        // Validate members
        if members.len() > MAX_GROUP_MEMBERS {
            return Err(ContractError::CustomError { 
                val: format!("Too many members. Maximum is {}", MAX_GROUP_MEMBERS)
            });
        }
        
        // Parse and validate member addresses
        let mut validated_members = Vec::with_capacity(members.len() + 1);
        
        // Always add the creator as a member
        validated_members.push(info.sender.clone());
        
        // Add other members if provided and validate addresses
        for member in members {
            let addr = deps.api.addr_validate(&member)?;
            // Don't add duplicates
            if !validated_members.contains(&addr) {
                validated_members.push(addr);
            }
        }
        
        // Get and increment group count
        let id = GROUP_COUNT.update(deps.storage, |count| -> StdResult<_> {
            Ok(count + 1)
        })?;
        
        // Create and save the group
        let group = Group {
            id,
            name,
            creator: info.sender.clone(),
            members: validated_members.clone(),
            created_at: env.block.time,
        };
        
        GROUPS.save(deps.storage, id, &group)?;
        
        // Update each member's group list
        for member in validated_members {
            let user_groups = USER_GROUPS
                .may_load(deps.storage, &member)?
                .unwrap_or_default();
            
            let mut updated_user_groups = user_groups;
            updated_user_groups.push(id);
            
            USER_GROUPS.save(deps.storage, &member, &updated_user_groups)?;
        }
        
        // Initialize empty expense list for this group
        GROUP_EXPENSES.save(deps.storage, id, &Vec::new())?;

        Ok(Response::new()
            .add_attribute("action", "create_group")
            .add_attribute("id", id.to_string())
            .add_attribute("creator", info.sender)
            .add_attribute("members", format!("{}", group.members.len())))
    }

    pub fn add_expense(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        group_id: u64,
        description: String,
        amount: Uint128,
        split_between: Vec<String>,
    ) -> Result<Response, ContractError> {
        // Validate expense description
        if description.trim().is_empty() {
            return Err(ContractError::InvalidExpenseDescription { 
                reason: "Expense description cannot be empty".to_string() 
            });
        }
        
        if description.len() > MAX_EXPENSE_DESCRIPTION_LENGTH {
            return Err(ContractError::InvalidExpenseDescription { 
                reason: format!("Description exceeds maximum length of {}", MAX_EXPENSE_DESCRIPTION_LENGTH) 
            });
        }
        
        // Validate amount
        if amount.is_zero() {
            return Err(ContractError::InvalidAmount { 
                reason: "Amount must be greater than zero".to_string() 
            });
        }
        
        // Check if the group exists
        let group = GROUPS.may_load(deps.storage, group_id)?
            .ok_or(ContractError::GroupNotFound {})?;
        
        // Check if the sender is in the group
        if !group.members.contains(&info.sender) {
            return Err(ContractError::UserNotInGroup {});
        }
        
        // Determine who shares this expense
        let split_members: Vec<Addr> = if split_between.is_empty() {
            // If no specific members are provided, all group members share the expense
            group.members.clone()
        } else {
            // Otherwise, validate the provided addresses
            let mut validated_split = Vec::with_capacity(split_between.len());
            
            for member in split_between {
                let addr = deps.api.addr_validate(&member)?;
                
                // Check if the address is a member of the group
                if !group.members.contains(&addr) {
                    return Err(ContractError::UserNotInGroup {});
                }
                
                // Don't add duplicates
                if !validated_split.contains(&addr) {
                    validated_split.push(addr);
                }
            }
            
            validated_split
        };
        
        // Get and increment expense count
        let id = EXPENSE_COUNT.update(deps.storage, |count| -> StdResult<_> {
            Ok(count + 1)
        })?;
        
        // Create and save the expense
        let expense = Expense {
            id,
            group_id,
            description,
            amount,
            paid_by: info.sender.clone(),
            split_between: split_members.clone(),  // Clone here to avoid moving split_members
            timestamp: env.block.time,
            settled: false,
        };
        
        EXPENSES.save(deps.storage, id, &expense)?;
        
        // Update the group's expense list
        let group_expenses = GROUP_EXPENSES
            .may_load(deps.storage, group_id)?
            .unwrap_or_default();
        
        let mut updated_group_expenses = group_expenses;
        updated_group_expenses.push(id);
        
        GROUP_EXPENSES.save(deps.storage, group_id, &updated_group_expenses)?;
        
        // Calculate and update debts
        let split_members_count = split_members.len() as u128;
        let split_amount = if split_members_count == 0 {
            Uint128::zero()
        } else {
            amount.checked_div(Uint128::from(split_members_count)).unwrap_or(Uint128::zero())
        };
        
        // Update debts - the person who paid is owed money by others
        for member in &split_members {  // Use reference here to avoid moving split_members
            // Skip the person who paid (they don't owe themselves)
            if member == &info.sender {
                continue;
            }
            
            // Update the debt from this member to the payer
            let debt_key = (group_id, member, &info.sender);
            let current_debt = DEBTS.may_load(deps.storage, debt_key)?.unwrap_or(Uint128::zero());
            DEBTS.save(deps.storage, debt_key, &(current_debt + split_amount))?;
        }

        Ok(Response::new()
            .add_attribute("action", "add_expense")
            .add_attribute("id", id.to_string())
            .add_attribute("group_id", group_id.to_string())
            .add_attribute("paid_by", info.sender)
            .add_attribute("amount", amount)
            .add_attribute("split_between", split_members.len().to_string()))
    }

    pub fn settle_debt(
        deps: DepsMut,
        _env: Env,
        info: MessageInfo,
        group_id: u64,
        to: String,
        amount: Uint128,
    ) -> Result<Response, ContractError> {
        // Validate the recipient address
        let recipient = deps.api.addr_validate(&to)?;
        
        // Cannot settle with yourself
        if info.sender == recipient {
            return Err(ContractError::CannotSettleWithSelf {});
        }
        
        // Check if the group exists
        let group = GROUPS.may_load(deps.storage, group_id)?
            .ok_or(ContractError::GroupNotFound {})?;
        
        // Check if both sender and recipient are in the group
        if !group.members.contains(&info.sender) || !group.members.contains(&recipient) {
            return Err(ContractError::UserNotInGroup {});
        }
        
        // Validate amount
        if amount.is_zero() {
            return Err(ContractError::InvalidAmount { 
                reason: "Amount must be greater than zero".to_string() 
            });
        }
        
        // Check if there is a debt from sender to recipient
        let debt_key = (group_id, &info.sender, &recipient);
        let debt = DEBTS.may_load(deps.storage, debt_key)?.unwrap_or(Uint128::zero());
        
        if debt.is_zero() {
            return Err(ContractError::NoDebtExists {});
        }
        
        // Check if trying to pay more than owed
        if amount > debt {
            return Err(ContractError::InvalidPayment {});
        }
        
        // Check if the sender has sent enough XION tokens with the transaction
        // Get the amount of XION sent
        let xion_amount = match info.funds.iter().find(|coin| coin.denom == "uxion") {
            Some(coin) => coin.amount,
            None => Uint128::zero(),
        };
        
        if xion_amount < amount {
            return Err(ContractError::InsufficientFunds { 
                needed: amount.to_string(), 
                available: xion_amount.to_string()
            });
        }
        
        // Update the debt
        let new_debt = debt - amount;
        if new_debt.is_zero() {
            DEBTS.remove(deps.storage, debt_key);
        } else {
            DEBTS.save(deps.storage, debt_key, &new_debt)?;
        }
        
        // Create message to transfer tokens to recipient
        let transfer_msg = BankMsg::Send {
            to_address: recipient.to_string(),
            amount: vec![Coin {
                denom: "uxion".to_string(),
                amount,
            }],
        };
        
        // Return success response with transfer message
        Ok(Response::new()
            .add_message(transfer_msg)
            .add_attribute("action", "settle_debt")
            .add_attribute("group_id", group_id.to_string())
            .add_attribute("from", info.sender)
            .add_attribute("to", recipient)
            .add_attribute("amount", amount.to_string())
            .add_attribute("remaining_debt", new_debt.to_string()))
    }

    pub fn settle_all_debts(
        deps: DepsMut,
        _env: Env,
        info: MessageInfo,
        group_id: u64,
    ) -> Result<Response, ContractError> {
        // Check if the group exists
        let group = GROUPS.may_load(deps.storage, group_id)?
            .ok_or(ContractError::GroupNotFound {})?;
        
        // Check if sender is in the group
        if !group.members.contains(&info.sender) {
            return Err(ContractError::UserNotInGroup {});
        }
        
        // Calculate total debt owed by the sender to others in this group
        let mut total_debt = Uint128::zero();
        let mut payments: Vec<(Addr, Uint128)> = Vec::new();
        
        // Find all debts the sender owes
        for creditor in &group.members {
            if creditor == &info.sender {
                continue; // Skip self
            }
            
            let debt_key = (group_id, &info.sender, creditor);
            if let Some(debt) = DEBTS.may_load(deps.storage, debt_key)? {
                if !debt.is_zero() {
                    total_debt += debt;
                    payments.push((creditor.clone(), debt));
                    
                    // Remove the debt
                    DEBTS.remove(deps.storage, debt_key);
                }
            }
        }
        
        // Check if there are any debts to settle
        if total_debt.is_zero() {
            return Err(ContractError::NoDebtExists {});
        }
        
        // Check if the sender has sent enough XION tokens with the transaction
        let xion_amount = match info.funds.iter().find(|coin| coin.denom == "uxion") {
            Some(coin) => coin.amount,
            None => Uint128::zero(),
        };
        
        if xion_amount < total_debt {
            return Err(ContractError::InsufficientFunds { 
                needed: total_debt.to_string(), 
                available: xion_amount.to_string()
            });
        }
        
        // Create messages to send tokens to each creditor
        let mut messages: Vec<CosmosMsg> = Vec::with_capacity(payments.len());
        let mut attrs = vec![
            ("action".to_string(), "settle_all_debts".to_string()),
            ("group_id".to_string(), group_id.to_string()),
            ("from".to_string(), info.sender.to_string()),
            ("total_paid".to_string(), total_debt.to_string()),
        ];
        
        for (index, (creditor, amount)) in payments.iter().enumerate() {
            let transfer_msg = BankMsg::Send {
                to_address: creditor.to_string(),
                amount: vec![Coin {
                    denom: "uxion".to_string(),
                    amount: *amount,
                }],
            };
            
            messages.push(transfer_msg.into());
            
            // Add payment details as attributes (limited to first few to avoid overflow)
            if index < 5 {
                attrs.push((
                    format!("paid_to_{}", index).to_string(),
                    creditor.to_string()
                ));
                attrs.push((
                    format!("amount_{}", index).to_string(),
                    amount.to_string()
                ));
            }
        }
        
        // Add total payments count
        attrs.push(("total_payments".to_string(), payments.len().to_string()));
        
        // Return success response with transfer messages
        Ok(Response::new()
            .add_messages(messages)
            .add_attributes(attrs))
    }

    pub fn join_group(
        deps: DepsMut,
        _env: Env,
        info: MessageInfo,
        group_id: u64,
    ) -> Result<Response, ContractError> {
        // Check if the group exists
        let mut group = GROUPS.may_load(deps.storage, group_id)?
            .ok_or(ContractError::GroupNotFound {})?;
        
        // Check if the user is already a member
        if group.members.contains(&info.sender) {
            return Err(ContractError::UserAlreadyInGroup {});
        }
        
        // Add the user to the group
        group.members.push(info.sender.clone());
        GROUPS.save(deps.storage, group_id, &group)?;
        
        // Update the user's groups
        let user_groups = USER_GROUPS
            .may_load(deps.storage, &info.sender)?
            .unwrap_or_default();
        
        let mut updated_user_groups = user_groups;
        updated_user_groups.push(group_id);
        
        USER_GROUPS.save(deps.storage, &info.sender, &updated_user_groups)?;
        
        Ok(Response::new()
            .add_attribute("action", "join_group")
            .add_attribute("group_id", group_id.to_string())
            .add_attribute("user", info.sender))
    }

    pub fn leave_group(
        deps: DepsMut,
        _env: Env,
        info: MessageInfo,
        group_id: u64,
    ) -> Result<Response, ContractError> {
        // Check if the group exists
        let mut group = GROUPS.may_load(deps.storage, group_id)?
            .ok_or(ContractError::GroupNotFound {})?;
        
        // Check if the user is a member
        if !group.members.contains(&info.sender) {
            return Err(ContractError::UserNotInGroup {});
        }
        
        // Check if user has any unsettled debts in this group
        let mut has_debts = false;
        
        // Check debts user owes to others
        for member in &group.members {
            if member == &info.sender {
                continue;
            }
            
            let debt_key = (group_id, &info.sender, member);
            if let Some(debt) = DEBTS.may_load(deps.storage, debt_key)? {
                if !debt.is_zero() {
                    has_debts = true;
                    break;
                }
            }
        }
        
        // Check debts others owe to user
        if !has_debts {
            for member in &group.members {
                if member == &info.sender {
                    continue;
                }
                
                let debt_key = (group_id, member, &info.sender);
                if let Some(debt) = DEBTS.may_load(deps.storage, debt_key)? {
                    if !debt.is_zero() {
                        has_debts = true;
                        break;
                    }
                }
            }
        }
        
        // Cannot leave group with unsettled debts
        if has_debts {
            return Err(ContractError::CustomError { 
                val: "Cannot leave group with unsettled debts".to_string() 
            });
        }
        
        // Remove user from the group
        group.members.retain(|member| member != &info.sender);
        
        // If group is now empty, remove it completely
        if group.members.is_empty() {
            GROUPS.remove(deps.storage, group_id);
            
            // Also clean up any group-related data
            GROUP_EXPENSES.remove(deps.storage, group_id);
        } else {
            // Otherwise save the updated group
            GROUPS.save(deps.storage, group_id, &group)?;
        }
        
        // Update the user's groups
        let user_groups = USER_GROUPS.may_load(deps.storage, &info.sender)?.unwrap_or_default();
        let updated_user_groups: Vec<u64> = user_groups.into_iter()
            .filter(|&id| id != group_id)
            .collect();
        
        if updated_user_groups.is_empty() {
            USER_GROUPS.remove(deps.storage, &info.sender);
        } else {
            USER_GROUPS.save(deps.storage, &info.sender, &updated_user_groups)?;
        }
        
        Ok(Response::new()
            .add_attribute("action", "leave_group")
            .add_attribute("group_id", group_id.to_string())
            .add_attribute("user", info.sender))
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetGroup { id } => 
            to_json_binary(&query::get_group(deps, id)?),
        QueryMsg::GetUserGroups { user, limit, start_after } => 
            to_json_binary(&query::get_user_groups(deps, user, limit, start_after)?),
        QueryMsg::GetExpense { id } => 
            to_json_binary(&query::get_expense(deps, id)?),
        QueryMsg::GetGroupExpenses { group_id, limit, start_after } => 
            to_json_binary(&query::get_group_expenses(deps, group_id, limit, start_after)?),
        QueryMsg::GetDebts { group_id } => 
            to_json_binary(&query::get_debts(deps, group_id)?),
        QueryMsg::GetBalanceSummary { group_id, user } => 
            to_json_binary(&query::get_balance_summary(deps, group_id, user)?),
    }
}

pub mod query {
    use super::*;

    // Default and maximum number of items to return in a query
    const DEFAULT_LIMIT: u32 = 10;
    const MAX_LIMIT: u32 = 30;

    pub fn get_group(deps: Deps, id: u64) -> StdResult<GroupResponse> {
        let group = GROUPS.load(deps.storage, id)?;
        Ok(GroupResponse { group })
    }

    pub fn get_user_groups(
        deps: Deps,
        user: String,
        limit: Option<u32>,
        start_after: Option<u64>,
    ) -> StdResult<GroupsResponse> {
        let user_addr = deps.api.addr_validate(&user)?;
        let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;

        // Get the groups this user belongs to
        let user_group_ids = USER_GROUPS
            .may_load(deps.storage, &user_addr)?
            .unwrap_or_default();

        // Filter by start_after if provided
        let filtered_ids: Vec<u64> = if let Some(start_id) = start_after {
            user_group_ids
                .into_iter()
                .filter(|&id| id > start_id)
                .collect()
        } else {
            user_group_ids
        };

        // Sort by ID (ascending)
        let mut sorted_ids = filtered_ids;
        sorted_ids.sort();

        // Apply limit
        let limited_ids = sorted_ids.into_iter().take(limit);

        // Load groups from IDs
        let groups: Vec<Group> = limited_ids
            .map(|id| GROUPS.load(deps.storage, id))
            .collect::<StdResult<Vec<_>>>()?;

        Ok(GroupsResponse { groups })
    }

    pub fn get_expense(deps: Deps, id: u64) -> StdResult<ExpenseResponse> {
        let expense = EXPENSES.load(deps.storage, id)?;
        Ok(ExpenseResponse { expense })
    }

    pub fn get_group_expenses(
        deps: Deps,
        group_id: u64,
        limit: Option<u32>,
        start_after: Option<u64>,
    ) -> StdResult<ExpensesResponse> {
        let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;

        // Check if the group exists
        if GROUPS.may_load(deps.storage, group_id)?.is_none() {
            return Err(StdError::not_found("Group"));
        }

        // Get the expense IDs for this group
        let expense_ids = GROUP_EXPENSES
            .may_load(deps.storage, group_id)?
            .unwrap_or_default();

        // Filter by start_after if provided
        let filtered_ids: Vec<u64> = if let Some(start_id) = start_after {
            expense_ids
                .into_iter()
                .filter(|&id| id > start_id)
                .collect()
        } else {
            expense_ids
        };

        // Sort by ID (ascending) - this is a simplification, may want to sort by timestamp in a real app
        let mut sorted_ids = filtered_ids;
        sorted_ids.sort();

        // Apply limit
        let limited_ids = sorted_ids.into_iter().take(limit);

        // Load expenses from IDs
        let expenses: Vec<Expense> = limited_ids
            .map(|id| EXPENSES.load(deps.storage, id))
            .collect::<StdResult<Vec<_>>>()?;

        Ok(ExpensesResponse { expenses })
    }

    pub fn get_debts(deps: Deps, group_id: u64) -> StdResult<DebtsResponse> {
        // Check if the group exists
        let group = GROUPS.may_load(deps.storage, group_id)?.ok_or_else(|| {
            StdError::not_found("Group")
        })?;

        let mut debts = Vec::new();

        // Go through all possible pairs of members to find debts
        for debtor in &group.members {
            for creditor in &group.members {
                if debtor == creditor {
                    continue;
                }

                let debt_key = (group_id, debtor, creditor);
                if let Some(amount) = DEBTS.may_load(deps.storage, debt_key)? {
                    if !amount.is_zero() {
                        debts.push(Debt {
                            debtor: debtor.clone(),
                            creditor: creditor.clone(),
                            amount,
                        });
                    }
                }
            }
        }

        Ok(DebtsResponse { debts })
    }

    pub fn get_balance_summary(
        deps: Deps,
        group_id: u64,
        user: String,
    ) -> StdResult<BalanceSummaryResponse> {
        let user_addr = deps.api.addr_validate(&user)?;

        // Check if the group exists
        let group = GROUPS.may_load(deps.storage, group_id)?.ok_or_else(|| {
            StdError::not_found("Group")
        })?;

        // Check if the user is in the group
        if !group.members.contains(&user_addr) {
            return Err(StdError::generic_err("User is not a member of this group"));
        }

        let mut balances = Vec::new();
        let mut total_owed = Uint128::zero();
        let mut total_owed_to = Uint128::zero();

        // Calculate balances with each other member
        for other in &group.members {
            if other == &user_addr {
                continue;
            }

            // Amount user owes to other
            let debt_key = (group_id, &user_addr, other);
            let user_owes = DEBTS.may_load(deps.storage, debt_key)?.unwrap_or(Uint128::zero());

            // Amount other owes to user
            let credit_key = (group_id, other, &user_addr);
            let other_owes = DEBTS.may_load(deps.storage, credit_key)?.unwrap_or(Uint128::zero());

            // Calculate net balance
            if !user_owes.is_zero() || !other_owes.is_zero() {
                let (amount, direction) = if user_owes > other_owes {
                    total_owed += user_owes - other_owes;
                    (user_owes - other_owes, -1) // Negative direction means user owes
                } else {
                    total_owed_to += other_owes - user_owes;
                    (other_owes - user_owes, 1)  // Positive direction means user is owed
                };

                balances.push(Balance {
                    other_user: other.clone(),
                    amount,
                    direction,
                });
            }
        }

        // Sort balances by direction (negative first, then by amount)
        balances.sort_by(|a, b| {
            a.direction.cmp(&b.direction).then(a.amount.cmp(&b.amount))
        });

        // Calculate net balance
        let net_balance = if total_owed_to >= total_owed {
            total_owed_to - total_owed
        } else {
            Uint128::zero()
        };

        Ok(BalanceSummaryResponse {
            balances,
            total_owed,
            total_owed_to,
            net_balance,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{coins, from_json, Addr, Coin, Timestamp, Uint128};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies();
        let env = mock_env();
        
        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "uxion"));
        
        let res = instantiate(deps.as_mut(), env, info, msg).unwrap();
        assert_eq!(0, res.messages.len());
        
        // Verify group count was initialized to 0
        let count = GROUP_COUNT.load(deps.as_ref().storage).unwrap();
        assert_eq!(0u64, count);
        
        // Verify expense count was initialized to 0
        let count = EXPENSE_COUNT.load(deps.as_ref().storage).unwrap();
        assert_eq!(0u64, count);
    }

    #[test]
    fn create_group_works() {
        let mut deps = mock_dependencies();
        let mut env = mock_env();
        env.block.time = Timestamp::from_seconds(1_000_000);
        
        // Initialize the contract
        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "uxion"));
        instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Create a group
        let msg = ExecuteMsg::CreateGroup { 
            name: "Room 101 Expenses".to_string(),
            members: vec!["member1".to_string(), "member2".to_string()]
        };
        let info = mock_info("creator", &[]);
        let res = execute(deps.as_mut(), env.clone(), info, msg).unwrap();
        
        // Check attributes
        assert_eq!(
            vec![
                ("action", "create_group"),
                ("id", "1"),
                ("creator", "creator"),
                ("members", "3"),
            ],
            res.attributes
        );
        
        // Query the group
        let query_msg = QueryMsg::GetGroup { id: 1 };
        let res: GroupResponse = from_json(&query(deps.as_ref(), env.clone(), query_msg).unwrap()).unwrap();
        
        assert_eq!(1, res.group.id);
        assert_eq!("Room 101 Expenses", res.group.name);
        assert_eq!(Addr::unchecked("creator"), res.group.creator);
        assert_eq!(3, res.group.members.len());
        assert!(res.group.members.contains(&Addr::unchecked("creator")));
        assert!(res.group.members.contains(&Addr::unchecked("member1")));
        assert!(res.group.members.contains(&Addr::unchecked("member2")));
    }

    #[test]
    fn add_expense_works() {
        let mut deps = mock_dependencies();
        let mut env = mock_env();
        env.block.time = Timestamp::from_seconds(1_000_000);
        
        // Initialize the contract
        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "uxion"));
        instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Create a group
        let msg = ExecuteMsg::CreateGroup { 
            name: "Room 101 Expenses".to_string(),
            members: vec!["member1".to_string(), "member2".to_string()]
        };
        let info = mock_info("creator", &[]);
        execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Add an expense
        let msg = ExecuteMsg::AddExpense { 
            group_id: 1,
            description: "Groceries".to_string(),
            amount: Uint128::new(150),
            split_between: vec![],  // Empty means split among all members
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Check attributes
        assert_eq!(
            vec![
                ("action", "add_expense"),
                ("id", "1"),
                ("group_id", "1"),
                ("paid_by", "creator"),
                ("amount", "150"),
                ("split_between", "3"),
            ],
            res.attributes
        );
        
        // Query the expense
        let query_msg = QueryMsg::GetExpense { id: 1 };
        let res: ExpenseResponse = from_json(&query(deps.as_ref(), env.clone(), query_msg).unwrap()).unwrap();
        
        assert_eq!(1, res.expense.id);
        assert_eq!("Groceries", res.expense.description);
        assert_eq!(Uint128::new(150), res.expense.amount);
        assert_eq!(Addr::unchecked("creator"), res.expense.paid_by);
        assert_eq!(3, res.expense.split_between.len());
        
        // Check debts - member1 should owe creator 50 (150/3)
        let query_msg = QueryMsg::GetDebts { group_id: 1 };
        let res: DebtsResponse = from_json(&query(deps.as_ref(), env.clone(), query_msg).unwrap()).unwrap();
        
        assert_eq!(2, res.debts.len());  // 2 members owe the creator
        
        // Find debt from member1 to creator
        let debt = res.debts.iter().find(|d| 
            d.debtor == Addr::unchecked("member1") && 
            d.creditor == Addr::unchecked("creator")
        ).unwrap();
        
        assert_eq!(Uint128::new(50), debt.amount);  // 150 / 3 = 50
    }

    #[test]
    fn settle_debt_works() {
        let mut deps = mock_dependencies();
        let mut env = mock_env();
        env.block.time = Timestamp::from_seconds(1_000_000);
        
        // Initialize the contract
        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "uxion"));
        instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Create a group
        let msg = ExecuteMsg::CreateGroup { 
            name: "Room 101 Expenses".to_string(),
            members: vec!["member1".to_string(), "member2".to_string()]
        };
        let info = mock_info("creator", &[]);
        execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Add an expense - creator pays
        let msg = ExecuteMsg::AddExpense { 
            group_id: 1,
            description: "Groceries".to_string(),
            amount: Uint128::new(150),
            split_between: vec![],  // Empty means split among all members
        };
        execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // member1 settles debt with creator
        let msg = ExecuteMsg::SettleDebt { 
            group_id: 1,
            to: "creator".to_string(),
            amount: Uint128::new(50),
        };
        let info = mock_info("member1", &coins(50, "uxion"));
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Check attributes and message
        assert_eq!(1, res.messages.len());
        assert_eq!(
            vec![
                ("action", "settle_debt"),
                ("group_id", "1"),
                ("from", "member1"),
                ("to", "creator"),
                ("amount", "50"),
                ("remaining_debt", "0"),
            ],
            res.attributes
        );
        
        // Check debts - member1 should no longer owe creator
        let query_msg = QueryMsg::GetDebts { group_id: 1 };
        let res: DebtsResponse = from_json(&query(deps.as_ref(), env.clone(), query_msg).unwrap()).unwrap();
        
        assert_eq!(1, res.debts.len());  // Only member2 still owes the creator
        
        // The remaining debt should be from member2 to creator
        let debt = &res.debts[0];
        assert_eq!(Addr::unchecked("member2"), debt.debtor);
        assert_eq!(Addr::unchecked("creator"), debt.creditor);
        assert_eq!(Uint128::new(50), debt.amount);
    }

    #[test]
    fn settle_all_debts_works() {
        let mut deps = mock_dependencies();
        let mut env = mock_env();
        env.block.time = Timestamp::from_seconds(1_000_000);
        
        // Initialize the contract
        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "uxion"));
        instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Create a group
        let msg = ExecuteMsg::CreateGroup { 
            name: "Room 101 Expenses".to_string(),
            members: vec!["member1".to_string(), "member2".to_string()]
        };
        let info = mock_info("creator", &[]);
        execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Add expense from creator
        let msg = ExecuteMsg::AddExpense { 
            group_id: 1,
            description: "Groceries".to_string(),
            amount: Uint128::new(150),
            split_between: vec![],  // Empty means split among all members
        };
        execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Add expense from member1
        let msg = ExecuteMsg::AddExpense { 
            group_id: 1,
            description: "Utilities".to_string(),
            amount: Uint128::new(90),
            split_between: vec![],  // Empty means split among all members
        };
        let info = mock_info("member1", &[]);
        execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Now member2 owes both creator and member1
        // member2 settles all debts at once
        let msg = ExecuteMsg::SettleAllDebts { group_id: 1 };
        let info = mock_info("member2", &coins(80, "uxion"));  // 50 to creator + 30 to member1
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
        
        // Check messages - should be 2 BankMsg::Send
        assert_eq!(2, res.messages.len());
        
        // Check there are no more debts for member2
        let query_msg = QueryMsg::GetBalanceSummary { 
            group_id: 1,
            user: "member2".to_string()
        };
        let res: BalanceSummaryResponse = from_json(&query(deps.as_ref(), env.clone(), query_msg).unwrap()).unwrap();
        
        assert_eq!(Uint128::zero(), res.total_owed);
        assert_eq!(0, res.balances.len());  // No balances should exist after settling all debts
    }
}
