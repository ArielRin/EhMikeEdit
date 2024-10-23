import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';

import Intro from './Intro';
import IntroBABY from './IntroBABY';
import Presalecomponent from './Presalecomponent';
import PresaleAdminPage from './PresaleAdminPage';
import IntroAdmin from './IntroAdmin';
import ContributorList from './Components/ContributorList';

import CalculatorDeployAToken from './Components/CalculatorDeployAToken';
import DeploymentModal from './Components/DeploymentModal';
import TokenDetails from './Components/TokenDetails';
import DeployPoolPage from './DeployPoolPage';
import AdminDeployPoolPage from './AdminDeployPoolPage';
import DeployPoolAPI from './DeployPoolAPI';
import ThirdWebNftStakePage from './3rdWebNftStakePage';
import NftStakeStats from './3wNftStakeStats';
import NftStakeStats2 from './NftStakeStats';
import Stakecalc from './Stakecalc';
import AllPresales from './AllPresales';
import IntroStake from './IntroStake';
import IntroMint from './IntroMint';
import Mint from './Components/NftMint0/NftMint0';


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
    {
      chainId: 7171,
      name: 'BitRock',
      currency: 'BROCK',
      explorerUrl: 'https://explorer.bit-rock.io',
      rpcUrl: 'https://connect.bit-rock.io'
    },

      {
        chainId: 7771,
        name: 'TestBock',
        currency: 'tBROCK',
        explorerUrl: 'https://testnetscan.bit-rock.io',
        rpcUrl: 'https://testnet.bit-rock.io'
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
    '--w3m-color-mix': '#2854f3',
    '--w3m-accent': '#dc9710',
    '--w3m-color-mix-strength': 22

  },
  chainImages: {
      8453: '/images/base.png',
      7171: '/images/brock.png',
      84532: '/images/baset.png',
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
        <Route path="/" element={<Intro />} />
          <Route path="/introbaby" element={<IntroBABY />} />
          <Route path="/presale" element={<Presalecomponent />} />
          <Route path="/list" element={<ContributorList />} />
          <Route path="/calc" element={<CalculatorDeployAToken />} />
          <Route path="/tokendetails" element={<DeploymentModal />} />
          <Route path="/token" element={<IntroAdmin />} />
          <Route path="/admin" element={<CalculatorDeployAToken />} />
          <Route path="/details" element={<TokenDetails />} />
          <Route path="/deploy" element={<DeployPoolPage />} />
          <Route path="/admindeploy" element={<AdminDeployPoolPage />} />
          <Route path="/apipools" element={<DeployPoolAPI />} />
          <Route path="/oldstake" element={<ThirdWebNftStakePage />} />
          <Route path="/nftstats" element={<NftStakeStats />} />
          <Route path="/stakecalc" element={<Stakecalc />} />
          <Route path="/allpresales" element={<AllPresales />} />
          <Route path="/introadmin" element={<IntroAdmin />} />
          <Route path="/intromint" element={<IntroMint />} />
          <Route path="/stake" element={<IntroStake />} />
          <Route path="/mint" element={<Mint />} />
      </Routes>
    </Router>
  );
};

export default App;
