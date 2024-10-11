import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';

import Intro from './Intro';
import IntroBABY from './IntroBABY';
import Presalecomponent from './Presalecomponent';
import PresaleAdminPage from './PresaleAdminPage';



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
    { chainId: 84532, name: 'Base Sepolia', currency: 'ETH', explorerUrl: 'https://sepolia.basescan.org', rpcUrl: 'https://sepolia.base.org' }

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
});

const modal = createWeb3Modal({
  ethersConfig,
  chains,
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': 'grey',
    '--w3m-accent': '#313131',
  },
  chainImages: {
      8453: '/images/base.png',

      84532: '/images/baset.png',
    },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'
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
        <Route path="/" element={<Intro />} />
          <Route path="/introbaby" element={<IntroBABY />} />
          <Route path="/presale" element={<Presalecomponent />} />
          <Route path="/adminpresale" element={<PresaleAdminPage />} />

      </Routes>
    </Router>
  );
};

export default App;
