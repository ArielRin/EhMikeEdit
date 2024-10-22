// SPDX-License-Identifier: UNLICENSED

/*
Example Parameters:
so you know what to type out, Mike:

    presaleTokenAddress:        0xA716C25e30Af41472bd51C92A643861d4Fa28021
    totalTokensOfferedPresale:  1000000000000000000000000 (1,000,000 tokens with 18 decimals)
    softCapUSD:                 2000000000 (2,000 USD with 6 decimals)
    presaleEndDate              1731641075  e.g this the date 15 november 2024 . see here to get value https://www.epochconverter.com/ unix time value as entry
*/

pragma solidity 0.8.19;

import "@openzeppelin/contracts@4.5.0/token/ERC20/IERC20.sol";

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

contract WSM20Presale {
    address public owner;
    address public presaleTokenAddress;
    address public USDTAddress;
    address public chainlinkPricefeedEth;

    uint256 public totalTokens;
    uint256 public initialTokenQty;
    uint256 public initialValueToAddInUSD;
    uint256 public burnTokens;
    uint256 public devMarketingTokens;
    uint256 public totalTokensOfferedPresale;
    uint256 public softCapUSD;
    uint256 public presaleValueRaised;
    uint256 public hardCapUSD;
    uint256 public presaleEndDate;

    bool public presaleSuccessful;
    bool public claimEnabled;
    bool public presaleCancelled;
    bool public presalePaused;

    struct Contributor {
        address contributorAddress;
        uint256 totalContributionUSD;
    }

    mapping(address => uint256) public ethContributions;
    mapping(address => uint256) public usdtContributions;
    mapping(address => bool) public claimed;
    mapping(address => bool) public refunded;
    Contributor[] public contributors;
    mapping(address => bool) public isContributor;

    // Events for updates
    event TokensPurchased(address indexed buyer, uint256 amountContributed);
    event TokensClaimed(address indexed claimer, uint256 amountClaimed);
    event RefundIssued(address indexed user, uint256 amountRefunded);
    event PresaleSuccessful(uint256 totalContributionsUSD, uint256 totalTokensOfferedPresaleDistributed);
    event ClaimEnabled();
    event PresaleCancelled();
    event PresalePaused(bool paused);
    event ParametersUpdated(
        uint256 newInitialTokenQty,
        uint256 newInitialValueToAddInUSD,
        uint256 newBurnTokens,
        uint256 newDevMarketingTokens,
        uint256 newHardCapUSD
    );
    event TotalTokensOfferedPresaleUpdated(uint256 newTotalTokensOfferedPresale);
    event PresaleValueRaisedUpdated(uint256 newPresaleValueRaised);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    modifier presaleNotCancelled() {
        require(!presaleCancelled, "Presale has been cancelled");
        _;
    }

    modifier presaleNotPaused() {
        require(!presalePaused, "Presale is paused");
        _;
    }

    modifier presaleNotEnded() {
        require(block.timestamp <= presaleEndDate, "Presale has ended");
        _;
    }

    constructor(
        address _presaleTokenAddress,
        uint256 _totalTokensOfferedPresale,
        uint256 _softCapUSD,
        uint256 _presaleEndDate
    ) {
        owner = msg.sender;
        presaleTokenAddress = _presaleTokenAddress;
        USDTAddress = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        chainlinkPricefeedEth = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;
        totalTokens = 0;
        initialTokenQty = 0;
        initialValueToAddInUSD = 0;
        burnTokens = 0;
        devMarketingTokens = 0;
        totalTokensOfferedPresale = _totalTokensOfferedPresale;
        softCapUSD = _softCapUSD;
        presaleEndDate = _presaleEndDate;
        presaleSuccessful = false;
        claimEnabled = false;
        presaleCancelled = false;
        presalePaused = false;
    }

    // Bulk update function for multiple parameters at once
    // Bulk update function for multiple parameters at once, including softCapUSD and totalTokensOfferedPresale
function updateParameters(
    uint256 newInitialTokenQty,
    uint256 newInitialValueToAddInUSD,
    uint256 newBurnTokens,
    uint256 newDevMarketingTokens,
    uint256 newHardCapUSD,
    uint256 newSoftCapUSD,
    uint256 newTotalTokensOfferedPresale
) external onlyOwner {
    initialTokenQty = newInitialTokenQty;
    initialValueToAddInUSD = newInitialValueToAddInUSD;
    burnTokens = newBurnTokens;
    devMarketingTokens = newDevMarketingTokens;
    hardCapUSD = newHardCapUSD;
    softCapUSD = newSoftCapUSD;
    totalTokensOfferedPresale = newTotalTokensOfferedPresale;

    emit ParametersUpdated(
        newInitialTokenQty,
        newInitialValueToAddInUSD,
        newBurnTokens,
        newDevMarketingTokens,
        newHardCapUSD
    );

    // Emit events for the updated values of softCapUSD and totalTokensOfferedPresale
    emit TotalTokensOfferedPresaleUpdated(newTotalTokensOfferedPresale);
    emit PresaleValueRaisedUpdated(newSoftCapUSD);
}


    // Update total tokens offered for presale
    function updateTotalTokensOfferedPresale(uint256 newTotalTokensOfferedPresale) external onlyOwner {
        totalTokensOfferedPresale = newTotalTokensOfferedPresale;
        emit TotalTokensOfferedPresaleUpdated(newTotalTokensOfferedPresale);
    }

    // Update presale value raised manually
    function updatePresaleValueRaised(uint256 newPresaleValueRaised) external onlyOwner {
        presaleValueRaised = newPresaleValueRaised;
        emit PresaleValueRaisedUpdated(newPresaleValueRaised);
    }

    // Contribute with ETH
    function contributeWithETH() external payable presaleNotCancelled presaleNotPaused presaleNotEnded {
        require(msg.value > 0, "Must contribute ETH");
        uint256 contributionInUSD = ethToUSD(msg.value);
        ethContributions[msg.sender] += msg.value;
        presaleValueRaised += contributionInUSD;

        if (!isContributor[msg.sender]) {
            contributors.push(Contributor(msg.sender, contributionInUSD));
            isContributor[msg.sender] = true;
        } else {
            for (uint256 i = 0; i < contributors.length; i++) {
                if (contributors[i].contributorAddress == msg.sender) {
                    contributors[i].totalContributionUSD += contributionInUSD;
                    break;
                }
            }
        }

        emit TokensPurchased(msg.sender, contributionInUSD);
    }

    // Contribute with USDT
    function contributeWithUSDT(uint256 usdtAmount) external presaleNotCancelled presaleNotPaused presaleNotEnded {
        require(usdtAmount > 0, "Must contribute USDT");
        uint256 allowance = IERC20(USDTAddress).allowance(msg.sender, address(this));
        require(allowance >= usdtAmount, "USDT allowance too low");
        IERC20(USDTAddress).transferFrom(msg.sender, address(this), usdtAmount);
        usdtContributions[msg.sender] += usdtAmount;
        presaleValueRaised += usdtToUSD(usdtAmount);

        if (!isContributor[msg.sender]) {
            contributors.push(Contributor(msg.sender, usdtAmount));
            isContributor[msg.sender] = true;
        } else {
            for (uint256 i = 0; i < contributors.length; i++) {
                if (contributors[i].contributorAddress == msg.sender) {
                    contributors[i].totalContributionUSD += usdtAmount;
                    break;
                }
            }
        }

        emit TokensPurchased(msg.sender, usdtAmount);
    }

    // End the presale if the soft cap is reached
    function endPresale() external onlyOwner presaleNotCancelled {
        require(presaleValueRaised >= softCapUSD, "Soft cap not reached");
        presaleSuccessful = true;
        emit PresaleSuccessful(presaleValueRaised, totalTokensOfferedPresale);
    }

    // Enable token claiming
    function enableClaimTokens() external onlyOwner {
        require(presaleSuccessful, "Presale must be successful to enable claims");
        claimEnabled = true;
        emit ClaimEnabled();
    }

    // Claim tokens after the presale
    function claimTokens() external {
        require(presaleSuccessful, "Presale not successful");
        require(claimEnabled, "Claiming not enabled");
        require(!claimed[msg.sender], "Tokens already claimed");

        uint256 userContributionUSD = ethToUSD(ethContributions[msg.sender]) + usdtContributions[msg.sender];
        require(userContributionUSD > 0, "No contributions from user");

        uint256 userTokenAmount = (totalTokensOfferedPresale * userContributionUSD) / presaleValueRaised;
        require(userTokenAmount > 0, "No tokens to claim");

        claimed[msg.sender] = true;
        IERC20(presaleTokenAddress).transfer(msg.sender, userTokenAmount);

        emit TokensClaimed(msg.sender, userTokenAmount);
    }

    // Issue refunds if the presale is cancelled or fails
    function refund() external {
        require(presaleCancelled || presaleValueRaised < softCapUSD, "Refunds not allowed");
        require(!refunded[msg.sender], "Already refunded");

        uint256 ethContribution = ethContributions[msg.sender];
        if (ethContribution > 0) {
            ethContributions[msg.sender] = 0;
            payable(msg.sender).transfer(ethContribution);
            refunded[msg.sender] = true;
            emit RefundIssued(msg.sender, ethContribution);
        }

        uint256 usdtContribution = usdtContributions[msg.sender];
        if (usdtContribution > 0) {
            usdtContributions[msg.sender] = 0;
            IERC20(USDTAddress).transfer(msg.sender, usdtContribution);
            refunded[msg.sender] = true;
            emit RefundIssued(msg.sender, usdtContribution);
        }
    }

    // Cancel the presale
    function cancelPresale() external onlyOwner {
        require(!presaleSuccessful, "Cannot cancel a successful presale");
        presaleCancelled = true;
        emit PresaleCancelled();
    }

    // Toggle presale pause state
    function togglePresalePause() external onlyOwner {
        presalePaused = !presalePaused;
        emit PresalePaused(presalePaused);
    }

    // Withdraw remaining tokens after the presale
    function withdrawRemainingTokens() external onlyOwner {
        require(presaleSuccessful, "Presale not successful");
        uint256 remainingTokens = IERC20(presaleTokenAddress).balanceOf(address(this));
        IERC20(presaleTokenAddress).transfer(owner, remainingTokens);
    }

    // Withdraw contributions (ETH and USDT)
    function withdrawContributions() external onlyOwner {
        require(presaleSuccessful, "Presale not successful");

        uint256 contractETHBalance = address(this).balance;
        if (contractETHBalance > 0) {
            payable(owner).transfer(contractETHBalance);
        }

        uint256 contractUSDTBalance = IERC20(USDTAddress).balanceOf(address(this));
        if (contractUSDTBalance > 0) {
            IERC20(USDTAddress).transfer(owner, contractUSDTBalance);
        }
    }

    // Get the latest ETH price using Chainlink
    function getLatestETHPrice() public view returns (uint256) {
        (, int256 price, , ,) = Aggregator(chainlinkPricefeedEth).latestRoundData();
        return uint256(price * 10 ** 10); // Convert to 18 decimals
    }

    // Convert ETH to USD based on the Chainlink price
    function ethToUSD(uint256 ethAmount) public view returns (uint256) {
        uint256 ethPriceInUSD = getLatestETHPrice();
        return (ethAmount * ethPriceInUSD) / 1 ether / 1e12; // Convert to 6 decimals
    }

    // Convert USDT to USD (1:1 ratio)
    function usdtToUSD(uint256 usdtAmount) public pure returns (uint256) {
        return usdtAmount;
    }

    // Get the balance of presale tokens
    function getPresaleTokenBalance() public view returns (uint256) {
        return IERC20(presaleTokenAddress).balanceOf(address(this));
    }

    // Get the list of contributors
    function getContributors() external view returns (Contributor[] memory) {
        return contributors;
    }
}
