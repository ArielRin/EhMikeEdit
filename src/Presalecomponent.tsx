import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Button, Progress, Input, Image, InputGroup, InputLeftElement, Tabs, TabList,
  TabPanels, Tab, TabPanel, useToast
} from '@chakra-ui/react';
import { ethers, Contract } from 'ethers';
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import presaleAbi from './Abi/presaleAbi.json';

const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS as string;
const PRESALE_CONTRACT_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS as string;
const PRESALE_TOKEN_ADDRESS = import.meta.env.VITE_PRESALE_TOKEN_ADDRESS as string;
const RPC_URL = import.meta.env.VITE_RPC_URL as string;
const targetDate = new Date(import.meta.env.VITE_TARGET_DATE as string);

const PresaleComponent: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [ethAmount, setEthAmount] = useState<string>('');
  const [usdtAmount, setUsdtAmount] = useState<string>('');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isClaimEnabled, setIsClaimEnabled] = useState<boolean>(false);
  const [isPresaleCancelled, setIsPresaleCancelled] = useState<boolean>(false);
  const [isPresaleSuccessful, setIsPresaleSuccessful] = useState<boolean>(false);
  const [usdtApproval, setUsdtApproval] = useState<boolean>(false);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [ethBalanceInUSD, setEthBalanceInUSD] = useState<string>('0');
  const [ethContribution, setEthContribution] = useState<string>('0');
  const [usdtContribution, setUsdtContribution] = useState<string>('0');
  const [totalContributionsUSD, setTotalContributionsUSD] = useState<string>('0');
  const [totalTokensOffered, setTotalTokensOffered] = useState<string>('0');
  const [softCapUSD, setSoftCapUSD] = useState<string>('0');
  const toast = useToast();

  const { isConnected, address } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initContract = async () => {
  let provider: ethers.JsonRpcProvider | ethers.BrowserProvider;
  let signerOrProvider: ethers.JsonRpcSigner | ethers.Provider;

  if (isConnected && walletProvider) {
    provider = new ethers.BrowserProvider(walletProvider as any);
    signerOrProvider = await provider.getSigner();
  } else {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    signerOrProvider = provider;
  }

  try {
    const presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, presaleAbi, signerOrProvider);
    setContract(presaleContract);

    await fetchClaimStatus(presaleContract);
    await fetchEthPrice(presaleContract);
    await fetchPresaleStatus(presaleContract);
    await fetchPresaleDetails(presaleContract);

    // Check if signerOrProvider is a JsonRpcSigner before calling fetchBalances
    if (isConnected && signerOrProvider instanceof ethers.JsonRpcSigner) {
      await fetchBalances(provider, signerOrProvider);
      await fetchUserContributions(presaleContract);
    }
  } catch (error) {
    console.error("Error initializing contract:", error);
  }
};



  const fetchBalances = async (provider: ethers.JsonRpcProvider | ethers.BrowserProvider, signer: ethers.JsonRpcSigner) => {
    if (!address) return;
    try {
      const ethBalance = await provider.getBalance(address);
      const formattedEthBalance = ethers.formatEther(ethBalance);
      setEthBalance(parseFloat(formattedEthBalance).toFixed(5));

      if (ethPrice && !isNaN(ethPrice)) {
        const ethBalanceInUSD = (parseFloat(formattedEthBalance) * ethPrice).toFixed(2);
        setEthBalanceInUSD(ethBalanceInUSD);
      }

      const usdtContract = new ethers.Contract(USDT_ADDRESS, ['function balanceOf(address) view returns (uint256)'], signer);
      const usdtBalance = await usdtContract.balanceOf(address);
      setUsdtBalance(parseFloat(ethers.formatUnits(usdtBalance, 6)).toFixed(5));
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };



  // New: Fetch presale status
  const fetchPresaleStatus = async (contract: Contract) => {
    try {
      const presaleCancelled = await contract.presaleCancelled();
      const presaleSuccessful = await contract.presaleSuccessful();

      setIsPresaleCancelled(presaleCancelled);
      setIsPresaleSuccessful(presaleSuccessful);
    } catch (error) {
      console.error('Error fetching presale status:', error);
    }
  };


  const fetchEthPrice = async (contract: Contract) => {
   try {
     const price = await contract.getLatestETHPrice();
     const formattedPrice = ethers.formatUnits(price, 18);
     setEthPrice(parseFloat(formattedPrice));
   } catch (error) {
     console.error("Error fetching ETH price:", error);
   }
 };

 const fetchClaimStatus = async (contract: Contract) => {
   try {
     const claimStatus = await contract.claimEnabled();
     setIsClaimEnabled(claimStatus);
   } catch (error) {
     console.error('Error fetching claim status:', error);
   }
 };

  const fetchUserContributions = async (contract: Contract) => {
    if (!address) return;
    try {
      const ethContrib = await contract.ethContributions(address);
      const usdtContrib = await contract.usdtContributions(address);
      const totalContribUSD = await contract.totalContributionsUSD();

      setEthContribution(parseFloat(ethers.formatEther(ethContrib)).toFixed(5));
      setUsdtContribution(parseFloat(ethers.formatUnits(usdtContrib, 6)).toFixed(5));
      setTotalContributionsUSD(parseFloat(ethers.formatUnits(totalContribUSD, 6)).toFixed(2));
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  };

  const fetchPresaleDetails = async (contract: Contract) => {
    try {
      const totalTokens = await contract.totalTokensOfferedPresale();
      const softCap = await contract.softCapUSD();

      setTotalTokensOffered(ethers.formatUnits(totalTokens, 18));
      setSoftCapUSD(ethers.formatUnits(softCap, 6));
    } catch (error) {
      console.error('Error fetching presale details:', error);
    }
  };

  useEffect(() => {
    initContract();
    const interval = setInterval(() => {
      initContract();
    }, 15000);

    return () => clearInterval(interval);
  }, [walletProvider, isConnected]);

  const handleContributeETH = async () => {
    if (!contract) return;
    try {
      const tx = await contract.contributeWithETH({ value: ethers.parseEther(ethAmount) });
      await tx.wait();
      toast({
        title: "ETH Contribution Successful",
        description: `You contributed ${ethAmount} ETH.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      await fetchUserContributions(contract);
    } catch (error) {
      console.error('ETH Contribution Failed:', error);
      toast({
        title: "ETH Contribution Failed",
        description: `There was an error contributing ${ethAmount} ETH.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const approveUSDT = async () => {
    if (!walletProvider || !contract) return;

    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(USDT_ADDRESS, ['function approve(address spender, uint256 amount) public returns (bool)'], signer);
      const approvalAmount = ethers.MaxUint256;

      const tx = await usdtContract.approve(PRESALE_CONTRACT_ADDRESS, approvalAmount);
      await tx.wait();
      setUsdtApproval(true);
      toast({
        title: "USDT Approval Successful",
        description: `You have successfully approved USDT.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error('USDT Approval Failed:', error);
      toast({
        title: "USDT Approval Failed",
        description: `There was an error approving USDT.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleContributeUSDT = async () => {
    if (!contract || usdtAmount === '' || !usdtApproval) return;
    try {
      const tx = await contract.contributeWithUSDT(ethers.parseUnits(usdtAmount, 6));
      await tx.wait();
      toast({
        title: "USDT Contribution Successful",
        description: `You contributed ${usdtAmount} USDT.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      await fetchUserContributions(contract);
    } catch (error) {
      console.error('USDT Contribution Failed:', error);
      toast({
        title: "USDT Contribution Failed",
        description: `There was an error contributing ${usdtAmount} USDT.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  // New: Handle token claim or refund based on presale status
  const handleClaimOrRefund = async () => {
    if (!contract) return;
    try {
      if (isPresaleCancelled) {
        const tx = await contract.refund();
        await tx.wait();
        toast({
          title: "Refund Processed",
          description: `Your refund has been processed.`,
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      } else if (isClaimEnabled) {
        const tx = await contract.claimTokens();
        await tx.wait();
        toast({
          title: "Tokens Claimed",
          description: `You successfully claimed your tokens.`,
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error('Action Failed:', error);
      toast({
        title: isPresaleCancelled ? "Refund Failed" : "Token Claim Failed",
        description: `There was an error processing your request.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const ethContributionInUSD = ethContribution && ethPrice ? (parseFloat(ethContribution) * ethPrice) : 0;

  const totalUserContributionUSD = ethContributionInUSD + parseFloat(usdtContribution || '0');

  const contributionPercentage = parseFloat(totalContributionsUSD) > 0
    ? (totalUserContributionUSD / parseFloat(totalContributionsUSD)) * 100
    : 0;

  const expectedTokens = parseFloat(totalTokensOffered) > 0
    ? (totalUserContributionUSD / parseFloat(totalContributionsUSD)) * parseFloat(totalTokensOffered)
    : 0;

  const softCapPercentage = parseFloat(softCapUSD) > 0
    ? (parseFloat(totalContributionsUSD) / parseFloat(softCapUSD)) * 100
    : 0;
    return (
      <Flex
        flexDirection="column"
        alignItems="center"
        p={6}
        borderRadius="xl"
        boxShadow="xl"
        bg="rgba(0, 0, 0, 0.7)"
        color="white"
        width="100%"
      >
        {isPresaleCancelled && (
          <Box textAlign="center" mb={4} bg="red.600" p={4} borderRadius="md">
            <Text fontSize="xl" fontWeight="bold">Presale Cancelled</Text>
            <Text fontSize="md">Go to the refund tab to retrieve your contributions.</Text>
          </Box>
        )}

        {isPresaleSuccessful && !isPresaleCancelled && (
          <Box textAlign="center" mb={4} bg="green.600" p={4} borderRadius="md">
            <Text fontSize="xl" fontWeight="bold">Presale Successful!</Text>
            <Text fontSize="md">You can now claim your tokens from the claim tab.</Text>
          </Box>
        )}

        <Box textAlign="center" mb={4}>
          <Image src="images/logobwb.png" alt="header" mx="auto" width="40%" minW="250px" mt="28px" />
          <Box mt={2} mx="auto" align="center">
            <w3m-button />
          </Box>
          <Text fontSize="2xl" fontWeight="bold">Presale ending in</Text>
          <Text fontSize="4xl" mt={2}>
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </Text>
        </Box>

        <Box width="100%" mb={6}>
          <Text fontSize="sm" mb={4} color="gray.300">{PRESALE_TOKEN_ADDRESS}</Text>
          <Text fontSize="xl" fontWeight="bold" textAlign="center">
            Total Tokens Offered: {parseInt(totalTokensOffered).toLocaleString()}
          </Text>

          {softCapPercentage >= 100 ? (
            <Text fontSize="3xl" fontWeight="bold" textAlign="center" color="green.400">
              Softcap Reached
            </Text>
          ) : (
            <Text fontSize="3xl" fontWeight="bold" textAlign="center">Required Softcap: ${softCapUSD} USD</Text>
          )}

          <Progress value={softCapPercentage} size="lg" mx="auto" maxW="250px" colorScheme="green" borderRadius="md" mt={4} />
          <Text fontSize="xl" textAlign="center" mt={2}>
            Current Contributions ${parseFloat(totalContributionsUSD).toFixed(2).toLocaleString()} / ${parseFloat(softCapUSD).toFixed(2).toLocaleString()} USD
          </Text>
          <Text fontSize="xl" mt={2}>
            Progress: {softCapPercentage.toFixed(2)}%
          </Text>
        </Box>

        <Tabs isFitted variant="enclosed" width="100%">
          <TabList mb="1em">
            <Tab>ETH</Tab>
            <Tab>USDT</Tab>
            <Tab>{isPresaleCancelled ? 'Refund' : 'Claim'}</Tab>
            <Tab>Position</Tab>
          </TabList>
          <TabPanels>
            {/* ETH Contribution Panel */}
            <TabPanel>
              <Flex flexDirection="column" alignItems="center">
                <Box width="100%" mb={4}>
                  <Text mb={2} fontSize="sm">Enter ETH amount</Text>
                  <InputGroup>
                    <InputLeftElement height="100%" display="flex" alignItems="center" pointerEvents="none">
                      <Image src="/images/eth.svg" alt="ETH Icon" boxSize="32px" />
                    </InputLeftElement>
                    <Input
                      bg="white"
                      color="black"
                      placeholder="Enter ETH amount"
                      size="lg"
                      borderRadius="md"
                      textAlign="right"
                      value={ethAmount}
                      onChange={(e) => setEthAmount(e.target.value)}
                      disabled={isPresaleCancelled} // Disable input if presale is cancelled
                    />
                  </InputGroup>
                </Box>

                <Text mt={2} mb={4} textAlign="right" fontSize="sm" width="100%">
                  ETH Balance: {ethBalance} ETH (${parseFloat(ethBalanceInUSD).toFixed(2)} USD)
                </Text>

                {!isPresaleCancelled && (
                  <Button
                    colorScheme="blue"
                    width="100%"
                    size="lg"
                    borderRadius="xl"
                    onClick={handleContributeETH}
                  >
                    Contribute ETH
                  </Button>
                )}

                {isPresaleCancelled && (
                  <Text color="red.500" fontWeight="bold" textAlign="center" mt={4}>
                    Presale cancelled, contributions are no longer accepted.
                  </Text>
                )}
              </Flex>
            </TabPanel>

            {/* USDT Contribution Panel */}
            <TabPanel>
              <Flex flexDirection="column" alignItems="center">
                <Box width="100%" mb={4}>
                  <Text mb={2} fontSize="sm">Enter USDT amount</Text>
                  <InputGroup>
                    <InputLeftElement height="100%" display="flex" alignItems="center" pointerEvents="none">
                      <Image src="/images/usdt.svg" alt="USDT Icon" boxSize="32px" />
                    </InputLeftElement>
                    <Input
                      bg="white"
                      color="black"
                      placeholder="Enter USDT amount"
                      size="lg"
                      borderRadius="md"
                      textAlign="right"
                      value={usdtAmount}
                      onChange={(e) => setUsdtAmount(e.target.value)}
                      disabled={isPresaleCancelled} // Disable input if presale is cancelled
                    />
                  </InputGroup>
                </Box>

                <Text mt={2} mb={4} textAlign="right" fontSize="sm" width="100%">
                  USDT Balance: {usdtBalance} USDT
                </Text>

                {!isPresaleCancelled && (
                  <Text fontSize="sm" fontWeight="normal" mb={4} textAlign="left">
                    Approve Spend then Contribute USDT will appear in place of approve button
                  </Text>
                )}

                {usdtApproval && !isPresaleCancelled ? (
                  <Button
                    colorScheme="blue"
                    width="100%"
                    size="lg"
                    borderRadius="xl"
                    onClick={handleContributeUSDT}
                  >
                    Contribute USDT
                  </Button>
                ) : (
                  !isPresaleCancelled && (
                    <Button
                      colorScheme="gray"
                      width="100%"
                      size="lg"
                      borderRadius="xl"
                      onClick={approveUSDT}
                    >
                      Approve USDT
                    </Button>
                  )
                )}

                {isPresaleCancelled && (
                  <Text color="red.500" fontWeight="bold" textAlign="center" mt={4}>
                    Presale cancelled, contributions are no longer accepted.
                  </Text>
                )}
              </Flex>
            </TabPanel>

            {/* Claim or Refund Panel */}
            <TabPanel>
              <Flex flexDirection="column" alignItems="center">
                {isPresaleCancelled ? (
                  <Button
                    colorScheme="red"
                    width="100%"
                    size="lg"
                    borderRadius="xl"
                    onClick={handleClaimOrRefund}
                  >
                    Refund Contributions
                  </Button>
                ) : (
                  <Button
                    colorScheme="blue"
                    width="100%"
                    size="lg"
                    borderRadius="xl"
                    onClick={handleClaimOrRefund}
                    disabled={!isClaimEnabled}
                  >
                    Claim Tokens
                  </Button>
                )}
              </Flex>
            </TabPanel>

            {/* User Contribution Position Panel */}
            <TabPanel>
              <Box width="100%" mt={10} p={4} borderRadius="md" boxShadow="lg">
                <Text fontSize="lg" fontWeight="bold" mb={4} textAlign="center">
                  Your Contributions
                </Text>
                <Flex justifyContent="space-between" mb={2}>
                  <Text>{PRESALE_TOKEN_ADDRESS}</Text>
                </Flex>
                <Flex justifyContent="space-between" mb={2}>
                  <Text>ETH Contribution:</Text>
                  <Text>{ethContribution} ETH (${ethContributionInUSD.toFixed(2)} USD)</Text>
                </Flex>
                <Flex justifyContent="space-between" mb={2}>
                  <Text>USDT Contribution:</Text>
                  <Text>{parseFloat(usdtContribution).toFixed(3)} USDT (${parseFloat(usdtContribution).toFixed(2)} USD)</Text>
                </Flex>

                <Flex justifyContent="space-between" mb={2}>
                  <Text>Total Contribution in USD:</Text>
                  <Text>${totalUserContributionUSD.toFixed(2)}</Text>
                </Flex>
                <Flex justifyContent="space-between">
                  <Text>Your Purchase Percentage:</Text>
                  <Text>{contributionPercentage.toFixed(2)}%</Text>
                </Flex>
                <Flex justifyContent="space-between">
                  <Text>Expected Tokens:</Text>
                  <Text>{expectedTokens.toFixed(2)}</Text>
                </Flex>

              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    );

};

export default PresaleComponent;
