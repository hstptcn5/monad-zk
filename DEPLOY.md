# Hướng Dẫn Deploy Contracts Lên Monad Testnet

## Cấu Trúc Project

```
monad-zk-priceguard/          ← Thư mục gốc (deploy từ đây)
├── contracts/                ← Smart contracts
│   ├── Verifier.sol
│   └── MonadPriceGuard.sol
├── scripts/
│   └── deploy.js             ← Deploy script
├── hardhat.config.js         ← Hardhat config
└── package.json
```

## Các Bước Deploy

### 1. Chuẩn Bị

Đảm bảo bạn đang ở **thư mục gốc** của project:

```bash
cd D:\build\monad-zk-priceguard
```

### 2. Cài Đặt Dependencies (nếu chưa có)

```bash
npm install
```

### 3. Compile Contracts (kiểm tra trước khi deploy)

```bash
npm run compile
# hoặc
npx hardhat compile
```

### 4. Deploy Lên Monad Testnet

**Option A: Deploy với Private Key (từ file .env)**

Tạo file `.env` ở thư mục gốc:
```
PRIVATE_KEY=your_private_key_here
```

Sau đó chạy:
```bash
npm run deploy
```

**Option B: Deploy với Private Key trực tiếp (không khuyến khích)**

```bash
PRIVATE_KEY=your_private_key_here npm run deploy
```

**Option C: Deploy localhost (test local)**

Trước tiên cần start local Hardhat node:
```bash
npx hardhat node
```

Sau đó deploy:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 5. Lưu Contract Addresses

Sau khi deploy thành công, script sẽ tự động tạo file `contract-addresses.json` ở thư mục gốc:

```json
{
  "verifier": "0x...",
  "monadPriceGuard": "0x...",
  "network": "monadTestnet",
  "chainId": 10143
}
```

**Quan trọng**: Copy file này vào `public/contract-addresses.json` để frontend có thể load:

```bash
# Windows PowerShell
Copy-Item contract-addresses.json public/contract-addresses.json

# Linux/Mac
cp contract-addresses.json public/contract-addresses.json
```

### 6. Test Frontend

Sau khi có `public/contract-addresses.json`, frontend sẽ tự động:
- Load contract addresses khi khởi động
- Hiển thị contract address trong logs
- Gửi real transactions khi wallet connected

## Lưu Ý

- ⚠️ **Bảo mật**: Không commit file `.env` hoặc `contract-addresses.json` có private key
- ✅ **Testnet**: Monad Testnet RPC: `https://testnet-rpc.monad.xyz`
- ✅ **Chain ID**: 10143
- ✅ **Gas**: Monad có gas rất rẻ, không cần lo về gas fees

## Troubleshooting

**Lỗi: "No Hardhat config file found"**
- Đảm bảo bạn đang ở thư mục gốc
- Kiểm tra file `hardhat.config.js` có tồn tại

**Lỗi: "Insufficient funds"**
- Cần có testnet tokens trong wallet
- Request testnet tokens từ Monad faucet (nếu có)

**Lỗi: "Network not found"**
- Kiểm tra `hardhat.config.js` có network `monadTestnet`
- Kiểm tra RPC URL có đúng không

