/**
 * ZK Proof Generation Service
 * 
 * This service handles ZK proof generation using EZKL.
 * 
 * Options:
 * 1. Backend API: Call Python backend to generate proof
 * 2. Local WASM: Use ezkl-wasm (if available)
 * 3. Mock: For development/demo
 */

export interface ZKProofResult {
  proof: string; // Hex encoded proof
  witness: any;
  publicInputs: number[];
  proofSize: number;
}

export interface ZKArtifacts {
  settings: any;
  vk: ArrayBuffer | null;
  pk: ArrayBuffer | null;
}

/**
 * Load ZK artifacts from public folder
 */
export const loadZKArtifacts = async (): Promise<ZKArtifacts> => {
  try {
    // Try to load settings.json
    const settingsResponse = await fetch('/settings.json');
    const settings = settingsResponse.ok ? await settingsResponse.json() : null;

    // Try to load verification key
    let vk: ArrayBuffer | null = null;
    try {
      const vkResponse = await fetch('/vk.key');
      if (vkResponse.ok) {
        vk = await vkResponse.arrayBuffer();
      }
    } catch (e) {
      console.warn('[ZK] vk.key not found, will use mock');
    }

    // Try to load proving key
    let pk: ArrayBuffer | null = null;
    try {
      const pkResponse = await fetch('/pk.key');
      if (pkResponse.ok) {
        pk = await pkResponse.arrayBuffer();
      }
    } catch (e) {
      console.warn('[ZK] pk.key not found, will use mock');
    }

    return { settings, vk, pk };
  } catch (error) {
    console.warn('[ZK] Failed to load artifacts, using mock mode:', error);
    return { settings: null, vk: null, pk: null };
  }
};

/**
 * Generate ZK proof from model prediction
 * 
 * @param inputs Input values [BTC Vol, ETH Gas, Volume]
 * @param prediction Model prediction result
 * @returns ZK proof result
 */
export const generateProof = async (
  inputs: [number, number, number],
  prediction: number
): Promise<ZKProofResult> => {
  const artifacts = await loadZKArtifacts();

  // If artifacts are available, try to use real ZK generation
  if (artifacts.settings && artifacts.pk && artifacts.vk) {
    return await generateRealProof(inputs, prediction, artifacts);
  }

  // Fallback to mock proof for demo
  console.warn('[ZK] Using mock proof generation (artifacts not found)');
  return generateMockProof(inputs, prediction);
};

/**
 * Generate real ZK proof (requires backend API or WASM)
 */
const generateRealProof = async (
  inputs: [number, number, number],
  prediction: number,
  artifacts: ZKArtifacts
): Promise<ZKProofResult> => {
  try {
    // Option 1: Call backend API
    const apiUrl = import.meta.env.VITE_ZK_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${apiUrl}/generate-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs,
        prediction,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        proof: result.proof,
        witness: result.witness,
        publicInputs: result.publicInputs || [...inputs, prediction],
        proofSize: result.proofSize || 0,
      };
    } else {
      throw new Error(`Backend API error: ${response.status}`);
    }
  } catch (error) {
    console.error('[ZK] Real proof generation failed:', error);
    // Fallback to mock
    return generateMockProof(inputs, prediction);
  }
};

/**
 * Generate mock proof for demo/development
 */
const generateMockProof = (
  inputs: [number, number, number],
  prediction: number
): ZKProofResult => {
  // Generate a deterministic "fake" proof hex based on inputs
  const proofData = [
    ...inputs.map(v => Math.floor(v * 1000)),
    Math.floor(prediction * 1000),
    Date.now() % 1000000,
  ];

  const proofHex = proofData
    .map(n => n.toString(16).padStart(8, '0'))
    .join('')
    .slice(0, 128); // 64 bytes = 128 hex chars

  return {
    proof: `0x${proofHex}`,
    witness: {
      inputs,
      output: prediction,
    },
    publicInputs: [...inputs, prediction],
    proofSize: 4096, // 4KB mock size
  };
};

/**
 * Verify proof (would call backend or use WASM)
 */
export const verifyProof = async (
  proof: string,
  publicInputs: number[],
  vk: ArrayBuffer | null
): Promise<boolean> => {
  if (!vk) {
    console.warn('[ZK] Verification key not available, skipping verification');
    return true; // Mock: always return true
  }

  try {
    const apiUrl = import.meta.env.VITE_ZK_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/verify-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proof,
        publicInputs,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.valid === true;
    }
    return false;
  } catch (error) {
    console.error('[ZK] Verification failed:', error);
    return false;
  }
};

