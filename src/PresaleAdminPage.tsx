import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Image,
  Text,
  Button,
  Progress,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { ethers, Contract, TransactionResponse } from 'ethers';
import { useWeb3ModalProvider } from '@web3modal/ethers/react';
import presaleAbi from './Abi/presaleAbi.json';

// import tokenABI from './Abi/erc20Abi.json';
import ContributorList from './Components/ContributorList';

// Environment variables for contract addresses
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as string;
const PRESALE_CONTRACT_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS as string;
const PRESALE_TOKEN_ADDRESS = import.meta.env.VITE_PRESALE_TOKEN_ADDRESS as string;

// Token ABI for interacting with the ERC-20 token
const tokenABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];


const AdminPresaleComponent: React.FC = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<Contract | null>(null);
  const [ethPrice, setEthPrice] = useState<string>('0.00');
  const [totalContributionsUSD, setTotalContributionsUSD] = useState<string>('0');
  const [totalTokensOffered, setTotalTokensOffered] = useState<string>('0');
  const [softCapUSD, setSoftCapUSD] = useState<string>('0');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [presaleTokenBalance, setPresaleTokenBalance] = useState<string>('0');
  const [isClaimEnabled, setIsClaimEnabled] = useState<boolean>(false);
  const [isPresaleSuccessful, setIsPresaleSuccessful] = useState<boolean>(false);
  const [isPresaleCancelled, setIsPresaleCancelled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { walletProvider } = useWeb3ModalProvider();
  const toast = useToast();

  useEffect(() => {
    if (walletProvider) {
      initContracts();
    }
  }, [walletProvider]);

  // Initialize the contracts
  const initContracts = async () => {
    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      const presaleContract = new ethers.Contract(
        PRESALE_CONTRACT_ADDRESS,
        presaleAbi,
        signer
      );
      setContract(presaleContract);

      const tokenContractInstance = new ethers.Contract(
        PRESALE_TOKEN_ADDRESS,
        tokenABI,
        signer
      );
      setTokenContract(tokenContractInstance);

      await fetchPresaleDetails(presaleContract);
      await fetchPresaleStatus(presaleContract);
      await fetchBalances(provider);
    } catch (error) {
      console.error('Error initializing contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize contracts.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  // Fetch presale details
  const fetchPresaleDetails = async (presaleContract: Contract) => {
    try {
      const [tokensOffered, softCap, totalContributions] = await Promise.all([
        presaleContract.totalTokensOfferedPresale(),
        presaleContract.softCapUSD(),
        presaleContract.totalContributionsUSD(),
      ]);

      setTotalTokensOffered(ethers.formatUnits(tokensOffered, 18));
      setSoftCapUSD(ethers.formatUnits(softCap, 6));
      setTotalContributionsUSD(ethers.formatUnits(totalContributions, 6));
    } catch (error) {
      console.error('Error fetching presale details:', error);
    }
  };

  // Fetch the status of the presale
  const fetchPresaleStatus = async (presaleContract: Contract) => {
    try {
      const [claimEnabled, presaleSuccessful, presaleCancelled] = await Promise.all([
        presaleContract.claimEnabled(),
        presaleContract.presaleSuccessful(),
        presaleContract.presaleCancelled(),
      ]);

      setIsClaimEnabled(claimEnabled);
      setIsPresaleSuccessful(presaleSuccessful);
      setIsPresaleCancelled(presaleCancelled);
    } catch (error) {
      console.error('Error fetching presale status:', error);
    }
  };

  // Fetch balances for the presale contract
  const fetchBalances = async (provider: ethers.BrowserProvider) => {
    try {
      const ethBalance = await provider.getBalance(PRESALE_CONTRACT_ADDRESS);
      setEthBalance(ethers.formatEther(ethBalance));

      if (tokenContract) {
        const tokenBalance = await tokenContract.balanceOf(PRESALE_CONTRACT_ADDRESS);
        setPresaleTokenBalance(ethers.formatUnits(tokenBalance, 18));
      }

      const usdtContract = new ethers.Contract(USDC_ADDRESS, ['function balanceOf(address) view returns (uint256)'], provider);
      const usdtBalance = await usdtContract.balanceOf(PRESALE_CONTRACT_ADDRESS);
      setUsdtBalance(ethers.formatUnits(usdtBalance, 6));
    } catch (error) {
      console.error('Error fetching contract balances:', error);
    }
  };

  // Reusable function for contract actions
const handleContractAction = async (
  action: () => Promise<TransactionResponse>, // Adjusted type for ethers.js v6
  successMessage: string
) => {
  if (!contract) return;
  setIsLoading(true);

  try {
    const tx = await action();
    const receipt = await tx.wait(); // Awaiting confirmation of the transaction
    toast({
      title: successMessage,
      status: 'success',
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });
  } catch (error) {
    console.error('Contract action error:', error);
    toast({
      title: 'Error',
      description: 'There was an error processing the transaction.',
      status: 'error',
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });
  } finally {
    setIsLoading(false);
  }
};

  const enableClaimTokens = () => handleContractAction(() => contract!.enableClaimTokens(), 'Claim Enabled');
  const endPresale = () => handleContractAction(() => contract!.endPresale(), 'Presale Ended');
  const cancelPresale = () => handleContractAction(() => contract!.cancelPresale(), 'Presale Cancelled');
  const withdrawContributions = () => handleContractAction(() => contract!.withdrawContributions(), 'Contributions Withdrawn');
  const withdrawRemainingTokens = () => handleContractAction(() => contract!.withdrawRemainingTokens(), 'Remaining Tokens Withdrawn');

  const transferTokensToPresale = async () => {
    if (!walletProvider || !tokenContract || !contract) return;

    try {
      setIsLoading(true); // Set loading state

      // Get the total tokens offered for presale from the presale contract
      const totalTokensOffered = await contract.totalTokensOfferedPresale();
      const tokensToSend = ethers.parseUnits(totalTokensOffered.toString(), 18);

      // Transfer tokens to the presale contract address
      const tx = await tokenContract.transfer(PRESALE_CONTRACT_ADDRESS, tokensToSend);

      // Wait for the transaction to be confirmed
      await tx.wait();

      // Show a success message to the user
      toast({
        title: 'Tokens Transferred',
        description: 'Successfully transferred tokens to the presale contract.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (error) {
      const errorMessage = (error as Error).message || 'Transaction reverted';
      console.error('Error transferring tokens to presale contract:', errorMessage);
      toast({
        title: 'Error',
        description: `There was an error transferring tokens to the presale contract. Details: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Box position="relative" flex={1} p={0} m={0} display="flex" flexDirection="column" bgImage="/images/b3.png" bgPosition="center" bgRepeat="no-repeat" bgSize="cover" color="white">
      <Flex flexDirection="column" p={6} borderRadius="xl" boxShadow="xl" color="white" width="100%" maxW="800px" mx="auto">
        <Box p={4} bg="rgba(0, 0, 0, 0.7)" borderRadius="md" boxShadow="lg" mb={10}>
          <Image mb={8} src="images/logobwb.png" alt="header" mx="auto" width="40%" minW="250px" />
          <Box mb={8} textAlign="center" mx="auto">
            <w3m-button />
          </Box>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Presale Overview
          </Text>
          <Flex justifyContent="space-between" mb={2}>
            <Text>Current ETH Price:</Text>
            <Text>${ethPrice}</Text>
          </Flex>
          <Flex justifyContent="space-between" mb={2}>
            <Text>Total Contributions:</Text>
            <Text>${parseFloat(totalContributionsUSD).toLocaleString()}</Text>
          </Flex>
          <Flex justifyContent="space-between" mb={2}>
            <Text>Soft Cap:</Text>
            <Text>${softCapUSD}</Text>
          </Flex>
          <Flex justifyContent="space-between" mb={2}>
            <Text>Total Tokens Offered:</Text>
            <Text>{totalTokensOffered} Tokens</Text>
          </Flex>
          <Progress value={(parseFloat(totalContributionsUSD) / parseFloat(softCapUSD)) * 100} colorScheme="green" borderRadius="md" width="100%" />
          <Flex justifyContent="space-between" mb={2}>
            <Text>Presale Successful:</Text>
            <Text>{isPresaleSuccessful ? "Yes" : "No"}</Text>
          </Flex>
          <Flex justifyContent="space-between" mb={2}>
            <Text>Claim Enabled:</Text>
            <Text>{isClaimEnabled ? "Yes" : "No"}</Text>
          </Flex>
          <Flex justifyContent="space-between" mb={2}>
            <Text>Presale Cancelled:</Text>
            <Text>{isPresaleCancelled ? "Yes" : "No"}</Text>
          </Flex>
          <Flex fontSize="sm" justifyContent="space-between" mb={2}>
            <Text>Token Address:</Text>
            <Text>{PRESALE_TOKEN_ADDRESS}</Text>
          </Flex>
          <Flex fontSize="sm" justifyContent="space-between" mb={2}>
            <Text>Presale Contract:</Text>
            <Text>{PRESALE_CONTRACT_ADDRESS}</Text>
          </Flex>
        </Box>

        <Box p={4} bg="rgba(0, 0, 0, 0.7)" borderRadius="md" boxShadow="lg" mb={10}>
          <Tabs isFitted variant="enclosed">
            <TabList>
              <Tab>Admin Controls</Tab>
              <Tab>Contributor List</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Text fontSize="sm" mb={2}>
                  <strong>Step 1:</strong> On successful presale, click "Successfully End Presale" to finalize.
                </Text>
                <Button colorScheme="blue" mb={4} onClick={endPresale} isLoading={isLoading} isDisabled={isPresaleSuccessful || isPresaleCancelled}>
                  Successfully End Presale
                </Button>

                <Text fontSize="sm" mb={4}>
                  If the presale fails, click "Cancel Presale" to allow refunds.
                </Text>
                <Button colorScheme="red" mb={4} onClick={cancelPresale} isLoading={isLoading} isDisabled={isPresaleCancelled || isPresaleSuccessful}>
                  Cancel Presale
                </Button>

                <Text fontSize="sm" mb={2}>
                  <strong>Step 2:</strong> Withdraw the total contributions after a successful presale.
                </Text>
                <Button
                  colorScheme="yellow"
                  mb={4}
                  onClick={withdrawContributions}
                  isLoading={isLoading}
                  isDisabled={!isPresaleSuccessful || parseFloat(ethBalance) === 0 && parseFloat(usdtBalance) === 0}
                >
                  {isPresaleSuccessful && parseFloat(ethBalance) === 0 && parseFloat(usdtBalance) === 0
                    ? "Funds Withdrawn"
                    : "Withdraw Contributions"}
                </Button>

                <Text fontSize="sm" mb={2}>
                  <strong>Step 3:</strong> Send the {totalTokensOffered} Presale Tokens to the Presale Contract address.
                </Text>
                <Button
                  colorScheme="blue"
                  mb={4}
                  onClick={transferTokensToPresale}
                  isLoading={isLoading}
                  isDisabled={!isPresaleSuccessful}
                >
                  Transfer Tokens to Presale
                </Button>

                <Text fontSize="sm" mb={4}>
                  <strong>Step 4:</strong> Enable "Claim Tokens" to allow participants to claim tokens.
                </Text>
                <Button
                  colorScheme="blue"
                  mb={4}
                  onClick={enableClaimTokens}
                  isLoading={isLoading}
                  isDisabled={isClaimEnabled || !isPresaleSuccessful}
                >
                  Enable Claim
                </Button>

                <Text fontSize="sm" mb={2}>
                  Withdraw any remaining tokens from the contract if no claims remaining.
                </Text>
                <Button
                  colorScheme="orange"
                  mb={4}
                  onClick={withdrawRemainingTokens}
                  isLoading={isLoading}
                  isDisabled={!isPresaleSuccessful && !isPresaleCancelled}
                >
                  Withdraw Remaining Tokens
                </Button>
              </TabPanel>

              <TabPanel>
                <ContributorList />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
    </Box>
  );
};

export default AdminPresaleComponent;
