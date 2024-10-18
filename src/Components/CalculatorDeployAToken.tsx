import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Input, VStack, Divider, HStack, useBreakpointValue
} from '@chakra-ui/react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const TokenDeploymentCalculator: React.FC = () => {
  const [totalTokens, setTotalTokens] = useState<number>(Number(import.meta.env.VITE_TOTAL_TOKENS) || 0);
  const [burnTokens, setBurnTokens] = useState<number>(Number(import.meta.env.VITE_BURN_TOKENS) || 0);
  const [liquidityPoolTokens, setLiquidityPoolTokens] = useState<number>(Number(import.meta.env.VITE_LP_TOKENS) || 0);
  const [presaleTokens, setPresaleTokens] = useState<number>(Number(import.meta.env.VITE_PRESALE_TOKENS) || 0);
  const [devMarketingTokens, setDevMarketingTokens] = useState<number>(Number(import.meta.env.VITE_DEV_MARKETING_TOKENS) || 0);
  const [liquidityInUSD, setLiquidityInUSD] = useState<number>(Number(import.meta.env.VITE_LIQUIDITY_IN_USD) || 0);
  const [presaleValueRaised, setPresaleValueRaised] = useState<number>(Number(import.meta.env.VITE_PRESALE_VALUE_RAISED) || 0); // Presale raised value
  const [softCap, setSoftCap] = useState<number>(Number(import.meta.env.VITE_SOFT_CAP) || 0); // Soft cap input

  const [unreleasedTokens, setUnreleasedTokens] = useState<number>(0);
  const [actualLaunchPrice, setActualLaunchPrice] = useState<number>(0); // Final launch price
  const [minLaunchPrice, setMinLaunchPrice] = useState<number>(0); // Minimum launch price
  const [marketCap, setMarketCap] = useState<number>(0); // Market cap calculation
  const [totalLiquidityValue, setTotalLiquidityValue] = useState<number>(0); // Liquidity calculation

  const isMobile = useBreakpointValue({ base: true, lg: false });

  useEffect(() => {
    const totalForLaunch = liquidityPoolTokens + presaleTokens;

    // Calculate unreleased tokens
    const unreleased = totalTokens - burnTokens - liquidityPoolTokens - presaleTokens - devMarketingTokens;
    setUnreleasedTokens(unreleased);

    // Calculate the minimum launch price based on soft cap + initial liquidity
    const totalInitialLiquidity = liquidityInUSD + softCap;
    if (totalInitialLiquidity > 0 && liquidityPoolTokens > 0) {
      const minPrice = totalInitialLiquidity / liquidityPoolTokens;
      setMinLaunchPrice(minPrice);
    }

    // Calculate actual launch price: Minimum Launch Price + (Presale Raised - Soft Cap) / Presale Tokens
    if (presaleValueRaised > softCap && presaleTokens > 0) {
      const presaleOverSoftCap = presaleValueRaised - softCap;
      const finalLaunchPrice = minLaunchPrice + (presaleOverSoftCap / presaleTokens);
      setActualLaunchPrice(finalLaunchPrice);
    } else {
      // If presale raised is less than soft cap, use min launch price for final launch price
      setActualLaunchPrice(minLaunchPrice);
    }

    // Calculate total liquidity value (doubled based on final launch price)
    const totalLiquidity = actualLaunchPrice * (liquidityPoolTokens + presaleTokens) * 2;
    setTotalLiquidityValue(totalLiquidity);

    // Calculate market cap (doubled based on final launch price and total tokens)
    const calculatedMarketCap = actualLaunchPrice * totalTokens * 2;
    setMarketCap(calculatedMarketCap);
  }, [
    totalTokens, burnTokens, liquidityPoolTokens, presaleTokens, devMarketingTokens,
    liquidityInUSD, presaleValueRaised, softCap, actualLaunchPrice
  ]);

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
        data: [burnTokens, liquidityPoolTokens, presaleTokens, devMarketingTokens, unreleasedTokens],
        backgroundColor: ['#FF6384', '#0052FF', '#00C2FF', '#0091FF', '#8f8f8f'],
        hoverOffset: 4,
      },
    ],
  };

  const pieOptions = {
  plugins: {
    legend: {
      display: false, // This will hide the legend labels
    },
    tooltip: {
      callbacks: {
        label: function (tooltipItem) {
          const dataIndex = tooltipItem.dataIndex;
          const label = pieData.labels[dataIndex];
          const value = pieData.datasets[0].data[dataIndex];
          const percentage = ((value / totalTokens) * 100).toFixed(2);
          return `${label}: ${value.toLocaleString()} tokens (${percentage}%)`;
        },
      },
    },
    datalabels: {
      display: false, // Keep this as per your preference
      formatter: (value: number) => {
        const percentage = ((value / totalTokens) * 100).toFixed(2);
        return `${value.toLocaleString()} \n(${percentage}%)`;
      },
      color: '#fff',
      font: {
        size: 12,
      },
      anchor: 'end',
      align: 'start',
      offset: 10,
    },
  },
  maintainAspectRatio: false,
  responsive: true,
};


  return (
    <Flex
      flexDirection={isMobile ? 'column' : 'row'}
      p={6}
      borderRadius="xl"
      boxShadow="xl"
      bgImage="/images/b3.png"
      bgPosition="center"
      bgRepeat="no-repeat"
      bgSize="cover"
      color="white"
      width="100%"
    >

      {/* Left Column - Inputs */}
      <VStack spacing={4} width={isMobile ? '100%' : '50%'}>
        <Box width="100%">
          <Text mt={4} mb={2} fontSize="2xl">Deployment Figures</Text>
        </Box>

        <Box width="100%">
          <Text mb={2} fontSize="lg">Total Token Supply</Text>
          <Input
            bg="white"
            color="black"
            value={totalTokens}
            onChange={(e) => setTotalTokens(Number(e.target.value))}
          />
        </Box>


        <HStack width="100%" >
          <Box width="100%">
            <Input
              bg="white"
              color="black"
              value={liquidityPoolTokens}
              onChange={(e) => setLiquidityPoolTokens(Number(e.target.value))}
            />
            <Text mb={2} fontSize="lg">Projects Initial Token Qty</Text>

          </Box>

          <Box width="100%">
            <Input
              bg="white"
              color="black"
              value={liquidityInUSD}
              onChange={(e) => setLiquidityInUSD(Number(e.target.value))}
            />
              <Text mb={2} fontSize="lg">Projects Initial Value USD</Text>
          </Box>
        </HStack>

        <Divider my={2} borderColor="gray.500" />


        <Box width="100%">
          <Text mb={2} fontSize="lg">Tokens to Burn </Text>
          <Input
            bg="white"
            color="black"
            value={burnTokens}
            onChange={(e) => setBurnTokens(Number(e.target.value))}
          />
        </Box>

        <Box width="100%">
          <Text mb={2} fontSize="lg">Dev/Marketing Tokens</Text>
          <Input
            bg="white"
            color="black"
            value={devMarketingTokens}
            onChange={(e) => setDevMarketingTokens(Number(e.target.value))}
          />
        </Box>

        <Divider my={2} borderColor="gray.500" />

        <HStack width="100%" >

        <Box width="100%">
          <Text mb={2} fontSize="lg">Presale Token Qty</Text>
          <Input
            bg="white"
            color="black"
            value={presaleTokens}
            onChange={(e) => setPresaleTokens(Number(e.target.value))}
          />
        </Box>

        <Box width="100%">
          <Text mb={2} fontSize="lg">Min SoftCap (USD)</Text>
          <Input
            bg="white"
            color="black"
            value={softCap}
            onChange={(e) => setSoftCap(Number(e.target.value))}
          />
        </Box>
        </HStack>


    <Divider my={2} borderColor="gray.500" />



    <HStack width="100%">
        <Box width="100%">
          <Text mt={4} mb={2} fontSize="lg">Presale Value Raised</Text>
          <Input
            bg="white"
            color="black"
            value={presaleValueRaised}
            onChange={(e) => setPresaleValueRaised(Number(e.target.value))}
          />
        </Box>

      </HStack>
        <Divider my={2} borderColor="gray.500" />

      </VStack>

      {/* Right Column - Results */}
      <VStack spacing={6} width={isMobile ? '100%' : '50%'} mt={isMobile ? 6 : 0} pl={isMobile ? 0 : 6}>

        {/* Pie Chart */}
        <Box width="100%" bg="rgba(0, 0, 0, 0.7)" p={9} borderRadius="md" boxShadow="md">
        <Text fontSize="lg" fontWeight="bold" mb={4}>Deployment Chart</Text>
          <Box  height="200px">
            <Doughnut data={pieData} options={pieOptions} />
          </Box>
        </Box>

        {/* New Section - Deployment Figures and Percentages */}
  <Box width="100%" bg="rgba(0, 0, 0, 0.7)" p={4} borderRadius="md" boxShadow="md">
    <Text fontSize="lg" fontWeight="bold" mb={4}>Deployment Figures and Percentages</Text>

    <HStack justifyContent="space-between" mt={2}>
      <HStack>
        <Box
          width="15px"
          height="15px"
          bg="#FF6384"
          border="2px solid white"
          borderRadius="2px"
        />
        <Text>To Burn:</Text>
      </HStack>
      <Text>{burnTokens.toLocaleString()} ({((burnTokens / totalTokens) * 100).toFixed(2)}%)</Text>
    </HStack>

    <HStack justifyContent="space-between" mt={2}>
      <HStack>
        <Box
          width="15px"
          height="15px"
          bg="#0052FF"
          border="2px solid white"
          borderRadius="2px"
        />
        <Text>Initial Token Qty:</Text>
      </HStack>
      <Text>{liquidityPoolTokens.toLocaleString()} ({((liquidityPoolTokens / totalTokens) * 100).toFixed(2)}%)</Text>
    </HStack>

    <HStack justifyContent="space-between" mt={2}>
      <HStack>
        <Box
          width="15px"
          height="15px"
          bg="#00C2FF"
          border="2px solid white"
          borderRadius="2px"
        />
        <Text>Presale:</Text>
      </HStack>
      <Text>{presaleTokens.toLocaleString()} ({((presaleTokens / totalTokens) * 100).toFixed(2)}%)</Text>
    </HStack>

    <HStack justifyContent="space-between" mt={2}>
      <HStack>
        <Box
          width="15px"
          height="15px"
          bg="#0091FF"
          border="2px solid white"
          borderRadius="2px"
        />
        <Text>Dev/Marketing:</Text>
      </HStack>
      <Text>{devMarketingTokens.toLocaleString()} ({((devMarketingTokens / totalTokens) * 100).toFixed(2)}%)</Text>
    </HStack>

    <HStack justifyContent="space-between" mt={2}>
      <HStack>
        <Box
          width="15px"
          height="15px"
          bg="#8f8f8f"
          border="2px solid white"
          borderRadius="2px"
        />
        <Text>Unreleased:</Text>
      </HStack>
      <Text>{unreleasedTokens.toLocaleString()} ({((unreleasedTokens / totalTokens) * 100).toFixed(2)}%)</Text>
    </HStack>
    <HStack justifyContent="space-between" mt={2}>
  <HStack>
    <Box
      width="15px"
      height="15px"
      bg="#65fa64"
      border="2px solid white"
      borderRadius="2px"
    />
    <Text>To be Released:</Text>
  </HStack>
  <Text>{(totalTokens - unreleasedTokens).toLocaleString()} ({(((totalTokens - unreleasedTokens) / totalTokens) * 100).toFixed(2)}%)</Text>
</HStack>
  </Box>
  <Box width="100%" bg="rgba(0, 0, 0, 0.7)" p={4} borderRadius="md" boxShadow="md">
    <Text fontSize="lg" fontWeight="bold" mb={4}>Summary</Text>

    <HStack justifyContent="space-between">
      <Text>Total Token Supply:</Text>
      <Text>{totalTokens.toLocaleString()}</Text>
    </HStack>

    <HStack justifyContent="space-between" mt={2}>
      <Text>Minimum Launch Price:</Text>
      <Text>${minLaunchPrice.toFixed(9)}</Text>
    </HStack>

    <HStack justifyContent="space-between" mt={2}>
      <Text>Actual Launch Price:</Text>
      <Text>${actualLaunchPrice.toFixed(9)}</Text>
    </HStack>

    <HStack justifyContent="space-between" mt={2}>
      <Text>Total Liquidity Value (LP):</Text>
      <Text>${totalLiquidityValue.toLocaleString()}</Text>
    </HStack>

    <HStack justifyContent="space-between" mt={2}>
      <Text>Market Cap:</Text>
      <Text>${marketCap.toLocaleString()}</Text>
    </HStack>
  </Box>


      </VStack>
    </Flex>
  );
};
export default TokenDeploymentCalculator;
