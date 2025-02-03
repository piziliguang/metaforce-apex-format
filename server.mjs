import express from "express";
import bodyParser from "body-parser"
import prettier from "prettier";
import * as apexPrettierPlugin from "prettier-plugin-apex";

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

app.post('/ai/tongyi', jsonParser, async (req, res) => {
    let { TongYi } = await import('./openAI.js');
    let { method, code } = req.body || {}, result = {};

    try {
        result = { isSucceeded: true, code: '' };
        if (method == 'optimizeApex') {
            result.code = await TongYi.optimizeApex(code);
        } else if (method == 'documentCode') {
            result.code = await TongYi.documentCode(code);
        } else {
            result.isSucceeded = false;
        }
        return result;
    } catch (ex) {
        result = { isSucceeded: false, formatted: ex.message };
    }
    //res.setHeader('Content-Type', 'application/json');
    res.json(result);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});