import express from "express";
import bodyParser from "body-parser"
import prettier from "prettier";
import * as apexPrettierPlugin from "prettier-plugin-apex";

import { AI_PROVIDER, AI_ACTION } from './openAI.js';

const port = 3000;
const app = express();
const jsonParser = bodyParser.json();

app.post('/apex/format', jsonParser, async (req, res) => {
    let { apexCode, prettierOptions } = req.body || {}, result = {};
    if (!prettierOptions) prettierOptions = {};

    try {
        let formatted = await prettier.format(apexCode || '', { semi: true, tabWidth: 4, printWidth: 120, ...prettierOptions, parser: prettierOptions?.anonymous ? 'apex-anonymous' : 'apex', plugins: [apexPrettierPlugin] })
        result = { isSucceeded: true, formatted };
    } catch (ex) {
        result = { isSucceeded: false, formatted: ex.message };
    }
    //res.setHeader('Content-Type', 'application/json');
    res.json(result);
});

app.post('/ai/chat', jsonParser, async (req, res) => {
    let { model, method, code } = req.body || {};
    let result = await requestAI(AI_PROVIDER.DeepSeek, model, method, code);
    res.json(result);
});

app.post('/ai/tongyi', jsonParser, async (req, res) => {
    let { model, method, code } = req.body || {};
    let result = await requestAI(AI_PROVIDER.TongYi, model, method, code);
    res.json(result);
});

app.post('/ai/doubao', jsonParser, async (req, res) => {
    let { model, method, code } = req.body || {};
    let result = await requestAI(AI_PROVIDER.DouBao, model, method, code);
    res.json(result);
});

async function requestAI (aiProvider, model, method, code) {
    let result = { isSucceeded: true, code: '' };
    try {
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
    } catch (ex) {
        result = { isSucceeded: false, code: ex?.error?.message || ex?.message };
    }
    return result;
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});