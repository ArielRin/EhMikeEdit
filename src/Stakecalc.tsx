import React, { useState } from 'react';
import { Box, Flex, Input, Text, Heading } from '@chakra-ui/react';
import { ethers } from 'ethers';

const RewardsCalculator = () => {
  // Default values
  const defaultTokenPerBlockWei = "9000000"; // entered in Wei (9 decimal token)
  const defaultTokenPrice = 0.015; // in USD
  const defaultBlockTime = 2; // in seconds
  const defaultTokenDecimals = 9; // Default token decimals (can be adjusted)
  const defaultTotalTokens = 1000000; // Total tokens to disperse (whole tokens)

  // State variables
  const [tokenPerBlockWei, setTokenPerBlockWei] = useState(defaultTokenPerBlockWei);
  const [tokenPrice, setTokenPrice] = useState(defaultTokenPrice);
  const [blockTime, setBlockTime] = useState(defaultBlockTime);
  const [tokenDecimals, setTokenDecimals] = useState(defaultTokenDecimals);
  const [totalTokens, setTotalTokens] = useState(defaultTotalTokens); // Total tokens in whole units

  // Constants for calculations
  const secondsInADay = 86400; // 24 hours in seconds

  // Convert from Wei to token units with respect to token decimals
  const tokenPerBlock = parseFloat(ethers.formatUnits(tokenPerBlockWei, tokenDecimals));

  // Calculate the rewards per day
  const blocksPerDay = secondsInADay / blockTime;
  const rewardsPerDay = tokenPerBlock * blocksPerDay;

  // Calculate how many days to earn $1
  const usdPerDay = rewardsPerDay * tokenPrice;
  const daysToOneDollar = 1 / usdPerDay;

  // Calculate how long the pool can run (in days), adjusting total tokens for decimals
  const totalTokensAdjusted = totalTokens * Math.pow(10, tokenDecimals); // Convert total tokens to smallest units
  const daysToRunPool = totalTokensAdjusted / (rewardsPerDay * Math.pow(10, tokenDecimals));

  return (
    <Box p={6} maxW="600px" mx="auto">
      <Heading mb={6} textAlign="center">Rewards Calculator</Heading>
      <Flex direction="column" gap={4}>
        <Box>
          <Text fontWeight="bold">Tokens Per Block (in Wei):</Text>
          <Input
            type="text"
            value={tokenPerBlockWei}
            onChange={(e) => setTokenPerBlockWei(e.target.value)}
          />
        </Box>

        <Box>
          <Text fontWeight="bold">Token Decimals:</Text>
          <Input
            type="number"
            value={tokenDecimals}
            onChange={(e) => setTokenDecimals(parseInt(e.target.value))}
          />
        </Box>

        <Box>
          <Text fontWeight="bold">Token Price (in USD):</Text>
          <Input
            type="number"
            value={tokenPrice}
            onChange={(e) => setTokenPrice(parseFloat(e.target.value))}
          />
        </Box>

        <Box>
          <Text fontWeight="bold">Block Time (in seconds):</Text>
          <Input
            type="number"
            value={blockTime}
            onChange={(e) => setBlockTime(parseFloat(e.target.value))}
          />
        </Box>

        <Box>
          <Text fontWeight="bold">Total Tokens to Disperse (whole tokens):</Text>
          <Input
            type="number"
            value={totalTokens}
            onChange={(e) => setTotalTokens(parseFloat(e.target.value))}
          />
        </Box>

        <Box mt={6} p={4} bg="gray.100" borderRadius="md">
          <Text fontWeight="bold">Results:</Text>
          <Text>Blocks Per Day: {blocksPerDay.toLocaleString()}</Text>
          <Text>Rewards Per Day: {rewardsPerDay.toLocaleString(undefined, { minimumFractionDigits: 12 })} tokens</Text>
          <Text>USD Earned Per Day: ${usdPerDay.toFixed(8)}</Text>
          <Text>Days to Earn $1: {daysToOneDollar.toLocaleString(undefined, { minimumFractionDigits: 2 })} days</Text>
          <Text>Days the Pool Can Run: {daysToRunPool.toFixed(2)} days</Text> {/* New result for pool run time */}
        </Box>
      </Flex>
    </Box>
  );
};

export default RewardsCalculator;
