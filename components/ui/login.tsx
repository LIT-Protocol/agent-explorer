import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Wallet, ChevronDown } from "lucide-react"

const WalletConnect = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [account, setAccount] = useState('');
  
  const connectMetaMask = async () => {
    try {
      const mockAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      setAccount(mockAddress);
      setIsOpen(false);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  const connectWalletConnect = async () => {
    try {
      const mockAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      setAccount(mockAddress);
      setIsOpen(false);
    } catch (error) {
      console.error("Error connecting to WalletConnect:", error);
    }
  };

  const connectCoinbase = async () => {
    try {
      const mockAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      setAccount(mockAddress);
      setIsOpen(false);
    } catch (error) {
      console.error("Error connecting to Coinbase:", error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const disconnectWallet = () => {
    setAccount('');
  };

  return (
    <div className="relative">
      <Button 
        onClick={() => setIsOpen(true)}
        variant={account ? "outline" : "default"}
        className="flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        {account ? formatAddress(account) : "Connect Wallet"}
        {account && <ChevronDown className="w-4 h-4" />}
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              Choose your preferred wallet connection method
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex flex-col gap-3 my-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={connectMetaMask}
            >
              <img src="/api/placeholder/24/24" alt="MetaMask" className="mr-2" />
              MetaMask
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={connectWalletConnect}
            >
              <img src="/api/placeholder/24/24" alt="WalletConnect" className="mr-2" />
              WalletConnect
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={connectCoinbase}
            >
              <img src="/api/placeholder/24/24" alt="Coinbase" className="mr-2" />
              Coinbase Wallet
            </Button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {account && (
        <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl border border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start px-4"
            onClick={disconnectWallet}
          >
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;