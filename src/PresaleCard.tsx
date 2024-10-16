import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Image, SimpleGrid, useToast
} from '@chakra-ui/react';
import { ethers, Contract } from 'ethers';
import presaleAbi from './Abi/presaleAbi.json';

// Sample list of presale contract addresses
const PRESALE_CONTRACT_ADDRESSES = [
  '0x1234567890abcdef1234567890abcdef12345678',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  // Add more addresses here
];

const RPC_URL = import.meta.env.VITE_RPC_URL as string;

const PresaleCardPage: React.FC = () => {
  const [presaleContracts, setPresaleContracts] = useState<string[]>(PRESALE_CONTRACT_ADDRESSES);

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb={6}>
        Active Presales
      </Text>
      <SimpleGrid columns={[1, null, 2, 4]} spacing={6}>
        {presaleContracts.map((address, index) => (
          <PresaleCard key={index} presaleAddress={address} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default PresaleCardPage;

// Card Component derived from your original PresaleComponent
const PresaleCard: React.FC<{ presaleAddress: string }> = ({ presaleAddress }) => {
  const [totalTokensOffered, setTotalTokensOffered] = useState<string>('0');
  const [isPresaleCancelled, setIsPresaleCancelled] = useState<boolean>(false);
  const [isPresaleSuccessful, setIsPresaleSuccessful] = useState<boolean>(false);
  const toast = useToast();

  // Fetch Presale Details (extracted from your original component)
  const fetchPresaleDetails = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new Contract(presaleAddress, presaleAbi, provider);

      const totalTokens = await contract.totalTokensOfferedPresale();
      const presaleCancelled = await contract.presaleCancelled();
      const presaleSuccessful = await contract.presaleSuccessful();

      setTotalTokensOffered(ethers.formatUnits(totalTokens, 18));
      setIsPresaleCancelled(presaleCancelled);
      setIsPresaleSuccessful(presaleSuccessful);
    } catch (error) {
      console.error('Error fetching presale details:', error);
      toast({
        title: 'Error Fetching Presale',
        description: `Could not fetch details for presale contract ${presaleAddress}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchPresaleDetails();
  }, [presaleAddress]);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.800" color="white">
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        Presale Address:
      </Text>
      <Text fontSize="sm" mb={4}>
        {presaleAddress}
      </Text>

      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Text fontSize="md" fontWeight="bold">
          Tokens Offered: {parseFloat(totalTokensOffered).toFixed(2)}
        </Text>
      </Flex>

      {isPresaleCancelled ? (
        <Text fontSize="lg" color="red.400" fontWeight="bold">
          Presale Cancelled
        </Text>
      ) : isPresaleSuccessful ? (
        <Text fontSize="lg" color="green.400" fontWeight="bold">
          Presale Successful
        </Text>
      ) : (
        <Text fontSize="lg" color="yellow.400" fontWeight="bold">
          Presale Active
        </Text>
      )}
    </Box>
  );
};
