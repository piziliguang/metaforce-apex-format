import express from "express";
import bodyParser from "body-parser";

import { AI_PROVIDER, AI_ACTION } from './utils/openAI.js';
import { analyzeFlow } from './utils/analyzeFlow.js';
import { analyzeCode } from './utils/analyzeCode.js';
import { formatApex } from './utils/formatApex.js';

const port = 3000;
const app = express();
const jsonParser = bodyParser.json({ limit: '10mb' });

app.post('/apex/format', jsonParser, async (req, res) => {
    res.json(await formatApex(req.body));
});

app.post('/code/analyze', jsonParser, async (req, res) => {
    res.json(await analyzeCode(req.body))
});

app.post('/flow/analyze', jsonParser, async (req, res) => {
    res.json(await analyzeFlow(req.body))
});

app.post('/ai/chat', jsonParser, async (req, res) => {
    let { model, method, developerName, code } = req.body, result = {};
    try {
        result = { isSucceeded: true, code: '' }
        if (method == 'optimizeCode' || method == 'optimizeApex') {
            result.code = await AI_ACTION.optimizeCode(AI_PROVIDER.DeepSeek, model, code);
        } else if (method == 'documentCode') {
            result.code = await AI_ACTION.documentCode(AI_PROVIDER.DeepSeek, model, developerName, code);
        } else if (method == 'generateApexTest') {
            result.code = await AI_ACTION.generateApexTest(AI_PROVIDER.DeepSeek, model, code);
        } else {
            result.isSucceeded = false;
            result.code = 'AI service is not available yet, stay tuned.';
        }
    } catch (ex) {
        result = { isSucceeded: false, code: ex?.error?.message || ex?.message };
    }

    res.json(result);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});