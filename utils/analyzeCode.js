import path from 'node:path';
import { execSync } from "child_process"
import { emptyDir, outputFile, pathExistsSync, readJson } from 'fs-extra/esm'
import { readFile } from 'fs/promises'
const Severity_Map = {
    '1': 'Critical',
    '2': 'High',
    '3': 'Moderate',
    '4': 'Low',
    '5': 'Info',
}

export const analyzeCode = async (requestBody = {}) => {
    try {
        let { codeName, codeMetadata } = requestBody;
        if (!codeName || !codeMetadata) {
            return { isSucceeded: false, data: 'Required data is missing!' };
        }

        let configPath = 'resources/code-analyzer.yml',
            inputFilePath = `cache/${codeName}`,
            outputFilePath = `cache/${codeName}-output.json`;

        let errorLogString = null, logFileFullPath = null;
        try {
            await outputFile(path.resolve(inputFilePath), codeMetadata || '');
            let result = execSync(`sf code-analyzer run ` +
                `--config-file ${configPath} ` +
                `-w ${inputFilePath} ` +
                `--output-file ${outputFilePath} ` +
                `--rule-selector pmd:all eslint:all ` +
                `--severity-threshold 3`,
                { encoding: 'utf-8' }
            );
            logFileFullPath = result.split('\n').find(val => val.includes('metaforce-apex-format/logs/'))?.trim();
        }
        catch (ex) {
            errorLogString = ex.stdout?.toString();
        }

        let response = null, outputFileFullPath = path.resolve(outputFilePath)
        if (pathExistsSync(outputFileFullPath)) {
            let { violations } = await readJson(outputFileFullPath, { throws: false }) || {};
            if (!violations) violations = [];

            if (violations.length == 0) {
                let logs = (await readFile(logFileFullPath, 'utf-8'))?.split('\n');
                errorLogString = logs.find(log => {
                    return log.trim().includes(' error at ');
                })?.trim();
            } else {
                errorLogString = null;
                violations = violations.map(rec => {
                    return {
                        severity: Severity_Map[rec.severity],
                        message: rec.message,
                        rule: rec.rule,
                        ...(rec.locations[0] || {})
                    }
                });
            }
            response = errorLogString ? { isSucceeded: false, data: errorLogString } : { isSucceeded: true, data: violations };
        } else {
            response = { isSucceeded: false, data: 'Unknown error.' + errorLogString };
        }

        emptyDir(path.resolve('cache'));
        emptyDir(path.resolve('logs'));
        return response;
    } catch (ex) {
        console.log(ex);
        return { isSucceeded: false, data: ex };
    }
}