const forecaster = require('./src/utils/demandForecasting');

async function test() {
    console.log('Testing Demand Forecaster initialization...');
    try {
        await forecaster.init();
        console.log('Initialization successful!');
        
        const testItems = [
            { medicine_id: 'test-1', medicine_name: 'Test Med', past_month_sales: 100, price: 50, stock_level: 200, seasonality_index: 1.0, promotion_active: 0 }
        ];
        
        console.log('Testing prediction...');
        const results = await forecaster.predict(testItems);
        console.log('Prediction results:', JSON.stringify(results, null, 2));
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
