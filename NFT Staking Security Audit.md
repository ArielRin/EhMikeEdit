# NftRewardPoolV2 Contract

The `NftRewardPoolV2` contract allows users to stake NFTs and earn rewards in the form of ERC20/BEP20 tokens. It supports features like user registration, pool configuration, depositing and withdrawing staked tokens, and emergency mechanisms. This contract utilizes OpenZeppelin’s `Ownable`, `ReentrancyGuard`, and `SafeERC20` libraries to ensure security and proper token handling.

## Overview

- **Staked Tokens**: ERC721 (NFTs)
- **Reward Tokens**: ERC20/BEP20
- **Core Features**:
  - User staking of NFTs
  - Reward distribution in ERC20/BEP20 tokens
  - User registration with fees
  - Pool limits per user
  - Emergency withdrawal and reward withdrawal
  - Admin functions to recover tokens and manage pool configurations

## Contract Deployment

When deploying the contract, you must pass the `RewardPoolConfiguration` struct to the constructor. This configuration contains the addresses for the staked and reward tokens, reward rates, pool limits, taxes, and admin.

### RewardPoolConfiguration

```solidity
struct RewardPoolConfiguration {
    address stakedToken;
    address rewardToken;
    address admin;
    address projectTaxAddress;
    address taxAddress;
    uint256 rewardPerBlock;
    uint256 startBlock;
    uint256 bonusEndBlock;
    uint256 poolLimitPerUser;
    uint256 tax;
    uint256 projectTax;
}
```

### Deployment Example:

```solidity
RewardPoolConfiguration memory config = RewardPoolConfiguration(
    stakedTokenAddress,      // ERC721 token address
    rewardTokenAddress,      // ERC20 token address
    adminAddress,            // Admin address
    projectTaxAddress,       // Project tax address
    taxAddress,              // Tax address
    rewardPerBlock,          // Rewards per block
    startBlock,              // Start block for reward distribution
    bonusEndBlock,           // End block for reward distribution
    poolLimitPerUser,        // Max number of NFTs a user can stake
    tax,                     // Registration tax
    projectTax               // Project tax
);

NftRewardPoolV2 pool = new NftRewardPoolV2(config);
```

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
