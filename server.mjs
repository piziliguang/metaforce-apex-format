import express from "express";
import bodyParser from "body-parser";

import { AI_PROVIDER, AI_ACTION } from './utils/openAI.js';
import { analyzeFlow } from './utils/analyzeFlow.js';
import { formatApex } from './utils/formatApex.js';

const port = 3000;
const app = express();
const jsonParser = bodyParser.json({ limit: '10mb' });

app.post('/apex/format', jsonParser, async (req, res) => {
    res.json(await formatApex(req.body));
});

app.post('/flow/analyze', jsonParser, async (req, res) => {
    res.json(await analyzeFlow(req.body))
});

app.post('/ai/chat', jsonParser, async (req, res) => {
    res.json(await requestAI(AI_PROVIDER.DeepSeek, req.body));
});

async function requestAI (aiProvider, requestBody = {}) {
    let { model, method, code } = requestBody;
    try {
        let result = { isSucceeded: true, code: '' }
        if (method == 'optimizeApex' || method == 'optimizeCode') {
            result.code = await AI_ACTION.optimizeCode(aiProvider, model, code);
        } else if (method == 'documentCode') {
            result.code = await AI_ACTION.documentCode(aiProvider, model, code);
        } else if (method == 'generateApexTest') {
            result.code = await AI_ACTION.generateApexTest(aiProvider, model, code);
        } else {
            result.isSucceeded = false;
            result.code = 'AI service is not available yet, stay tuned.';
        }
        return result;
    } catch (ex) {
        return { isSucceeded: false, code: ex?.error?.message || ex?.message };
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});