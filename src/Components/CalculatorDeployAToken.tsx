import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  VStack,
  Divider,
  HStack,
  Button,
  Image,
  useBreakpointValue,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { ethers } from 'ethers';
import presaleABI from '../Abi/presaleAbi.json';
import tokenABI from '../Abi/tokenAbi.json';
import FormattedPrice from './FormattedPrice';

import Presalecomponent from '../Presalecomponent';
import Admin from '../PresaleAdminPage';

ChartJS.register(ArcElement, Tooltip, Legend);

const CONTRACT_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
const PRESALE_TOKEN_ADDRESS = import.meta.env.VITE_PRESALE_TOKEN_ADDRESS;

const TokenDeploymentCalculator: React.FC = () => {
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [burnTokens, setBurnTokens] = useState<number>(0);
  const [liquidityPoolTokens, setLiquidityPoolTokens] = useState<number>(0);
  const [devMarketingTokens, setDevMarketingTokens] = useState<number>(0);
  const [liquidityInUSD, setLiquidityInUSD] = useState<number>(0);
  const [presaleValueRaised, setPresaleValueRaised] = useState<number>(0);
  const [softCap, setSoftCap] = useState<number>(0);
  const [hardCap, setHardCap] = useState<number>(0);
  const [presaleEndDate, setPresaleEndDate] = useState<number>(0);
  const [totalTokensOfferedPresale, setTotalTokensOfferedPresale] = useState<number>(0);
  const [contributionsUSD, setContributionsUSD] = useState<number>(0);
  const [unreleasedTokens, setUnreleasedTokens] = useState<number>(0);
  const [actualLaunchPrice, setActualLaunchPrice] = useState<number>(0);
  const [minLaunchPrice, setMinLaunchPrice] = useState<number>(0);
  const [marketCap, setMarketCap] = useState<number>(0);
  const [totalLiquidityValue, setTotalLiquidityValue] = useState<number>(0);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const toast = useToast();

  useEffect(() => {
    const initializeProvider = () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const newProvider = new ethers.BrowserProvider(
            window.ethereum as unknown as ethers.Eip1193Provider
          );
          setProvider(newProvider);
        } catch (error) {
          console.error('Error initializing provider:', error);
        }
      } else {
        console.error('MetaMask is not installed or not detected');
      }
    };

    initializeProvider();
  }, []);

  useEffect(() => {
    const fetchContractData = async () => {
      if (!provider) {
        console.error('Provider is not available');
        return;
      }

      try {
        const signer = await provider.getSigner();
        const presaleContract = new ethers.Contract(CONTRACT_ADDRESS, presaleABI, signer);
        const tokenContract = new ethers.Contract(PRESALE_TOKEN_ADDRESS, tokenABI, signer);

        const [
          totalTokens,
          burnTokens,
          liquidityPoolTokens,
          devMarketingTokens,
          liquidityInUSD,
          presaleValueRaised,
          softCap,
          hardCap,
          presaleEndDate,
          totalTokensOfferedPresale,
          contributionsUSD,
          tokenSupply
        ] = await Promise.all([
          presaleContract.totalTokens(),
          presaleContract.burnTokens(),
          presaleContract.initialTokenQty(),
          presaleContract.devMarketingTokens(),
          presaleContract.initialValueToAddInUSD(),
          presaleContract.presaleValueRaised(),
          presaleContract.softCapUSD(),
          presaleContract.hardCapUSD(),
          presaleContract.presaleEndDate(),
          presaleContract.totalTokensOfferedPresale(),
          presaleContract.presaleValueRaised(),
          tokenContract.totalSupply()
        ]);

        setTotalTokens(Number(ethers.formatUnits(tokenSupply, 18)));
        setBurnTokens(Number(ethers.formatUnits(burnTokens, 18)));
        setLiquidityPoolTokens(Number(ethers.formatUnits(liquidityPoolTokens, 18)));
        setDevMarketingTokens(Number(ethers.formatUnits(devMarketingTokens, 18)));
        setLiquidityInUSD(Number(ethers.formatUnits(liquidityInUSD, 6)));
        setPresaleValueRaised(Number(ethers.formatUnits(presaleValueRaised, 6)));
        setSoftCap(Number(ethers.formatUnits(softCap, 6)));
        setHardCap(Number(ethers.formatUnits(hardCap, 6)));
        setPresaleEndDate(Number(presaleEndDate));
        setTotalTokensOfferedPresale(Number(ethers.formatUnits(totalTokensOfferedPresale, 18)));
        setContributionsUSD(Number(ethers.formatUnits(contributionsUSD, 6)));
      } catch (error) {
        console.error('Error fetching contract data:', error);
      }
    };

    if (provider) {
      fetchContractData();
    }
  }, [provider]);

  const updateParameters = async () => {
    if (!provider) {
      toast({
        title: "Provider not available",
        description: "Please connect to MetaMask",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const signer = await provider.getSigner();
      const presaleContract = new ethers.Contract(CONTRACT_ADDRESS, presaleABI, signer);

      const tx = await presaleContract.updateParameters(
        ethers.parseUnits(liquidityPoolTokens.toString(), 18),
        ethers.parseUnits(liquidityInUSD.toString(), 6),
        ethers.parseUnits(burnTokens.toString(), 18),
        ethers.parseUnits(devMarketingTokens.toString(), 18),
        ethers.parseUnits(hardCap.toString(), 6),
        ethers.parseUnits(softCap.toString(), 6),
        ethers.parseUnits(totalTokensOfferedPresale.toString(), 18)
      );

      await tx.wait();

      toast({
        title: "Parameters updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = (error as Error).message || 'Transaction reverted';
      console.error('Error updating parameters:', errorMessage);
      toast({
        title: "Error updating parameters",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };


  useEffect(() => {
    const totalForLaunch = liquidityPoolTokens + totalTokensOfferedPresale;

    // Calculate unreleased tokens, which now excludes the presale tokens as they are part of the released tokens.
    const unreleased = totalTokens - burnTokens - liquidityPoolTokens - totalTokensOfferedPresale - devMarketingTokens;
    setUnreleasedTokens(unreleased);

    const totalInitialLiquidity = liquidityInUSD + softCap;
    if (totalInitialLiquidity > 0 && liquidityPoolTokens > 0) {
      const minPrice = totalInitialLiquidity / liquidityPoolTokens;
      setMinLaunchPrice(minPrice);
    }

    if (presaleValueRaised > softCap && totalTokensOfferedPresale > 0) {
      const presaleOverSoftCap = presaleValueRaised - softCap;
      const finalLaunchPrice = minLaunchPrice + (presaleOverSoftCap / totalTokensOfferedPresale);
      setActualLaunchPrice(finalLaunchPrice);
    } else {
      setActualLaunchPrice(minLaunchPrice);
    }

    const totalLiquidity = actualLaunchPrice * totalForLaunch ;
    setTotalLiquidityValue(totalLiquidity);

    const calculatedMarketCap = actualLaunchPrice * totalTokens ;
    setMarketCap(calculatedMarketCap);
  }, [
    totalTokens, burnTokens, liquidityPoolTokens, totalTokensOfferedPresale, devMarketingTokens,
    liquidityInUSD, presaleValueRaised, softCap, actualLaunchPrice
  ]);


  const handleChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setter(value);
  };

  const pieData = {
    labels: [
      'Burn',
      'Liquidity Pool (LP)',
      'Presale Offering',
      'Dev/Marketing',
      'Unreleased',
    ],
    datasets: [
      {
        data: [burnTokens, liquidityPoolTokens, totalTokensOfferedPresale, devMarketingTokens, unreleasedTokens],
        backgroundColor: ['#FF6384', '#0052FF', '#00C2FF', '#0091FF', '#8f8f8f'],
        hoverOffset: 4,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: TooltipItem<'doughnut'>) {
            const dataIndex = tooltipItem.dataIndex;
            const label = pieData.labels[dataIndex];
            const value = pieData.datasets[0].data[dataIndex];
            const percentage = ((value as number / totalTokens) * 100).toFixed(2);
            return `${label}: ${value.toLocaleString()} tokens (${percentage}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };





    return (
      <Flex
        flexDirection="column"
        p={2}
        borderRadius="xl"
        boxShadow="xl"
        bgImage="/images/b3.png"
        bgPosition="center"
        bgRepeat="no-repeat"
        bgSize="cover"
        color="white"
        width="100%"
      >
      <Tabs  isFitted variant="soft-rounded" width="100%" color="white" maxW="450px" mt={6}>
        <TabList>
        <Tab color="white" _selected={{ color: 'white', bg: '#2182ff' }}>
          Deployment</Tab>
          <Tab color="white" _selected={{ color: 'white', bg: '#2182ff' }}>
          Presale</Tab>
          <Tab color="white" _selected={{ color: 'white', bg: '#2182ff' }}>
          Admin</Tab>
          <Tab color="white" _selected={{ color: 'white', bg: '#2182ff' }}>
          Edit</Tab>
        </TabList>
        <TabPanels>

            <TabPanel>
              <Box  width="100%" bg="rgba(0, 0, 0, 0.7)" p={4} borderRadius="xl" boxShadow="md">
              <Image mb={6} src="images/logobwb.png" alt="header" mx="auto" width="70%" minW="250px" mt="28px" />
                <Box height="200px">
                  <Doughnut data={pieData} options={pieOptions} />
                </Box>

                  <Text fontSize="lg" fontWeight="bold" mt={6} mb={4}>Deployment Figures and Percentages</Text>
                  <HStack justifyContent="space-between" mt={2}>
                    <HStack>
                      <Box width="15px" height="15px" bg="#FF6384" border="2px solid white" borderRadius="2px" />
                      <Text>To Burn:</Text>
                    </HStack>
                    <Text>{burnTokens.toLocaleString()} ({((burnTokens / totalTokens) * 100).toFixed(2)}%)</Text>
                  </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <HStack>
                      <Box width="15px" height="15px" bg="#0052FF" border="2px solid white" borderRadius="2px" />
                      <Text>Initial Token Qty:</Text>
                    </HStack>
                    <Text>{liquidityPoolTokens.toLocaleString()} ({((liquidityPoolTokens / totalTokens) * 100).toFixed(2)}%)</Text>
                  </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <HStack>
                      <Box width="15px" height="15px" bg="#00C2FF" border="2px solid white" borderRadius="2px" />
                      <Text>Presale:</Text>
                    </HStack>
                    <Text>{totalTokensOfferedPresale.toLocaleString()} ({((totalTokensOfferedPresale / totalTokens) * 100).toFixed(2)}%)</Text>
                  </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <HStack>
                      <Box width="15px" height="15px" bg="#0091FF" border="2px solid white" borderRadius="2px" />
                      <Text>Dev/Marketing:</Text>
                    </HStack>
                    <Text>{devMarketingTokens.toLocaleString()} ({((devMarketingTokens / totalTokens) * 100).toFixed(2)}%)</Text>
                  </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <HStack>
                      <Box width="15px" height="15px" bg="#8f8f8f" border="2px solid white" borderRadius="2px" />
                      <Text>Unreleased:</Text>
                    </HStack>
                    <Text>{unreleasedTokens.toLocaleString()} ({((unreleasedTokens / totalTokens) * 100).toFixed(2)}%)</Text>
                  </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <HStack>
                      <Box width="15px" height="15px" bg="#65fa64" border="2px solid white" borderRadius="2px" />
                      <Text>To be Released:</Text>
                    </HStack>
                    <Text>{(totalTokens - unreleasedTokens).toLocaleString()} ({(((totalTokens - unreleasedTokens) / totalTokens) * 100).toFixed(2)}%)</Text>
                  </HStack>

                  <Text mt={8} fontSize="lg" fontWeight="bold" mb={4}>Summary</Text>
                  <HStack justifyContent="space-between">
                    <Text>Total Token Supply:</Text>
                    <Text>{totalTokens.toLocaleString()}</Text>
                  </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <Text>Minimum Launch Price:</Text>
  <FormattedPrice price={minLaunchPrice} />
                    </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <Text>Actual Launch Price:</Text>
                      <FormattedPrice price={actualLaunchPrice} />
                  </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <Text>Total Liquidity Value (LP):</Text>
                    <Text>${totalLiquidityValue.toLocaleString()}</Text>
                  </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <Text>Market Cap:</Text>
                    <Text>${marketCap.toLocaleString()}</Text>
                  </HStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <Text>Soft Cap Reached:</Text>
                    <Text>${softCap.toLocaleString()} / ${contributionsUSD.toLocaleString()}</Text>
                  </HStack>
                </Box>
            </TabPanel>
            <TabPanel>
              <Box width="100%" borderRadius="xl" boxShadow="md" >
                <Presalecomponent />
              </Box>
            </TabPanel>
            <TabPanel>
              <Box width="100%" borderRadius="xl" boxShadow="md" >
                <Admin />
              </Box>
            </TabPanel>
            <TabPanel>
            <VStack spacing={4} width="100%">
              <Box width="100%">
                <Text mt={4} mb={2} fontSize="2xl">Deployment Figures</Text>
              </Box>

              <Box width="100%">
                <Text mb={2} fontSize="lg">Total Token Supply</Text>
                <Input bg="white" color="black" value={totalTokens} isReadOnly />
              </Box>

              <HStack width="100%">
                <Box width="100%">
                  <Text mb={2} fontSize="lg">Projects Initial Token Qty</Text>
                  <Input
                    bg="white"
                    color="black"
                    value={liquidityPoolTokens}
                    onChange={handleChange(setLiquidityPoolTokens)}
                  />
                </Box>

                <Box width="100%">
                  <Text mb={2} fontSize="lg">Projects Initial Value USD</Text>
                  <Input
                    bg="white"
                    color="black"
                    value={liquidityInUSD}
                    onChange={handleChange(setLiquidityInUSD)}
                  />
                </Box>
              </HStack>

              <Box width="100%">
                <Text mb={2} fontSize="lg">Tokens to Burn</Text>
                <Input
                  bg="white"
                  color="black"
                  value={burnTokens}
                  onChange={handleChange(setBurnTokens)}
                />
              </Box>

              <Box width="100%">
                <Text mb={2} fontSize="lg">Dev/Marketing Tokens</Text>
                <Input
                  bg="white"
                  color="black"
                  value={devMarketingTokens}
                  onChange={handleChange(setDevMarketingTokens)}
                />
              </Box>

              <Box width="100%">
                <Text mb={2} fontSize="lg">Presale Token Qty</Text>
                <Input
                  bg="white"
                  color="black"
                  value={totalTokensOfferedPresale}
                  onChange={handleChange(setTotalTokensOfferedPresale)}
                />
              </Box>

              <Box width="100%">
                <Text mb={2} fontSize="lg">Soft Cap (USD)</Text>
                <Input
                  bg="white"
                  color="black"
                  value={softCap}
                  onChange={handleChange(setSoftCap)}
                />
              </Box>

              <Box width="100%">
                <Text mb={2} fontSize="lg">Contributions in USD</Text>
                <Input bg="white" color="black" value={contributionsUSD} isReadOnly />
              </Box>

              <Box width="100%">
                <Text mb={2} fontSize="lg">Hard Cap (USD)</Text>
                <Input
                  bg="white"
                  color="black"
                  value={hardCap}
                  onChange={handleChange(setHardCap)}
                />
              </Box>

              <Button colorScheme="blue" onClick={updateParameters}>
                Update Parameters
              </Button>
              <Divider my={2} borderColor="gray.500" />
            </VStack>


                </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    );
  };

  export default TokenDeploymentCalculator;
