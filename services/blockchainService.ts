import { ethers } from 'ethers';

// Monad Testnet Configuration
const MONAD_TESTNET = {
  chainId: 10143,
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  name: 'Monad Testnet',
};

// Contract ABIs (simplified for demo)
const VERIFIER_ABI = [
  'function verify(uint256[] calldata instances, bytes calldata proof) external pure returns (bool)',
];

const PRICE_GUARD_ABI = [
  'function verifyPrediction(uint256[] calldata instances, bytes calldata proof) public returns (bool)',
  'event PredictionVerified(address indexed prover, uint256[] inputs, uint256[] output, uint256 timestamp)',
];

export interface ContractAddresses {
  verifier?: string;
  monadPriceGuard?: string;
}

/**
 * Initialize provider for Monad Testnet
 */
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(MONAD_TESTNET.rpcUrl);
}

/**
 * Get signer from browser wallet (MetaMask, etc.)
 */
export async function getSigner(): Promise<ethers.BrowserProvider> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // Request account access
  await provider.send('eth_requestAccounts', []);
  
  return provider;
}

/**
 * Switch to Monad Testnet if not already connected
 */
export async function switchToMonadTestnet(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${MONAD_TESTNET.chainId.toString(16)}` }],
    });
    return true;
  } catch (switchError: any) {
    // Chain doesn't exist, try to add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${MONAD_TESTNET.chainId.toString(16)}`,
              chainName: MONAD_TESTNET.name,
              rpcUrls: [MONAD_TESTNET.rpcUrl],
              nativeCurrency: {
                name: 'MON',
                symbol: 'MON',
                decimals: 18,
              },
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Monad Testnet:', addError);
        return false;
      }
    }
    console.error('Failed to switch to Monad Testnet:', switchError);
    return false;
  }
}

/**
 * Load contract addresses from environment variables or file
 * Priority: 1. Environment variables (Vercel), 2. JSON file, 3. Empty object
 */
export async function loadContractAddresses(): Promise<ContractAddresses> {
  // First, try environment variables (standard for Vercel deployments)
  // Note: Vite only exposes variables prefixed with VITE_ to client-side code
  const envVerifier = import.meta.env.VITE_VERIFIER_ADDRESS;
  const envPriceGuard = import.meta.env.VITE_MONAD_PRICE_GUARD_ADDRESS;
  
  if (envVerifier || envPriceGuard) {
    console.log('[Blockchain] Using contract addresses from environment variables');
    return {
      verifier: envVerifier,
      monadPriceGuard: envPriceGuard,
    };
  }
  
  // Fallback to JSON file
  try {
    const response = await fetch('/contract-addresses.json');
    if (response.ok) {
      const data = await response.json();
      
      // If the JSON has network-specific addresses, use monadTestnet
      if (data.monadTestnet) {
        console.log('[Blockchain] Using Monad Testnet addresses from JSON');
        return {
          verifier: data.monadTestnet.verifier,
          monadPriceGuard: data.monadTestnet.monadPriceGuard,
        };
      }
      
      // Otherwise, use root-level addresses (backward compatibility)
      if (data.verifier || data.monadPriceGuard) {
        console.log('[Blockchain] Using root-level addresses from JSON');
        return {
          verifier: data.verifier,
          monadPriceGuard: data.monadPriceGuard,
        };
      }
    }
  } catch (error) {
    console.warn('[Blockchain] Could not load contract-addresses.json:', error);
  }
  
  // Return empty - contracts need to be deployed first
  console.warn('[Blockchain] No contract addresses found. Using mock transactions.');
  return {};
}

/**
 * Get Verifier contract instance
 */
export async function getVerifierContract(address: string): Promise<ethers.Contract> {
  const provider = getProvider();
  return new ethers.Contract(address, VERIFIER_ABI, provider);
}

/**
 * Get MonadPriceGuard contract instance
 */
export async function getPriceGuardContract(
  address: string,
  signer?: ethers.Signer
): Promise<ethers.Contract> {
  const provider = signer ? signer : getProvider();
  return new ethers.Contract(address, PRICE_GUARD_ABI, provider);
}

/**
 * Verify prediction on blockchain
 */
export async function verifyPredictionOnChain(
  contractAddress: string,
  instances: number[],
  proof: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Get signer
    const provider = await getSigner();
    const signer = await provider.getSigner();
    
    // Switch to Monad Testnet
    await switchToMonadTestnet();
    
    // Get contract
    const contract = await getPriceGuardContract(contractAddress, signer);
    
    // Convert proof hex to bytes
    const proofBytes = ethers.getBytes(proof);
    
    // Convert instances to BigInt array
    const instancesBigInt = instances.map(i => BigInt(Math.floor(i * 1e18))); // Scale to 18 decimals
    
    // Estimate gas
    const gasEstimate = await contract.verifyPrediction.estimateGas(instancesBigInt, proofBytes);
    
    // Send transaction
    const tx = await contract.verifyPrediction(instancesBigInt, proofBytes, {
      gasLimit: gasEstimate * BigInt(2), // Add buffer
    });
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (error: any) {
    console.error('Verification failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Check if wallet is connected
 */
export async function isWalletConnected(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get connected wallet address
 */
export async function getWalletAddress(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const provider = await getSigner();
    const signer = await provider.getSigner();
    return await signer.getAddress();
  } catch {
    return null;
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

