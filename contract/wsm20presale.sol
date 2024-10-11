// SPDX-License-Identifier: UNLICENSED



/*
token address 0xA716C25e30Af41472bd51C92A643861d4Fa28021
usdt address 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2
eth chainlink aggrigator 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70
tokens offer for presale 100
softcapUSD 3

0xE2BEAD99467C2546a137d3a4EFBA3705eE13652C
*/


/*
Example Parameters:
so u know what to type out mike

    presaleTokenAddress:        0xA716C25e30Af41472bd51C92A643861d4Fa28021
    USDTAddress:                0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2
    chainlinkPricefeedEth:      0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70
    totalTokensOfferedPresale:  1000000000000000000000000 (1,000,000 tokens with 18 decimals)
    softCapUSD:                 2000000000 (2,000 USD with 6 decimals)
*/



pragma solidity ^0.8;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface Aggregator {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

contract Presale {
    address public owner;
    address public presaleTokenAddress;
    address public USDTAddress;
    address public chainlinkPricefeedEth;
    uint256 public totalTokensOfferedPresale;
    uint256 public softCapUSD;
    uint256 public totalContributionsUSD;
    bool public presaleSuccessful;
    bool public claimEnabled;
    bool public presaleCancelled;

    mapping(address => uint256) public ethContributions;
    mapping(address => uint256) public usdtContributions;

    event TokensPurchased(address indexed buyer, uint256 amountContributed);
    event TokensClaimed(address indexed claimer, uint256 amountClaimed);
    event PresaleSuccessful(uint256 totalContributionsUSD, uint256 totalTokensOfferedPresaleDistributed);
    event RefundIssued(address indexed user, uint256 amountRefunded);
    event ClaimEnabled();
    event PresaleCancelled();

    constructor(
        address _presaleTokenAddress,
        address _USDTAddress,
        address _chainlinkPricefeedEth,
        uint256 _totalTokensOfferedPresale,
        uint256 _softCapUSD
    ) {
        owner = msg.sender;
        presaleTokenAddress = _presaleTokenAddress;
        USDTAddress = _USDTAddress;
        chainlinkPricefeedEth = _chainlinkPricefeedEth;
        totalTokensOfferedPresale = _totalTokensOfferedPresale;
        softCapUSD = _softCapUSD;
        presaleSuccessful = false;
        claimEnabled = false;
        presaleCancelled = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    modifier presaleNotCancelled() {
        require(!presaleCancelled, "Presale has been cancelled");
        _;
    }

    // Fetch ETH price in USD using Chainlink's price feed
    function getLatestETHPrice() public view returns (uint256) {
        (, int256 price, , ,) = Aggregator(chainlinkPricefeedEth).latestRoundData();
        return uint256(price * 10 ** 10); // Convert the price to 18 decimals
    }

    // Convert ETH contribution to USD (in 6 decimals)
    function ethToUSD(uint256 ethAmount) public view returns (uint256) {
        uint256 ethPriceInUSD = getLatestETHPrice(); // Get ETH/USD price in 18 decimals
        uint256 ethInUSD = (ethAmount * ethPriceInUSD) / 1 ether; // Convert ETH to USD equivalent (still 18 decimals)

        // Convert the 18 decimal ETH value to a 6 decimal USD value for totalContributionsUSD
        return ethInUSD / 1e12; // Scale down to 6 decimals for proper handling with USDT
    }

    // Convert USDT (6 decimals) to USD (6 decimals)
    function usdtToUSD(uint256 usdtAmount) public pure returns (uint256) {
        return usdtAmount; // USDT is already in 6 decimals, so we return it directly
    }

    // Allow users to contribute ETH
    function contributeWithETH() external payable presaleNotCancelled {
        require(msg.value > 0, "Must contribute ETH");

        uint256 contributionInUSD = ethToUSD(msg.value); // Convert ETH to USD (scaled to 6 decimals)
        ethContributions[msg.sender] += msg.value;
        totalContributionsUSD += contributionInUSD; // Add USD-equivalent contribution (6 decimals)

        emit TokensPurchased(msg.sender, contributionInUSD);
    }

    // Allow users to contribute USDT (already in 6 decimals)
    function contributeWithUSDT(uint256 usdtAmount) external presaleNotCancelled {
        require(usdtAmount > 0, "Must contribute USDT");

        uint256 allowance = IERC20(USDTAddress).allowance(msg.sender, address(this));
        require(allowance >= usdtAmount, "USDT allowance too low");

        IERC20(USDTAddress).transferFrom(msg.sender, address(this), usdtAmount);
        usdtContributions[msg.sender] += usdtAmount;
        totalContributionsUSD += usdtToUSD(usdtAmount); // Add USDT directly to total contributions (6 decimals)

        emit TokensPurchased(msg.sender, usdtAmount);
    }

    // End the presale and mark as successful if soft cap (in USD) is reached
    function endPresale() external onlyOwner presaleNotCancelled {
        require(totalContributionsUSD >= softCapUSD, "Soft cap in USD not reached");
        presaleSuccessful = true;
        emit PresaleSuccessful(totalContributionsUSD, totalTokensOfferedPresale);
    }

    // Cancel the presale and allow users to get refunds
    function cancelPresale() external onlyOwner presaleNotCancelled {
        presaleCancelled = true;
        emit PresaleCancelled();
    }

    // Manually enable the claim process (owner must call this when ready)
    function enableClaimTokens() external onlyOwner {
        require(presaleSuccessful, "Presale must be successful to enable claims");
        require(!presaleCancelled, "Cannot enable claims, presale was cancelled");
        claimEnabled = true;
        emit ClaimEnabled();
    }

    // Claim tokens based on contribution percentage
    function claimTokens() external {
        require(presaleSuccessful, "Presale not successful");
        require(claimEnabled, "Token claim is not enabled");
        require(!presaleCancelled, "Presale was cancelled, no tokens to claim");

        // Calculate user's total contribution in USD
        uint256 userTotalContributionUSD = ethToUSD(ethContributions[msg.sender]) + usdtContributions[msg.sender]; // ETH is scaled to 6 decimals, USDT is 6 decimals
        require(userTotalContributionUSD > 0, "No contributions from user");

        // Calculate the percentage of the total contributions made by the user
        uint256 userSharePercentage = (userTotalContributionUSD * 1e6) / totalContributionsUSD; // Use 6 decimals for user share percentage

        // Calculate the number of tokens the user is entitled to
        uint256 userTokenAmount = (totalTokensOfferedPresale * userSharePercentage) / 1e6;

        require(userTokenAmount > 0, "No tokens to claim");

        // Transfer tokens to the user
        IERC20(presaleTokenAddress).transfer(msg.sender, userTokenAmount);

        // Reset user's contributions to 0 after claiming
        ethContributions[msg.sender] = 0;
        usdtContributions[msg.sender] = 0;

        emit TokensClaimed(msg.sender, userTokenAmount);
    }

    // Refund contributions if the presale is cancelled or soft cap is not reached
    function refund() external {
        require(presaleCancelled || totalContributionsUSD < softCapUSD, "No refunds, presale successful");

        // Refund ETH contributions
        uint256 ethContribution = ethContributions[msg.sender];
        if (ethContribution > 0) {
            ethContributions[msg.sender] = 0;
            payable(msg.sender).transfer(ethContribution);
            emit RefundIssued(msg.sender, ethContribution);
        }

        // Refund USDT contributions
        uint256 usdtContribution = usdtContributions[msg.sender];
        if (usdtContribution > 0) {
            usdtContributions[msg.sender] = 0;
            IERC20(USDTAddress).transfer(msg.sender, usdtContribution);
            emit RefundIssued(msg.sender, usdtContribution);
        }
    }

    // Owner can withdraw the remaining tokens after the presale ends
    function withdrawRemainingTokens() external onlyOwner {
        require(presaleSuccessful, "Presale not successful");
        require(!presaleCancelled, "Presale was cancelled, no withdrawal");
        uint256 remainingTokens = IERC20(presaleTokenAddress).balanceOf(address(this));
        IERC20(presaleTokenAddress).transfer(owner, remainingTokens);
    }

    // Owner can withdraw the total contributions after the presale is successful
    function withdrawContributions() external onlyOwner {
        require(presaleSuccessful, "Presale not successful");
        require(!presaleCancelled, "Presale was cancelled, no withdrawal");

        payable(owner).transfer(address(this).balance); // Withdraw ETH contributions

        uint256 usdtBalance = IERC20(USDTAddress).balanceOf(address(this));
        IERC20(USDTAddress).transfer(owner, usdtBalance); // Withdraw USDT contributions
    }
}
