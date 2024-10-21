import React from 'react';
import { Text } from '@chakra-ui/react';

interface FormattedPriceProps {
  price: number;
  decimals?: number; // Number of significant decimals to display
}

const FormattedPrice: React.FC<FormattedPriceProps> = ({ price, decimals = 4 }) => {
  // Format the price with a sufficient number of decimals to capture precision
  const priceString = price.toFixed(18); // Adjust to show enough decimal places for precision

  // Split into the integer and decimal parts
  const [integerPart, decimalPart] = priceString.split('.');

  // Find leading zeros in the decimal part
  const leadingZerosMatch = decimalPart.match(/^0+/);
  const leadingZerosCount = leadingZerosMatch ? leadingZerosMatch[0].length : 0;

  // Get the significant part after the leading zeros
  const significantPart = decimalPart.slice(leadingZerosCount, leadingZerosCount + decimals);

  return (
    <Text>
      ${integerPart}.
      <span style={{ fontSize: '0.7em', verticalAlign: 'sub' }}>
        {leadingZerosCount > 0 ? leadingZerosCount : ''}
      </span>
      {significantPart}
    </Text>
  );
};

export default FormattedPrice;
