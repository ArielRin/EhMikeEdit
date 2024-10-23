import React, { useState, useEffect } from 'react';
import { Box, Image, Flex, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as ChakraLink } from '@chakra-ui/react';
import Footer from './Components/Footer/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter as faXTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import Stake from './3rdWebNftStakePagelil';
import Presalecomponent from './Presalecomponent';
import AdminStyled from './Components/DeploymentModal';
import Mint from './Components/NftMint0/NftMint0';



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
          <Box flex={1} p={1} m={0} display="flex" flexDirection="column" bgImage="/images/b3.png" bgPosition="center" bgRepeat="no-repeat" bgSize="cover" color="white">
            <Flex justifyContent="center" p={0} flexWrap="wrap" position="relative">
              {/* Left column displayed only on larger screens */}
              <Box
                flex={1}
                m={2}
                boxShadow="md"
                textAlign="center"
                borderRadius="2xl"
                border="2px"
                borderColor="#fff"
                bgImage="/images/b2.png"
                bgSize="cover"
                bgPosition="left"
                display={{ base: 'none', md: 'block' }} // Hide on smaller screens
              >
                <Box p={0} m={0} borderRadius="2xl" height="100%" bg="rgba(0, 0, 0, 0.65)">
                  <Flex flex={1} m={0} p={7} textAlign="center" flexWrap="wrap" alignItems="center" justifyContent="center" h="auto" flexDirection="column">
                    <Flex mt="15px" mb="15px" justify="center" align="center" gap={4}>
                      <ChakraLink href="https://babydoge20.com/" isExternal color="white" _hover={{ textDecoration: 'underline', color: 'white.400' }}>
                        Home
                      </ChakraLink>
                      <ChakraLink href="https://babydoge20.com/about/" isExternal color="white" _hover={{ textDecoration: 'underline', color: 'white.400' }}>
                        About
                      </ChakraLink>
                      <ChakraLink href="https://x.com/team_wsm20" isExternal color="white" _hover={{ color: 'white.400' }}>
                        <FontAwesomeIcon icon={faXTwitter} size="xl" />
                      </ChakraLink>
                      <ChakraLink href="https://t.me/foxy_wsm20" isExternal color="white" _hover={{ color: 'white.400' }}>
                        <FontAwesomeIcon icon={faTelegram} size="xl" />
                      </ChakraLink>
                    </Flex>
                    <Text mb={2} ml={4} textAlign="left" fontSize="lg" fontWeight="bolder">
                      Welcome to BABYDOGE on Base! Grab your Presale tokens while they last!
                    </Text>
                  </Flex>
                  <Image mb="100px" src={currentImageBabyDoge} alt="BabyDoge" mx="auto" width="60%" minW="350px" mt="28px" borderRadius="2xl" />
                  {/* Presale Buttons */}
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
                        <Image src="/images/direct-marketing.svg" alt="Claim Icon" boxSize="60px" mb={1} />
                        <Text fontSize="xs">Presale</Text>
                      </Box>
                    </RouterLink>
                    <RouterLink to="/token" style={{ textDecoration: 'none' }}>
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
                        <Image src="/images/admin-panel.svg" alt="Claim Icon" boxSize="60px" mb={1} />
                        <Text fontSize="xs">Token Details</Text>
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
                        <Image src="/images/doge.svg" alt="Claim Icon" boxSize="60px" mb={1} />
                        <Text fontSize="xs">NFT Stake</Text>
                      </Box>
                    </RouterLink>
                    <RouterLink to="/intromint" style={{ textDecoration: 'none' }}>
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
                        <Image src="/images/mining.svg" alt="Claim Icon" boxSize="60px" mb={1} />
                        <Text fontSize="xs">Presale NFTs</Text>
                      </Box>
                    </RouterLink>
                  </Flex>
                </Box>
              </Box>




                            {/* Box above the right column - only visible on smaller screens */}
                            <Box
                              flex={1}
                              p={2}
                              bg="rgba(0, 0, 0, 0.85)"
                              textAlign="center"
                              color="white"
                              display={{ base: 'block', md: 'none' }} // Visible only on smaller screens
                              position="fixed"
                              bottom={0} // Fixed at the bottom of the viewport
                              left={0}
                              right={0}
                              zIndex={10} // Ensures it stays above other elements
                            >
                              <Flex
                                justifyContent="space-between"
                                p={1}
                                gap={2}
                                flexWrap="nowrap"
                              >
                                <RouterLink to="/" style={{ textDecoration: 'none', flex: '1' }}>
                                  <Box
                                    p={1}
                                    bg="rgba(251, 164, 30, 0.8)"
                                    borderRadius="md"
                                    _hover={{ bg: "rgba(251, 164, 30, 1)" }}
                                    textAlign="center"
                                    color="white"
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    width="100%"
                                    cursor="pointer"
                                  >
                                    <Image src="/images/direct-marketing.svg" alt="Claim Icon" boxSize="20px" mb={1} />
                                    <Text fontSize="x-small">Presale</Text>
                                  </Box>
                                </RouterLink>
                                <RouterLink to="/token" style={{ textDecoration: 'none', flex: '1' }}>
                                  <Box
                                    p={1}
                                    bg="rgba(251, 164, 30, 0.8)"
                                    borderRadius="md"
                                    _hover={{ bg: "rgba(251, 164, 30, 1)" }}
                                    textAlign="center"
                                    color="white"
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    width="100%"
                                    cursor="pointer"
                                  >
                                    <Image src="/images/admin-panel.svg" alt="Claim Icon" boxSize="20px" mb={1} />
                                    <Text fontSize="x-small">Token</Text>
                                  </Box>
                                </RouterLink>
                                <RouterLink to="/stake" style={{ textDecoration: 'none', flex: '1' }}>
                                  <Box
                                    p={1}
                                    bg="rgba(251, 164, 30, 0.8)"
                                    borderRadius="md"
                                    _hover={{ bg: "rgba(251, 164, 30, 1)" }}
                                    textAlign="center"
                                    color="white"
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    width="100%"
                                    cursor="pointer"
                                  >
                                    <Image src="/images/doge.svg" alt="Claim Icon" boxSize="20px" mb={1} />
                                    <Text fontSize="x-small">NFT Stake</Text>
                                  </Box>
                                </RouterLink>
                                <RouterLink to="/intromint" style={{ textDecoration: 'none', flex: '1' }}>
                                  <Box
                                    p={1}
                                    bg="rgba(251, 164, 30, 0.8)"
                                    borderRadius="md"
                                    _hover={{ bg: "rgba(251, 164, 30, 1)" }}
                                    textAlign="center"
                                    color="white"
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    width="100%"
                                    cursor="pointer"
                                  >
                                    <Image src="/images/mining.svg" alt="Claim Icon" boxSize="20px" mb={1} />
                                    <Text fontSize="x-small">Mint</Text>
                                  </Box>
                                </RouterLink>
                              </Flex>
                            </Box>


              {/* Right column - Always visible */}
              <Box
                flex={1}
                m={2}
                maxW="480px"
                bg="rgba(0, 0, 0, 0.75)"
                borderRadius="2xl"
                boxShadow="md"
                textAlign="center"
                border="2px"
                borderColor="#fff"
              >
                <Stake />
              </Box>
            </Flex>

            {/* Presale message box - Always visible */}
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
