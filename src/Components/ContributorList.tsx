import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Progress, Spinner } from '@chakra-ui/react';
import { ethers, Contract } from 'ethers';
import contributorsAbi from '../Abi/presaleAbi.json';

const RPC_URL = import.meta.env.VITE_RPC_URL; // Use the .env RPC URL
const CONTRACT_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS; // Use the .env Contract Address

interface Contributor {
  contributorAddress: string;
  totalContributionUSD: bigint;
}

// Utility function to truncate the address
const truncateAddress = (address: string) => {
  return `${address.slice(0, 2)}..${address.slice(-6)}`;
};

// Utility function to convert 6-decimal USDT to regular USD
const convertToUSD = (value: bigint) => {
  return Number(value) / 1e6; // Divide by 10^6 to adjust for USDT decimals
};

const Contributors: React.FC = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalContributionsUSD, setTotalContributionsUSD] = useState<number>(0); // Regular number after conversion

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new Contract(CONTRACT_ADDRESS, contributorsAbi, provider);

        // Fetch the total contributions
        const totalContributions: bigint = await contract.totalContributionsUSD();
        setTotalContributionsUSD(convertToUSD(totalContributions)); // Convert BigInt to regular number

        // Fetch contributors list
        const contributorsArray: Contributor[] = await contract.getContributors();

        // Sort contributors by totalContributionUSD in descending order
        const sortedContributors = contributorsArray.sort(
          (a, b) => Number(b.totalContributionUSD - a.totalContributionUSD)
        );

        setContributors(sortedContributors);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching contributors:', error);
        setLoading(false);
      }
    };

    fetchContributors();
  }, []);

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box p={4} borderRadius="xl" bg="rgba(0, 0, 0, 0)" color="white" width="100%">
      <Text fontSize="2xl" mb={4} fontWeight="bold" textAlign="center">
        Contributor List
      </Text>
      {contributors.length > 0 ? (
        contributors.map((contributor, index) => {
          const contributionInUSD = convertToUSD(contributor.totalContributionUSD); // Convert the user's contribution
          const percentage = ((contributionInUSD / totalContributionsUSD) * 100).toFixed(2);

          return (
            <Flex
              key={index}
              mb={4}
              p={4}
              borderRadius="md"
              bg="gray.800"
              
              justifyContent="space-between"
              alignItems="center"
              flexDirection={['column', 'row']} // Stack vertically on smaller screens
            >
              <Text fontSize="md">
                <strong>Address:</strong> {truncateAddress(contributor.contributorAddress)}
              </Text>
              <Text fontSize="md">
                <strong>Value:</strong> ${contributionInUSD.toFixed(2)}
              </Text>
              <Progress value={parseFloat(percentage)} size="sm" colorScheme="green" mt={2} width="60%" />
              <Text fontSize="md">
                <strong></strong> {percentage}%
              </Text>
            </Flex>
          );
        })
      ) : (
        <Text fontSize="xl" textAlign="center">
          No contributors yet.
        </Text>
      )}
    </Box>
  );
};

export default Contributors;
