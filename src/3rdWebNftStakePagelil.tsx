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

const contractAddress = "0xBbd8ddBe5e0bD078Df0aEb061A30e1325a8087b4"; // Staking contract address
const nftContractAddress = "0x30928bF970b74fdcd06E5c9A2B31104327A8A514"; // NFT contract address
const rewardTokenAddress = "0x5Dc2085Fe510Bbaaba2119d71B09c25098caCa3F"; // Reward Token address
const geckoAPIUrl = "https://api.geckoterminal.com/api/v2/simple/networks/base/token_price/0x5dc2085fe510bbaaba2119d71b09c25098caca3f"; // Gecko Terminal API for reward token price
const baseScanUrl = "https://basescan.org/";
const RPC_URL = import.meta.env.VITE_RPC_URL as string;

// Base chain block time (1.9 seconds per block)
const BLOCK_TIME_SECONDS = 1.9;
const REWARD_TOKEN_DECIMALS = 9; // Set reward token decimals to 9 for BBDOGE

const NftStakingPage = () => {
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [bonusEndBlock, setBonusEndBlock] = useState<number>(0);
  const [remainingBlocks, setRemainingBlocks] = useState<number>(0);
  const [pendingReward, setPendingReward] = useState<string>("0");
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [timeExceeded, setTimeExceeded] = useState<boolean>(false);
  const [pendingRewardUSD, setPendingRewardUSD] = useState<number>(0);
  const [rewardTokenPrice, setRewardTokenPrice] = useState<number>(0);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const CACHE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
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
    // Fetch the price only if there's no recent cache or cache is expired
    if (!lastFetched || Date.now() - lastFetched >= CACHE_INTERVAL) {
      const response = await fetch(geckoAPIUrl);
      const data = await response.json();
      const price = parseFloat(data.data.attributes.token_prices["0x5dc2085fe510bbaaba2119d71b09c25098caca3f"]);
      setRewardTokenPrice(price);
      setLastFetched(Date.now()); // Update the last fetched timestamp
      console.log('Fetched new price:', price);
    } else {
      console.log('Using cached price:', rewardTokenPrice);
    }
  } catch (error) {
    console.error("Error fetching token price:", error);
  }
};

useEffect(() => {
  fetchTokenPrice();
  // Set an interval to refresh the price after CACHE_INTERVAL
  const interval = setInterval(fetchTokenPrice, CACHE_INTERVAL);

  // Clear the interval when the component is unmounted
  return () => clearInterval(interval);
}, [lastFetched, rewardTokenPrice]);

  const fetchContractData = async (stakingContract: Contract, nftContract: Contract, provider: ethers.Provider) => {
  if (!stakingContract || !nftContract || !address) return;

  try {
    const blockNumber = await provider.getBlockNumber();
    setCurrentBlock(blockNumber);

    // Ensure `bonusEndBlock` is accessed as a function call since it's defined as a view function in the ABI
    const endBlock = await stakingContract.bonusEndBlock();
    setBonusEndBlock(Number(endBlock));

    const remaining = Math.max(Number(endBlock) - blockNumber, 0);
    setRemainingBlocks(remaining);








    const userPendingReward = await stakingContract.pendingReward(address);
    // Adjust the fetch of user pending rewards to use the correct decimals
    const formattedPendingReward = ethers.formatUnits(userPendingReward, REWARD_TOKEN_DECIMALS);
    setPendingReward(formattedPendingReward);

    const userTokens = await stakingContract.getUserStakedTokens(address, 100, 0);
    setUserStakedTokens(userTokens[0]);

    await fetchOwnedNFTs(nftContract);
    await fetchRewardTokenBalance(stakingContract, provider);

    calculateEstimatedTime(remaining);

    const stakedTokenCount = await stakingContract.getUserStakedTokensCount(address);
    setUserStakedTokenCount(Number(stakedTokenCount));

    // Calculate pending rewards in USD
    const pendingRewardUSDValue = parseFloat(formattedPendingReward) * rewardTokenPrice;
    setPendingRewardUSD(pendingRewardUSDValue);
  } catch (error) {
    console.error("Error fetching contract data:", error);
  }
};


  const fetchRewardTokenBalance = async (stakingContract: Contract, provider: ethers.Provider) => {
    const rewardTokenAddress = await stakingContract.rewardToken();
    const rewardTokenContract = new ethers.Contract(rewardTokenAddress, erc20ABI, provider);
    const contractBalance = await rewardTokenContract.balanceOf(contractAddress);
    // Adjust the balance fetching to use the correct decimals
    const formattedRewardTokenBalance = ethers.formatUnits(contractBalance, REWARD_TOKEN_DECIMALS);
    setRewardTokenBalance(formattedRewardTokenBalance);





    // Calculate remaining tokens in USD
    const rewardTokenBalanceUSDValue = parseFloat(formattedRewardTokenBalance) * rewardTokenPrice;
    setRewardTokenBalanceUSD(rewardTokenBalanceUSDValue);
  };

  const fetchOwnedNFTs = async (nftContract: Contract) => {
  if (!nftContract || !address) return;

  try {
    const balance = await nftContract.balanceOf(address);
    const ownedTokens: number[] = [];

    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
      ownedTokens.push(Number(tokenId));
      const imageUrl = await fetchMetadataForNFT(tokenId);
      setNftImages(prev => ({ ...prev, [tokenId]: imageUrl }));
    }

    // Filter out NFTs that are already staked
    const unstakedNFTs = ownedTokens.filter(token => !userStakedTokens.includes(token));
    setOwnedNFTs(unstakedNFTs);
  } catch (error) {
    console.error("Error fetching owned NFTs:", error);
  }
};


const fetchMetadataForNFT = async (tokenId: number) => {
try {
  // Example of fetching metadata using an API call or directly from the NFT contract.
  const metadataUrl = `/NFTIMAGES/${tokenId}.png`; // Change this URL as needed.
  const response = await fetch(metadataUrl);

  if (!response.ok) {
    console.error("Image not found for token:", tokenId);
    return null;
  }

  return metadataUrl;
} catch (error) {
  console.error("Error fetching metadata for token:", tokenId, error);
  return null;
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
      setEstimatedTime(`${estimatedDate.toLocaleString()}`);
    }
  };

  useEffect(() => {
    initContract();
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
    // Initialize provider
    const provider = walletProvider
      ? new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
      : new ethers.JsonRpcProvider(RPC_URL);

    // Approve NFTs for staking
    await approveNFTs();

    // Stake the selected NFTs
    const tx = await stakingContract.deposit(selectedTokenIds);
    await tx.wait();

    // Show success message
    toast({
      title: "Stake Successful",
      description: `Staked NFT tokens: ${selectedTokenIds.join(", ")}`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    // Clear selected tokens
    setSelectedTokenIds([]);

    // Refresh contract data only if contracts are not null
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

  // Ensure selected token IDs are properly formatted if needed
  const tokenIds = selectedTokenIds.map(tokenId => ethers.toBigInt(tokenId));
  console.log("Token IDs for withdrawal:", tokenIds);

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

  // Refresh contract data if contracts are not null
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
    if (ownedNFTs.length > 0 || userStakedTokens.length > 0) {
      loadNftImages();
    }
  }, [ownedNFTs, userStakedTokens]);


    return (
      <Box bgPosition="center" bgRepeat="no-repeat" bgSize="cover" color="white" mx="auto">
        <Box p={0} maxW="1000px" mx="auto">
          <Flex borderRadius="3xl"   p={6}  justify="space-between" align="center">
          <Image src="/images/logobwb.png" alt="header" width="40%"  minW="150px" />
          <Flex align="right">
            <w3m-button />
          </Flex>
        </Flex>
        {/* Flex container for Unstaked and Staked NFTs */}
        <Flex direction={{ base: "column", md: "row" }} gap={3} mt={3}>



          {/* Staked NFTs */}
          <Box minH="420px"  textAlign="center" borderRadius="3xl"   flex={1} bg="rgba(0, 0, 0, 0)" p={6} >
            <Heading size="sm" mb={4}>Your Staked NFTs</Heading>
            <Grid templateColumns="repeat(3, 1fr)" gap={3}>
              {userStakedTokens.map(tokenId => (
                <GridItem key={tokenId}>
                  <Box border="1px solid gray" borderRadius="2xl" p={4} textAlign="center">
                    <Image
                      src={nftImages[tokenId] || '/placeholder.png'}
                      alt={`NFT ${tokenId}`}
                      mb={2}
                    />
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
            <Button mt={4} color="white" bg="rgba(251, 164, 30, 1)" onClick={withdrawNFTs}>
              Unstake
            </Button>
            <Text mt={6}><strong>Unstake your NFTs to Claim Rewards</strong></Text>

          </Box>
        </Flex>

          {/* Staking Stats */}
          <Box mt={3} bg="rgba(0, 0, 0, 0)" p={2} borderRadius="lg">
          <Grid templateColumns={{ base:  "repeat(2, 1fr)" , md: "repeat(2, 1fr)" }} gap={3} >
              {/* Pending Reward */}
              <Box  borderRadius="3xl" border="1px solid gray"   p={6} bg="rgba(0, 0, 0, 0)" textAlign="center">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Pending Reward
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {pendingReward}
                </Text>
                <Text fontSize="md" mt={2}>
                  ({pendingRewardUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                </Text>
              </Box>

              {/* Blocks Remaining */}
              <Box  borderRadius="3xl" border="1px solid gray"    p={6} bg="rgba(0, 0, 0, 0)" textAlign="center">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Blocks Remaining
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {remainingBlocks}
                </Text>
                <Text fontSize="md" mt={2}>Until End of Staking</Text>
              </Box>


            </Grid>

            <Grid templateColumns={{ base:  "repeat(2, 1fr)" , md: "repeat(2, 1fr)" }} gap={3} mt={3}>
              {/* Remaining Rewards */}
              <Box  borderRadius="3xl"  border="1px solid gray"   p={6} bg="rgba(0, 0, 0, 0)" textAlign="center">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Pool Total
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {parseFloat(rewardTokenBalance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
                <Text fontSize="md" mt={2}>
                  (${rewardTokenBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                </Text>

                <Text fontSize="6px" mt={0}>
                  {contractAddress}
                </Text>
              </Box>
              {/* User Staked Tokens Count */}
              <Box  borderRadius="3xl" border="1px solid gray"    p={6}  textAlign="center">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Your Staked NFTs
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {userStakedTokenCount}
                </Text>
                <Text fontSize="md" mt={2}>NFTs Staked</Text>

                                <Text fontSize="6px" mt={0}>
                                  {nftContractAddress}
                                </Text>
              </Box>

            </Grid>
          </Box>






      </Box>

    </Box>
  );
};

export default NftStakingPage;
