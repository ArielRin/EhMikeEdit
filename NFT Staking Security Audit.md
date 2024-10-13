# Comprehensive Security Audit for `NftRewardPoolV2` Contract

This audit examines the `NftRewardPoolV2` contract in terms of potential vulnerabilities, logical flaws, gas optimization opportunities, and adherence to best practices. The audit also suggests mitigation strategies for any identified risks.

---

### Contract Overview

The `NftRewardPoolV2` contract allows users to stake NFTs and earn rewards in the form of ERC20/BEP20 tokens. It supports features like user registration, pool configuration, depositing and withdrawing staked tokens, and emergency mechanisms. This contract utilizes OpenZeppelin’s `Ownable`, `ReentrancyGuard`, and `SafeERC20` libraries to ensure security and proper token handling.

- **Staked Tokens**: ERC721 (NFTs)
- **Reward Tokens**: ERC20/BEP20
- **Core Features**:
  - User staking of NFTs
  - Reward distribution in ERC20/BEP20 tokens
  - User registration with fees
  - Pool limits per user
  - Emergency withdrawal and reward withdrawal
  - Admin functions to recover tokens and manage pool configurations


### Audit Overview

- **Contract Name**: `NftRewardPoolV2`
- **Chain**: `Base Chain`
- **Contract Address**: `0xa73F53d6737a78e90e0716b8C3a472e4536e93C0`
- **Dependencies**:
  - OpenZeppelin Libraries (`Ownable`, `ReentrancyGuard`, `SafeERC20`, `EnumerableSet`, `SafeMath`)
  - `IERC721` (Staked NFTs)
  - `IBEP20` (Reward Token, similar to `IERC20` but specific to BSC)
  
  **Note**: `IBEP20` is functionally the same as `IERC20`, but it’s tailored for Binance Smart Chain (BSC). If deploying this contract on a non-BSC network, consider updating `IBEP20` to `IERC20` to ensure compatibility with chain standards.

### Audit Scope

The audit focuses on the following critical areas:

1. **Reentrancy**
2. **Ownership and Access Control**
3. **Token Transfer Safety**
4. **User Registration and Fee Management**
5. **Reward Calculations**
6. **Gas Efficiency**
7. **Input Validation**
8. **Emergency Functions**
9. **Security Best Practices**

---

### 1. **Reentrancy Protection**

- **Risk**: Reentrancy attacks occur when an external contract repeatedly calls back into a vulnerable function, potentially draining funds or causing incorrect state changes.
- **Mitigation**: The contract uses OpenZeppelin's `ReentrancyGuard`, which ensures that critical functions (`deposit`, `withdraw`, `emergencyWithdraw`) are protected from reentrancy attacks.
  - **Recommendation**: The existing implementation is secure and follows best practices. No further changes needed for reentrancy protection.

**Rating**: ✔️ Secure

---

### 2. **Ownership and Access Control**

- **Risk**: The contract inherits from OpenZeppelin's `Ownable`, giving the owner complete control over sensitive functions such as stopping rewards, recovering tokens, and setting pool limits. If ownership is compromised, the entire pool could be at risk.
- **Mitigation**: Only the owner can execute these critical functions, ensuring access control. However, the contract does not support multi-signature ownership or decentralized governance mechanisms.
  - **Recommendation**: If decentralization is desired, consider implementing a multi-signature wallet (e.g., Gnosis Safe) for ownership or adding role-based access control for different admin-level functions.

**Rating**: ✔️ Secure, but could be improved with multi-signature or decentralized control.

---

### 3. **Token Transfer Safety**

- **Risk**: Incorrect token transfer handling (e.g., handling tokens that don’t return true/false on transfers) can lead to loss of tokens or stuck funds.
- **Mitigation**: The contract uses OpenZeppelin's `SafeERC20` library, which ensures safe interactions with the reward token (`IBEP20`/`IERC20`). `SafeERC20` correctly handles edge cases for tokens that may return `false` or revert.
  - **Note**: If deploying on a non-BSC network, switch from `IBEP20` to `IERC20` to comply with network standards.
  - **Recommendation**: The contract correctly handles safe transfers using the library. No issues identified.

**Rating**: ✔️ Secure

---

### 4. **User Registration and Fee Management**

- **Risk**: Users must register before participating in staking, and a registration fee is forwarded to a specified address. Incorrect handling of this mechanism could result in unfair access or failure to collect fees.
- **Mitigation**: The registration fee is correctly enforced in the `deposit` function, and fees are transferred to the designated `registrationFeeAddress`. Non-registered users cannot stake tokens without first registering.
  - **Recommendation**: Consider adding the ability to update the registration fee or the registration fee address to provide more flexibility during the contract’s operation. This would help if the fee structure or fee recipient needs to change.

**Rating**: ✔️ Secure, but could be improved with flexibility for fee updates.

---

### 5. **Reward Calculation and Distribution**

- **Risk**: Incorrect reward calculations could either under-reward or over-reward users, leading to potential abuse or dissatisfaction.
- **Mitigation**: The reward per block and accrual system is well-implemented. The contract uses `accTokenPerShare` and `PRECISION_FACTOR` to ensure precision in reward calculations. It also checks the token balance of the pool (`stakedToken.balanceOf(address(this))`) to determine the reward distribution.
  - **Recommendation**: Conduct thorough testing of reward calculations, especially around edge cases where block numbers overlap the start and end of reward periods (e.g., `startBlock`, `bonusEndBlock`). Ensure no underflow/overflow issues occur when calculating rewards.

**Rating**: ✔️ Secure, but requires thorough testing.

---

### 6. **Gas Efficiency**

- **Risk**: Excessive gas costs can make interactions with the contract expensive for users, especially in large-scale staking scenarios.
- **Mitigation**: The contract is generally gas efficient, but there are some areas that could be further optimized:
  - **EnumerableSet Operations**: Operations like `user.tokens.add()` and `user.tokens.remove()` involve modifying and checking `EnumerableSet`, which can be costly in terms of gas. This can become expensive for users with large numbers of NFTs.
  - **Recommendation**: Consider caching the length of user token sets where possible to reduce multiple reads from storage. Additionally, if large-scale usage is anticipated, consider alternative data structures that might reduce gas costs for frequent operations.

**Rating**: ⚠️ Efficient, but further optimizations could reduce gas costs for larger staking pools.

---

### 7. **Input Validation**

- **Risk**: Functions that accept user input (e.g., token IDs, addresses, etc.) are vulnerable to input-related attacks if inputs are not properly validated.
- **Mitigation**: The contract performs reasonable validation on inputs:
  - Checks if the user has already registered before allowing deposits.
  - Ensures that token IDs provided during deposit and withdrawal operations are valid and owned by the user.
  - **Recommendation**: Consider adding additional checks for `address(0)` to ensure that no zero addresses are passed where not appropriate. Although this is checked in some places (e.g., tax address validation), it should be a general practice for all address inputs.

**Rating**: ✔️ Secure, but can be improved by adding `address(0)` checks throughout.

---

### 8. **Emergency Functions**

- **Risk**: Emergency functions such as `emergencyWithdraw` allow users to withdraw tokens in the event of critical failures. If not properly implemented, these functions can be exploited to bypass normal operational logic.
- **Mitigation**: The contract includes appropriate emergency functions:
  - `emergencyWithdraw`: Allows users to withdraw NFTs without collecting rewards. This is a good safety measure in case the reward logic fails or gets stuck.
  - `emergencyRewardWithdraw`: Allows the owner to withdraw reward tokens in case of emergency.
  - **Recommendation**: No issues identified, but it is critical to ensure that these emergency functions are only used in genuine emergencies and cannot be exploited by malicious actors.

**Rating**: ✔️ Secure

---

### 9. **Best Practices and Other Considerations**

- **Code Quality**: The contract is well-structured and documented, adhering to Solidity best practices.
- **Decentralization**: While the contract is secure, all control lies with the owner. This centralization may not align with decentralized governance goals. Consider adding governance mechanisms or multi-signature control for important actions like stopping rewards or recovering tokens.
- **Upgradeability**: The contract is not upgradeable. If future updates are anticipated, consider using a proxy pattern (e.g., OpenZeppelin's `Upgradeable` contracts) to allow upgrades without resetting state variables.

**Rating**: ✔️ Follows best practices, but could improve on decentralization and upgradeability.

---

### Vulnerabilities Checklist

- **Reentrancy**: Protected (ReentrancyGuard)
- **Ownership Exploits**: Secured (Ownable, but recommend multi-sig)
- **Token Transfer Safety**: Secured (SafeERC20)
- **Reward Calculation**: Correct, but requires edge case testing
- **Emergency Functions**: Secured, no known exploits
- **Gas Optimization**: Reasonably optimized, but further optimizations possible

---

### Final Recommendations

1. **Multi-Signature or Decentralized Control**: Implement a multi-signature wallet for ownership or role-based access control for enhanced security and decentralization.
2. **Gas Optimization**: Review gas usage for large pools and consider optimizations for `EnumerableSet` operations, especially for pools with a high number of staked NFTs.
3. **Flexibility in Fee Updates**: Add the ability to modify registration fees and recipient addresses dynamically during contract operation.
4. **Thorough Testing**: Ensure comprehensive testing of reward calculations, especially around edge cases like block number limits, large pool sizes, and reward claim scenarios.
5. **Upgradeability**: Consider implementing an upgradeable proxy pattern if the system needs future updates without redeploying the entire contract.
6. **Chain Standardization**: If deploying the contract on non-BSC chains, update the reward token interface from `IBEP20` to `IERC20` to comply with standard token interfaces across Ethereum or other chains.

---

---

**Overall Security Rating**

: ✔️ **Secure, with minor optimizations and enhancements recommended.**

---

---



## Functions

### User Functions

#### `deposit(uint256[] calldata tokenIds)`

- **Description**: Deposits NFTs (ERC721 tokens) into the pool and collects any available rewards.
- **Parameters**:
  - `tokenIds`: Array of token IDs to deposit.
- **Requires**:
  - User must pay registration fees if not already registered.
  - Pool limit checks if set.

```solidity
function deposit(uint256[] calldata tokenIds) external payable nonReentrant;
```

#### `withdraw(uint256[] calldata tokenIds)`

- **Description**: Withdraws staked NFTs and claims any pending rewards.
- **Parameters**:
  - `tokenIds`: Array of token IDs to withdraw.

```solidity
function withdraw(uint256[] calldata tokenIds) external nonReentrant;
```

#### `emergencyWithdraw(uint256 tokenId)`

- **Description**: Allows users to withdraw a specific NFT immediately without claiming rewards. Useful in emergency cases.
- **Parameters**:
  - `tokenId`: The ID of the NFT to withdraw.

```solidity
function emergencyWithdraw(uint256 tokenId) external nonReentrant;
```

#### `pendingReward(address _user)`

- **Description**: Returns the pending reward for the specified user.
- **Parameters**:
  - `_user`: The address of the user.

```solidity
function pendingReward(address _user) external view returns (uint256);
```

#### `register()`

- **Description**: Registers a user by paying the registration fee. This function must be called before staking if registration is required.
- **Requires**: User must send the correct registration fee with the transaction.

```solidity
function register() external payable;
```

#### `getUserStakedTokensCount(address account)`

- **Description**: Returns the number of NFTs staked by the user.
- **Parameters**:
  - `account`: The address of the user.

```solidity
function getUserStakedTokensCount(address account) public view returns (uint256);
```

#### `getUserStakedTokens(address account, uint256 size, uint256 cursor)`

- **Description**: Returns the list of tokens staked by a user. Useful for paginated queries.
- **Parameters**:
  - `account`: The address of the user.
  - `size`: The number of tokens to return.
  - `cursor`: The starting index for the query.

```solidity
function getUserStakedTokens(address account, uint256 size, uint256 cursor) external view returns (uint256[] memory, uint256);
```

### Admin Functions

#### `recoverWrongTokens(address _tokenAddress, uint256 _tokenAmount)`

- **Description**: Allows the admin to recover any tokens accidentally sent to the contract.
- **Parameters**:
  - `_tokenAddress`: Address of the token to recover.
  - `_tokenAmount`: Amount of tokens to recover.

```solidity
function recoverWrongTokens(address _tokenAddress, uint256 _tokenAmount) external onlyOwner;
```

#### `stopReward()`

- **Description**: Stops the reward distribution by setting `bonusEndBlock` to the current block number. Only callable by the owner.

```solidity
function stopReward() external onlyOwner;
```

#### `updatePoolLimitPerUser(bool _hasUserLimit, uint256 _poolLimitPerUser)`

- **Description**: Updates the pool limit per user. If `hasUserLimit` is false, there will be no limit for staking.
- **Parameters**:
  - `_hasUserLimit`: Whether the pool has a limit.
  - `_poolLimitPerUser`: New limit per user.

```solidity
function updatePoolLimitPerUser(bool _hasUserLimit, uint256 _poolLimitPerUser) external onlyOwner;
```

#### `emergencyRewardWithdraw(uint256 _amount)`

- **Description**: Allows the owner to withdraw reward tokens in an emergency. Only callable by the owner.
- **Parameters**:
  - `_amount`: Amount of reward tokens to withdraw.

```solidity
function emergencyRewardWithdraw(uint256 _amount) external onlyOwner;
```

### View Functions

#### `vaultAddress()`

- **Description**: Returns the address of the vault (contract address itself).

```solidity
function vaultAddress() external view returns (address);
```

#### `vaultConfiguration()`

- **Description**: Returns the configuration of the vault, including registration requirements, deposit block range, and limits.

```solidity
function vaultConfiguration() external view returns (bool requiresRegistration, uint256 startDepositBlock, uint256 endDepositBlock, uint256 maxTokensStaked, uint256 maxTokensPerUser, uint256 vestDuration);
```

#### `tokensStaked()`

- **Description**: Returns the total number of NFTs currently staked in the contract.

```solidity
function tokensStaked() external view returns (uint256);
```

## Events

- **`Deposit(address indexed user, uint256[] tokenIds)`**: Emitted when a user deposits NFTs.
- **`Withdraw(address indexed user, uint256[] tokenIds)`**: Emitted when a user withdraws NFTs.
- **`EmergencyWithdraw(address indexed user, uint256 tokenId)`**: Emitted during emergency withdrawals.
- **`Registered(address indexed account)`**: Emitted when a user registers for staking.
- **`AdminTokenRecovery(address tokenRecovered, uint256 tokenId)`**: Emitted when the admin recovers tokens from the contract.
- **`NewPoolLimit(uint256 poolLimitPerUser)`**: Emitted when the pool limit is updated.
- **`RewardsStop(uint256 blockNumber)`**: Emitted when rewards are stopped.

## Security

This contract implements various security mechanisms:

- **ReentrancyGuard**: Prevents reentrancy attacks on critical functions like deposit and withdraw.
- **Ownable**: Ensures only the contract owner can perform sensitive operations.
- **SafeERC20**: Handles safe transfers of ERC20/BEP20 tokens to prevent unexpected failures.
- **Emergency Withdraw**: Allows users to withdraw their staked NFTs in case of emergencies.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
