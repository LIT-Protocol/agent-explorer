"use client"

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, Theme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
// import { polygonAmoy } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import * as React from "react";
import { Chain } from 'wagmi/chains';

const customTheme: Theme = {
    blurs: {
      modalOverlay: 'blur(8px)',
    },
    colors: {
      accentColor: '#000000', // Bright purple
      accentColorForeground: '#FFFFFF',
      actionButtonBorder: 'none',
      actionButtonBorderMobile: 'none',
      actionButtonSecondaryBackground: '#7C3AED', // Slightly darker purple
      closeButton: '#FFFFFF',
      closeButtonBackground: 'rgba(0, 0, 0, 0.1)',
      connectButtonBackground: '#7C3AED', // Main purple color from image
      connectButtonBackgroundError: '#FF494A',
      connectButtonInnerBackground: '#7C3AED',
      connectButtonText: '#FFFFFF',
      connectButtonTextError: '#FFFFFF',
      connectionIndicator: '#1BB517',
      downloadBottomCardBackground: '#1E1E1E',
      downloadTopCardBackground: '#1E1E1E',
      error: '#FF494A',
      generalBorder: 'transparent',
      generalBorderDim: 'transparent',
      menuItemBackground: '#1E1E1E',
      modalBackdrop: 'rgba(0, 0, 0, 0.5)',
      modalBackground: '#1E1E1E',
      modalBorder: 'transparent',
      modalText: '#FFFFFF',
      modalTextDim: '#7E7E7E',
      modalTextSecondary: '#A9A9A9',
      profileAction: 'rgba(124, 58, 237, 0.1)', // Transparent purple
      profileActionHover: 'rgba(124, 58, 237, 0.2)',
      profileForeground: '#1E1E1E',
      selectedOptionBorder: 'rgba(124, 58, 237, 0.1)',
      standby: '#FFD641',
    },
    fonts: {
      body: 'Inter, sans-serif',
    },
    radii: {
      actionButton: '12px',
      connectButton: '6px',
      menuButton: '12px',
      modal: '16px',
      modalMobile: '16px',
    },
    shadows: {
      connectButton: 'none',
      dialog: '0px 4px 24px rgba(0, 0, 0, 0.25)',
      profileDetailsAction: 'none',
      selectedOption: '0px 2px 6px rgba(0, 0, 0, 0.15)',
      selectedWallet: '0px 2px 6px rgba(0, 0, 0, 0.15)',
      walletLogo: '0px 2px 16px rgba(0, 0, 0, 0.16)',
    },
  };

const chronicleYellowstone: Chain = {
  id: 175188,
  name: 'Chronicle Yellowstone',
  nativeCurrency: {
    decimals: 18,
    name: 'tstLPX',
    symbol: 'tstLPX',
  },
  rpcUrls: {
    default: { 
      http: ['https://yellowstone-rpc.litprotocol.com']
    },
    public: {
      http: ['https://yellowstone-rpc.litprotocol.com']
    }
  },
};

const config = getDefaultConfig({
    appName: "My RainbowKit App",
    projectId: "95f8ce26a83baf6d9b6db95a07e082a1",
    chains: [chronicleYellowstone],
    ssr: false, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={customTheme}>{mounted && children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}