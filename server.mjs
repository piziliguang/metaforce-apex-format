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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});