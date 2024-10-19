import express from "express";

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
    let prettier = await import('prettier'), apexPrettierPlugin = await import('prettier-plugin-apex');
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