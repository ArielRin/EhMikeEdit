import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  Box,
  Button,
  Text,
  Link,
  Image,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import nftMintAbi from './nftMintAbi.json';

const MINT_PRICE = 0.02;
const MINT_SUPPLY = 20;
const NFTMINT_CONTRACT_ADDRESS = '0x36e50b8c7be83546e11567e0D5871a99c7c554e0';
const BASE_CHAIN_ID = '8453'; // Base chain ID
const RPC_PROVIDER = 'https://mainnet.base.org';
const EXPLORER_LINK = 'https://basescan.org';
const METADATA_BASE_URL = '/NFTMETADATA/';

const getExplorerLink = (tokenId: number) => `${EXPLORER_LINK}/token/${NFTMINT_CONTRACT_ADDRESS}?a=${tokenId}`;
const getMarketplaceLink = (tokenId: number) => `https://opensea.io/assets/matic/${NFTMINT_CONTRACT_ADDRESS}/${tokenId}`;

interface ContractError extends Error {
  data?: {
    message: string;
  };
}

function NftMint() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const [selectedNft, setSelectedNft] = useState<number | null>(null);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [mintAmount, setMintQuantity] = useState<number>(1);
  const [mintLoading, setMintLoading] = useState<boolean>(false);
  const [mintError, setMintError] = useState<ContractError | null>(null);

  useEffect(() => {
    fetchContractData();
    const interval = setInterval(fetchContractData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);
      const contract = new ethers.Contract(NFTMINT_CONTRACT_ADDRESS, nftMintAbi, provider);
      const supply = await contract.totalSupply();
      setTotalSupply(Number(supply));
    } catch (error) {
      toast({
        title: 'Error Fetching Data',
        description: 'There was an issue fetching data from the contract.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error fetching contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchToBase = async () => {
    if (walletProvider?.request) {
      try {
        console.log('Switching to Base Chain...');
        await walletProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${parseInt(BASE_CHAIN_ID).toString(16)}` }],
        });
        console.log('Switched to Base Chain');
      } catch (switchError) {
        if ((switchError as { code: number }).code === 4902) {
          console.log('Base Chain not found. Adding network...');
          try {
            await walletProvider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${parseInt(BASE_CHAIN_ID).toString(16)}`,
                  chainName: 'Base Mainnet',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: [RPC_PROVIDER],
                  blockExplorerUrls: [EXPLORER_LINK],
                },
              ],
            });
            console.log('Added and switched to Base Chain');
          } catch (addError) {
            console.error('Error adding Base Chain:', addError);
          }
        } else {
          console.error('Error switching to Base Chain:', switchError);
        }
      }
    }
  };

  const onMintClick = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      open();
      return;
    }

    setMintLoading(true);
    try {
      if (!walletProvider) {
        throw new Error('Wallet provider is not available');
      }

      let provider = new ethers.BrowserProvider(walletProvider);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== parseInt(BASE_CHAIN_ID)) {
        await switchToBase();
        provider = new ethers.BrowserProvider(walletProvider);
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(NFTMINT_CONTRACT_ADDRESS, nftMintAbi, signer);

      const tx = await contract.mint(address, mintAmount, {
        value: ethers.parseEther((MINT_PRICE * mintAmount).toString()),
      });
      await tx.wait();
      fetchContractData();
    } catch (error) {
      console.error('Minting error:', error);
      const contractError = error as ContractError;
      setMintError(contractError);
      const errorMessage = contractError.data ? contractError.data.message : 'An unknown error occurred.';
      toast({
        title: 'Minting Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setMintLoading(false);
    }
  };

  const handleIncrement = () => {
    setMintQuantity((prev) => Math.min(prev + 1, 25));
  };

  const handleDecrement = () => {
    setMintQuantity((prev) => Math.max(prev - 1, 1));
  };

  const maxSupply = MINT_SUPPLY;
  const remainingSupply = maxSupply - totalSupply;

  const addNftToWallet = async (tokenId: number) => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error('Ethereum object not found');
      }

      const metadataResponse = await fetch(`${METADATA_BASE_URL}${tokenId}.json`);
      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch metadata');
      }
      const metadata = await metadataResponse.json();
      const imageUrl = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');

      const wasAdded = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: {
            address: NFTMINT_CONTRACT_ADDRESS,
            tokenId: tokenId.toString(),
            symbol: 'PIGZ',
            image: imageUrl,
          },
        },
      });

      if (wasAdded) {
        toast({
          title: 'NFT added to wallet!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'NFT addition rejected',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error adding NFT to wallet', error);
      toast({
        title: 'Error adding NFT to wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const [nfts, setNfts] = useState<number[]>([]);

  const fetchNFTs = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);
      const contract = new ethers.Contract(NFTMINT_CONTRACT_ADDRESS, nftMintAbi, provider);
      const balance = await contract.balanceOf(address);
      const nftList: number[] = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
        nftList.push(Number(tokenId));
      }
      setNfts(nftList);
    } catch (error) {
      toast({
        title: 'Error Fetching NFTs',
        description: 'There was an issue fetching NFTs from the contract.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchNFTs();
      switchToBase();
    }
  }, [isConnected]);

  const handleViewNft = (tokenId: number) => {
    setSelectedNft(tokenId);
    onOpen();
  };

  return (
    <>
      <Box
        flex={1}
        p={0}
        m={0}
        display="flex"
        flexDirection="column"
        bgPosition="center"
        bgRepeat="no-repeat"
        bgSize="cover"
      >
        <Box
          flex={1}
          p={0}
          m={0}
          display="flex"
          flexDirection="column"
          bg="rgba(0, 0, 0, 0.0)"
          bgPosition="center"
          bgRepeat="no-repeat"
          bgSize="cover"
        >
          <Box
            marginBottom="40px"
            borderRadius="2xl"
            mx="auto"
            my="10px"
            maxWidth="800px"
            width="100%"
            minWidth="380px"
            textAlign="center"
          >
            <div>
              <Image src="/images/logobwb.png" alt="header" mx="auto" width="70%" minW="100px" mt="18px" />
              <Box mt={6} display="flex" justifyContent="center" alignItems="center" mx="auto">
                <w3m-button />
              </Box>


                <Text mt={8} fontSize="2xl" style={{ color: 'white', textAlign: 'center', fontWeight: 'bolder' }}>
                  BBDOGG NFT Presale Collection
                </Text>
              <Text className="totalSupply" style={{ color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                {loading ? 'Loading...' : `Sold : ${totalSupply} / ${maxSupply}`}
              </Text>
              <Text className="remainingSupply" style={{ color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                {loading ? 'Loading...' : `Remaining Supply: ${remainingSupply}`}
              </Text>
              <Text className="contractaddr" style={{ color: 'white', display: 'block', textAlign: 'center', fontWeight: 'bold', marginTop: '10px' }}>
                Contract
              </Text>
              <Text fontSize="lg" style={{ color: 'white', display: 'block', textAlign: 'center', fontWeight: 'bold', marginTop: '10px' }}>
                {NFTMINT_CONTRACT_ADDRESS}
              </Text>
              <Link mb="100px" isExternal href={`https://basescan.org/token/${NFTMINT_CONTRACT_ADDRESS}`} className="contractaddr" style={{ color: 'white', display: 'block', textAlign: 'center', fontWeight: 'bold', marginTop: '10px' }}>
                View on Explorer
              </Link>
            </div>
            {remainingSupply > 0 ? (
              <>
                <Text mb="72px" className="pricecost" style={{ color: 'white', textAlign: 'center', fontWeight: 'bolder' }}>
                  Mint at {MINT_PRICE} ETH (Base)
                </Text>
                <Box marginTop="4" display="flex" alignItems="center" justifyContent="center">
                  <Button
                    onClick={handleDecrement}
                    disabled={mintAmount <= 1 || mintLoading || remainingSupply === 0}
                    textColor="white"
                    bg="rgba(251, 164, 30, 1)"
                    _hover={{ bg: '#136bff' }}
                  >
                    -
                  </Button>
                  <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bolder', marginTop: '20px' }} mx="4">
                    {mintAmount}
                  </Text>
                  <Button
                    onClick={handleIncrement}
                    disabled={mintAmount >= 5 || mintLoading}
                    textColor="white"
                    bg="rgba(251, 164, 30, 1)"
                    _hover={{ bg: '#136bff' }}
                  >
                    +
                  </Button>
                </Box>
                <Box marginTop="4" marginBottom="10" display="flex" alignItems="center" justifyContent="center">
                  <Button
                   mb="65px"
                    onClick={onMintClick}
                    disabled={!isConnected || mintLoading || remainingSupply === 0}
                    textColor="white"
                    bg="rgba(251, 164, 30, 1)"
                    _hover={{ bg: '#136bff' }}
                    marginTop="4"
                  >
                    Mint Now
                  </Button>
                </Box>

                <Text className="contractaddr" style={{ color: 'white', textAlign: 'center', fontWeight: 'bolder', marginTop: '20px' }}>
                  Will Switch to Base Chain automatically on mint (If not already connected).
                </Text>
              </>
            ) : (
              <Text className="pricecost" style={{ color: 'white', textAlign: 'center', fontWeight: 'bolder', marginTop: '20px' }}>
                Minting has Completed!
              </Text>
            )}
            {mintError && <Text color="red.500" mt="4">Error: {mintError.message}</Text>}
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default NftMint;
