import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Image, Text, Button, Progress, useToast
} from '@chakra-ui/react';
import { ethers, Contract } from 'ethers';
import { useWeb3ModalProvider } from '@web3modal/ethers/react';
import presaleAbi from './Abi/presaleAbi.json';

const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS as string;
const PRESALE_CONTRACT_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS as string;
const PRESALE_TOKEN_ADDRESS = import.meta.env.VITE_PRESALE_TOKEN_ADDRESS as string;
const targetDate = new Date(import.meta.env.VITE_TARGET_DATE as string);

const AdminPresaleComponent: React.FC = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<Contract | null>(null);
  const [ethPrice, setEthPrice] = useState<string | null>(null);
  const [totalContributionsUSD, setTotalContributionsUSD] = useState<string>('0');
  const [totalTokensOffered, setTotalTokensOffered] = useState<string>('0');
  const [softCapUSD, setSoftCapUSD] = useState<string>('0');
  const [ethContribution, setEthContribution] = useState<string>('0');
  const [usdtContribution, setUsdtContribution] = useState<string>('0');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [presaleTokenBalance, setPresaleTokenBalance] = useState<string>('0');
  const [isClaimEnabled, setIsClaimEnabled] = useState<boolean>(false);
  const [isPresaleSuccessful, setIsPresaleSuccessful] = useState<boolean>(false);
  const [isPresaleCancelled, setIsPresaleCancelled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { walletProvider } = useWeb3ModalProvider();
  const toast = useToast();

  const initContract = async () => {
    if (walletProvider) {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      try {
        const presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, presaleAbi, signer);
        setContract(presaleContract);

        const tokenContract = new ethers.Contract(PRESALE_TOKEN_ADDRESS, ['function balanceOf(address) view returns (uint256)'], provider);
        setTokenContract(tokenContract);

        await fetchEthPrice(presaleContract);
        await fetchPresaleDetails(presaleContract);
        await fetchPresaleStatus(presaleContract);
        await fetchUserContributions(presaleContract);
        await fetchPresaleTokenBalance(tokenContract);
        await fetchEthAndUsdtBalances(provider);
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    }
  };

  const fetchEthPrice = async (contract: Contract) => {
    try {
      const price = await contract.getLatestETHPrice();
      const formattedPrice = ethers.formatUnits(price, 18);
      setEthPrice(formattedPrice);
    } catch (error) {
      console.error("Error fetching ETH price:", error);
    }
  };

  const fetchPresaleDetails = async (contract: Contract) => {
    try {
      const totalTokens = await contract.totalTokensOfferedPresale();
      const softCap = await contract.softCapUSD();
      const totalContributions = await contract.totalContributionsUSD();

      setTotalTokensOffered(ethers.formatUnits(totalTokens, 18));
      setSoftCapUSD(ethers.formatUnits(softCap, 6));
      setTotalContributionsUSD(ethers.formatUnits(totalContributions, 6));
    } catch (error) {
      console.error('Error fetching presale details:', error);
    }
  };

  const fetchPresaleStatus = async (contract: Contract) => {
    try {
      const claimStatus = await contract.claimEnabled();
      const presaleSuccessStatus = await contract.presaleSuccessful();
      const presaleCancelStatus = await contract.presaleCancelled();

      setIsClaimEnabled(claimStatus);
      setIsPresaleSuccessful(presaleSuccessStatus);
      setIsPresaleCancelled(presaleCancelStatus);
    } catch (error) {
      console.error('Error fetching presale status:', error);
    }
  };

  const fetchUserContributions = async (contract: Contract) => {
    try {
      const ethContrib = await contract.ethContributions(PRESALE_CONTRACT_ADDRESS);
      const usdtContrib = await contract.usdtContributions(PRESALE_CONTRACT_ADDRESS);

      setEthContribution(ethers.formatEther(ethContrib));
      setUsdtContribution(ethers.formatUnits(usdtContrib, 6));
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  };

  const fetchPresaleTokenBalance = async (tokenContract: Contract) => {
    try {
      const balance = await tokenContract.balanceOf(PRESALE_CONTRACT_ADDRESS);
      setPresaleTokenBalance(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  const fetchEthAndUsdtBalances = async (provider: ethers.BrowserProvider) => {
    try {
      const ethBalance = await provider.getBalance(PRESALE_CONTRACT_ADDRESS);
      setEthBalance(ethers.formatEther(ethBalance));

      const usdtContract = new ethers.Contract(USDT_ADDRESS, ['function balanceOf(address) view returns (uint256)'], provider);
      const usdtBalance = await usdtContract.balanceOf(PRESALE_CONTRACT_ADDRESS);
      setUsdtBalance(ethers.formatUnits(usdtBalance, 6));
    } catch (error) {
      console.error('Error fetching contract balances:', error);
    }
  };

  const handleEnableClaim = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      const tx = await contract.enableClaimTokens();
      await tx.wait();
      toast({
        title: "Claim Enabled",
        description: "Claim has been successfully enabled.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error("Error enabling claim:", error);
      toast({
        title: "Error",
        description: "There was an error enabling claim.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndPresale = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      const tx = await contract.endPresale();
      await tx.wait();
      toast({
        title: "Presale Ended",
        description: "Presale has been successfully ended.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error("Error ending presale:", error);
      toast({
        title: "Error",
        description: "There was an error ending the presale.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPresale = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      const tx = await contract.cancelPresale();
      await tx.wait();
      toast({
        title: "Presale Cancelled",
        description: "Presale has been successfully cancelled.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error("Error cancelling presale:", error);
      toast({
        title: "Error",
        description: "There was an error cancelling the presale.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawContributions = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      const tx = await contract.withdrawContributions();
      await tx.wait();
      toast({
        title: "Contributions Withdrawn",
        description: "Contributions have been successfully withdrawn.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error("Error withdrawing contributions:", error);
      toast({
        title: "Error",
        description: "There was an error withdrawing contributions.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawRemainingTokens = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      const tx = await contract.withdrawRemainingTokens();
      await tx.wait();
      toast({
        title: "Remaining Tokens Withdrawn",
        description: "Remaining tokens have been successfully withdrawn.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      toast({
        title: "Error",
        description: "There was an error withdrawing the remaining tokens.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (walletProvider) {
      initContract();
    }
  }, [walletProvider]);

  return (
    <Box position="relative" flex={1} p={0} m={0} display="flex" flexDirection="column" bgImage="/images/b3.png" bgPosition="center" bgRepeat="no-repeat" bgSize="cover" color="white">

    <Flex flexDirection="column" p={6} borderRadius="xl" boxShadow="xl" color="white" width="100%" maxW="800px" mx="auto">
      <Box p={4} bg="rgba(0, 0, 0, 0.7)" borderRadius="md" boxShadow="lg" mb={10}>
        <Image mb={8} src="images/logobwb.png" alt="header" mx="auto" width="40%" minW="250px" />
        <Box textAlign="center" mx="auto">
          <w3m-button />
        </Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>Presale Overview</Text>

        <Flex justifyContent="space-between" mb={2}>
          <Text>Current ETH Price:</Text>
          <Text>${ethPrice ? parseFloat(ethPrice).toFixed(2) : '0.00'}</Text>
        </Flex>

        <Flex justifyContent="space-between" mb={2}>
          <Text>Total Contributions:</Text>
          <Text>${parseFloat(totalContributionsUSD).toLocaleString()} USD</Text>
        </Flex>

        <Flex justifyContent="space-between" mb={2}>
          <Text>Soft Cap:</Text>
          <Text>${parseFloat(softCapUSD).toFixed(2)} USD</Text>
        </Flex>

        <Flex justifyContent="space-between" mb={2}>
          <Text>Total Tokens Offered:</Text>
          <Text>{parseInt(totalTokensOffered).toLocaleString()} Tokens</Text>
        </Flex>

        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Text>Progress:</Text>
          <Box width="60%">
            <Progress value={(parseFloat(totalContributionsUSD) / parseFloat(softCapUSD)) * 100} colorScheme="green" borderRadius="md" />
          </Box>
          <Text>{((parseFloat(totalContributionsUSD) / parseFloat(softCapUSD)) * 100).toFixed(2)}%</Text>
        </Flex>

        <Flex fontSize="sm" justifyContent="space-between" mb={2}>
          <Text>Token Address:</Text>
        </Flex>
        <Flex fontSize="sm" justifyContent="space-between" mb={2}>
          <Text>{PRESALE_TOKEN_ADDRESS}</Text>
        </Flex>

        <Flex fontSize="sm" justifyContent="space-between" mb={2}>
          <Text>Presale Contract Address:</Text>
        </Flex>
        <Flex fontSize="sm" justifyContent="space-between" mb={2}>
          <Text>{PRESALE_CONTRACT_ADDRESS}</Text>
        </Flex>
      </Box>





      <Box p={4} bg="rgba(0, 0, 0, 0.7)" borderRadius="md" boxShadow="lg" mb={10}>
        <Text fontSize="lg" fontWeight="bold" mb={4}>Contributions Summary</Text>

        <Flex justifyContent="space-between" mb={2}>
          <Text>ETH Balance in Contract:</Text>
          <Text>{parseFloat(ethBalance).toFixed(5)} ETH</Text>
        </Flex>

        <Flex justifyContent="space-between" mb={2}>
          <Text>USDT Balance in Contract:</Text>
          <Text>{usdtBalance} USDT</Text>
        </Flex>
        <Flex justifyContent="space-between" mb={2}>
          <Text>Total Contribution in USD:</Text>
          <Text>${parseFloat(totalContributionsUSD).toLocaleString()}</Text>
        </Flex>
      </Box>





      <Box p={4} bg="rgba(0, 0, 0, 0.7)" borderRadius="md" boxShadow="lg">
        <Text fontSize="lg" fontWeight="bold" mb={4}>Admin Controls</Text>

        <Text fontSize="sm" mb={2}>Step 1: On successful presale, click "End Presale" to finalize.</Text>
        <Button colorScheme="blue" mb={4} onClick={handleEndPresale} isLoading={isLoading} isDisabled={isPresaleSuccessful || isPresaleCancelled}>
          End Presale
        </Button>

        <Text fontSize="sm" mb={2}>Step 2: Withdraw the total contributions after a successful presale.</Text>
        <Button colorScheme="yellow" mb={4} onClick={handleWithdrawContributions} isLoading={isLoading} isDisabled={!isPresaleSuccessful || isPresaleCancelled}>
          Withdraw Contributions
        </Button>

        <Text fontSize="sm" mb={2}>Step 3: Enable "Claim Tokens" to allow participants to claim tokens.</Text>
        <Button colorScheme="blue" mb={4} onClick={handleEnableClaim} isLoading={isLoading} isDisabled={isClaimEnabled || !isPresaleSuccessful}>
          Enable Claim
        </Button>
        <Text fontSize="sm" mt={2}>Step 4: Add Liquidity to Exchange and Announce Live Contract as Desired.</Text>


        <Text fontSize="lg" mt={12} color="red.500" fontWeight="bold">Warning: Proceed with caution!</Text>

        <Text fontSize="sm" mb={2}>If the presale fails, click "Cancel Presale" to allow refunds.</Text>
        <Button colorScheme="red" mb={4} onClick={handleCancelPresale} isLoading={isLoading} isDisabled={isPresaleCancelled || isPresaleSuccessful}>
          Cancel Presale
        </Button>

        <Text fontSize="sm" mb={2}>Withdraw any remaining tokens from the contract.</Text>
        <Button colorScheme="orange" mb={4} onClick={handleWithdrawRemainingTokens} isLoading={isLoading} isDisabled={!isPresaleSuccessful || isPresaleCancelled}>
          Withdraw Remaining Tokens
        </Button>

      </Box>
    </Flex>
  </Box>
  );
};

export default AdminPresaleComponent;
