const nock = require('nock');

const mlService = require('./mlService');

describe('mlService', () => {
    beforeEach(() => {
        process.env.ML_SERVER_URL = 'http://127.0.0.1:8000';
        process.env.ML_TIMEOUT_MS = '2000';
    });

    afterEach(() => {
        nock.cleanAll();
        delete process.env.ML_SERVER_URL;
        delete process.env.ML_TIMEOUT_MS;
    });

    test('predict() returns PredictResponse shape on 200', async () => {
        nock('http://127.0.0.1:8000')
            .post('/predict')
            .reply(200, {
                delay_risk_label: 'Medium',
                delay_risk_class: 2,
                probabilities: { High: 0.1, Low: 0.1, Medium: 0.8 },
                is_high_risk: false,
                confidence: 0.8,
            });

        const res = await mlService.predict({
            Job_Type: 'Brochures',
            Quantity: 500,
            Color_Type: 'Full Color',
            Material_Type: 'Glossy Paper',
            Order_Request_Date: '2025-04-01',
            Requested_Deadline_Date: '2025-04-04',
            Assigned_Date: '2025-04-02',
            Estimated_End_Date: '2025-04-05',
            Current_Queued_Jobs_Count: 80,
            Active_Machines_Count: 4,
            Total_Machines_Count: 6,
            Available_Staff_Count: 3,
            Total_Staff_Count: 8,
            Priority: 'Urgent',
            Assigned_Machine_Workload: 85,
            Assigned_Operator_Workload: 90,
        });

        expect(res).toHaveProperty('delay_risk_label');
        expect(res).toHaveProperty('delay_risk_class');
        expect(res).toHaveProperty('probabilities');
        expect(res).toHaveProperty('is_high_risk');
        expect(res).toHaveProperty('confidence');
    });

    test('predict() throws descriptive error on 500', async () => {
        nock('http://127.0.0.1:8000').post('/predict').reply(500, { error: true });
        await expect(
            mlService.predict({
                Job_Type: 'Brochures',
                Quantity: 500,
                Color_Type: 'Full Color',
                Material_Type: 'Glossy Paper',
                Order_Request_Date: '2025-04-01',
                Requested_Deadline_Date: '2025-04-04',
                Assigned_Date: '2025-04-02',
                Estimated_End_Date: '2025-04-05',
                Current_Queued_Jobs_Count: 80,
                Active_Machines_Count: 4,
                Total_Machines_Count: 6,
                Available_Staff_Count: 3,
                Total_Staff_Count: 8,
                Priority: 'Urgent',
                Assigned_Machine_Workload: 85,
                Assigned_Operator_Workload: 90,
            })
        ).rejects.toThrow('ML prediction failed');
    });

    test('predict() rejects with timeout error on slow response', async () => {
        process.env.ML_TIMEOUT_MS = '50';
        nock('http://127.0.0.1:8000').post('/predict').delay(1000).reply(200, {});
        await expect(
            mlService.predict({
                Job_Type: 'Brochures',
                Quantity: 500,
                Color_Type: 'Full Color',
                Material_Type: 'Glossy Paper',
                Order_Request_Date: '2025-04-01',
                Requested_Deadline_Date: '2025-04-04',
                Assigned_Date: '2025-04-02',
                Estimated_End_Date: '2025-04-05',
                Current_Queued_Jobs_Count: 80,
                Active_Machines_Count: 4,
                Total_Machines_Count: 6,
                Available_Staff_Count: 3,
                Total_Staff_Count: 8,
                Priority: 'Urgent',
                Assigned_Machine_Workload: 85,
                Assigned_Operator_Workload: 90,
            })
        ).rejects.toThrow('ML prediction failed');
    });

    test('checkModelHealth() returns true on 200', async () => {
        nock('http://127.0.0.1:8000').get('/health').reply(200, { ok: true });
        await expect(mlService.checkModelHealth()).resolves.toBe(true);
    });

    test('checkModelHealth() returns false on connection refused', async () => {
        nock('http://127.0.0.1:8000').get('/health').replyWithError('ECONNREFUSED');
        await expect(mlService.checkModelHealth()).resolves.toBe(false);
    });
});

