import hre from "hardhat";
import { JsonRpcProvider, Wallet, ContractFactory, formatEther } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting deployment script...");

  // 1. Setup Configuration
  // Determine network
  let networkName = "monadTestnet"; // default
  const networkIndex = process.argv.indexOf("--network");
  if (networkIndex !== -1 && process.argv[networkIndex + 1]) {
    networkName = process.argv[networkIndex + 1];
  }
  console.log(`ℹ️  Target Network: ${networkName}`);

  // Get RPC URL (hardcoded to avoid Hardhat's internal URL wrapper issues)
  let rpcUrl;
  let chainId;
  if (networkName === "localhost") {
    rpcUrl = "http://127.0.0.1:8545";
    chainId = 31337;
  } else if (networkName === "sepolia") {
    rpcUrl = process.env.SEPOLIA_RPC_URL || 
             (process.env.INFURA_API_KEY ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` : "https://rpc.sepolia.org");
    chainId = 11155111;
  } else {
    // monadTestnet
    rpcUrl = "https://testnet-rpc.monad.xyz";
    chainId = 10143;
  }
  console.log(`ℹ️  RPC URL: ${rpcUrl}`);

  // Get private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ PRIVATE_KEY not found in .env file.");
  }

  // 2. Initialize Provider & Wallet
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  console.log(`👤 Deployer Address: ${wallet.address}`);

  try {
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Balance: ${formatEther(balance)} ETH`);
  } catch (e) {
    console.log(`⚠️  Could not fetch balance: ${e.message}`);
  }

  // 3. Deploy Verifier
  console.log("\n📝 Deploying Verifier...");
  const VerifierArtifact = await hre.artifacts.readArtifact("Verifier");
  const VerifierFactory = new ContractFactory(
    VerifierArtifact.abi,
    VerifierArtifact.bytecode,
    wallet
  );
  
  const verifier = await VerifierFactory.deploy();
  console.log("⏳ Waiting for deployment...");
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`✅ Verifier deployed at: ${verifierAddress}`);

  // 4. Deploy MonadPriceGuard
  console.log("\n📝 Deploying MonadPriceGuard...");
  const PriceGuardArtifact = await hre.artifacts.readArtifact("MonadPriceGuard");
  const PriceGuardFactory = new ContractFactory(
    PriceGuardArtifact.abi,
    PriceGuardArtifact.bytecode,
    wallet
  );

  const priceGuard = await PriceGuardFactory.deploy(verifierAddress);
  console.log("⏳ Waiting for deployment...");
  await priceGuard.waitForDeployment();
  const priceGuardAddress = await priceGuard.getAddress();
  console.log(`✅ MonadPriceGuard deployed at: ${priceGuardAddress}`);

  // 5. Save Artifacts
  console.log("\n💾 Saving artifacts...");
  
  // Load existing addresses if any
  const rootPath = path.join(__dirname, '..', 'contract-addresses.json');
  const publicDir = path.join(__dirname, '..', 'public');
  const publicPath = path.join(publicDir, 'contract-addresses.json');
  
  let allAddresses = {};
  
  // Try to load existing addresses
  if (fs.existsSync(publicPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
      // Handle both old format (flat) and new format (nested)
      if (existing.network) {
        // Old format - convert to new format
        allAddresses[existing.network] = {
          verifier: existing.verifier,
          monadPriceGuard: existing.monadPriceGuard,
          chainId: existing.chainId
        };
      } else {
        // New format - use as is
        allAddresses = existing;
      }
    } catch (e) {
      console.log(`   ⚠️  Could not load existing addresses: ${e.message}`);
    }
  }
  
  // Add/update current network addresses
  allAddresses[networkName] = {
    verifier: verifierAddress,
    monadPriceGuard: priceGuardAddress,
    chainId
  };
  
  // Also keep backward compatibility: if this is monadTestnet, add flat keys
  if (networkName === "monadTestnet") {
    allAddresses.verifier = verifierAddress;
    allAddresses.monadPriceGuard = priceGuardAddress;
    allAddresses.network = networkName;
    allAddresses.chainId = chainId;
  }

  // Save to root
  fs.writeFileSync(rootPath, JSON.stringify(allAddresses, null, 2));
  console.log(`   - Saved to: ${rootPath}`);

  // Save to public/
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(publicPath, JSON.stringify(allAddresses, null, 2));
  console.log(`   - Saved to: ${publicPath}`);
  
  console.log(`\n📋 Current contract addresses:`);
  Object.keys(allAddresses).forEach(key => {
    if (typeof allAddresses[key] === 'object' && allAddresses[key].chainId) {
      console.log(`   ${key}:`);
      console.log(`     Verifier: ${allAddresses[key].verifier}`);
      console.log(`     MonadPriceGuard: ${allAddresses[key].monadPriceGuard}`);
    }
  });

  console.log("\n🎉 Deployment Finished Successfully!");
}

main().catch((error) => {
  console.error("\n❌ Deployment Failed:");
  console.error(error);
  process.exitCode = 1;
});
