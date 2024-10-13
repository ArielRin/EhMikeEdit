import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import stakingFactoryABI from './Abi/stakingfactoyABI.json'; // Import your ABI here

const FACTORY_CONTRACT_ADDRESS = "0x01e67794bebb71044C4210f3c150faa51a5cC185";
const RPC_URL = import.meta.env.VITE_RPC_URL as string;

const DeployedPoolsRawJsonPage: React.FC = () => {
  const [pools, setPools] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDeployedPools();
  }, []);

  const fetchDeployedPools = async () => {
    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, stakingFactoryABI, provider);
      const pools = await contract.getDeployedPools();
      setPools(pools);
    } catch (error) {
      console.error('Error fetching deployed pools:', error);
    } finally {
      setIsLoading(false);
    }
  };

    return (
      <pre style={{ color: 'black' }}>
        {JSON.stringify(pools, null, 2)}
      </pre>
    );
  }


export default DeployedPoolsRawJsonPage;
