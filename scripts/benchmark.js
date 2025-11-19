/**
 * Benchmark Script: Capture real metrics from Sepolia and Monad Testnet
 * 
 * This script:
 * 1. Deploys contracts on both networks (if not already deployed)
 * 2. Sends test transactions to verifyPrediction()
 * 3. Captures: gas used, confirmation time, gas cost (USD)
 * 4. Saves results to public/benchmark-data.json
 */

import hre from "hardhat";
import { JsonRpcProvider, Wallet, ContractFactory, formatEther, parseEther, Contract } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock proof data for testing (same as frontend uses)
const MOCK_PROOF = "0x" + "00".repeat(128); // 128 bytes mock proof
const MOCK_INSTANCES = [BigInt("1000000000000000000"), BigInt("2000000000000000000")]; // Scaled values

async function getGasPrice(provider) {
  try {
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || feeData.maxFeePerGas || BigInt(0);
  } catch (e) {
    console.warn(`⚠️  Could not fetch gas price: ${e.message}`);
    return BigInt(0);
  }
}

async function getEthPrice() {
  try {
    // Using CoinGecko API (free tier)
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
    const data = await response.json();
    return data.ethereum?.usd || 2000; // Fallback to $2000
  } catch (e) {
    console.warn(`⚠️  Could not fetch ETH price, using $2000: ${e.message}`);
    return 2000;
  }
}

async function benchmarkNetwork(networkName, rpcUrl, chainId, contractAddress) {
  console.log(`\n📊 Benchmarking ${networkName}...`);
  console.log(`   RPC: ${rpcUrl}`);
  console.log(`   Contract: ${contractAddress}`);

  const provider = new JsonRpcProvider(rpcUrl);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ PRIVATE_KEY not found in .env");
  }
  const wallet = new Wallet(privateKey, provider);

  // Get contract
  const PriceGuardArtifact = await hre.artifacts.readArtifact("MonadPriceGuard");
  const contract = new Contract(contractAddress, PriceGuardArtifact.abi, wallet);

  // Get gas price
  const gasPrice = await getGasPrice(provider);
  
  // Determine token type (ETH for Sepolia, MON for Monad)
  const isSepolia = chainId === 11155111;
  const tokenName = isSepolia ? "ETH" : "MON";
  
  // Only get ETH price for Sepolia (for USD conversion)
  let ethPrice = null;
  if (isSepolia) {
    ethPrice = await getEthPrice();
    console.log(`   Gas Price: ${formatEther(gasPrice)} ${tokenName}`);
    console.log(`   ETH Price: $${ethPrice}`);
  } else {
    console.log(`   Gas Price: ${formatEther(gasPrice)} ${tokenName}`);
    console.log(`   Note: MON price not available (testnet token)`);
  }

  // Send test transaction
  console.log(`   Sending test transaction...`);
  const startTime = Date.now();
  
  try {
    // Estimate gas
    const gasEstimate = await contract.verifyPrediction.estimateGas(MOCK_INSTANCES, MOCK_PROOF);
    console.log(`   Estimated Gas: ${gasEstimate.toString()}`);

    // Send transaction
    const tx = await contract.verifyPrediction(MOCK_INSTANCES, MOCK_PROOF, {
      gasLimit: gasEstimate * BigInt(2), // Buffer
    });
    
    console.log(`   TxHash: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    // Wait for confirmation
    const receipt = await tx.wait();
    const endTime = Date.now();
    const confirmationTime = (endTime - startTime) / 1000; // seconds

    // Calculate costs
    const gasUsed = receipt.gasUsed;
    // gasUsed and gasPrice are both in wei, multiply then convert to token
    const gasCostWei = gasUsed * gasPrice;
    const gasCostToken = Number(formatEther(gasCostWei));
    
    // Only calculate USD for Sepolia (ETH)
    let gasCostUsd = null;
    if (isSepolia && ethPrice) {
      gasCostUsd = gasCostToken * ethPrice;
    }

    console.log(`   ✅ Confirmed!`);
    console.log(`   Gas Used: ${gasUsed.toString()}`);
    console.log(`   Confirmation Time: ${confirmationTime.toFixed(2)}s`);
    if (isSepolia && gasCostUsd !== null) {
      console.log(`   Gas Cost: ${gasCostToken.toFixed(8)} ${tokenName} (~$${gasCostUsd.toFixed(4)})`);
    } else {
      console.log(`   Gas Cost: ${gasCostToken.toFixed(8)} ${tokenName}`);
    }

    return {
      network: networkName,
      chainId,
      contractAddress,
      txHash: receipt.hash,
      gasUsed: gasUsed.toString(),
      gasPrice: gasPrice.toString(),
      tokenName,
      gasCostToken: gasCostToken.toFixed(8),
      gasCostUsd: gasCostUsd !== null ? gasCostUsd.toFixed(4) : null,
      confirmationTime: confirmationTime.toFixed(2),
      ethPrice: ethPrice ? ethPrice.toString() : null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting Benchmark Script...");
  console.log("This will test both Sepolia and Monad Testnet\n");

  // Load contract addresses
  const addressesPath = path.join(__dirname, "..", "public", "contract-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error(`❌ Contract addresses not found at ${addressesPath}. Please deploy contracts first.`);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const results = [];

  // Benchmark Sepolia
  if (addresses.sepolia?.monadPriceGuard) {
    try {
      const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL || 
                            (process.env.INFURA_API_KEY ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` : "https://rpc.sepolia.org");
      const sepoliaResult = await benchmarkNetwork(
        "Ethereum (Sepolia)",
        sepoliaRpcUrl,
        11155111,
        addresses.sepolia.monadPriceGuard
      );
      results.push(sepoliaResult);
    } catch (e) {
      console.error(`❌ Sepolia benchmark failed: ${e.message}`);
    }
  } else {
    console.log("⚠️  Sepolia contract not found. Deploy first: npm run deploy -- --network sepolia");
  }

  // Benchmark Monad Testnet
  const monadAddress = addresses.monadTestnet?.monadPriceGuard || addresses.monadPriceGuard;
  if (monadAddress) {
    try {
      const monadResult = await benchmarkNetwork(
        "Monad Testnet",
        "https://testnet-rpc.monad.xyz",
        10143,
        monadAddress
      );
      results.push(monadResult);
    } catch (e) {
      console.error(`❌ Monad benchmark failed: ${e.message}`);
    }
  } else {
    console.log("⚠️  Monad contract not found. Deploy first: npm run deploy -- --network monadTestnet");
  }

  // Save results
  if (results.length > 0) {
    const benchmarkPath = path.join(__dirname, "..", "public", "benchmark-data.json");
    fs.writeFileSync(benchmarkPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Benchmark results saved to: ${benchmarkPath}`);

    // Print summary
    console.log("\n📈 Benchmark Summary:");
    console.log("=".repeat(60));
    results.forEach((r) => {
      console.log(`\n${r.network}:`);
      console.log(`  Gas Used: ${r.gasUsed}`);
      console.log(`  Confirmation Time: ${r.confirmationTime}s`);
      if (r.gasCostUsd) {
        console.log(`  Gas Cost: ${r.gasCostToken} ${r.tokenName} (~$${r.gasCostUsd})`);
      } else {
        console.log(`  Gas Cost: ${r.gasCostToken} ${r.tokenName} (testnet token)`);
      }
    });

    // Calculate improvements
    if (results.length === 2) {
      const sepolia = results.find((r) => r.network.includes("Sepolia"));
      const monad = results.find((r) => r.network.includes("Monad"));
      
      if (sepolia && monad) {
        const timeImprovement = (parseFloat(sepolia.confirmationTime) / parseFloat(monad.confirmationTime)).toFixed(1);
        
        console.log("\n🎯 Monad Improvements:");
        console.log(`  ${timeImprovement}x faster confirmation time`);
        
        // Note: Cannot compare costs directly (ETH vs MON are different tokens)
        console.log(`  ⚠️  Cost comparison: Sepolia uses ETH, Monad uses MON (different tokens)`);
        if (sepolia.gasCostUsd) {
          console.log(`     Sepolia: ${sepolia.gasCostToken} ETH (~$${sepolia.gasCostUsd})`);
        } else {
          console.log(`     Sepolia: ${sepolia.gasCostToken} ETH`);
        }
        console.log(`     Monad: ${monad.gasCostToken} MON (testnet token, price N/A)`);
        
        // Show gas efficiency (gas units comparison)
        const sepoliaGas = parseFloat(sepolia.gasUsed);
        const monadGas = parseFloat(monad.gasUsed);
        if (sepoliaGas > 0) {
          const gasEfficiency = ((sepoliaGas - monadGas) / sepoliaGas * 100).toFixed(1);
          if (monadGas < sepoliaGas) {
            console.log(`  ${Math.abs(gasEfficiency)}% less gas units used`);
          } else {
            console.log(`  ${Math.abs(gasEfficiency)}% more gas units used (but ${timeImprovement}x faster)`);
            console.log(`  Note: Monad's speed advantage makes higher gas units acceptable`);
          }
        }
      }
    }
  } else {
    console.log("\n⚠️  No benchmark results collected. Please deploy contracts first.");
  }
}

main().catch((error) => {
  console.error("\n❌ Benchmark Failed:");
  console.error(error);
  process.exitCode = 1;
});

