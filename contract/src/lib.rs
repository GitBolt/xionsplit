pub mod contract;
pub mod error;
pub mod msg;
pub mod state;

#[cfg(test)]
mod tests {
    // We'll include tests in the individual modules
}

pub use crate::error::ContractError;
