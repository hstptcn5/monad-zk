# EZKL ZK-Proof Generation

Thư mục này chứa scripts để generate ZK proofs từ ONNX model.

## Setup

1. **Cài đặt EZKL**:
```bash
# Sử dụng python -m pip để đảm bảo cài vào đúng Python version
python -m pip install ezkl

# Hoặc nếu có nhiều Python versions:
python3 -m pip install ezkl

# Nếu PyPI không hoạt động, thử GitHub:
python -m pip install git+https://github.com/zkonduit/ezkl.git
```

2. **Cài đặt các dependencies khác**:
```bash
python -m pip install -r requirements.txt
```

3. **Kiểm tra cài đặt**:
```bash
python -c "import ezkl; print('EZKL version:', ezkl.__version__)"
```

4. **Đảm bảo file `network.onnx` đã có trong `../public/network.onnx`**

## Usage

### Generate proof với input mặc định:
```bash
python generate_proof.py
```

### Generate proof với input tùy chỉnh:
```bash
python generate_proof.py 0.45 24 1.2
```

## Output Files

Sau khi chạy, các file sau sẽ được tạo:
- `settings.json` - EZKL settings
- `network.ezkl` - Compiled circuit
- `pk.key` - Proving key
- `vk.key` - Verification key
- `witness.json` - Witness data
- `proof.json` - ZK proof
- `contracts/Verifier.sol` - Solidity verifier contract

## Next Steps

Sau khi generate xong, copy các file vào `public/` để frontend có thể load:
- `pk.key` → `public/pk.key`
- `vk.key` → `public/vk.key`
- `settings.json` → `public/settings.json`
- `network.ezkl` → `public/network.ezkl`

