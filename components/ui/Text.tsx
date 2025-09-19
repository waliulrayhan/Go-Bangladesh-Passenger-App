import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { TYPOGRAPHY } from '../../utils/fonts';

type TypographyVariant = keyof typeof TYPOGRAPHY;

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
}

export const Text: React.FC<TextProps> = ({ 
  variant = 'body', 
  color, 
  style, 
  children, 
  ...props 
}) => {
  const typographyStyle = TYPOGRAPHY[variant];
  
  return (
    <RNText 
      style={[
        typographyStyle,
        color && { color },
        style
      ]} 
      {...props}
    >
      {children}
    </RNText>
  );
};

