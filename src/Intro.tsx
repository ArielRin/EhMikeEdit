import React, { useState, useEffect } from 'react';
import { Box, Image, Flex, Text } from '@chakra-ui/react';
import { css, keyframes } from '@emotion/react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as ChakraLink } from '@chakra-ui/react';
import Footer from './Components/Footer/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter as faXTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import ViewPresale from './Presalecomponent';
import Presalecomponent from './Presalecomponent';
import './1styles.css'; // Make sure this points to your CSS file

const imagePaths = ['/images/logobwb.png'];
const imagePathsBabyDoge = ['/images/logobwb.png'];

const NewPage = () => {
  const [currentImage, setCurrentImage] = useState<string>(imagePaths[0]);
  const [currentImageBabyDoge, setCurrentImageBabyDoge] = useState<string>(imagePathsBabyDoge[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImage(imagePaths[Math.floor(Math.random() * imagePaths.length)]);
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalIdBabyDoge = setInterval(() => {
      setCurrentImageBabyDoge(imagePathsBabyDoge[Math.floor(Math.random() * imagePathsBabyDoge.length)]);
    }, 2000);
    return () => clearInterval(intervalIdBabyDoge);
  }, []);

  return (
    <>
      <Box position="relative" flex={1} p={0} m={0} display="flex" flexDirection="column" color="white">
        <Box flex={1} p={0} m={0} bg="rgba(0, 0, 0, 0.65)" display="flex" flexDirection="column" color="white">
          <Box flex={1} p={4} m={0} display="flex" flexDirection="column" bgImage="/images/b3.png" bgPosition="center" bgRepeat="no-repeat" bgSize="cover" color="white">
            {/* Insert the animated background */}
            <ul className="circles">
              <li></li>
              <li></li>
              <li></li>
              <li></li>
              <li></li>
              <li></li>
              <li></li>
              <li></li>
              <li></li>
              <li></li>
            </ul>

            <Flex flex={1} m={2} p={7} borderRadius="2xl" textAlign="center" bg="rgba(0, 0, 0, 0.61)" border="2px" borderColor="#fff" flexWrap="wrap" alignItems="center" justifyContent="center" h="auto" flexDirection="column" bgImage="/images/b3.png" bgSize="cover" bgPosition="left">
              <Flex  mt="15px" mb="15px" justify="center" align="center" gap={4}>
                <ChakraLink href="https://babydoge20.com/" isExternal>
                  Home
                </ChakraLink>
                <ChakraLink href="https://babydoge20.com/about/" isExternal>
                  About
                </ChakraLink>
                <ChakraLink href="https://x.com/team_wsm20" isExternal>
                  <FontAwesomeIcon icon={faXTwitter} size="xl" />
                </ChakraLink>
                <ChakraLink href="https://t.me/foxy_wsm20" isExternal>
                  <FontAwesomeIcon icon={faTelegram} size="xl" />
                </ChakraLink>
              </Flex>
              <Text mb={2} ml={4} textAlign="left" fontSize="lg" fontWeight="bolder">
                Welcome to BABYDOGE on Base! Grab your Presale tokens while they last!
              </Text>
              <Image src="/images/logobwb.png" alt="header" mx="auto" width="30%" minW="200px" mt="28px" />
              <Flex align="center">
                <w3m-button />
              </Flex>
            </Flex>

            <Flex justifyContent="center" p={0} flexWrap="wrap" position="relative">
              <Box flex={1} minW="300px" m={2} p={7} borderRadius="2xl" boxShadow="md" textAlign="center" border="2px" borderColor="#fff" bg="rgba(0, 0, 0, 0.61)" bgImage="/images/b2.png" bgSize="cover" bgPosition="left">
                <RouterLink to="/introBABY">
                  <Image src="/images/babytextlogo.png" alt="header" mx="auto" width="40%" minW="250px" mt="28px" />
                  <Image src="/images/nobase.png" alt="header" mx="auto" width="20%" minW="180px" mb={2} />
                  <Flex justifyContent="center" flexWrap="wrap">
                    <Text mt="10px" width="60%" textAlign="center" fontSize="lg" fontWeight="normal">
                      Click to Enter Site
                    </Text>
                  </Flex>
                  <Flex justifyContent="center" flexWrap="wrap">
                    <Text width="60%" textAlign="center" fontSize="lg" fontWeight="normal">
                      BABYDOGE on Base Presale Coming soon...
                    </Text>
                  </Flex>
                  <Image src={currentImageBabyDoge} alt="BabyDoge" mx="auto" width="40%" minW="250px" mt="28px" borderRadius="2xl" />
                </RouterLink>
              </Box>

              <Box m={2} maxW="480px" flex={1} borderRadius="2xl" boxShadow="md" textAlign="center" border="2px" borderColor="#fff">
                <Presalecomponent />
              </Box>
            </Flex>
            <Flex justifyContent="center" p={0} flexWrap="wrap" position="relative">
              <Box flex={1} minW="300px" m={2} p={7} borderRadius="2xl" boxShadow="md" textAlign="center" bg="rgba(0, 0, 0, 0.61)" border="2px" borderColor="#fff">
                <RouterLink to="/">
                  <Text textAlign="center" color="white" fontSize="4xl" fontWeight="bolder">
                    Presale is Live!
                  </Text>
                  <Image src="images/logobwb.png" alt="header" mx="auto" width="40%" minW="250px" mt="28px" />
                </RouterLink>
              </Box>
            </Flex>
          </Box>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default NewPage;
