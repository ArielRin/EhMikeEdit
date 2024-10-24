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
const targetDate = new Date(import.meta.env.VITE_TARGET_DATE as string);

const PresaleComponent: React.FC = () => {

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [ethAmount, setEthAmount] = useState<string>('');
  const [usdtAmount, setUsdtAmount] = useState<string>('');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isClaimEnabled, setIsClaimEnabled] = useState<boolean>(false);
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
    if (walletProvider && isConnected && address) {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      try {
        const presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, presaleAbi, signer);
        setContract(presaleContract);

        await fetchClaimStatus(presaleContract);
        await fetchEthPrice(presaleContract);
        await fetchBalances(provider, signer);
        await fetchUserContributions(presaleContract);
        await fetchPresaleDetails(presaleContract);
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    } else {
      console.error("Wallet provider or connection is missing.");
    }
  };

  const fetchBalances = async (provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) => {
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
    if (isConnected) {
      initContract();
    }
    const interval = setInterval(() => {
      if (isConnected) {
        initContract();
      }
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

  const handleClaimTokens = async () => {
    if (!contract || !isClaimEnabled) return;
    try {
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
    } catch (error) {
      console.error('Token Claim Failed:', error);
      toast({
        title: "Token Claim Failed",
        description: `There was an error claiming your tokens.`,
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
      <Box textAlign="center" mb={4}>
        <Image src="images/logobwb.png" alt="header" mx="auto" width="40%" minW="250px" mt="28px" />
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
        <Text fontSize="3xl" fontWeight="bold" textAlign="center">Required Softcap: ${softCapUSD} USD</Text>
        <Progress value={(parseFloat(totalContributionsUSD) / parseFloat(softCapUSD)) * 100} size="lg" mx="auto" maxW="250px" colorScheme="green" borderRadius="md" mt={4} />
        <Text fontSize="xl" textAlign="center" mt={2}>
          Current Contributions ${parseFloat(totalContributionsUSD).toFixed(2).toLocaleString()} / ${parseFloat(softCapUSD).toFixed(2).toLocaleString()} USD
        </Text>
        <Text fontSize="xl" mt={2}>
          Progress: {((parseFloat(totalContributionsUSD) / parseFloat(softCapUSD)) * 100).toFixed(2)}%
        </Text>
      </Box>

      <Tabs isFitted variant="enclosed" width="100%">
        <TabList mb="1em">
          <Tab>ETH</Tab>
          <Tab>USDT</Tab>
          <Tab>Claim</Tab>
          <Tab>Position</Tab>

        </TabList>
        <TabPanels>
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
                  />
                </InputGroup>
              </Box>

              <Text mt={2} mb={4} textAlign="right" fontSize="sm" width="100%">
                ETH Balance: {ethBalance} ETH (${parseFloat(ethBalanceInUSD).toFixed(2)} USD)
              </Text>

              <Button
                colorScheme="blue"
                width="100%"
                size="lg"
                borderRadius="xl"
                onClick={handleContributeETH}
              >
                Contribute ETH
              </Button>
            </Flex>
          </TabPanel>

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
                  />
                </InputGroup>
              </Box>

              <Text mt={2} mb={4} textAlign="right" fontSize="sm" width="100%">
                USDT Balance: {usdtBalance} USDT
              </Text>

              {usdtApproval ? (
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
                <Button
                  colorScheme="gray"
                  width="100%"
                  size="lg"
                  borderRadius="xl"
                  onClick={approveUSDT}
                >
                  Approve USDT
                </Button>
              )}
            </Flex>
          </TabPanel>

          <TabPanel>
            <Flex flexDirection="column" alignItems="center">
              <Button
                colorScheme="blue"
                width="100%"
                size="lg"
                borderRadius="xl"
                onClick={handleClaimTokens}
                disabled={!isClaimEnabled}
              >
                Claim Tokens
              </Button>
            </Flex>
          </TabPanel>
        <TabPanel>

              <Box width="100%" mt={10} p={4} borderRadius="md"  boxShadow="lg">
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
