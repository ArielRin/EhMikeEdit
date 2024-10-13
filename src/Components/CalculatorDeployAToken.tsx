import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Input, VStack, Divider, useBreakpointValue, HStack
} from '@chakra-ui/react';

const CalculatorPage: React.FC = () => {
  // Access values from the .env file using import.meta.env
  const [totalTokens, setTotalTokens] = useState<string>(import.meta.env.VITE_TOTAL_TOKENS || ''); // Total token supply
  const [percentReleased, setPercentReleased] = useState<number>(parseFloat(import.meta.env.VITE_PERCENT_RELEASED || '0')); // Percentage released at launch
  const [ethProvided, setEthProvided] = useState<string>(import.meta.env.VITE_ETH_PROVIDED || ''); // Owner boost in USD
  const [presalePercentage, setPresalePercentage] = useState<number>(parseFloat(import.meta.env.VITE_PRESALE_PERCENTAGE || '0')); // Presale percentage
  const [presaleEarnings, setPresaleEarnings] = useState<string>(import.meta.env.VITE_PRESALE_EARNINGS || ''); // Presale earnings in USD
  const [liquidityPercent, setLiquidityPercent] = useState<number>(100); // Liquidity percentage
  const [minSoftCap, setMinSoftCap] = useState<string>(import.meta.env.VITE_MIN_SOFT_CAP || ''); // Minimum soft cap in USD for presale

  // Calculated state values
  const [presaleTokenValue, setPresaleTokenValue] = useState<string>('0');
  const [calculatedLaunchPrice, setCalculatedLaunchPrice] = useState<string>('0');
  const [presaleTokenPrice, setPresaleTokenPrice] = useState<string>('0');
  const [liquidityValue, setLiquidityValue] = useState<string>('0');
  const [dexLiquidityTokens, setDexLiquidityTokens] = useState<string>('0');
  const [dexLiquidityETH, setDexLiquidityETH] = useState<string>('0');
  const [tokensFor100Presale, setTokensFor100Presale] = useState<string>('0'); // $100 worth of presale tokens
  const [tokensFor100Launch, setTokensFor100Launch] = useState<string>('0'); // $100 worth of launch tokens
  const [softCapReached, setSoftCapReached] = useState<boolean>(false);
  const [fdv, setFdv] = useState<string>('0'); // Fully Diluted Valuation
  const [marketCap, setMarketCap] = useState<string>('0'); // Market Cap

  const isMobile = useBreakpointValue({ base: true, lg: false });

  useEffect(() => {
    calculateValues();
  }, [totalTokens, percentReleased, ethProvided, presalePercentage, presaleEarnings, liquidityPercent, minSoftCap]);

  // Function to calculate token prices, liquidity value, DEX settings, FDV, and Market Cap
  const calculateValues = () => {
    try {
      // Calculate presale token value based on percentage
      const presaleTokens = Math.floor(parseFloat(totalTokens) * (presalePercentage / 100));
      setPresaleTokenValue(presaleTokens.toLocaleString('en-US', { maximumFractionDigits: 0 })); // No decimals for large numbers

      // Presale price calculation based on presale earnings and tokens
      const presalePricePerToken = parseFloat(presaleEarnings) / presaleTokens;

      // Launch price calculation (owner’s value added to presale earnings)
      const totalTokensReleased = Math.floor(parseFloat(totalTokens) * (percentReleased / 100));
      const totalValueForLaunch = parseFloat(ethProvided) + parseFloat(presaleEarnings);
      const launchPricePerToken = totalValueForLaunch / totalTokensReleased;

      // Liquidity value calculation (both presale earnings and owner's ETH, doubled for DEX liquidity)
      const totalLiquidityValue = 2 * (totalValueForLaunch * (liquidityPercent / 100));
      const singleLiquidityValue = totalValueForLaunch * (liquidityPercent / 100);
      const liquidityTokens = Math.floor(singleLiquidityValue / launchPricePerToken); // No decimals for liquidity tokens
      const dexEth = Math.floor(singleLiquidityValue); // No decimals for ETH value

      // Fully Diluted Valuation (FDV) calculation (doubled)
      const fdvValue = Math.floor(2 * (parseFloat(totalTokens) * launchPricePerToken));
      setFdv(fdvValue.toLocaleString('en-US', { maximumFractionDigits: 0 }));

      // Market Cap calculation (doubled)
      const marketCapValue = Math.floor(2 * (totalTokensReleased * launchPricePerToken));
      setMarketCap(marketCapValue.toLocaleString('en-US', { maximumFractionDigits: 0 }));

      // Check if soft cap is reached
      setSoftCapReached(parseFloat(presaleEarnings) >= parseFloat(minSoftCap));

      // Calculate tokens for $100 based on presale and launch prices
      const tokensFor100Presale = Math.floor(100 / presalePricePerToken);
      const tokensFor100Launch = Math.floor(100 / launchPricePerToken);

      // Update calculated values
      setPresaleTokenPrice(presalePricePerToken.toLocaleString('en-US', { minimumFractionDigits: 18, maximumFractionDigits: 18 }));
      setCalculatedLaunchPrice(launchPricePerToken.toLocaleString('en-US', { minimumFractionDigits: 18, maximumFractionDigits: 18 }));
      setLiquidityValue(totalLiquidityValue.toLocaleString('en-US', { maximumFractionDigits: 0 }));

      // Set DEX liquidity values (single values)
      setDexLiquidityTokens(liquidityTokens.toLocaleString('en-US', { maximumFractionDigits: 0 }));
      setDexLiquidityETH(dexEth.toLocaleString('en-US', { maximumFractionDigits: 0 }));

      // Set $100 worth of tokens
      setTokensFor100Presale(tokensFor100Presale.toLocaleString('en-US', { maximumFractionDigits: 0 }));
      setTokensFor100Launch(tokensFor100Launch.toLocaleString('en-US', { maximumFractionDigits: 0 }));
    } catch (error) {
      console.error('Error in calculations:', error);
    }
  };

  // Conditional style for affected values if soft cap is not reached
  const affectedTextColor = softCapReached ? 'inherit' : 'red.500';

  return (
    <Flex
      flexDirection={isMobile ? 'column' : 'row'}
      p={6}
      borderRadius="xl"
      boxShadow="xl"
      bg="rgba(0, 0, 0, 0.7)"
      color="white"
      width="100%"
    >
      {/* Left Column - Inputs */}
      <VStack spacing={4} width={isMobile ? '100%' : '50%'}>
        <Box width="100%">
          <Text mb={2} fontSize="lg">Total Token Supply</Text>
          <Input
            bg="white"
            color="black"
            value={totalTokens}
            onChange={(e) => setTotalTokens(e.target.value)}
            placeholder="Enter total supply"
          />
        </Box>

        <Box width="100%">
          <Text mb={2} fontSize="lg">Percentage Released at Launch (%)</Text>
          <Input
            bg="white"
            color="black"
            type="number"
            value={percentReleased}
            onChange={(e) => setPercentReleased(parseFloat(e.target.value))}
            placeholder="Enter percentage to release"
          />
        </Box>

        <Box width="100%">
          <Text mb={2} fontSize="lg">Owner Boost (in USD):</Text>
          <Input
            bg="white"
            color="black"
            value={ethProvided}
            onChange={(e) => setEthProvided(e.target.value)}
            placeholder="Enter total ETH in USD"
          />
        </Box>

        <Box width="100%">
          <Text mb={2} fontSize="lg">Tokens to Presale based off total supply (%)</Text>
          <Input
            bg="white"
            color="black"
            type="number"
            value={presalePercentage}
            onChange={(e) => setPresalePercentage(parseFloat(e.target.value))}
            placeholder="Enter percentage of tokens for presale"
          />
        </Box>

        <Box width="100%">
          <Text mb={2} fontSize="lg">Minimum Soft Cap (in USD)</Text>
          <Input
            bg="white"
            color="black"
            value={minSoftCap}
            onChange={(e) => setMinSoftCap(e.target.value)}
            placeholder="Enter minimum soft cap"
          />
        </Box>

        <Box width="100%">
          <Text mb={2} fontSize="lg">Actual Presale Earnings</Text>
          <Input
            bg="white"
            color="black"
            value={presaleEarnings}
            onChange={(e) => setPresaleEarnings(e.target.value)}
            placeholder="Enter presale earnings"
          />
        </Box>
      </VStack>

      {/* Right Column - Results (Invoice-style) */}
      <VStack spacing={6} width={isMobile ? '100%' : '50%'} mt={isMobile ? 6 : 0} pl={isMobile ? 0 : 6}>
        <Divider my={4} borderColor="gray.500" />

        <Box width="100%" bg="gray.800" p={4} borderRadius="md" boxShadow="md">
          <Text fontSize="lg" fontWeight="bold" mb={4} >Summary</Text>

          <HStack justifyContent="space-between">
            <Text>Total Token Supply:</Text>
            <Text>{parseFloat(totalTokens).toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={2}>
            <Text>Percentage Released on deploy:</Text>
            <Text>{percentReleased}%</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={2}>
            <Text>Owner Boost (in USD):</Text>
            <Text>${parseFloat(ethProvided).toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={2}>
            <Text> Tokens to Deploy:</Text>
            <Text>{dexLiquidityTokens}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={2}>
            <Text>Presale Allocation:</Text>
            <Text>{presaleTokenValue}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={2}>
            <Text>Minimum Soft Cap:</Text>
            <Text>${parseFloat(minSoftCap).toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={6}>
            <Text>Presale Earnings (in USD):</Text>
            <Text>${parseFloat(presaleEarnings).toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
          </HStack>

          {/* Soft Cap Status */}
          {!softCapReached && (
            <Box color="red.500" mt={4}>
              <Text>Softcap not reached! These values may not be accurate:</Text>
            </Box>
          )}

          <Divider my={4} borderColor="gray.500" />
          <Text fontSize="lg" fontWeight="bold" mb={3}>Exchange Deployment Figures</Text>

          <HStack justifyContent="space-between">
            <Text fontWeight="bold" color={affectedTextColor}>Tokens to Deploy:</Text>
            <Text fontWeight="bold" color={affectedTextColor}>{dexLiquidityTokens}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={2}>
            <Text fontWeight="bold" color={affectedTextColor}>ETH Value to Deploy:</Text>
            <Text fontWeight="bold" color={affectedTextColor}>${dexLiquidityETH}</Text>
          </HStack>

          <Divider my={4} borderColor="gray.500" />
          <Text fontSize="lg" fontWeight="bold" mb={3}>Expected Tokens per $100USD</Text>

          <HStack justifyContent="space-between" mt={4}>
            <Text fontWeight="bold" color="green.400">$100 in Presale:</Text>
            <Text fontWeight="bold" color="green.400">{tokensFor100Presale}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={2}>
            <Text fontWeight="bold" color="green.400">$100 at Launch:</Text>
            <Text fontWeight="bold" color="green.400">{tokensFor100Launch}</Text>
          </HStack>

          <Divider my={4} borderColor="gray.500" />

          {/* LP and Market Cap */}
          <Text fontSize="lg" fontWeight="bold" mb={3}>Estimated Launch Figures</Text>

          <HStack justifyContent="space-between">
            <Text fontWeight="bold" color={affectedTextColor}>Presale Token Price:</Text>
            <Text fontWeight="bold" color={affectedTextColor}>${presaleTokenPrice}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={2}>
            <Text fontWeight="bold" color={affectedTextColor}>Launch Price:</Text>
            <Text fontWeight="bold" color={affectedTextColor}>${calculatedLaunchPrice}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={2}>
            <Text fontWeight="bold" color="yellow.400">Liquidity (LP):</Text>
            <Text fontWeight="bold" color="yellow.400">${liquidityValue}</Text>
          </HStack>

          <HStack justifyContent="space-between" mt={4}>
            <Text fontWeight="bold" color="yellow.400">Market Cap (MC):</Text>
            <Text fontWeight="bold" color="yellow.400">${fdv}</Text>
          </HStack>
        </Box>
      </VStack>
    </Flex>
  );
};

export default CalculatorPage;
