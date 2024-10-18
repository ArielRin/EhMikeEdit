import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';

import ThirdWebNftStakePage from './3rdWebNftStakePage';
import NftStakeStats from './3wNftStakeStats';


import { ethers, BrowserProvider } from 'ethers';
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider
} from '@web3modal/ethers/react';

const projectId = import.meta.env.VITE_PROJECT_ID;
if (!projectId) {
  throw new Error('VITE_PROJECT_ID is not set');
}

const chains = [

  {
    chainId: 8453,
    name: 'Base',
    currency: 'ETH',
    explorerUrl: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org'
  },

  // added testnets for dev recreation of joeys frontend works

];

const ethersConfig = defaultConfig({
  metadata: {
    name: 'WSM20',
    description: '',
    url: '',
    icons: ['/logo.png']
  },
  defaultChainId: 8453,
  rpcUrl: 'https://mainnet.base.org',
  auth: {
    email: false,
    showWallets: true,
    walletFeatures: true
  }
});

const modal = createWeb3Modal({
  ethersConfig,
  chains,
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#dc9710',
    '--w3m-accent': '#4f613e',
    '--w3m-color-mix-strength': 22

  },
  chainImages: {
      8453: '/images/base.png',

    },
  tokens: {
    8453: {
      address: '0xA716C25e30Af41472bd51C92A643861d4Fa28021',
      image: 'https://raw.githubusercontent.com/ArielRin/WS20Ehvi8r/refs/heads/web3modal/Eh8r.png'
    },
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'
  ]
});


  const App = () => {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [connected, setConnected] = useState(false);

    const { open, close } = useWeb3Modal();
    const { address, chainId, isConnected } = useWeb3ModalAccount();
    const { walletProvider } = useWeb3ModalProvider();

    useEffect(() => {
      const connectWalletOnPageLoad = async () => {
        if (localStorage.getItem("isWalletConnected") === "true") {
          await connectWallet();
        }
      };
      connectWalletOnPageLoad();
    }, []);

    const connectWallet = async () => {
      try {
        await open();
        if (walletProvider) {
          const provider = new BrowserProvider(walletProvider);
          setProvider(provider);
          setConnected(true);
          localStorage.setItem("isWalletConnected", "true");
        } else {
          console.error("walletProvider is undefined");
        }
      } catch (error) {
        console.error("Could not get a wallet connection", error);
      }
    };


    const disconnectWallet = async () => {
      await close();
      setProvider(null);
      setConnected(false);
      localStorage.removeItem("isWalletConnected");
    };


  return (
    <Router>
      <Routes>
      <Route path="/" element={<NftStakeStats />} />
          <Route path="/2stake" element={<ThirdWebNftStakePage />} />
      </Routes>
    </Router>
  );
};

export default App;
