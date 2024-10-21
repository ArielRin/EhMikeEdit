import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Button, Progress, Input, Image, InputGroup, InputLeftElement, Tabs, TabList,
  TabPanels, Tab, TabPanel, useToast
} from '@chakra-ui/react';
import { ethers, Contract, JsonRpcSigner, JsonRpcProvider, BigNumberish } from 'ethers';

import { usePrice } from './PriceContext'; // Adjust the import path as needed

import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import presaleAbi from './Abi/presaleAbi.json';

// Environment Variables
const USDT_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as string;
const PRESALE_CONTRACT_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS as string;
const PRESALE_TOKEN_ADDRESS = import.meta.env.VITE_PRESALE_TOKEN_ADDRESS as string;
const RPC_URL = import.meta.env.VITE_RPC_URL as string;
const targetDate = new Date(import.meta.env.VITE_TARGET_DATE as string);

const PresaleComponent: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [ethAmount, setEthAmount] = useState<string>('0.0059');
  const [usdtAmount, setUsdtAmount] = useState<string>('15');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isClaimEnabled, setIsClaimEnabled] = useState<boolean>(false);
  const [isPresaleCancelled, setIsPresaleCancelled] = useState<boolean>(false);
  const [isPresaleSuccessful, setIsPresaleSuccessful] = useState<boolean>(false);
  const [isApprovingUSDT, setIsApprovingUSDT] = useState<boolean>(false);
  const [usdtApproval, setUsdtApproval] = useState<boolean>(false);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [ethBalanceInUSD, setEthBalanceInUSD] = useState<string>('0');
  const [ethContribution, setEthContribution] = useState<string>('0');
  const [usdtContribution, setUsdtContribution] = useState<string>('0');
  const [totalContributionsUSD, setTotalContributionsUSD] = useState<string>('0');
  const [totalTokensOffered, setTotalTokensOffered] = useState<string>('0');
  const [softCapUSD, setSoftCapUSD] = useState<string>('0');
  const [presaleTokenBalance, setPresaleTokenBalance] = useState<string>('0');
  const [isContributingETH, setIsContributingETH] = useState<boolean>(false);
  const [isContributingUSDT, setIsContributingUSDT] = useState<boolean>(false);
  const { setMinLaunchPrice, setActualLaunchPrice } = usePrice();

  const toast = useToast();
  const { isConnected, address } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  // Countdown Timer
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

  // Initialize Contract
  const initContract = useCallback(async () => {
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const presaleContract = new ethers.Contract(
        PRESALE_CONTRACT_ADDRESS,
        presaleAbi,
        provider
      );
      setContract(presaleContract);

      await fetchPresaleStatus(presaleContract);
      await fetchEthPrice(presaleContract);
      await fetchPresaleDetails(presaleContract);
      await fetchTotalContributions(presaleContract);

      if (isConnected && walletProvider) {
        const signer = await (new ethers.BrowserProvider(walletProvider as any)).getSigner();
        await fetchBalances(signer);
        await fetchUserContributions(presaleContract, signer);
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  }, [isConnected, walletProvider]);

  const fetchPresaleStatus = async (contract: Contract) => {
    try {
      const presaleCancelled = await contract.presaleCancelled();
      const presaleSuccessful = await contract.presaleSuccessful();
      setIsPresaleCancelled(presaleCancelled);
      setIsPresaleSuccessful(presaleSuccessful);
      if (presaleSuccessful) {
        const claimEnabled = await contract.claimEnabled();
        setIsClaimEnabled(claimEnabled);
      }
    } catch (error) {
      console.error('Error fetching presale status:', error);
    }
  };

  const fetchTotalContributions = async (contract: Contract) => {
    try {
      const totalContribUSD = await contract.totalContributionsUSD();
      setTotalContributionsUSD(parseFloat(ethers.formatUnits(totalContribUSD, 6)).toFixed(2));
    } catch (error) {
      console.error('Error fetching total contributions:', error);
    }
  };

  const fetchBalances = async (signer: JsonRpcSigner) => {
    if (!address) return;
    try {
      const provider = signer.provider;
      const ethBalance = await provider.getBalance(address);
      const formattedEthBalance = ethers.formatEther(ethBalance);
      setEthBalance(parseFloat(formattedEthBalance).toFixed(5));

      if (ethPrice) {
        const ethBalanceInUSD = (parseFloat(formattedEthBalance) * ethPrice).toFixed(2);
        setEthBalanceInUSD(ethBalanceInUSD);
      }

      const usdtContract = new ethers.Contract(
        USDT_ADDRESS,
        ['function balanceOf(address) view returns (uint256)'],
        signer
      );
      const usdtBalance = await usdtContract.balanceOf(address);
      setUsdtBalance(parseFloat(ethers.formatUnits(usdtBalance, 6)).toFixed(5));
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const fetchEthPrice = async (contract: Contract) => {
    try {
      const price = await contract.getLatestETHPrice();
      const formattedPrice = ethers.formatUnits(price, 18);
      setEthPrice(parseFloat(formattedPrice));
    } catch (error) {
      console.error('Error fetching ETH price:', error);
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

  const fetchUserContributions = async (contract: Contract, signer: JsonRpcSigner) => {
    if (!address) return;
    try {
      const ethContrib = await contract.ethContributions(address);
      const usdtContrib = await contract.usdtContributions(address);
      setEthContribution(parseFloat(ethers.formatEther(ethContrib)).toFixed(5));
      setUsdtContribution(parseFloat(ethers.formatUnits(usdtContrib, 6)).toFixed(5));
    } catch (error) {
      console.error('Error fetching user contributions:', error);
    }
  };

  useEffect(() => {
    initContract();
  }, [initContract]);

  const handleClaimOrRefund = async () => {
  if (!contract || !walletProvider) return;
  try {
    const provider = new ethers.BrowserProvider(walletProvider as any);
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer) as Contract;

    if (isPresaleCancelled) {
      const tx = await contractWithSigner.refund();
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
      const tx = await contractWithSigner.claimTokens();
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

const handleContributeETH = async () => {
if (!contract || !walletProvider || !ethAmount) return;
try {
  setIsContributingETH(true);
  const provider = new ethers.BrowserProvider(walletProvider as any);
  const signer = await provider.getSigner();
  const contractWithSigner = contract.connect(signer) as Contract;

  const tx = await contractWithSigner.contributeWithETH({
    value: ethers.parseEther(ethAmount),
  });
  await tx.wait();
  toast({
    title: "Contribution Successful",
    description: `You have contributed ${ethAmount} ETH.`,
    status: "success",
    duration: 5000,
    isClosable: true,
    position: "top-right",
  });
} catch (error) {
  toast({
    title: "Contribution Failed",
    description: `There was an error with your ETH contribution.`,
    status: "error",
    duration: 5000,
    isClosable: true,
    position: "top-right",
  });
} finally {
  setIsContributingETH(false);
}
};


const handleContributeUSDT = async () => {
if (!contract || !walletProvider || !usdtAmount) return;
try {
  setIsContributingUSDT(true);
  const provider = new ethers.BrowserProvider(walletProvider as any);
  const signer = await provider.getSigner();
  const contractWithSigner = contract.connect(signer) as Contract;

  const tx = await contractWithSigner.contributeWithUSDT(
    ethers.parseUnits(usdtAmount, 6)
  );
  await tx.wait();
  toast({
    title: "Contribution Successful",
    description: `You have contributed ${usdtAmount} USDC.`,
    status: "success",
    duration: 5000,
    isClosable: true,
    position: "top-right",
  });
} catch (error) {
  toast({
    title: "Contribution Failed",
    description: `There was an error with your USDC contribution.`,
    status: "error",
    duration: 5000,
    isClosable: true,
    position: "top-right",
  });
} finally {
  setIsContributingUSDT(false);
}
};

  const approveUSDT = async () => {
    if (!walletProvider) return;
    try {
      setIsApprovingUSDT(true);
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(
        USDT_ADDRESS,
        ['function approve(address spender, uint256 amount) public returns (bool)'],
        signer
      );
      const tx = await usdtContract.approve(PRESALE_CONTRACT_ADDRESS, ethers.parseUnits('1000000', 6));
      await tx.wait();
      setUsdtApproval(true);
      toast({
        title: "Approval Successful",
        description: "USDC approved for presale contribution.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "There was an error approving USDC.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsApprovingUSDT(false);
    }
  };

  // Calculation Helpers
  const ethContributionInUSD = ethContribution && ethPrice ? parseFloat(ethContribution) * ethPrice : 0;
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
          <Image src="images/logobwb.png" alt="header" mx="auto" width="70%" minW="250px" mt="28px" />
          <Text fontSize="sm" mb={4} mt={4} color="gray.300">{PRESALE_TOKEN_ADDRESS}</Text>
          <Box display="flex" justifyContent="center" alignItems="center" mx="auto">
            <w3m-button />
          </Box>
          {!isPresaleSuccessful && !isPresaleCancelled && (
            <>
              <Text fontSize="2xl" fontWeight="bold">Presale ends in</Text>
              <Text fontSize="4xl" mt={2}>
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </Text>
              <Progress value={softCapPercentage} size="lg" mx="auto" maxW="250px" colorScheme="blue" borderRadius="md" mt={4} />
              <Text fontSize="md" textAlign="center" mt={2}>
                Contributions ${parseFloat(totalContributionsUSD).toFixed(2)} / ${parseFloat(softCapUSD).toFixed(2)} USD
              </Text>
              <Text fontSize="md" mt={2}>
                Progress: {softCapPercentage.toFixed(2)}%
              </Text>
            </>
          )}
          {isPresaleCancelled && (
            <Box textAlign="center" mb={4} mt={4} bg="red.600" p={4} borderRadius="md">
              <Text fontSize="2xl" fontWeight="bold">Presale Cancelled</Text>
              <Text fontSize="md">You can refund your contributions below.</Text>
            </Box>
          )}
          {isPresaleSuccessful && !isPresaleCancelled && (
            <Box textAlign="center" mb={4} mt={4} bg="green.600" p={4} borderRadius="md">
              <Text fontSize="2xl" fontWeight="bold">Presale Successful!</Text>
              <Text fontSize="md">You can now claim your tokens below.</Text>
            </Box>
          )}
        </Box>

        {/* Conditionally hide the Tabs section when presale is cancelled or successful */}
        {!isPresaleCancelled && !isPresaleSuccessful && (
          <Tabs isFitted variant="solid-rounded" width="100%">
            <TabList mb="1em">
              <Tab _selected={{ color: 'white', bg: '#2182ff' }}>
                <Flex alignItems="center">
                  <Image src="/images/eth.svg" alt="ETH Icon" boxSize="20px" mr={2} />
                  <Text color="white">ETH</Text>
                </Flex>
              </Tab>
              <Tab _selected={{ color: 'white', bg: '#2182ff' }}>
                <Flex alignItems="center">
                  <Image src="/images/usdc.png" alt="USDC Icon" boxSize="20px" mr={2} />
                  <Text color="white">USDC</Text>
                </Flex>
              </Tab>
              <Tab _selected={{ color: 'white', bg: '#2182ff' }}>
                <Flex alignItems="center">
                  <Image src="/images/diagram.svg" alt="Position Icon" boxSize="20px" mr={2} />
                  <Text color="white">Position</Text>
                </Flex>
              </Tab>
            </TabList>

            <TabPanels>
              {/* ETH Contribution Panel */}
              <TabPanel>
                <Flex flexDirection="column" alignItems="center">
                  <Box width="100%">
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
                    <Text mb={4} textAlign="right" fontSize="sm" width="100%">
                      ${(parseFloat(ethAmount) * (ethPrice || 0)).toFixed(2)} USD
                    </Text>
                    <Text mt={2} textAlign="right" fontSize="sm" width="100%">
                      Your Balance: {ethBalance} ETH
                    </Text>
                    <Text mb={4} textAlign="right" fontSize="sm" width="100%">
                      (${(parseFloat(ethBalance) * (ethPrice || 0)).toFixed(2)} USD)
                    </Text>
                  </Box>
                  <Button
                    mt={10}
                    colorScheme="blue"
                    width="100%"
                    size="lg"
                    borderRadius="3xl"
                    onClick={handleContributeETH}
                    isLoading={isContributingETH}
                    loadingText="Contributing to presale..."
                    leftIcon={<Image src="/images/eth.svg" alt="ETH Icon" boxSize="24px" />}
                  >
                    Contribute ETH
                  </Button>
                </Flex>
              </TabPanel>

              {/* USDC Contribution Panel */}
              <TabPanel>
                <Flex flexDirection="column" alignItems="center">
                  <Box width="100%">
                    <Text mb={2} fontSize="sm">Enter USDC amount</Text>
                    <InputGroup>
                      <InputLeftElement height="100%" display="flex" alignItems="center" pointerEvents="none">
                        <Image src="/images/usdc.png" alt="USDC Icon" boxSize="32px" />
                      </InputLeftElement>
                      <Input
                        bg="white"
                        color="black"
                        placeholder="Enter USDC amount"
                        size="lg"
                        borderRadius="md"
                        textAlign="right"
                        value={usdtAmount}
                        onChange={(e) => setUsdtAmount(e.target.value)}
                      />
                    </InputGroup>
                    <Text mb={4} textAlign="right" fontSize="sm" width="100%">
                      ${(parseFloat(usdtAmount) * 1).toFixed(2)} USD
                    </Text>
                    <Text mt={2} textAlign="right" fontSize="sm" width="100%">
                      Your Balance: {usdtBalance} USDC
                    </Text>
                    <Text mb={4} textAlign="right" fontSize="sm" width="100%">
                      (${parseFloat(usdtBalance).toFixed(2)} USD)
                    </Text>
                  </Box>
                  {usdtApproval ? (
                    <Button
                      mt={10}
                      colorScheme="blue"
                      width="100%"
                      size="lg"
                      borderRadius="3xl"
                      onClick={handleContributeUSDT}
                      isLoading={isContributingUSDT}
                      loadingText="Contributing to presale..."
                      leftIcon={<Image src="/images/usdc.png" alt="USDC Icon" boxSize="24px" />}
                    >
                      Contribute USDC
                    </Button>
                  ) : (
                    <Button
                      mt={10}
                      colorScheme="blue"
                      width="100%"
                      size="lg"
                      borderRadius="3xl"
                      onClick={approveUSDT}
                      isLoading={isApprovingUSDT}
                      loadingText="Approving USDC..."
                      leftIcon={<Image src="/images/usdc.png" alt="USDC Icon" boxSize="24px" />}
                    >
                      Approve USDC
                    </Button>
                  )}
                </Flex>
              </TabPanel>

              {/* Position Panel */}
              <TabPanel>
                <Box width="100%" mt={5} mb={12} borderRadius="md" boxShadow="lg">
                  <Text fontSize="lg" fontWeight="bold" mb={4} textAlign="center">
                    Your Contributions
                  </Text>
                  <Flex justifyContent="space-between" mb={2}>
                    <Text>ETH Contribution:</Text>
                    <Text>{ethContribution} ETH (${ethContributionInUSD.toFixed(2)} USD)</Text>
                  </Flex>
                  <Flex justifyContent="space-between" mb={2}>
                    <Text>USDC Contribution:</Text>
                    <Text>{parseFloat(usdtContribution).toFixed(3)} USDC (${parseFloat(usdtContribution).toFixed(2)} USD)</Text>
                  </Flex>
                  <Flex justifyContent="space-between" mb={2}>
                    <Text>Total Contribution in USD:</Text>
                    <Text>${totalUserContributionUSD.toFixed(2)}</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text>Your Purchase Percentage:</Text>
                    <Text>{contributionPercentage.toFixed(2)}%</Text>
                  </Flex>
                </Box>
                <Button
                  mt={5}
                  colorScheme="green"
                  width="100%"
                  size="lg"
                  borderRadius="3xl"
                  onClick={handleClaimOrRefund}
                  isDisabled={!isClaimEnabled || expectedTokens === 0}
                  leftIcon={<Image src="/images/claimbd.png" alt="Claim Icon" boxSize="24px" />}
                >
                  {expectedTokens === 0 ? (
                    'No Valid Token Claim'
                  ) : isClaimEnabled ? (
                    `Claim ${expectedTokens.toFixed(0)} Tokens`
                  ) : (
                    'Claim Tokens on Presale Success'
                  )}
                </Button>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}

        {/* Show Claim Section if presale is successful */}
        {isPresaleSuccessful && !isPresaleCancelled && (
          <Flex flexDirection="column" alignItems="center" width="100%">
            <Box width="100%" mb={5} p={2} borderRadius="md" boxShadow="lg">
              <Flex justifyContent="space-between" mb={2}>
                <Text>ETH Contribution:</Text>
                <Text>{ethContribution} ETH (${ethContributionInUSD.toFixed(2)} USD)</Text>
              </Flex>
              <Flex justifyContent="space-between" mb={2}>
                <Text>USDC Contribution:</Text>
                <Text>{parseFloat(usdtContribution).toFixed(3)} USDC (${parseFloat(usdtContribution).toFixed(2)} USD)</Text>
              </Flex>
              <Flex justifyContent="space-between" mb={4}>
                <Text>Total Contribution in USD:</Text>
                <Text>${totalUserContributionUSD.toFixed(2)}</Text>
              </Flex>
              <Flex justifyContent="space-between">
                <Text>Your Purchase Percentage:</Text>
                <Text>{contributionPercentage.toFixed(2)}%</Text>
              </Flex>
            </Box>
            <Button
              mt={5}
              colorScheme="green"
              width="100%"
              size="lg"
              borderRadius="3xl"
              onClick={handleClaimOrRefund}
              isDisabled={!isClaimEnabled || expectedTokens === 0}
              leftIcon={<Image src="/images/claimbd.png" alt="Claim Icon" boxSize="24px" />}
            >
              {expectedTokens === 0 ? (
                'No Valid Token Claim'
              ) : isClaimEnabled ? (
                `Claim ${expectedTokens.toFixed(0)} Tokens`
              ) : (
                'Claim Presale Tokens Soon'
              )}
            </Button>
          </Flex>
        )}

        {/* Show Refund Section if presale is cancelled */}
        {isPresaleCancelled && (
          <Flex flexDirection="column" alignItems="center" width="100%">
            <Box width="100%" mb={5} p={2} borderRadius="md" boxShadow="lg">
              <Flex justifyContent="space-between" mb={2}>
                <Text>ETH Contribution:</Text>
                <Text>{ethContribution} ETH (${ethContributionInUSD.toFixed(2)} USD)</Text>
              </Flex>
              <Flex justifyContent="space-between" mb={2}>
                <Text>USDC Contribution:</Text>
                <Text>{parseFloat(usdtContribution).toFixed(3)} USDC (${parseFloat(usdtContribution).toFixed(2)} USD)</Text>
              </Flex>
              <Flex justifyContent="space-between" mb={4}>
                <Text>Total Contribution in USD:</Text>
                <Text>${totalUserContributionUSD.toFixed(2)}</Text>
              </Flex>
            </Box>
            <Button
              mt={5}
              colorScheme="red"
              width="100%"
              size="lg"
              borderRadius="3xl"
              onClick={handleClaimOrRefund}
              isDisabled={totalUserContributionUSD === 0}
              leftIcon={<Image src="/images/refund-icon.png" alt="Refund Icon" boxSize="24px" />}
            >
              {totalUserContributionUSD === 0 ? 'No refund available' : `Refund of $${totalUserContributionUSD.toFixed(2)}`}
            </Button>
          </Flex>
        )}
      </Flex>
    );
}

export default PresaleComponent;
