import path from 'node:path';
import { execSync } from "child_process"
import { outputFile, pathExistsSync, readJson, remove } from 'fs-extra/esm'

export const analyzeCode = async (requestBody = {}) => {
    try {
        let { codeName, codeMetadata } = requestBody;
        if (!codeName || !codeMetadata) {
            return { isSucceeded: false, data: 'Required data is missing!' };
        }

        let configPath = 'resources/analyzeCode.yml', inputFilePath = `cache/${codeName}`, outputFilePath = `cache/${codeName}-output.json`;

        let inputFileFullPath = path.resolve(inputFilePath), outputFileFullPath = path.resolve(outputFilePath);
        await outputFile(inputFileFullPath, codeMetadata || '');

        let cmdLine = `sf code-analyzer run ` +
            `-w ${inputFilePath} ` +
            `--config-file ${configPath} ` +
            `--output-file ${outputFilePath} ` +
            `--rule-selector pmd:recommended ` +
            `--severity-threshold 3`;

        try { execSync(cmdLine); }
        catch (error) {
            //DO-NOTHING
        }
        finally {
            remove(inputFileFullPath);
        }

        if (pathExistsSync(outputFileFullPath)) {
            let data = await readJson(outputFileFullPath, { throws: false });
            remove(outputFileFullPath);
            return { isSucceeded: true, data };
        } else {
            return { isSucceeded: false, data: 'Unknown error.' + pathExistsSync(outputFileFullPath) };
        }
    } catch (ex) {
        console.log('err');
        return { isSucceeded: false, data: ex };
    }
}