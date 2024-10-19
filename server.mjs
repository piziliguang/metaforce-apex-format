import express from "express";
import prettier from "prettier";
import * as apexPrettierPlugin from "prettier-plugin-apex";
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    let result = {};
    try {
        let formatted = prettier.format('public class Test{ Integer i = 1; }', { semi: true, tabWidth: 4, printWidth: 120, parser: 'apex', plugins: [apexPrettierPlugin] })
        result = { isSucceeded: true, formatted };
    } catch (ex) {
        result = { isSucceeded: true, formatted: ex.getMessage() };
    }
    res.send('Welcome to my server!' + JSON.stringify(result));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});