import React from 'react';
import { ImageBackground } from 'react-native';

export default function FullBG({ children }: { children?: React.ReactNode }) {
  return (
    <ImageBackground
      source={require('../assets/background.png')} 
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}
