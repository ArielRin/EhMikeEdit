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
  useToast,
  Link,
} from "@chakra-ui/react";
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import contractABI from './Abi/stakingfoxynftABI.json'; // Staking Contract ABI
import erc721ABI from './Abi/nftAbi.json'; // ERC-721 ABI for NFTs
import erc20ABI from './Abi/erc20Abi.json'; // ERC-20 ABI for Reward Tokens

const contractAddress = "0x668e6869980a1711cDE54Acc0f7569B949b66969"; // Staking contract address
const nftContractAddress = "0x0600Fd27CA4ed4bF1539a907EBE8dCE3814042F7"; // NFT contract address
const rewardTokenAddress = "0xA716C25e30Af41472bd51C92A643861d4Fa28021"; // Reward Token address
const geckoAPIUrl = "https://api.geckoterminal.com/api/v2/simple/networks/base/token_price/0x5dc2085fe510bbaaba2119d71b09c25098caca3f"; // Gecko Terminal API for reward token price
const baseScanUrl = "https://basescan.org/";
const RPC_URL = import.meta.env.VITE_RPC_URL as string;

// Base chain block time (1.9 seconds per block)
const BLOCK_TIME_SECONDS = 1.9;
const REWARD_TOKEN_DECIMALS = 18;

const NftStakingPage = () => {
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [remainingBlocks, setRemainingBlocks] = useState<number>(0);
  const [pendingReward, setPendingReward] = useState<string>("0");
  const [rewardTokenPrice, setRewardTokenPrice] = useState<number>(0);
  const [pendingRewardUSD, setPendingRewardUSD] = useState<number>(0);
  const [rewardTokenBalance, setRewardTokenBalance] = useState<string>("0");
  const [rewardTokenBalanceUSD, setRewardTokenBalanceUSD] = useState<number>(0);
  const [userStakedTokens, setUserStakedTokens] = useState<number[]>([]);
  const [ownedNFTs, setOwnedNFTs] = useState<number[]>([]);
  const [nftImages, setNftImages] = useState<{ [key: number]: string | null }>({});
  const [selectedTokenIds, setSelectedTokenIds] = useState<number[]>([]);
  const [userStakedTokenCount, setUserStakedTokenCount] = useState<number>(0);

  const { isConnected, address } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const toast = useToast();

  const [stakingContract, setStakingContract] = useState<Contract | null>(null);
  const [nftContract, setNftContract] = useState<Contract | null>(null);

  const initContract = async () => {
    let provider: ethers.BrowserProvider | ethers.JsonRpcProvider;
    let signerOrProvider: ethers.JsonRpcSigner | ethers.Provider;

    if (isConnected && walletProvider) {
      provider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider);
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
      const price = parseFloat(data.data.attributes.token_prices["0x5dc2085fe510bbaaba2119d71b09c25098caca3f"]);
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
    const remaining = Math.max(Number(endBlock) - blockNumber, 0);
    setRemainingBlocks(remaining);

    const userPendingReward = await stakingContract.pendingReward(address);
    const formattedPendingReward = ethers.formatUnits(userPendingReward, 9);
    setPendingReward(formattedPendingReward);

    const userTokens = await stakingContract.getUserStakedTokens(address, 100, 0);
    setUserStakedTokens(userTokens[0]);

    const stakedTokenCount = await stakingContract.getUserStakedTokensCount(address);
    setUserStakedTokenCount(Number(stakedTokenCount));

    await fetchOwnedNFTs(nftContract);
    await fetchRewardTokenBalance(stakingContract, provider);

    const pendingRewardUSDValue = parseFloat(formattedPendingReward) * rewardTokenPrice;
    setPendingRewardUSD(pendingRewardUSDValue);
  };

  const fetchRewardTokenBalance = async (stakingContract: Contract, provider: ethers.Provider) => {
    const rewardTokenAddress = await stakingContract.rewardToken();
    const rewardTokenContract = new ethers.Contract(rewardTokenAddress, erc20ABI, provider);
    const contractBalance = await rewardTokenContract.balanceOf(contractAddress);
    const formattedRewardTokenBalance = ethers.formatUnits(contractBalance, REWARD_TOKEN_DECIMALS);
    setRewardTokenBalance(formattedRewardTokenBalance);

    const rewardTokenBalanceUSDValue = parseFloat(formattedRewardTokenBalance) * rewardTokenPrice;
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
      return null;
    }
  };

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
      const provider = walletProvider
        ? new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
        : new ethers.JsonRpcProvider(RPC_URL);

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

      if (stakingContract && nftContract) {
        await fetchContractData(stakingContract, nftContract, provider);
      }
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
    if (!stakingContract || !nftContract || !address || selectedTokenIds.length === 0) {
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

      const provider = walletProvider
        ? new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
        : new ethers.JsonRpcProvider(RPC_URL);

      if (stakingContract && nftContract) {
        await fetchContractData(stakingContract, nftContract, provider);
      }
    } catch (error) {
      console.error("Error withdrawing NFTs:", error);
      toast({
        title: "Error",
        description: `Failed to withdraw NFTs: ${error instanceof Error ? error.message : "Unknown error"}`,
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
    initContract();
  }, [stakingContract, nftContract, walletProvider, isConnected]);

  useEffect(() => {
    if (ownedNFTs.length > 0 || userStakedTokens.length > 0) {
      loadNftImages();
    }
  }, [ownedNFTs, userStakedTokens]);

  return (
    <Box bgImage="/images/foxyBkg.png" bgPosition="center" bgRepeat="no-repeat" bgSize="cover" color="white" mx="auto">
      <Box maxW="1000px" mx="auto">
        <Flex p={6} bg="rgba(0, 0, 0, 0.65)" justify="space-between" align="center">
          <Heading>Foxy NFT Staking Stats</Heading>
          <Flex align="right">
            <w3m-button />
          </Flex>
        </Flex>
        <Heading p={2}  bg="rgba(0, 0, 0, 0.65)" size="md">
          Stake Foxy NFT - Earn $RYIU
        </Heading>

        {/* Staking Stats */}
        <Box mt={4} bg="rgba(0, 0, 0, 0)" p={0} borderRadius="lg">
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={2}>
            {/* Pending Reward */}
            <Box p={4} bg="rgba(0, 0, 0, 0.65)" borderRadius="lg" textAlign="center">
              <Text fontSize="xl" fontWeight="bold" mb={4}>
                Pending Reward
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="white">
                {pendingReward}
              </Text>
              <Text fontSize="lg" mt={2}>
                ({pendingRewardUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
              </Text>
            </Box>

            {/* User Staked Tokens Count */}
            <Box p={6} bg="rgba(0, 0, 0, 0.65)" borderRadius="lg" textAlign="center">
              <Text fontSize="xl" fontWeight="bold" mb={4}>
                Your Staked NFTs
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="white">
                {userStakedTokenCount}
              </Text>
              <Text fontSize="lg" mt={2}>NFTs Staked</Text>
            </Box>

            {/* Blocks Remaining */}
            <Box p={6} bg="rgba(0, 0, 0, 0.65)" borderRadius="lg" textAlign="center">
              <Text fontSize="xl" fontWeight="bold" mb={4}>
                Blocks Remaining
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="white">
                {remainingBlocks}
              </Text>
              <Text fontSize="lg" mt={2}>Until End of Staking</Text>
            </Box>
          </Grid>

          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={2} mt={2}>
            {/* Remaining Rewards */}
            <Box p={6} bg="rgba(0, 0, 0, 0.65)" borderRadius="lg" textAlign="center">
              <Text fontSize="xl" fontWeight="bold" mb={4}>
                Remaining Rewards to Distribute
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="white">
                {parseFloat(rewardTokenBalance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
              <Text fontSize="lg" mt={2}>
                (${rewardTokenBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
              </Text>
            </Box>

            {/* Reward Token Price */}
            <Box p={6} bg="rgba(0, 0, 0, 0.65)" borderRadius="lg" textAlign="center">
              <Text fontSize="xl" fontWeight="bold" mb={4}>
                $RYIU Token Price
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="white">
                ${rewardTokenPrice.toFixed(8)}
              </Text>
              <Text fontSize="lg" mt={2}>USD per Token</Text>
            </Box>
          </Grid>
        </Box>

        {/* Flex container for Unstaked and Staked NFTs */}
        <Flex direction={{ base: "column", md: "row" }} gap={2} mt={2}>
          {/* Unstaked NFTs */}
          <Box flex={1} bg="rgba(0, 0, 0, 0.65)" p={6} borderRadius="md">
            <Heading size="md" mb={4}>Your Unstaked NFTs</Heading>
            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              {ownedNFTs.map(tokenId => (
                <GridItem key={tokenId}>
                  <Box border="1px solid gray" borderRadius="2xl" p={4} textAlign="center">
                    <Image
                      src={nftImages[tokenId] || '/placeholder.png'}
                      alt={`NFT ${tokenId}`}
                      mb={2}
                    />
                    <Text>NFT #{tokenId}</Text>
                  </Box>
                </GridItem>
              ))}
            </Grid>
          </Box>

          {/* Staked NFTs */}
          <Box flex={1} bg="rgba(0, 0, 0, 0.65)" p={6} borderRadius="md">
            <Heading size="md" mb={4}>Your Staked NFTs</Heading>
            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              {userStakedTokens.map(tokenId => (
                <GridItem key={tokenId}>
                  <Box border="1px solid gray" borderRadius="2xl" p={4} textAlign="center">
                    <Image
                      src={nftImages[tokenId] || '/placeholder.png'}
                      alt={`NFT ${tokenId}`}
                      mb={2}
                    />
                    <Text>NFT Staked</Text>
                  </Box>
                </GridItem>
              ))}
            </Grid>
          </Box>
        </Flex>


        <Box gap={6} flex={1} bg="rgba(0, 0, 0, 0.65)" p={6} borderRadius="md" mt={8}>

                  <Flex   justifyContent="space-between" mt={8}>
                    <Box>
                      <Link href={`${baseScanUrl}address/${contractAddress}`} isExternal color="white" fontWeight="bold">
                        View Staking Contract on BaseScan
                      </Link>
                    </Box>
                    <Box>
                      <Link href={`${baseScanUrl}token/${rewardTokenAddress}`} isExternal color="white" fontWeight="bold">
                        View Reward Token on BaseScan
                      </Link>
                    </Box>
                  </Flex>
                </Box>

      </Box>

      <Box p={6} mt={6} minH="250px" bg="rgba(0, 0, 0, 0.65)"></Box>
    </Box>
  );
};

export default NftStakingPage;
