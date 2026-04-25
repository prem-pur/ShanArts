const nock = require('nock');
const mlService = require('./mlService');

describe('mlService', () => {
    beforeEach(() => {
        nock.cleanAll();
        process.env.ML_SERVER_URL = 'http://127.0.0.1:8000';
        process.env.ML_TIMEOUT_MS = '200';
    });

    test('predict returns parsed response on 200', async () => {
        nock('http://127.0.0.1:8000')
            .post('/predict')
            .reply(200, { delay_risk_label: 'Medium', delay_risk_class: 2, probabilities: { High: 0.1, Low: 0.1, Medium: 0.8 }, is_high_risk: false, confidence: 0.8 });

        const res = await mlService.predict({
            Order_Request_Date: '2024-03-01',
            Assigned_Date: '2024-03-04',
            Estimated_End_Date: '2024-03-11',
            Quantity: 10,
            Assigned_Machine_Workload: 20,
            Assigned_Operator_Workload: 30,
            Current_Queued_Jobs_Count: 1,
            Priority: 'Normal',
        });
        expect(res.delay_risk_label).toBe('Medium');
    });

    test('predict throws on server 500', async () => {
        nock('http://127.0.0.1:8000').post('/predict').reply(500, { error: true });
        await expect(
            mlService.predict({
                Order_Request_Date: '2024-03-01',
                Assigned_Date: '2024-03-04',
                Estimated_End_Date: '2024-03-11',
                Quantity: 10,
                Assigned_Machine_Workload: 20,
                Assigned_Operator_Workload: 30,
                Current_Queued_Jobs_Count: 1,
                Priority: 'Normal',
            })
        ).rejects.toBeTruthy();
    });

    test('checkModelHealth returns true on 200 ok:true', async () => {
        nock('http://127.0.0.1:8000').get('/health').reply(200, { ok: true });
        await expect(mlService.checkModelHealth()).resolves.toBe(true);
    });

    test('checkModelHealth returns false on connection failure', async () => {
        nock('http://127.0.0.1:8000').get('/health').replyWithError('ECONNREFUSED');
        await expect(mlService.checkModelHealth()).resolves.toBe(false);
    });
});

