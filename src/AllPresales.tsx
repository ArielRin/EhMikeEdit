import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Button, Image, SimpleGrid, useToast,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useWeb3ModalProvider } from '@web3modal/ethers/react';
import presaleAbi from './Abi/presaleAbi.json';
import PresaleCard from './PresaleCard'; // Adjust the path if needed

// Sample data for presale contract addresses
const PRESALE_CONTRACT_ADDRESSES = [
  '0xFcE8F3B8ca2f666F2dBd8C108249c51ebC9A009B',
  '0x63df0F5B0D4F8DdF77dC072C2CdE9c6C828c0De6',

];

const PresaleListPage: React.FC = () => {
  const [presaleContracts, setPresaleContracts] = useState<string[]>([]);
  const { walletProvider } = useWeb3ModalProvider();
  const toast = useToast();

  // Fetching presale contract details
  const fetchPresaleContracts = async () => {
    try {
      // You can fetch from a contract or API. Here, it's a static array for demo.
      setPresaleContracts(PRESALE_CONTRACT_ADDRESSES);
    } catch (error) {
      console.error('Error fetching presale contracts:', error);
      toast({
        title: 'Error Fetching Contracts',
        description: 'There was an issue fetching presale contracts.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchPresaleContracts();
  }, []);

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb={6}>
        Presale Contracts List
      </Text>
      <SimpleGrid columns={[1, null, 4]} spacing={6}>
        {presaleContracts.map((address, index) => (
          <PresaleCard key={index} presaleAddress={address} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default PresaleListPage;
