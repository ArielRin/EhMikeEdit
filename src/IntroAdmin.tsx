import React, { useState, useEffect } from 'react';
import { Box, Image, Flex, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as ChakraLink } from '@chakra-ui/react';
import Footer from './Components/Footer/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter as faXTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import Presalecomponent from './Presalecomponent';
import AdminStyled from './Components/DeploymentModal';
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



            <Flex justifyContent="center" p={0} flexWrap="wrap" position="relative">



              <Box flex={1}  m={2} boxShadow="md" textAlign="center" borderRadius="2xl" border="2px" borderColor="#fff"  bgImage="/images/b2.png" bgSize="cover" bgPosition="left">
              <Box p={0} m={0}  borderRadius="2xl" height="100%" bg="rgba(0, 0, 0, 0.65)">
              <Flex flex={1} m={0} p={7}  textAlign="center"  flexWrap="wrap" alignItems="center" justifyContent="center" h="auto" flexDirection="column">
      <Flex mt="15px" mb="15px" justify="center" align="center" gap={4}>
        <ChakraLink
          href="https://babydoge20.com/"
          isExternal
          color="white"
          _hover={{ textDecoration: 'underline', color: 'white.400' }}
        >
          Home
        </ChakraLink>
        <ChakraLink
          href="https://babydoge20.com/about/"
          isExternal
          color="white"
          _hover={{ textDecoration: 'underline', color: 'white.400' }}
        >
          About
        </ChakraLink>
        <ChakraLink
          href="https://x.com/team_wsm20"
          isExternal
          color="white"
          _hover={{ color: 'white.400' }}
        >
          <FontAwesomeIcon icon={faXTwitter} size="xl" />
        </ChakraLink>
        <ChakraLink
          href="https://t.me/foxy_wsm20"
          isExternal
          color="white"
          _hover={{ color: 'white.400' }}
        >
          <FontAwesomeIcon icon={faTelegram} size="xl" />
        </ChakraLink>
      </Flex>
      <Text mb={2} ml={4} textAlign="left" fontSize="lg" fontWeight="bolder">
        Welcome to BABYDOGE on Base! Grab your Presale tokens while they last!
      </Text>
    </Flex>
    <Image mb="100px" src={currentImageBabyDoge} alt="BabyDoge" mx="auto" width="60%" minW="350px" mt="28px" borderRadius="2xl" />


                              {/* New button bruvva */}
                              <Flex justifyContent="center" p={0} flexWrap="wrap" position="relative" gap={4} mt={6}>

                                                              <RouterLink to="/" style={{ textDecoration: 'none' }}>
                                                                <Box
                                                                  p={4}
                                                                  bg="rgba(251, 164, 30, 1)"
                                                                  borderRadius="md"
                                                                  _hover={{ bg: "rgba(251, 164, 30, 0.5)" }}
                                                                  textAlign="center"
                                                                  color="white"
                                                                  display="flex"
                                                                  flexDirection="column"
                                                                  alignItems="center"
                                                                  width="150px"
                                                                  cursor="pointer"
                                                                >
                                                                <Image src="/images/direct-marketing.svg" alt="Claim Icon" boxSize="60px"  mb={2} />
                                                                  <Text>Presale</Text>
                                                                </Box>
                                                              </RouterLink>
                                <RouterLink to="/token"
                                 style={{ textDecoration: 'none' }}>
                                  <Box
                                    p={4}
                                    bg="rgba(251, 164, 30, 1)"
                                    borderRadius="md"
                                    _hover={{ bg: "rgba(251, 164, 30, 0.5)" }}
                                    textAlign="center"
                                    color="white"
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    width="150px"
                                    cursor="pointer"
                                  >
                                  <Image src="/images/admin-panel.svg" alt="Claim Icon" boxSize="60px"  mb={2} />
                                  <Text>Token Details</Text>
                                  </Box>
                                </RouterLink>

                                <RouterLink to="/stake" style={{ textDecoration: 'none' }}>
                                  <Box
                                    p={4}
                                    bg="rgba(251, 164, 30, 1)"
                                    borderRadius="md"
                                    _hover={{ bg: "rgba(251, 164, 30, 0.5)" }}
                                    textAlign="center"
                                    color="white"
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    width="150px"
                                    cursor="pointer"
                                  >
                                  <Image src="/images/doge.svg" alt="Claim Icon" boxSize="60px" mb={2} />
                                    <Text>NFT Stake</Text>
                                  </Box>
                                </RouterLink>

                                <RouterLink to="/nftstats" style={{ textDecoration: 'none' }}>
                                  <Box
                                    p={4}
                                    bg="rgba(251, 164, 30, 1)"
                                    borderRadius="md"
                                    _hover={{ bg: "rgba(251, 164, 30, 0.5)" }}
                                    textAlign="center"
                                    color="white"
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    width="150px"
                                    cursor="pointer"
                                  >
                                  <Image src="/images/growth.svg" alt="Claim Icon" boxSize="60px" mb={2} />
                                    <Text>NFT Stats</Text>
                                  </Box>
                                </RouterLink>
                              </Flex>
                  <RouterLink to="/introBABY">

                  <Flex justifyContent="center" flexWrap="wrap">

                    <Text mt="10px" width="60%" textAlign="center" fontSize="lg" fontWeight="normal">
                      More...
                    </Text>
                  </Flex>
                  <Flex justifyContent="center" flexWrap="wrap">
                    <Text width="60%" textAlign="center" fontSize="lg" fontWeight="normal">
                      BABYDOGE on Base Presale Coming soon...
                    </Text>
                  </Flex>
                  <Image mt={9} mb={9} src="/images/BABYlogo.png" alt="header" mx="auto" width="100px"  minW="100px" />
                </RouterLink>
              </Box>
            </Box>

              <Box m={2} maxW="480px" bg="rgba(0, 0, 0, 0.65)" flex={1} borderRadius="2xl" boxShadow="md" textAlign="center" border="2px" borderColor="#fff">
                <AdminStyled />
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
