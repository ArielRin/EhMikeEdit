import React from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { PriceProvider } from './PriceContext';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        margin: 0,
        fontFamily: 'Arial, sans-serif',
      },
    },
  },
});

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <PriceProvider>
          <App />
        </PriceProvider>
      </ChakraProvider>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}
