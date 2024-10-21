// PresaleCard.tsx
import React, { useEffect, useState } from 'react';
import { Box, Text, Flex, useToast } from '@chakra-ui/react';
import { ethers, Contract } from 'ethers';
import presaleAbi from './Abi/presaleAbi.json';

interface PresaleCardProps {
  presaleAddress: string;
}

const PresaleCard: React.FC<PresaleCardProps> = ({ presaleAddress }) => {
  const [totalTokensOffered, setTotalTokensOffered] = useState<string>('0');
  const [isPresaleCancelled, setIsPresaleCancelled] = useState<boolean>(false);
  const [isPresaleSuccessful, setIsPresaleSuccessful] = useState<boolean>(false);
  const toast = useToast();

  const RPC_URL = import.meta.env.VITE_RPC_URL as string;

  // Fetch Presale Details
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

export default PresaleCard;
