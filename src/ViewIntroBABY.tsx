import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast as notify } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Box,
  Button,
  Image,
  Text,
  Link,
  useToast,
  Modal,
  Flex,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Wrap,
  WrapItem,
  Grid,
  GridItem,
} from '@chakra-ui/react';

import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

function MyBABY() {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        try {
          const accounts: string[] = await provider.send("eth_requestAccounts", []);
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          notify.error('Please connect to your Wallet.');
        }

        (window.ethereum as any).on('accountsChanged', async (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setAddress(null);
            setIsConnected(false);
          }
        });

        (window.ethereum as any).on('chainChanged', async (chainId: string) => {
          const network = await provider.getNetwork();
          const accounts = await provider.listAccounts();
          if (network.chainId && accounts.length > 0) {
            const accountAddresses = await Promise.all(accounts.map((account) => account.getAddress()));
            setAddress(accountAddresses[0]);
          }
        });
      } else {
        notify.error('Wallet not Detected. Try Refreshing or Install a Wallet to use this app.');
      }
    };

    initializeConnection();
  }, []);


 return (
    <>
      <Box
        position="relative"
        flex={1}
        p={0}
        m={5}
        display="flex"
        flexDirection="column"

      >
        <h1>Welcome to the BABYDOGE on Base Presale</h1>
        <div align="left">
          <p>&nbsp; </p>
          <p> Connect your wallet and buy your presale tokens now!  Once the presale is over, you will ba able to claim your tokens here by hitting the claim button.</p>
          <p>&nbsp; </p>
          <p>Once all tokens are claimed, you can trade them on Uniswap or HODL for the 2000X that's coming!!! good Luck, Diamond Hands Win!!</p>
          <p>&nbsp; </p>
          <p align="center">Have fun!!</p>
        </div>
      </Box>

    </>
  );
};

export default MyBABY;
