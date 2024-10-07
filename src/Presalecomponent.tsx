import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, Progress, Input, Image, InputGroup, InputLeftElement } from '@chakra-ui/react';

const PresaleComponent = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // oi Mike! Set the target date here  for the countdown on dapp
  const targetDate = new Date('2024-11-05T00:00:00');
  // oi Mike! Set the target date here  for the countdown on dapp





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
          <Text fontSize="2xl" fontWeight="bold">
            Presale ending in
          </Text>
          <Text fontSize="4xl" mt={2}>
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </Text>
        </Box>

        <Box width="100%" mb={4}>
          <Text fontSize="xl" textAlign="center" mt={2} >
            Total Sold: 794,092/1,000,000,000
          </Text>

          <Progress value={16} size="lg" colorScheme="blue" borderRadius="md" mt={4} />

        </Box>


                <Box width="100%" mb={6}>
                  <Text fontSize="md" textAlign="center" mt={2}>
                  1 $BABYDOGE = $0.0000525
                  </Text>
                </Box>

        <Flex justifyContent="space-between" width="100%" mb={4} gap={4}>
    <Button
      flex={1}
      p={6}
      colorScheme="gray"
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Image src="/images/eth.svg" alt="ETH Icon" boxSize="30px" mr={2} />
      ETH
    </Button>

    <Button
      flex={1}
      p={6}
      colorScheme="gray"
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Image src="/images/usdt.svg" alt="USDT Icon" boxSize="30px" mr={2} />
      USDT
    </Button>

    <Button
      flex={1}
      p={6}
      colorScheme="gray"
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Image src="/images/claimbd.png" alt="Claim Icon" boxSize="30px" mr={2} />
      Claim
    </Button>
  </Flex>


  <Flex justifyContent="center" flexWrap="wrap">
    <Text mt="30px" width="60%" textAlign="center" fontSize="lg" fontWeight="normal">

    </Text>
  </Flex>

  <Flex justifyContent="space-between" width="100%" mb={8}>

<Box width="48%">
<Text mb={2} fontSize="sm">
  Enter ETH amount
</Text>
<InputGroup>
  <InputLeftElement
    height="100%"
    display="flex"
    alignItems="center"
    pointerEvents="none"
  >
    <Image src="/images/eth.svg" alt="ETH Icon" boxSize="32px" />
  </InputLeftElement>
  <Input
    bg="white"
    color="black"
    placeholder="Enter value"
    size="lg"
    borderRadius="md"
    textAlign="right"
  />
</InputGroup>
</Box>

<Box width="48%">
<Text mb={2} fontSize="sm">
  $BABYDOGE Estimated
</Text>
<InputGroup>
  <InputLeftElement
    height="100%"
    display="flex"
    alignItems="center"
    pointerEvents="none"
  >
    <Image src="/images/claimbd.png" alt="BABYDOGE Icon" boxSize="32px" />
  </InputLeftElement>
  <Input
    bg="white"
    color="black"
    placeholder=""
    size="lg"
    borderRadius="md"
    textAlign="right"
  />
</InputGroup>
</Box>
</Flex>

        <Box width="100%" mb={4} textAlign="center">
          <Text fontSize="md">
            The new BABYDOGE on Base, with a tokenomics engineered for you for maximum growth! Total supply is 4.2B tokens with 1B available for presale.
          </Text>
        </Box>

        <Button colorScheme="blue"  mt={4} width="100%" size="lg" borderRadius="xl">
          Connect wallet and presale token purchase
        </Button>


          <Flex justifyContent="center" flexWrap="wrap">
            <Text mt="30px" width="60%" textAlign="center" fontSize="lg" fontWeight="normal">

            </Text>
          </Flex>
      </Flex>
    );
  };

  export default PresaleComponent;
