use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},
    
    #[error("Group not found")]
    GroupNotFound {},
    
    #[error("Expense not found")]
    ExpenseNotFound {},
    
    #[error("Invalid group name: {reason}")]
    InvalidGroupName { reason: String },
    
    #[error("Invalid expense description: {reason}")]
    InvalidExpenseDescription { reason: String },
    
    #[error("Invalid amount: {reason}")]
    InvalidAmount { reason: String },
    
    #[error("User not in group")]
    UserNotInGroup {},
    
    #[error("User already in group")]
    UserAlreadyInGroup {},
    
    #[error("Insufficient funds: needed {needed}, had {available}")]
    InsufficientFunds { needed: String, available: String },
    
    #[error("No debt exists between users")]
    NoDebtExists {},
    
    #[error("Invalid payment: cannot pay more than owed")]
    InvalidPayment {},
    
    #[error("Cannot settle with yourself")]
    CannotSettleWithSelf {},
    
    #[error("Custom Error val: {val:?}")]
    CustomError { val: String },
}
