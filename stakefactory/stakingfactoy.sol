// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./stakingfoxynft_flattened.sol"; // Import the NftRewardPoolV2 contract

contract NftRewardPoolFactory {
    address public factoryOwner;
    uint256 public deploymentFee;

    address[] public deployedPools;

    event PoolDeployed(address indexed poolAddress, address indexed admin);
    event FeeUpdated(uint256 newFee);
    event FundsWithdrawn(uint256 amount);

    modifier onlyFactoryOwner() {
        require(msg.sender == factoryOwner, "Caller is not the factory owner");
        _;
    }

    constructor(uint256 _deploymentFee) {
        factoryOwner = msg.sender;
        deploymentFee = _deploymentFee;
    }

    // Deploy pool without fee
    function deployNewPoolWithoutFee(
        address stakedToken,
        address rewardToken,
        address admin,
        address projectTaxAddress,
        address taxAddress,
        uint256 rewardPerBlock,
        uint256 startBlock,
        uint256 bonusEndBlock,
        uint256 poolLimitPerUser,
        uint256 tax,
        uint256 projectTax
    ) external returns (address) {
        RewardPoolConfiguration memory config = RewardPoolConfiguration({
            stakedToken: stakedToken,
            rewardToken: rewardToken,
            admin: admin,
            projectTaxAddress: projectTaxAddress,
            taxAddress: taxAddress,
            rewardPerBlock: rewardPerBlock,
            startBlock: startBlock,
            bonusEndBlock: bonusEndBlock,
            poolLimitPerUser: poolLimitPerUser,
            tax: tax,
            projectTax: projectTax
        });

        NftRewardPoolV2 newPool = new NftRewardPoolV2{value: 0}(config);
        deployedPools.push(address(newPool));

        emit PoolDeployed(address(newPool), admin);
        return address(newPool);
    }

    // Deploy pool with fee
    function deployNewPoolWithFee(
        address stakedToken,
        address rewardToken,
        address admin,
        address projectTaxAddress,
        address taxAddress,
        uint256 rewardPerBlock,
        uint256 startBlock,
        uint256 bonusEndBlock,
        uint256 poolLimitPerUser,
        uint256 tax,
        uint256 projectTax
    ) external payable returns (address) {
        require(msg.value >= deploymentFee, "Insufficient fee");

        RewardPoolConfiguration memory config = RewardPoolConfiguration({
            stakedToken: stakedToken,
            rewardToken: rewardToken,
            admin: admin,
            projectTaxAddress: projectTaxAddress,
            taxAddress: taxAddress,
            rewardPerBlock: rewardPerBlock,
            startBlock: startBlock,
            bonusEndBlock: bonusEndBlock,
            poolLimitPerUser: poolLimitPerUser,
            tax: tax,
            projectTax: projectTax
        });

        NftRewardPoolV2 newPool = new NftRewardPoolV2{value: msg.value}(config);
        deployedPools.push(address(newPool));

        emit PoolDeployed(address(newPool), admin);
        return address(newPool);
    }

    // Update deployment fee (only factory owner can do this)
    function updateDeploymentFee(uint256 newFee) external onlyFactoryOwner {
        deploymentFee = newFee;
        emit FeeUpdated(newFee);
    }

    // Factory owner can withdraw accumulated fees
    function withdrawFunds() external onlyFactoryOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(factoryOwner).transfer(balance);
        emit FundsWithdrawn(balance);
    }

    // Get all deployed pools
    function getDeployedPools() external view returns (address[] memory) {
        return deployedPools;
    }
}
