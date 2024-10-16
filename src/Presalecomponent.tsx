import React, { useState, useEffect, useCallback } from 'react';
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
  const [ethAmount, setEthAmount] = useState<string>('0.0059'); // Default value is 1
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

  const toast = useToast();

  const [isContributingETH, setIsContributingETH] = useState<boolean>(false);
  const [isContributingUSDT, setIsContributingUSDT] = useState<boolean>(false);

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

  const initContract = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, presaleAbi, provider);
      setContract(presaleContract);

      await fetchPresaleStatus(presaleContract);
      await fetchEthPrice(presaleContract);
      await fetchPresaleDetails(presaleContract);
      await fetchTotalContributions(presaleContract);
      if (isPresaleSuccessful) {
        await fetchClaimStatus(presaleContract); // Fetch claim status only if presale is successful
      }

      if (isConnected && walletProvider) {
        const signer = await (new ethers.BrowserProvider(walletProvider as any)).getSigner();
        await fetchBalances(signer);
        await fetchPresaleTokenBalance(signer);
        await fetchUserContributions(presaleContract, signer);
      }
    } catch (error) {
      console.error("Error initializing contract:", error);
    }
  }, [isConnected, walletProvider, isPresaleSuccessful]);


  const fetchClaimStatus = async (contract: Contract) => {
    try {
      const claimEnabled = await contract.claimEnabled();
      setIsClaimEnabled(claimEnabled);
    } catch (error) {
      console.error('Error fetching claim status:', error);
    }
  };

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

  const fetchTotalContributions = async (contract: Contract) => {
    try {
      const totalContribUSD = await contract.totalContributionsUSD();
      setTotalContributionsUSD(parseFloat(ethers.formatUnits(totalContribUSD, 6)).toFixed(2));
    } catch (error) {
      console.error('Error fetching total contributions:', error);
    }
  };

  const fetchBalances = async (signer: ethers.JsonRpcSigner) => {
    if (!address) return;
    try {
      const provider = signer.provider;
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

      const fetchPresaleTokenBalance = async (signer: ethers.JsonRpcSigner) => {
      if (!address) return;
      try {
        const tokenContract = new ethers.Contract(PRESALE_TOKEN_ADDRESS, ['function balanceOf(address) view returns (uint256)'], signer);
        const balance = await tokenContract.balanceOf(address);
        setPresaleTokenBalance(parseFloat(ethers.formatUnits(balance, 18)).toFixed(0));
      } catch (error) {
        console.error("Error fetching presale token balance:", error);
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

  const fetchUserContributions = async (contract: Contract, signer: ethers.JsonRpcSigner) => {
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
    const interval = setInterval(() => {
      initContract();
    }, 15000);

    initContract();

    return () => clearInterval(interval);
  }, [initContract]);




  const handleContributeETH = async () => {
    if (!contract || !walletProvider) return;
    try {
      setIsContributingETH(true);
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.contributeWithETH({ value: ethers.parseEther(ethAmount) });
      await tx.wait();

      toast({
        title: "ETH Contribution Successful",
        description: `You contributed ${ethAmount} ETH.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });

      await fetchUserContributions(contract, signer);
    } catch (error) {
      toast({
        title: "ETH Contribution Failed",
        description: `There was an error contributing ${ethAmount} ETH.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsContributingETH(false);
    }
  };

  const approveUSDT = async () => {
    if (!walletProvider || !contract) return;

    try {
      setIsApprovingUSDT(true);
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
      toast({
        title: "USDT Approval Failed",
        description: `There was an error approving USDT.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsApprovingUSDT(false);
    }
  };

  const handleContributeUSDT = async () => {
    if (!contract || usdtAmount === '' || !usdtApproval || !walletProvider) return;

    try {
      setIsContributingUSDT(true);
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.contributeWithUSDT(ethers.parseUnits(usdtAmount, 6));
      await tx.wait();

      toast({
        title: "USDT Contribution Successful",
        description: `You contributed ${usdtAmount} USDT.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });

      await fetchUserContributions(contractWithSigner, signer);
    } catch (error) {
      toast({
        title: "USDT Contribution Failed",
        description: `There was an error contributing ${usdtAmount} USDT.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsContributingUSDT(false);
    }
  };

  const handleClaimOrRefund = async () => {
    if (!contract || !walletProvider) return;

    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

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

              {/* Progress Bar for Soft Cap */}
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
            <Box textAlign="center">
            <Box textAlign="center" mb={4} mt={4} bg="red.600" p={4} borderRadius="md">
              <Text fontSize="2xl" fontWeight="bold">Presale Cancelled</Text>
              <Text fontSize="md">You can refund your contributions below.</Text>
            </Box>
            <Image src="images/money-back.svg" alt="header" mx="auto" width="140px" minW="194px" mt="28px" />
            </Box>
          )}

          {isPresaleSuccessful && !isPresaleCancelled && (
            <Box textAlign="center">
            <Box textAlign="center" mb={4} mt={4} bg="green.600" p={4} borderRadius="md"  >
              <Text fontSize="2xl" fontWeight="bold">Presale Successful!</Text>
              <Text fontSize="md">You can now claim your tokens below.</Text>
            </Box>
            <Image src="images/claimbd.png" alt="header" mx="auto" width="140px" minW="194px" mt="28px" />
            </Box>

          )}
        </Box>

        {/* Conditionally hide the Tabs section when presale is cancelled or successful */}
        {!isPresaleCancelled && !isPresaleSuccessful && (
          <Tabs isFitted variant="solid-rounded"  width="100%">
            <TabList mb="1em">
              <Tab _selected={{ color: 'white', bg: '#2182ff' }}>
                <Flex alignItems="center">
                  <Image src="/images/eth.svg" alt="ETH Icon" boxSize="20px" mr={2} />
                  <Text color="white">ETH</Text>
                </Flex>
              </Tab>
              <Tab _selected={{ color: 'white', bg: '#2182ff' }}>
                <Flex alignItems="center">
                  <Image src="/images/usdt.svg" alt="USDT Icon" boxSize="20px" mr={2} />
                  <Text color="white">USDT</Text>
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
    <Box width="100%" >
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
        {/* Display ETH value in USD based on the input */}

          <Text mb={4} textAlign="right" fontSize="sm" width="100%">
            ${(parseFloat(ethAmount) * ethPrice).toFixed(2)}USD
          </Text>

    <Text mt={2}  textAlign="right" fontSize="sm" width="100%">
      Your Balance: {ethBalance} ETH
    </Text>

    <Text  mb={4} textAlign="right" fontSize="sm" width="100%">
      (${(parseFloat(ethBalance) * ethPrice).toFixed(2)}USD)
    </Text>


    <Button
      mt={10}
      colorScheme="blue"
      width="100%"
      size="lg"
      borderRadius="3xl"
      onClick={handleContributeETH}
      isLoading={isContributingETH} // Spinner shows when contributing ETH
      loadingText="Contributing to presale..." // Button text while contributing
      leftIcon={<Image src="/images/eth.svg" alt="ETH Icon" boxSize="24px" />}  // Add icon

    >
      Contribute ETH
    </Button>
    <Button
      mt={4}
      color="white"
      bg="blue.400"
      width="100%"
      size="lg"
      borderRadius="3xl"
      onClick={handleClaimOrRefund}
      isDisabled={!isClaimEnabled || expectedTokens === 0}  // Disable if no claim is possible
      leftIcon={<Image src="/images/claimbd.png" alt="USDT Icon" boxSize="24px" />}  // Add icon
    >
      {expectedTokens === 0 ? (
        'No Valid Token Claim'  // Message when claim is not possible
      ) : isClaimEnabled ? (
        `Claim ${expectedTokens.toFixed(0)} Tokens`  // Show token amount to claim
      ) : (
        'Claim Tokens on Presale Success'  // Presale tokens are not yet claimable
      )}
    </Button>
  </Flex>
</TabPanel>


              {/* USDT Contribution Panel */}
              <TabPanel>
                <Flex flexDirection="column" alignItems="center">
                  <Box width="100%" >
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
                      {/* Display ETH value in USD based on the input */}

                        <Text mb={4} textAlign="right" fontSize="sm" width="100%">
                          ${(parseFloat(usdtAmount) * 0.9998).toFixed(2)}USD

                        </Text>


                      <Text mt={2} textAlign="right" fontSize="sm" width="100%">
                        Your Balance: {usdtBalance} USDT
                      </Text>

                      <Text  mb={4} textAlign="right" fontSize="sm" width="100%">
                            (${parseFloat(usdtBalance).toFixed(2)} USD)
                      </Text>

                  {usdtApproval ? (
                    <Button
                      mt={10}
                      color="white"
                      bg="#399c00"
                      width="100%"
                      size="lg"
                      borderRadius="3xl"
                      onClick={handleContributeUSDT}
                      isLoading={isContributingUSDT}
                      loadingText="Contributing to presale..."
                      leftIcon={<Image src="/images/usdt.svg" alt="USDT Icon" boxSize="24px" />}  // Add icon

                    >
                      Contribute USDT
                    </Button>
                  ) : (
                    <Button
                      mt={10}
                      color="white"
                      bg="#399c00"
                      width="100%"
                      size="lg"
                      borderRadius="3xl"
                      onClick={approveUSDT}
                      isLoading={isApprovingUSDT}
                      loadingText="Approving USDT..."
                      leftIcon={<Image src="/images/usdt.svg" alt="USDT Icon" boxSize="24px" />}  // Add icon

                    >
                      Approve USDT
                    </Button>
                  )}
                  <Button
                    mt={4}
                    color="white"
                    bg="blue.400"
                    width="100%"
                    size="lg"
                    borderRadius="3xl"
                    onClick={handleClaimOrRefund}
                    isDisabled={!isClaimEnabled || expectedTokens === 0}  // Disable if no claim is possible
                    leftIcon={<Image src="/images/claimbd.png" alt="USDT Icon" boxSize="24px" />}  // Add icon
                  >
                    {expectedTokens === 0 ? (
                      'No Valid Token Claim'  // Message when claim is not possible
                    ) : isClaimEnabled ? (
                      `Claim ${expectedTokens.toFixed(0)} Tokens`  // Show token amount to claim
                    ) : (
                      'Claim Tokens on Presale Success'  // Presale tokens are not yet claimable
                    )}
                  </Button>
                </Flex>
              </TabPanel>

              {/* Position Panel */}
              <TabPanel>
                <Box width="100%" mt={5} mb={12} p={4} borderRadius="md" boxShadow="lg">
                  <Text fontSize="lg" fontWeight="bold" mb={4} textAlign="center">
                    Your Contributions
                  </Text>
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
                </Box>
                <Button
                  mt={5}
                  color="white"
                  bg="blue.400"
                  width="100%"
                  size="lg"
                  borderRadius="3xl"
                  onClick={handleClaimOrRefund}
                  isDisabled={!isClaimEnabled || expectedTokens === 0}  // Disable if no claim is possible
                  leftIcon={<Image src="/images/claimbd.png" alt="USDT Icon" boxSize="24px" />}  // Add icon
                >
                  {expectedTokens === 0 ? (
                    'No Valid Token Claim'  // Message when claim is not possible
                  ) : isClaimEnabled ? (
                    `Claim ${expectedTokens.toFixed(0)} Tokens`  // Show token amount to claim
                  ) : (
                    'Claim Tokens on Presale Success'  // Presale tokens are not yet claimable
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
            <Flex justifyContent="center" mb={4}>
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
              <Flex justifyContent="space-between" mb={3} mt={2}>
                <Text>Presale Token Balance:</Text>
                <Text>{presaleTokenBalance}</Text>
              </Flex>

            </Box>
            <Button
              mt={5}
              colorScheme="green"
              width="100%"
              size="lg"
              borderRadius="3xl"
              onClick={handleClaimOrRefund}
              isDisabled={!isClaimEnabled || expectedTokens === 0}  // Disable if no claim is possible
            >
              {expectedTokens === 0 ? (
                'No Valid Token Claim'  // Message when claim is not possible
              ) : isClaimEnabled ? (
                `Claim ${expectedTokens.toFixed(0)} Tokens`  // Show token amount to claim
              ) : (
                'Claim Presale Tokens Soon'  // Presale tokens are not yet claimable
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
                <Text>USDT Contribution:</Text>
                <Text>{parseFloat(usdtContribution).toFixed(3)} USDT (${parseFloat(usdtContribution).toFixed(2)} USD)</Text>
              </Flex>
              <Flex justifyContent="space-between" mb={4}>
                <Text>Total Contribution in USD:</Text>
                <Text>${totalUserContributionUSD.toFixed(2)}</Text>
              </Flex>
            </Box>
            <Button
              colorScheme={totalUserContributionUSD === 0 ? "red" : "red"}
              width="100%"
              size="lg"
              borderRadius="3xl"
              onClick={handleClaimOrRefund}
              isDisabled={totalUserContributionUSD === 0}
            >
              {totalUserContributionUSD === 0 ? 'No refund available' : `Refund of $${totalUserContributionUSD.toFixed(2)}`}
            </Button>
          </Flex>
        )}
      </Flex>
    );


};

export default PresaleComponent;
