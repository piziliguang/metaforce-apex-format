import express from "express";
import bodyParser from "body-parser";

import { AI_ACTION } from './utils/openAI.js';
import { analyzeFlow } from './utils/analyzeFlow.js';
import { analyzeCode } from './utils/analyzeCode.js';
import { formatApex } from './utils/formatApex.js';

const port = 3000;
const app = express();
const jsonParser = bodyParser.json({ limit: '10mb' });

app.use(express.static('cache'));

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
    let { method, files, data } = req.body;
    try {
        if (method == 'askAI') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
            let streamResponse = await AI_ACTION.askAI(files, data);
            for await (const part of streamResponse) {
                res.write(part.choices[0]?.delta?.content || '');
            }
            res.end();
        } else if (method == 'convertAudio2Text') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Transfer-Encoding', 'chunked');
            let streamResponse = await AI_ACTION.convertAudio2Text(data);
            streamResponse.on('data', data => {
                data = data.toString();
                if (data.includes('HTTP_STATUS/200')) {
                    let outputObj = JSON.parse(data.split('data:')[1]);
                    res.write(outputObj.output.choices[0].message.content[0].text);
                }
            });
            streamResponse.on('end', () => { res.end(); });
        } else if (method == 'completeCode') {
            res.json({ isSucceeded: true, data: await AI_ACTION.completeCode(data) });
        } else if (method == 'documentCode') {
            res.json({ isSucceeded: true, data: await AI_ACTION.documentCode(req.body.developerName, data) });
        } else {
            res.json({ isSucceeded: false, data: `We're upgrading our AI services, stay tuned.` });
        }
    } catch (ex) {
        res.json({ isSucceeded: false, data: ex?.error?.message || ex?.message });
    }
});

app.post('/org/backup', jsonParser, async (req, res) => {
    // TODO: 
    // generate zip file and uncompress the zip, 
    // Search zip folder and return results.
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});