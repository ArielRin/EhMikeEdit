import React, { useEffect, useState } from 'react';
import { Flex, Box, Image, Text, Link } from '@chakra-ui/react';
import { useWeb3Modal } from '@web3modal/ethers/react';
import { ethers } from 'ethers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter as faXTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faGlobe, faChartLine } from '@fortawesome/free-solid-svg-icons';

const Footer: React.FC = () => {
  const { open } = useWeb3Modal();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum as any);
          const accounts = await web3Provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].toString());
            setProvider(web3Provider);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();
  }, []);


  return (
    <footer style={{ backgroundColor: 'rgba(0, 0, 0, 1)', color: 'white', textAlign: 'center' }}>
      <Box
      >  <Box
          bg="rgba(0, 0, 0, 0.95)"
          p={6}
        >
      </Box>


        <Text fontSize="xl" mb={2}>&copy;  BABYDOGE on Base {currentYear} </Text>
        <Flex p={2} bg="rgba(0, 0, 0, 0.61)" mt="15px" justify="center" align="center" gap={4}>

          {/*  <Image p={2} ml="4" src="/images/banner.png" alt="Banner" width="300px" /> */}

        </Flex>

        {/* Socials */}
        <Flex mt="15px" mb="15px" justify="center" align="center" gap={4}>
          <Link href="https://babydoge20.com/" isExternal>
            <FontAwesomeIcon icon={faGlobe} size="xl" />
          </Link>
          <Link href="https://x.com/team_wsm20" isExternal>
            <FontAwesomeIcon icon={faXTwitter} size="xl" />
          </Link>
          <Link href="https://t.me/foxy_wsm20" isExternal>
            <FontAwesomeIcon icon={faTelegram} size="xl" />
          </Link>
        </Flex>


                        <a href="https://portfolio.metamask.io/bridge" target="_blank" rel="noopener noreferrer">


                          <Flex justifyContent="center" flexWrap="wrap">
                            <Text width="60%" textAlign="center" fontSize="xl" fontWeight="normal"  textDecoration="underline">
                             Need to Bridge Tokens? Click Here.
                            </Text>
                          </Flex>
                          <Flex justifyContent="center" flexWrap="wrap">

                          </Flex>
                        </a>

        <Text mt="25px" fontSize="sm" mb={2}></Text>
        
        {/* Don't need these here, they are at the top
        <Flex mb={2} justifyContent="center" flexWrap="wrap">
          <w3m-network-button />
        </Flex>
        <Flex mb={4} justifyContent="center" flexWrap="wrap">
          <w3m-button />
        </Flex>
        */}
        <a href="https://alpha7.live" target="_blank" rel="noopener noreferrer">
          <Image
            src="https://raw.githubusercontent.com/ArielRin/Alpha7-Public-Files-and-Assets/master/OldDapp/src/headerlogo.png"
            alt="Logo"
            width="60px"
            mx="auto"
          />

          <Flex justifyContent="center" flexWrap="wrap">
            <Text width="60%" textAlign="center" fontSize="8px" fontWeight="normal">
              This Site was Made with Passion, Great Ethics
            </Text>
          </Flex>
          <Flex justifyContent="center" flexWrap="wrap">
            <Text width="60%" textAlign="center" mb="160px" fontSize="8px" fontWeight="normal">
              and High Spirits by The Alpha7 Team.
            </Text>
          </Flex>
        </a>
      </Box>
    </footer>
  );
};

export default Footer;
