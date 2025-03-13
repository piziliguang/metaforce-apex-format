import prettier from "prettier";
import * as apexPrettierPlugin from "prettier-plugin-apex";

export const formatApex = async (requestBody = {}) => {
    let { apexCode, prettierOptions } = requestBody;
    if (!prettierOptions) prettierOptions = {};

    if (!apexCode) {
        return { isSucceeded: false, formatted: 'Required data is missing!' };
    }

    try {
        let formatted = await prettier.format(apexCode || '', { semi: true, tabWidth: 4, printWidth: 120, ...prettierOptions, parser: prettierOptions?.anonymous ? 'apex-anonymous' : 'apex', plugins: [apexPrettierPlugin] })
        return { isSucceeded: true, formatted };
    } catch (ex) {
        return { isSucceeded: false, formatted: ex.message };
    }
}