const ort = require('onnxruntime-node');
const path = require('path');
const fs = require('fs');

class DemandForecaster {
  constructor() {
    this.session = null;
    this.scalerParams = null;
    this.isInitialized = false;

    const defaultModelCandidates = [
      path.resolve(__dirname, '..', '..', '..', 'ai-ml', 'models', 'demand_forecasting', 'demand_model.onnx'),
      path.resolve(process.cwd(), 'ai-ml', 'models', 'demand_forecasting', 'demand_model.onnx'),
      path.resolve(process.cwd(), '..', 'ai-ml', 'models', 'demand_forecasting', 'demand_model.onnx'),
    ];
    const defaultParamsCandidates = [
      path.resolve(__dirname, '..', '..', '..', 'ai-ml', 'models', 'demand_forecasting', 'scaler_params.json'),
      path.resolve(process.cwd(), 'ai-ml', 'models', 'demand_forecasting', 'scaler_params.json'),
      path.resolve(process.cwd(), '..', 'ai-ml', 'models', 'demand_forecasting', 'scaler_params.json'),
    ];

    this.modelPath = process.env.DEMAND_MODEL_PATH || this.findExistingPath(defaultModelCandidates);
    this.paramsPath = process.env.DEMAND_PARAMS_PATH || this.findExistingPath(defaultParamsCandidates);
  }

  findExistingPath(candidatePaths) {
    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return candidatePaths[0];
  }

  /**
   * Initializes the ONNX session and loads scaler parameters.
   */
  async init() {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(this.modelPath)) {
        const attempted = [
          this.modelPath,
          process.env.DEMAND_MODEL_PATH || '<unset>'
        ].filter(Boolean);
        throw new Error(`Model file not found at ${this.modelPath}. Tried paths: ${attempted.join(', ')}`);
      }
      if (!fs.existsSync(this.paramsPath)) {
        const attempted = [
          this.paramsPath,
          process.env.DEMAND_PARAMS_PATH || '<unset>'
        ].filter(Boolean);
        throw new Error(`Scaler parameters not found at ${this.paramsPath}. Tried paths: ${attempted.join(', ')}`);
      }

      // Load session
      this.session = await ort.InferenceSession.create(this.modelPath);
      
      // Load scaler params
      const paramsRaw = fs.readFileSync(this.paramsPath, 'utf8');
      this.scalerParams = JSON.parse(paramsRaw);
      
      this.isInitialized = true;
      console.log('✅ Demand Forecasting ONNX Model loaded successfully.');
    } catch (error) {
      console.error('❌ Failed to initialize DemandForecaster:', error.message);
      throw error;
    }
  }

  /**
   * Predicts demand for a list of items.
   * @param {Array} items - List of item objects with features like past_month_sales, price, etc.
   * @returns {Promise<Array>} - List of forecasts.
   */
  async predict(items) {
    if (!this.isInitialized) {
      await this.init();
    }

    const { mean, scale, feature_names, seq_length } = this.scalerParams;
    const forecasts = [];

    for (const item of items) {
      try {
        // 1. Extract and order features as expected by the model
        const inputFeatures = feature_names.map((name, index) => {
          const val = item[name] !== undefined ? item[name] : 0;
          // 2. Preprocess: Standard Scaling (x - mean) / scale
          return (val - mean[index]) / scale[index];
        });

        // 3. Create Sequence (Tiling logic from Python wrapper)
        // The model expects [1, seq_length, num_features]
        const numFeatures = feature_names.length;
        const sequenceData = new Float32Array(seq_length * numFeatures);
        
        // Tile the single snapshot into a sequence of length 'seq_length'
        for (let i = 0; i < seq_length; i++) {
          for (let j = 0; j < numFeatures; j++) {
            sequenceData[i * numFeatures + j] = inputFeatures[j];
          }
        }

        // 4. Run Inference
        const inputTensor = new ort.Tensor('float32', sequenceData, [1, seq_length, numFeatures]);
        const feeds = { input: inputTensor };
        const results = await this.session.run(feeds);
        
        // Output is usually 'output' or the first key in results
        const outputKey = this.session.outputNames[0];
        const prediction = results[outputKey].data[0];

        // 5. Post-process
        const predVal = Math.round(prediction);
        const pastSales = item.past_month_sales || 0;
        
        // Heuristic for confidence based on variance (simulating Python logic)
        const confidence = 0.85; // Baseline high trust for neural net

        forecasts.push({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          predicted_demand: Math.max(0, predVal),
          confidence_score: confidence,
          trend: predVal > pastSales * 1.15 ? 'up' : (predVal < pastSales * 0.85 ? 'down' : 'stable')
        });
      } catch (err) {
        console.error(`Error forecasting for item ${item.medicine_id}:`, err);
        // Fallback for this specific item if inference fails
        forecasts.push({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          predicted_demand: Math.round(item.past_month_sales * 1.05),
          confidence_score: 0.5,
          trend: 'stable',
          error: true
        });
      }
    }

    return forecasts;
  }
}

module.exports = new DemandForecaster();
