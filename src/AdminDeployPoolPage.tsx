import React, { useState, useEffect } from 'react';
import { Box, Button, Input, Flex, Text, useToast } from '@chakra-ui/react';
import { ethers, Contract } from 'ethers';
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import stakingFactoryABI from './Abi/stakingfactoyABI.json'; // Import your ABI here

const FACTORY_CONTRACT_ADDRESS = "0xf7e35568Ddc298Cc07a49062DFe152F87f0B227F";
const RPC_URL = import.meta.env.VITE_RPC_URL as string;

const DeployPoolPage: React.FC = () => {
  const [stakedToken, setStakedToken] = useState('');
  const [rewardToken, setRewardToken] = useState('');
  const [admin, setAdmin] = useState('');
  const [projectTaxAddress, setProjectTaxAddress] = useState('');
  const [taxAddress, setTaxAddress] = useState('');
  const [rewardPerBlock, setRewardPerBlock] = useState('');
  const [startBlock, setStartBlock] = useState('');
  const [bonusEndBlock, setBonusEndBlock] = useState('');
  const [poolLimitPerUser, setPoolLimitPerUser] = useState('');
  const [tax, setTax] = useState('');
  const [projectTax, setProjectTax] = useState('');
  const [deployedPools, setDeployedPools] = useState<string[]>([]);
  const [deploymentFee, setDeploymentFee] = useState<string>('');
  const [newFee, setNewFee] = useState<string>('');
  const [contractBalance, setContractBalance] = useState<string>('0');

  const { isConnected, address } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const toast = useToast();

  useEffect(() => {
    fetchDeployedPools();
    fetchDeploymentFee();
    fetchContractBalance();
  }, [walletProvider]);

  const fetchContract = async () => {
    let provider: ethers.JsonRpcProvider | ethers.BrowserProvider;
    let signerOrProvider: ethers.JsonRpcSigner | ethers.Provider;

    if (isConnected && walletProvider) {
      provider = new ethers.BrowserProvider(walletProvider as any);
      signerOrProvider = await provider.getSigner();
    } else {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      signerOrProvider = provider; // If you're not connected to a wallet, this will be a read-only provider.
    }

    return new ethers.Contract(FACTORY_CONTRACT_ADDRESS, stakingFactoryABI, signerOrProvider);
  };

  const fetchDeployedPools = async () => {
    try {
      const contract = await fetchContract();
      const pools = await contract.getDeployedPools();
      setDeployedPools(pools);
    } catch (error) {
      console.error('Error fetching deployed pools:', error);
    }
  };

  const fetchDeploymentFee = async () => {
    try {
      const contract = await fetchContract();
      const fee = await contract.deploymentFee();
      setDeploymentFee(ethers.formatEther(fee));
    } catch (error) {
      console.error('Error fetching deployment fee:', error);
    }
  };

  const fetchContractBalance = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const balance = await provider.getBalance(FACTORY_CONTRACT_ADDRESS);
      setContractBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error fetching contract balance:', error);
    }
  };

  const deployNewPoolWithoutFee = async () => {
    try {
      const contract = await fetchContract();
      const tx = await contract.deployNewPoolWithoutFee(
        stakedToken,
        rewardToken,
        admin,
        projectTaxAddress,
        taxAddress,
        rewardPerBlock,
        startBlock,
        bonusEndBlock,
        poolLimitPerUser,
        tax,
        projectTax
      );
      await tx.wait();
      toast({
        title: 'Pool Deployed Successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchDeployedPools(); // Update the deployed pools list
    } catch (error) {
      console.error('Error deploying pool:', error);
      toast({
        title: 'Error Deploying Pool',
        description: 'Please check the details and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateDeploymentFee = async () => {
    try {
      const contract = await fetchContract();
      const tx = await contract.updateDeploymentFee(ethers.parseUnits(newFee, 'ether'));
      await tx.wait();
      toast({
        title: 'Deployment Fee Updated',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchDeploymentFee(); // Refresh the deployment fee
    } catch (error) {
      console.error('Error updating deployment fee:', error);
      toast({
        title: 'Error Updating Fee',
        description: 'Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const withdrawFunds = async () => {
    try {
      const contract = await fetchContract();
      const tx = await contract.withdrawFunds();
      await tx.wait();
      toast({
        title: 'Funds Withdrawn',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchContractBalance(); // Refresh the contract balance
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast({
        title: 'Error Withdrawing Funds',
        description: 'Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6}>
      <Flex align="right">
        <w3m-button />
      </Flex>
      <Text fontSize="2xl" mb={4}>Owner Deploy New Pool</Text>

      {/* Form Inputs */}
      <Input placeholder="Staked Token Address" value={stakedToken} onChange={(e) => setStakedToken(e.target.value)} mb={2} />
      <Input placeholder="Reward Token Address" value={rewardToken} onChange={(e) => setRewardToken(e.target.value)} mb={2} />
      <Input placeholder="Admin Address" value={admin} onChange={(e) => setAdmin(e.target.value)} mb={2} />
      <Input placeholder="Project Tax Address" value={projectTaxAddress} onChange={(e) => setProjectTaxAddress(e.target.value)} mb={2} />
      <Input placeholder="Tax Address" value={taxAddress} onChange={(e) => setTaxAddress(e.target.value)} mb={2} />
      <Input placeholder="Reward Per Block" value={rewardPerBlock} onChange={(e) => setRewardPerBlock(e.target.value)} mb={2} />
      <Input placeholder="Start Block" value={startBlock} onChange={(e) => setStartBlock(e.target.value)} mb={2} />
      <Input placeholder="Bonus End Block" value={bonusEndBlock} onChange={(e) => setBonusEndBlock(e.target.value)} mb={2} />
      <Input placeholder="Pool Limit Per User" value={poolLimitPerUser} onChange={(e) => setPoolLimitPerUser(e.target.value)} mb={2} />
      <Input placeholder="Tax" value={tax} onChange={(e) => setTax(e.target.value)} mb={2} />
      <Input placeholder="Project Tax" value={projectTax} onChange={(e) => setProjectTax(e.target.value)} mb={4} />

      <Button colorScheme="blue" onClick={deployNewPoolWithoutFee} mb={6}>Deploy Pool Without Fee</Button>

      {/* Deployment Fee Section */}
      <Text fontSize="lg" mb={2}>Current Deployment Fee: {deploymentFee} ETH</Text>
      <Flex mb={4}>
        <Input placeholder="New Deployment Fee (ETH)" value={newFee} onChange={(e) => setNewFee(e.target.value)} />
        <Button colorScheme="green" ml={2} onClick={updateDeploymentFee}>Update Fee</Button>
      </Flex>

      {/* Contract Balance */}
      <Text fontSize="lg" mb={2}>Contract Balance: {contractBalance} ETH</Text>
      <Button colorScheme="red" onClick={withdrawFunds} mb={6}>Withdraw Funds</Button>

      {/* Deployed Pools List */}
      <Box>
        <Text fontSize="xl" mb={4}>Deployed Pools:</Text>
        {deployedPools.length === 0 ? (
          <Text>No pools deployed yet.</Text>
        ) : (
          deployedPools.map((pool, index) => (
            <Text key={index}>{pool}</Text>
          ))
        )}
      </Box>
    </Box>
  );
};

export default DeployPoolPage;
