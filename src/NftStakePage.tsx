import React, { useState, useEffect } from "react";
import { ethers, Contract } from 'ethers';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Grid,
  GridItem,
  Image,
  Checkbox,
  useToast,
  Link,
} from "@chakra-ui/react";
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import contractABI from './Abi/stakingfoxynftABI.json'; // Staking Contract ABI
import erc721ABI from './Abi/nftAbi.json'; // ERC-721 ABI for NFTs
import erc20ABI from './Abi/erc20Abi.json'; // ERC-20 ABI for Reward Tokens

const contractAddress = "0x2366d7eF1Fd04A100e2c64feF99A75f31bd95F34"; // Staking contract address
const nftContractAddress = "0x0600Fd27CA4ed4bF1539a907EBE8dCE3814042F7"; // NFT contract address
const rewardTokenAddress = "0xA716C25e30Af41472bd51C92A643861d4Fa28021"; // Reward Token address
const geckoAPIUrl = "https://api.geckoterminal.com/api/v2/simple/networks/base/token_price/0x24ca2fcca044b345d0676f770c6cb42ac34809d7"; // Gecko Terminal API for reward token price
const baseScanUrl = "https://basescan.org/";
const RPC_URL = import.meta.env.VITE_RPC_URL as string;

// Base chain block time (2 seconds per block)
const BLOCK_TIME_SECONDS = 2;

const NftStakingPage = () => {
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [bonusEndBlock, setBonusEndBlock] = useState<number>(0);
  const [remainingBlocks, setRemainingBlocks] = useState<number>(0);
  const [pendingReward, setPendingReward] = useState<string>("0");
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [timeExceeded, setTimeExceeded] = useState<boolean>(false);
  const [rewardTokenPrice, setRewardTokenPrice] = useState<number>(0);
  const [pendingRewardUSD, setPendingRewardUSD] = useState<number>(0);
  const [rewardTokenBalance, setRewardTokenBalance] = useState<string>("0");
  const [rewardTokenBalanceUSD, setRewardTokenBalanceUSD] = useState<number>(0);
  const [userStakedTokens, setUserStakedTokens] = useState<number[]>([]);
  const [ownedNFTs, setOwnedNFTs] = useState<number[]>([]);
  const [nftImages, setNftImages] = useState<{ [key: number]: string }>({});
  const [selectedTokenIds, setSelectedTokenIds] = useState<number[]>([]);

  const { isConnected, address } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const toast = useToast();

  const [stakingContract, setStakingContract] = useState<Contract | null>(null);
  const [nftContract, setNftContract] = useState<Contract | null>(null);

  const initContract = async () => {
    let provider: ethers.JsonRpcProvider | ethers.BrowserProvider;
    let signerOrProvider: ethers.JsonRpcSigner | ethers.Provider;

    if (isConnected && walletProvider) {
      provider = new ethers.BrowserProvider(walletProvider);
      signerOrProvider = await provider.getSigner();
    } else {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      signerOrProvider = provider;
    }

    try {
      const stakingContractInstance = new ethers.Contract(contractAddress, contractABI, signerOrProvider);
      const nftContractInstance = new ethers.Contract(nftContractAddress, erc721ABI, signerOrProvider);
      setStakingContract(stakingContractInstance);
      setNftContract(nftContractInstance);

      await fetchContractData(stakingContractInstance, nftContractInstance, provider);
      await fetchTokenPrice();
    } catch (error) {
      console.error("Error initializing contract:", error);
    }
  };

  const fetchTokenPrice = async () => {
    try {
      const response = await fetch(geckoAPIUrl);
      const data = await response.json();
      const price = parseFloat(data.data.attributes.token_prices["0x24ca2fcca044b345d0676f770c6cb42ac34809d7"]);
      setRewardTokenPrice(price);
    } catch (error) {
      console.error("Error fetching token price:", error);
    }
  };

  const fetchContractData = async (stakingContract: Contract, nftContract: Contract, provider: ethers.Provider) => {
    if (!stakingContract || !nftContract || !address) return;

    const blockNumber = await provider.getBlockNumber();
    setCurrentBlock(blockNumber);

    const endBlock = await stakingContract.bonusEndBlock();
    setBonusEndBlock(Number(endBlock));
    const remaining = Math.max(Number(endBlock) - blockNumber, 0);
    setRemainingBlocks(remaining);

    const userPendingReward = await stakingContract.pendingReward(address);
    setPendingReward(ethers.formatEther(userPendingReward));

    const userTokens = await stakingContract.getUserStakedTokens(address, 100, 0);
    setUserStakedTokens(userTokens[0]);

    await fetchOwnedNFTs(nftContract);
    await fetchRewardTokenBalance(stakingContract, provider);

    calculateEstimatedTime(remaining);

    // Calculate pending rewards in USD
    const pendingRewardUSDValue = parseFloat(ethers.formatEther(userPendingReward)) * rewardTokenPrice;
    setPendingRewardUSD(pendingRewardUSDValue);
  };

  const fetchRewardTokenBalance = async (stakingContract: Contract, provider: ethers.Provider) => {
    const rewardTokenAddress = await stakingContract.rewardToken();
    const rewardTokenContract = new ethers.Contract(rewardTokenAddress, erc20ABI, provider);
    const contractBalance = await rewardTokenContract.balanceOf(contractAddress);
    setRewardTokenBalance(ethers.formatEther(contractBalance));

    // Calculate remaining tokens in USD
    const rewardTokenBalanceUSDValue = parseFloat(ethers.formatEther(contractBalance)) * rewardTokenPrice;
    setRewardTokenBalanceUSD(rewardTokenBalanceUSDValue);
  };

  const fetchOwnedNFTs = async (nftContract: Contract) => {
    if (!nftContract || !address) return;

    const balance = await nftContract.balanceOf(address);
    const ownedTokens: number[] = [];

    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
      ownedTokens.push(Number(tokenId));
      await fetchMetadataForNFT(tokenId);
    }

    setOwnedNFTs(ownedTokens.filter(token => !userStakedTokens.includes(token)));
  };

  const fetchMetadataForNFT = async (tokenId: number) => {
    try {
      const imageUrl = `/NFTIMAGES/${tokenId}.png`;
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Image not found");
      }

      return imageUrl;
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  const calculateEstimatedTime = (remainingBlocks: number) => {
    const totalSeconds = remainingBlocks * BLOCK_TIME_SECONDS;
    const totalHours = Math.round(totalSeconds / 3600);

    const estimatedDate = new Date(Date.now() + totalHours * 3600000);

    if (estimatedDate.getTime() <= Date.now()) {
      setTimeExceeded(true);
    } else {
      setTimeExceeded(false);
      setEstimatedTime(`Date: ${estimatedDate.toLocaleString()}`);
    }
  };

  useEffect(() => {
    initContract();
    const interval = setInterval(() => {
      if (stakingContract && nftContract) {
        fetchContractData(stakingContract, nftContract, walletProvider || new ethers.JsonRpcProvider(RPC_URL));
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [stakingContract, nftContract, walletProvider, isConnected]);

  const handleTokenSelection = (tokenId: number) => {
    const isSelected = selectedTokenIds.includes(tokenId);
    setSelectedTokenIds(isSelected ? selectedTokenIds.filter(id => id !== tokenId) : [...selectedTokenIds, tokenId]);
  };

  const approveNFTs = async () => {
    if (!nftContract || !address) return;

    try {
      const isApproved = await nftContract.isApprovedForAll(address, contractAddress);

      if (!isApproved) {
        const tx = await nftContract.setApprovalForAll(contractAddress, true);
        await tx.wait();
        toast({
          title: "Approval Successful",
          description: "NFTs approved for staking",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error approving NFTs:", error);
      toast({
        title: "Error",
        description: "Failed to approve NFTs for staking",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const stakeNFTs = async () => {
    if (!stakingContract || !nftContract || !address || selectedTokenIds.length === 0) return;

    try {
      await approveNFTs();
      const tx = await stakingContract.deposit(selectedTokenIds);
      await tx.wait();
      toast({
        title: "Stake Successful",
        description: `Staked NFT tokens: ${selectedTokenIds.join(", ")}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setSelectedTokenIds([]);
      await fetchContractData(stakingContract, nftContract, walletProvider || new ethers.JsonRpcProvider(RPC_URL));
    } catch (error) {
      console.error("Error staking NFTs:", error);
      toast({
        title: "Error",
        description: "Failed to stake NFTs",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const withdrawNFTs = async () => {
    if (!stakingContract || !address || selectedTokenIds.length === 0) {
      toast({
        title: "Error",
        description: "No NFTs selected for withdrawal",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      await approveNFTs();
      const tokenIds = selectedTokenIds.map(tokenId => ethers.toBigInt(tokenId));
      const tx = await stakingContract.withdraw(tokenIds);
      await tx.wait();

      toast({
        title: "Withdraw Successful",
        description: `Withdrawn NFT tokens: ${tokenIds.join(", ")}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setSelectedTokenIds([]);
      await fetchContractData(stakingContract, nftContract, walletProvider || new ethers.JsonRpcProvider(RPC_URL));
    } catch (error) {
      console.error("Error withdrawing NFTs:", error);
      toast({
        title: "Error",
        description: `Failed to withdraw NFTs: ${error.reason || "Unknown error"}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadNftImages = async () => {
    const imageMap: { [tokenId: number]: string | null } = {};

    for (const tokenId of ownedNFTs) {
      const imageUrl = await fetchMetadataForNFT(tokenId);
      imageMap[tokenId] = imageUrl;
    }

    for (const tokenId of userStakedTokens) {
      const imageUrl = await fetchMetadataForNFT(tokenId);
      imageMap[tokenId] = imageUrl;
    }

    setNftImages(imageMap);
  };

  useEffect(() => {
    if (ownedNFTs.length > 0 || userStakedTokens.length > 0) {
      loadNftImages();
    }
  }, [ownedNFTs, userStakedTokens]);

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Flex justify="space-between" align="center">
        <Heading>Testing the NFT Staking Contract for Foxy</Heading>
        <Flex align="right">
          <w3m-button />
        </Flex>
      </Flex>

      {/* Flex container for Unstaked and Staked NFTs */}
      <Flex direction={{ base: "column", md: "row" }} gap={6} mt={6}>
        {/* Unstaked NFTs */}
        <Box flex={1} bg="gray.100" p={6} borderRadius="md">
          <Heading size="md" mb={4}>Your Unstaked NFTs</Heading>
          <Grid templateColumns="repeat(3, 1fr)" gap={6}>
            {ownedNFTs.map(tokenId => (
              <GridItem key={tokenId}>
                <Box border="1px solid gray" p={4} textAlign="center">
                  <Image
                    src={nftImages[tokenId] || '/placeholder.png'}
                    alt={`NFT ${tokenId}`}
                    mb={2}
                  />
                  <Text>NFT #{tokenId}</Text>
                  <Checkbox
                    isChecked={selectedTokenIds.includes(tokenId)}
                    onChange={() => handleTokenSelection(tokenId)}
                  >
                    Select
                  </Checkbox>
                </Box>
              </GridItem>
            ))}
          </Grid>
          <Button mt={4} colorScheme="green" onClick={stakeNFTs}>
            Approve & Stake Selected NFTs
          </Button>
        </Box>

        {/* Staked NFTs */}
        <Box flex={1} bg="gray.100" p={6} borderRadius="md">
          <Heading size="md" mb={4}>Your Staked NFTs</Heading>
          <Grid templateColumns="repeat(3, 1fr)" gap={6}>
            {userStakedTokens.map(tokenId => (
              <GridItem key={tokenId}>
                <Box border="1px solid gray" p={4} textAlign="center">
                  <Image
                    src={nftImages[tokenId] || '/placeholder.png'}
                    alt={`NFT ${tokenId}`}
                    mb={2}
                  />
                  <Text>NFT #{tokenId}</Text>
                  <Checkbox
                    isChecked={selectedTokenIds.includes(tokenId)}
                    onChange={() => handleTokenSelection(tokenId)}
                  >
                    Select
                  </Checkbox>
                </Box>
              </GridItem>
            ))}
          </Grid>
          <Button mt={4} colorScheme="orange" onClick={withdrawNFTs}>
            Approve & Unstake Selected NFTs
          </Button>
        </Box>
      </Flex>

      {/* Staking Stats */}
      <Box mt={6} bg="gray.100" p={6} borderRadius="md">
        <Heading size="md" mb={4}>Your Staking Stats</Heading>
        <Text><strong>Pending Reward:</strong> {pendingReward} Reward Tokens ({pendingRewardUSD.toFixed(8)} USD)</Text>
        <Text><strong>Bonus End Block:</strong> {bonusEndBlock}</Text>
        <Text><strong>Current Block:</strong> {currentBlock}</Text>
        <Text><strong>Blocks Remaining:</strong> {remainingBlocks}</Text>
        <Text><strong>Estimated Time:</strong> {timeExceeded ? "Bonus time until tokens in the pool are depleted" : estimatedTime}</Text>
        <Text><strong>Reward Token Price:</strong> ${rewardTokenPrice.toFixed(8)} USD</Text>
        <Text><strong>Reward Tokens in Contract:</strong> {rewardTokenBalance} Tokens ({rewardTokenBalanceUSD.toFixed(8)} USD)</Text>
        <Box spacing={4}>
          <Link href={`${baseScanUrl}address/${contractAddress}`} isExternal>
            View Staking Contract on BaseScan
          </Link>
        </Box>
        <Box spacing={4}>
          <Link href={`${baseScanUrl}token/${rewardTokenAddress}`} isExternal>
            View Reward Token on BaseScan
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default NftStakingPage;
