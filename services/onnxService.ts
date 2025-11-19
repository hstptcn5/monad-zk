import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;

/**
 * Load ONNX model from public folder
 */
export const loadModel = async (): Promise<ort.InferenceSession> => {
  if (session) {
    return session;
  }

  try {
    // Configure ONNX Runtime WASM paths (use CDN for WASM files)
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
    
    // Load model using fetch - Vite serves files from public/ at root
    // Try multiple paths in case of routing issues
    const possiblePaths = [
      '/network.onnx',
      './network.onnx',
      `${window.location.origin}/network.onnx`
    ];
    
    let modelData: Uint8Array | null = null;
    let lastError: Error | null = null;
    
    for (const path of possiblePaths) {
      try {
        console.log(`[ONNX] Trying to load from: ${path}`);
        const response = await fetch(path, {
          method: 'GET',
          headers: {
            'Accept': 'application/octet-stream, application/onnx, */*'
          },
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log(`[ONNX] Response content-type: ${contentType}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        
        // Check if it's HTML (common Vite routing issue)
        const firstBytes = Array.from(data.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ');
        console.log(`[ONNX] First bytes: ${firstBytes}`);
        
        if (firstBytes.startsWith('3c 21 44 4f') || firstBytes.startsWith('3c 68 74 6d') || firstBytes.startsWith('3c 68 74 6d 6c')) {
          console.warn(`[ONNX] Received HTML from ${path}, trying next path...`);
          continue;
        }
        
        if (data.length < 4) {
          throw new Error('File too small to be a valid ONNX model');
        }
        
        modelData = data;
        console.log(`[ONNX] Successfully loaded from ${path}, size: ${data.length} bytes`);
        break;
      } catch (err) {
        lastError = err as Error;
        console.warn(`[ONNX] Failed to load from ${path}:`, err);
        continue;
      }
    }
    
    if (!modelData) {
      throw new Error(`Failed to load model from all paths. Last error: ${lastError?.message || 'Unknown'}`);
    }
    
    // Create session from ArrayBuffer
    session = await ort.InferenceSession.create(modelData, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    
    console.log('[ONNX] Model loaded successfully');
    console.log('[ONNX] Input names:', session.inputNames);
    console.log('[ONNX] Output names:', session.outputNames);
    return session;
  } catch (error) {
    console.error('[ONNX] Error loading model:', error);
    throw new Error(`Failed to load ONNX model: ${error}`);
  }
};

/**
 * Run inference with ONNX model
 * @param inputs Array of 3 floats: [BTC Volatility, ETH Gas, Market Volume]
 * @returns Predicted price (float)
 */
export const runInference = async (inputs: [number, number, number]): Promise<number> => {
  try {
    const model = await loadModel();
    
    // Prepare input tensor: shape [1, 3]
    const inputTensor = new ort.Tensor('float32', new Float32Array(inputs), [1, 3]);
    
    // Run inference
    const feeds = { input: inputTensor };
    const results = await model.run(feeds);
    
    // Extract output (shape [1, 1])
    const output = results.output as ort.Tensor;
    const prediction = output.data[0] as number;
    
    console.log('[ONNX] Input:', inputs);
    console.log('[ONNX] Output:', prediction);
    
    return prediction;
  } catch (error) {
    console.error('[ONNX] Inference error:', error);
    throw new Error(`Inference failed: ${error}`);
  }
};

/**
 * Preload model (call this early to reduce latency)
 */
export const preloadModel = async (): Promise<void> => {
  try {
    await loadModel();
  } catch (error) {
    console.warn('[ONNX] Preload failed, will retry on first inference:', error);
  }
};

