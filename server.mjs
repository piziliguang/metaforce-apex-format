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
    let { method, data } = req.body;
    try {
        if (method == 'askAI') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
            let streamResponse = await AI_ACTION.askAI(AI_PROVIDER.DeepSeek, data);
            for await (const part of streamResponse) {
                res.write(part.choices[0]?.delta?.content || '');
            }
            res.end();
        } else if (method == 'completeCode') {
            res.json({ isSucceeded: true, data: await AI_ACTION.completeCode(AI_PROVIDER.DeepSeek, data) });
        } else if (method == 'assistCode') {
            res.json({ isSucceeded: true, data: await AI_ACTION.assistCode(AI_PROVIDER.DeepSeek, data) });
        } else if (method == 'optimizeCode') {
            res.json({ isSucceeded: true, data: await AI_ACTION.optimizeCode(AI_PROVIDER.DeepSeek, data) });
        } else if (method == 'documentCode') {
            res.json({ isSucceeded: true, data: await AI_ACTION.documentCode(AI_PROVIDER.DeepSeek, req.body.developerName, data) });
        } else if (method == 'generateApexTest') {
            res.json({ isSucceeded: true, data: await AI_ACTION.generateApexTest(AI_PROVIDER.DeepSeek, data) });
        } else {
            res.json({ isSucceeded: false, data: 'AI service is not available yet, stay tuned.' });
        }
    } catch (ex) {
        res.json({ isSucceeded: false, data: ex?.error?.message || ex?.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});