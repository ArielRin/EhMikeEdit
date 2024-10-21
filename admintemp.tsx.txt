import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Image, Text, Button, Progress, useToast, Tabs, TabList, TabPanels, Tab, TabPanel,
} from '@chakra-ui/react';
import { ethers, Contract } from 'ethers';
import { useWeb3ModalProvider } from '@web3modal/ethers/react';
import presaleAbi from './Abi/presaleAbi.json';
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

// Admin Presale Component
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
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);
  const [userTokenBalance, setUserTokenBalance] = useState<string>('0');



  const { walletProvider } = useWeb3ModalProvider();
  const toast = useToast();

  const initContract = async () => {
  if (walletProvider) {
    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      const userAddress = await signer.getAddress();  // Get the connected user's address

      // Initialize the presale and token contracts
      const presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, presaleAbi, signer);
      setContract(presaleContract);

      const tokenContract = new ethers.Contract(PRESALE_TOKEN_ADDRESS, tokenABI, signer);
      setTokenContract(tokenContract);

      // Fetch initial data
      await fetchEthPrice(presaleContract);
      await fetchPresaleDetails(presaleContract);
      await fetchPresaleStatus(presaleContract);
      await fetchUserContributions(presaleContract);
      await fetchPresaleTokenBalance(tokenContract);  // Fetch contract token balance
      await fetchEthAndUsdtBalances(provider);

      // Fetch the presale contract's token balance
      const presaleTokenBalance = await tokenContract.balanceOf(PRESALE_CONTRACT_ADDRESS);
      setPresaleTokenBalance(ethers.formatUnits(presaleTokenBalance, 18));  // Store the balance formatted to 18 decimals

      // Fetch the connected user's balance of presale tokens
      const userTokenBalance = await tokenContract.balanceOf(userAddress);
      setUserTokenBalance(ethers.formatUnits(userTokenBalance, 18));  // Store the user's balance formatted to 18 decimals

    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  }
};


  // Fetch the latest ETH price
  const fetchEthPrice = async (contract: Contract) => {
    try {
      const price = await contract.getLatestETHPrice();
      const formattedPrice = ethers.formatUnits(price, 18);
      setEthPrice(formattedPrice);
    } catch (error) {
      console.error("Error fetching ETH price:", error);
    }
  };

  // Fetch presale details including token offerings and contributions
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

  // Fetch the status of the presale (claim enabled, success, canceled)
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

  // Fetch contributions made in ETH and USDT
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

  // Fetch the balance of the presale tokens in the presale contract
  const fetchPresaleTokenBalance = async (tokenContract: Contract) => {
    try {
      const balance = await tokenContract.balanceOf(PRESALE_CONTRACT_ADDRESS);
      setPresaleTokenBalance(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  // Fetch the ETH and USDT balances in the presale contract
  const fetchEthAndUsdtBalances = async (provider: ethers.BrowserProvider) => {
    try {
      const ethBalance = await provider.getBalance(PRESALE_CONTRACT_ADDRESS);
      setEthBalance(ethers.formatEther(ethBalance));

      const usdtContract = new ethers.Contract(USDC_ADDRESS, ['function balanceOf(address) view returns (uint256)'], provider);
      const usdtBalance = await usdtContract.balanceOf(PRESALE_CONTRACT_ADDRESS);
      setUsdtBalance(ethers.formatUnits(usdtBalance, 6));
    } catch (error) {
      console.error('Error fetching contract balances:', error);
    }
  };

  // Enable the claim tokens function in the presale contract
  const handleEnableClaim = async () => {
    if (!contract || !walletProvider) return;
    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.enableClaimTokens();
      await tx.wait();

      setIsClaimEnabled(true);
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

  // End the presale (finalizes the presale)
  const handleEndPresale = async () => {
    if (!contract || !walletProvider) return;
    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const gasPrice = ethers.parseUnits("50", "gwei");
      const gasLimit = 500000n; // BigInt format for ethers v6

      const tx = await contractWithSigner.endPresale({
        gasLimit: gasLimit,
        gasPrice: gasPrice,
      });

      await tx.wait();

      setIsPresaleSuccessful(true);
      toast({
        title: "Presale Ended",
        description: "Presale has been successfully ended.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error: any) {
      if (error.reason && error.reason.includes("Soft cap in USD not reached")) {
        toast({
          title: "Error Ending Presale",
          description: "Cannot end presale: Soft cap in USD not reached.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      } else {
        toast({
          title: "Error",
          description: `There was an error ending the presale: ${error.reason || "Unknown error"}`,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      }
      console.error("Error ending presale:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel the presale
  const handleCancelPresale = async () => {
    if (!contract || !walletProvider) return;
    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.cancelPresale();
      await tx.wait();

      setIsPresaleCancelled(true);
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

  // Withdraw the contributions from the presale contract
  const handleWithdrawContributions = async () => {
    if (!contract || !walletProvider) return;
    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.withdrawContributions();
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

  // Transfer tokens to the presale contract
  const handleTransferTokensToPresale = async () => {
  if (!walletProvider || !tokenContract || !contract) return;

  try {
    setIsLoading(true); // Set loading state

    // Connect to the wallet provider and get the signer
    const provider = new ethers.BrowserProvider(walletProvider as any);
    const signer = await provider.getSigner();
    const tokenContractWithSigner = tokenContract.connect(signer);

    // Fetch the total tokens offered for the presale (assuming 1,000,000 in the contract)
    const totalTokensOffered = await contract.totalTokensOfferedPresale();

    const tokensToSend = ethers.parseUnits(totalTokensOffered.toString(), 0);

    // Call the transfer function directly on the token contract instance
    const transferTx = await tokenContractWithSigner.transfer(
      PRESALE_CONTRACT_ADDRESS,
      tokensToSend
    );
    await transferTx.wait();

    toast({
      title: "Tokens Transferred",
      description: `Successfully transferred tokens to the presale contract.`,
      status: "success",
      duration: 5000,
      isClosable: true,
      position: "top-right",
    });
  } catch (error) {
    console.error("Error transferring tokens to presale contract:", error);
    toast({
      title: "Error",
      description: "There was an error transferring tokens to the presale contract.",
      status: "error",
      duration: 5000,
      isClosable: true,
      position: "top-right",
    });
  } finally {
    setIsLoading(false); // End loading state
  }
};


  // Withdraw any remaining tokens in the presale contract
  const handleWithdrawRemainingTokens = async () => {
    if (!contract || !walletProvider) return;
    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.withdrawRemainingTokens();
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

  // Run contract initialization on wallet connection
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
          <Box mb={8} textAlign="center" mx="auto">
            <w3m-button />
          </Box>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Presale Overview
          </Text>

          <Flex justifyContent="space-between" mb={2}>
            <Text>Current ETH Price:</Text>
            <Text>${ethPrice ? parseFloat(ethPrice).toFixed(2) : "0.00"}</Text>
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
            <Progress value={(parseFloat(totalContributionsUSD) / parseFloat(softCapUSD)) * 100} colorScheme="green" borderRadius="md" width="60%" />
          </Flex>

          <Flex justifyContent="space-between" mb={2}>
          <Text>%</Text>
            <Text>{((parseFloat(totalContributionsUSD) / parseFloat(softCapUSD)) * 100).toFixed(2)}%</Text>
          </Flex>

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
            <Text fontSize="10px" mb={2}>{PRESALE_TOKEN_ADDRESS}</Text>
          </Flex>

          <Flex fontSize="sm" justifyContent="space-between" mb={2}>
            <Text>Presale Contract:</Text>
            <Text fontSize="10px" mb={2}>{PRESALE_CONTRACT_ADDRESS}</Text>
          </Flex>

          <Box p={4} bg="rgba(0, 0, 0, 0.7)" borderRadius="md" boxShadow="lg" mb={10}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Contributions Summary
            </Text>


            <Flex  justifyContent="space-between" mb={2}>
              <Text>Presale Contract Token Balance:</Text>
              <Text>{parseFloat(presaleTokenBalance).toLocaleString()} Tokens</Text>
            </Flex>


            <Flex justifyContent="space-between" mb={2}>
              <Text>ETH Balance in Contract:</Text>
              <Text>{parseFloat(ethBalance).toFixed(5)} ETH</Text>
            </Flex>

            <Flex justifyContent="space-between" mb={2}>
              <Text>USDC Balance in Contract:</Text>
              <Text>{usdtBalance} USDC</Text>
            </Flex>
            <Flex justifyContent="space-between" mb={2}>
              <Text>Total Contribution in USD:</Text>
              <Text>${parseFloat(totalContributionsUSD).toLocaleString()}</Text>
            </Flex>
          </Box>
        </Box>

        <Flex flexDirection="column" alignItems="center" p={6} borderRadius="xl" boxShadow="xl" bg="rgba(0, 0, 0, 0.6)" color="white" width="100%">
          <Tabs isFitted variant="enclosed" width="100%">
            <TabList mb="1em">
              <Tab>Admin Controls</Tab>
              <Tab>List</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Box borderRadius="md" boxShadow="lg">
                  <Text fontSize="lg" fontWeight="bold" mb={4}>
                    Admin Controls
                  </Text>

                  <Text fontSize="sm" mb={2}>
                    <strong>Step 1:</strong> On successful presale, click "Successfully End Presale" to finalize.
                  </Text>
                  <Button
                    colorScheme="blue"
                    mb={4}
                    onClick={handleEndPresale}
                    isLoading={isLoading}
                    isDisabled={isPresaleSuccessful || isPresaleCancelled}
                  >
                    Successfully End Presale
                  </Button>


                  <Text fontSize="sm" mb={4}>
                    If the presale fails, click "Cancel Presale" to allow refunds.
                  </Text>
                  <Button
                    colorScheme="red"
                    mb={4}
                    onClick={handleCancelPresale}
                    isLoading={isLoading}
                    isDisabled={isPresaleCancelled || isPresaleSuccessful}
                  >
                    Cancel Presale
                  </Button>

                  <Text fontSize="sm" mb={2}>
                    <strong>Step 2:</strong> Withdraw the total contributions after a successful presale.
                  </Text>
                  <Button
                    colorScheme="yellow"
                    mb={4}
                    onClick={handleWithdrawContributions}
                    isLoading={isLoading}
                    isDisabled={!isPresaleSuccessful || parseFloat(ethBalance) === 0 && parseFloat(usdtBalance) === 0}
                  >
                    {isPresaleSuccessful && parseFloat(ethBalance) === 0 && parseFloat(usdtBalance) === 0
                      ? "Funds Withdrawn"
                      : "Withdraw Contributions"}
                  </Button>

                  <Text fontSize="sm" mb={2}>
                    <strong>Step 3:</strong> Send the {parseInt(totalTokensOffered).toLocaleString()} Presale Tokens to the Presale Contract address. Use button Below to easily transfer the presale tokens
                  </Text>
                  <Text fontSize="10px" mb={4}>
                    {PRESALE_CONTRACT_ADDRESS}
                  </Text>
                  <Button
                    mb={6}
                    colorScheme="blue"
                    onClick={handleTransferTokensToPresale}  // Replace with your token transfer function
                    isLoading={isLoading}
                    isDisabled={!isPresaleSuccessful || parseFloat(ethBalance) === 0 && parseFloat(usdtBalance) === 0}
                  >
                    Transfer Tokens to Presale
                  </Button>

                  {isButtonDisabled && (
                    <Text color="green" mt={2} mb={6} >
                        <strong>Presale contract has been Funded with required tokens.</strong>
                    </Text>
                  )}




                  <Text fontSize="sm" mb={4}>
                    <strong>Step 4:</strong> Before enabling the claim tokens ensure the token contract has been set to allow tokens transferred to claims. Look for functions like "EnableTrade" or "StartTrade" in the token contract.
                  </Text>

                  <Text fontSize="sm" mb={4}>
                    Add the value to the liquidity in the correct ratio to ensure contributors get the correct value of tokens purchased.
                  </Text>

                  <Text fontSize="sm" mb={2}>
                    <strong>Step 5:</strong> Enable "Claim Tokens" to allow participants to claim tokens.
                  </Text>
                  <Button
                    colorScheme="blue"
                    mb={4}
                    onClick={handleEnableClaim}
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
                    onClick={handleWithdrawRemainingTokens}
                    isLoading={isLoading}
                    isDisabled={!isPresaleSuccessful && !isPresaleCancelled}
                  >
                    Withdraw Remaining Tokens
                  </Button>
                </Box>
              </TabPanel>

              <TabPanel>
                <ContributorList />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>
      </Flex>
    </Box>
  );
};

export default AdminPresaleComponent;
