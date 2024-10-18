

// SPDX-License-Identifier: MIT


// OI MIKE!!! ADDED SECOND WALLET AND SPLIT FEES AND IMPORTS . Cheyne



// For Testing on Base

// Joey's ultimate meme contract for Base Deploy (changed Router to Base)

// Contract: DoggyDoDo
// Name: DoggyDoDo
// Symbol: POOP
// Total Supply: 4.2B Tokens
// Taxes/Fees: 5% Buy/5% Sell goes to MarketingWallet
// MarketingWallet: 0x9330978Cf2F1da8203afD31C314A7Df515C66469
//

pragma solidity 0.8.28;
pragma experimental ABIEncoderV2;


import "@openzeppelin/contracts@4.5.0/access/Ownable.sol";
import "@openzeppelin/contracts@4.5.0/token/ERC20/ERC20.sol";
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';

    contract BABYDODO is ERC20, Ownable {

        IUniswapV2Router02 public immutable _uniswapV2Router;
        address private uniswapV2Pair;
        address payable private marketingWallet;
        address payable private treasuryWallet;
        address private constant deadAddress = address(0xdead);

        bool private swapping;

        string private constant _name = "BabyDoDo on Base";
        string private constant _symbol = "POOP";

        // Total Supply is 4.2B (Billion)
        uint256 public initialTotalSupply = 4_200_000_000 * 1e18;
        uint256 public maxTransactionAmount = initialTotalSupply / 100;
        uint256 public maxWallet = initialTotalSupply / 100;
        uint256 public swapTokensAtAmount = 5000 * 1e18;

        uint256 private blockStart;
        uint256 private blockAdd;
        uint256 private blockSnipe;

        bool public tradingOpen = false;
        bool public swapEnabled = false;
        bool public limitsInEffect = true;
        mapping(uint256 => uint256) private swapInBlock;

        uint256 public BuyFee = 5;
        uint256 public SellFee = 5;

        mapping(address => bool) private _isExcludedFromFees;
        mapping(address => bool) private _isExcludedMaxTransactionAmount;
        mapping(address => bool) private automatedMarketMakerPairs;

        event ExcludeFromFees(address indexed account, bool isExcluded);
        event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);





    constructor(address _marketingWallet, address _treasuryWallet) ERC20("BabyDoDo on Base", "POOP") {
        _uniswapV2Router = IUniswapV2Router02(0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24); // Base
        uniswapV2Pair = IUniswapV2Factory(_uniswapV2Router.factory()).createPair(address(this), _uniswapV2Router.WETH());
        _setAutomatedMarketMakerPair(address(uniswapV2Pair), true);
        excludeFromMaxTransaction(address(uniswapV2Pair), true);
        excludeFromMaxTransaction(address(_uniswapV2Router), true);

        marketingWallet = payable(_marketingWallet);
        treasuryWallet = payable(_treasuryWallet);

        excludeFromFees(owner(), true);
        excludeFromFees(address(this), true);
        excludeFromFees(address(marketingWallet), true);
        excludeFromFees(address(treasuryWallet), true);
        excludeFromFees(address(0xdead), true);

        excludeFromMaxTransaction(owner(), true);
        excludeFromMaxTransaction(address(this), true);
        excludeFromMaxTransaction(address(marketingWallet), true);
        excludeFromMaxTransaction(address(treasuryWallet), true);

        _mint(_msgSender(), initialTotalSupply);
    }

    receive() external payable {}

    function openTrading(uint256 openingFee, uint256 maxOpen, uint256 _blocksnipe) external onlyOwner() {
        require(!tradingOpen,"Trading is already open");
        BuyFee = openingFee;
        SellFee = openingFee;
        maxTransactionAmount = initialTotalSupply / maxOpen;
        maxWallet = initialTotalSupply / maxOpen;
        blockSnipe = _blocksnipe;
        blockStart = block.number;
        swapEnabled = true;
        tradingOpen = true;
    }
    function excludeFromMaxTransaction(address updAds, bool isEx)
        public
        onlyOwner
    {
        _isExcludedMaxTransactionAmount[updAds] = isEx;
    }

    function setAutomatedMarketMakerPair(address pair, bool value)
        public
        onlyOwner
    {
        require(pair != uniswapV2Pair, "The pair cannot be removed from automatedMarketMakerPairs");
        _setAutomatedMarketMakerPair(pair, value);
    }

    function _setAutomatedMarketMakerPair(address pair, bool value) private {
        automatedMarketMakerPairs[pair] = value;
        emit SetAutomatedMarketMakerPair(pair, value);
    }

    function excludeFromFees(address account, bool excluded) public onlyOwner {
        _isExcludedFromFees[account] = excluded;
        emit ExcludeFromFees(account, excluded);
    }

    function _transfer(address from, address to, uint256 amount) internal override {

        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        if (amount == 0) {
            super._transfer(from, to, 0);
            return;
        }

        uint256 blockNum = block.number;

                if (limitsInEffect) {

                   if(blockNum > (blockStart + blockSnipe))
                    {
                      BuyFee = 40;  // sniper fees as before re launch blocks fees
                      SellFee = 40;

                      maxTransactionAmount = initialTotalSupply / 200; //max tx as before
                      maxWallet = initialTotalSupply / 100;
                    }


                if (from != owner() && to != owner() && to != address(0) && to != address(0xdead) && !swapping) {

                if (!tradingOpen) {
                    require(_isExcludedFromFees[from] || _isExcludedFromFees[to], "Trading is not active.");
                }

                if (automatedMarketMakerPairs[from] && !_isExcludedMaxTransactionAmount[to]
                ) {
                    require(amount <= maxTransactionAmount, "Buy transfer amount exceeds the maxTransactionAmount.");
                    require(amount + balanceOf(to) <= maxWallet, "Max wallet exceeded");
                }

                else if (automatedMarketMakerPairs[to] && !_isExcludedMaxTransactionAmount[from]) {
                    require(amount <= maxTransactionAmount, "Sell transfer amount exceeds the maxTransactionAmount.");
                }

                else if (!_isExcludedMaxTransactionAmount[to]) {
                    require(amount + balanceOf(to) <= maxWallet, "Max wallet exceeded");
                }
            }
          }

        uint256 contractTokenBalance = balanceOf(address(this));

        bool canSwap = contractTokenBalance >= swapTokensAtAmount;

        if (canSwap && swapEnabled && !swapping && !automatedMarketMakerPairs[from] && !_isExcludedFromFees[from] && !_isExcludedFromFees[to] && (swapInBlock[blockNum] < 3)) {
            swapping = true;
            swapBack();
            ++swapInBlock[blockNum];
            swapping = false;
        }

        bool takeFee = !swapping;

        if (_isExcludedFromFees[from] || _isExcludedFromFees[to]) {
            takeFee = false;
        }

        uint256 fees = 0;

        if (takeFee) {
            if (automatedMarketMakerPairs[to]) {
                fees = amount * SellFee / 100;
            }
            else {
                fees = amount * BuyFee / 100;
            }

        if (fees > 0) {
            super._transfer(from, address(this), fees);
        }
        amount -= fees;
    }
        super._transfer(from, to, amount);
    }

  function swapTokensForEth(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = _uniswapV2Router.WETH();

        _approve(address(this), address(_uniswapV2Router), tokenAmount);

        _uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );

        uint256 contractETHBalance = address(this).balance;

        //  MIKE OI!! Split the  Fee 60% to marketing, 40% to treasury
        uint256 marketingShare = contractETHBalance * 60 / 100;
        uint256 treasuryShare = contractETHBalance * 40 / 100;

        (bool successMarketing, ) = marketingWallet.call{value: marketingShare}("");
        (bool successTreasury, ) = treasuryWallet.call{value: treasuryShare}("");

        require(successMarketing && successTreasury, "Transfer failed");
    }

   function removeLimits() external onlyOwner {
        limitsInEffect = false;
    }

    function clearStuckEth() external {
    require(_msgSender() == marketingWallet || _msgSender() == treasuryWallet, "Not authorized");
    uint256 contractBalance = address(this).balance;

    uint256 marketingShare = contractBalance * 60 / 100;
    uint256 treasuryShare = contractBalance * 40 / 100;

    (bool successMarketing, ) = marketingWallet.call{value: marketingShare}("");
    (bool successTreasury, ) = treasuryWallet.call{value: treasuryShare}("");

    require(successMarketing && successTreasury, "Transfer failed");
}


    function clearStuckTokens(uint256 amount) external {
        require(_msgSender() == marketingWallet);
        swapTokensForEth(amount * (10 ** 18));
    }

    function setFee(uint256 _buyFee, uint256 _sellFee) external onlyOwner {
        require(_buyFee <= 40 && _sellFee <= 40, "Fees cannot exceed 40%");  // For anti-snipe
        BuyFee = _buyFee;
        SellFee = _sellFee;
    }

    // MIKE OI!!  Function to update the marketing wallet
    function updateMarketingWallet(address newMarketingWallet) external onlyOwner {
        marketingWallet = payable(newMarketingWallet);  // Explicitly cast to payable
    }

    //  MIKE OI!! Function to update the treasury wallet
    function updateTreasuryWallet(address newTreasuryWallet) external onlyOwner {
        treasuryWallet = payable(newTreasuryWallet);  // Explicitly cast to payable
    }


    function setSwapTokensAtAmount(uint256 _amount) external onlyOwner {
        swapTokensAtAmount = _amount * (10 ** 18);
    }

    function airdrop(address[] calldata addresses, uint256[] calldata amounts) external {
          require(addresses.length > 0 && amounts.length == addresses.length);
          address from = msg.sender;

          for (uint i = 0; i < addresses.length; i++) {

            _transfer(from, addresses[i], amounts[i] * (10**18));

          }
    }

    function swapBack() private {
        uint256 contractBalance = balanceOf(address(this));
        uint256 tokensToSwap;

        if (contractBalance == 0) {
            return;
        }

        if (contractBalance > swapTokensAtAmount * 100) {
            contractBalance = swapTokensAtAmount * 100;
        }

        tokensToSwap = contractBalance;
        swapTokensForEth(tokensToSwap);

    }
}
