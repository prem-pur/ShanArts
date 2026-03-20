const axios = require('axios');
const config = require('../config/env');

const aiService = {
    async predictDelay(features) {
        try {
            const response = await axios.post(`${config.AI_SERVICE_URL}/predict/delay`, features, {
                timeout: 5000,
            });
            return response.data;
        } catch (error) {
            console.error('Error calling AI service:', error.message);
            // Fallback rule-based detection
            return this.fallbackRiskDetection(features);
        }
    },

    fallbackRiskDetection(features) {
        // Rule-based fallback: if time to deadline < estimated duration * 1.2, flag as at_risk
        if (features.hours_to_deadline < (features.estimated_duration_min / 60) * 1.2) {
            return {
                risk_score: 0.7,
                risk_label: 'at_risk',
                confidence: 0.5,
                fallback: true,
            };
        }
        return {
            risk_score: 0.2,
            risk_label: 'on_time',
            confidence: 0.5,
            fallback: true,
        };
    },

    async checkModelStatus() {
        try {
            const response = await axios.get(`${config.AI_SERVICE_URL}/model/status`, {
                timeout: 3000,
            });
            return response.data;
        } catch (error) {
            console.error('AI service status check failed:', error.message);
            return { status: 'offline', message: 'AI service is not available' };
        }
    },
};

module.exports = aiService;
