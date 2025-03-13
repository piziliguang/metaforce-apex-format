import path from 'node:path';
import { execSync } from "child_process"
import { outputFile, remove } from 'fs-extra/esm'

export const analyzeFlow = async (requestBody = {}) => {
    try {
        let { flowName, flowMetadata } = requestBody;
        if (!flowName || !flowMetadata) {
            return { isSucceeded: false, data: 'Required data is missing!' };
        }

        let flowFullPath = path.resolve(`cache/${flowName}.flow-meta.xml`);
        await outputFile(flowFullPath, flowMetadata);

        let cmdResult = {}, cmdLine = `sfdx flow:scan -p "${flowFullPath}" --json`;
        try {
            cmdResult = execSync(cmdLine)?.toString();
        } catch (error) {
            cmdResult = error.stdout?.toString();
        }
        remove(flowFullPath);

        let analyzeResult = JSON.parse(cmdResult)

        const rule2Result = new Map();
        analyzeResult.result.results.forEach(rec => {
            let connectsTo = rec.details?.connectsTo ? rec.details?.connectsTo.join(', ') : null;
            let nodeObj = { nodeName: rec.name, nodeType: rec.type, connectsTo: connectsTo };
            if (!rule2Result.has(rec.rule)) {
                rule2Result.set(rec.rule, {
                    ruleName: rec.rule, ruleDescription: rec.ruleDescription, severity: rec.severity,
                    results: [nodeObj]
                });
            } else {
                rule2Result.get(rec.rule).results.push(nodeObj);
            }
        })
        return { isSucceeded: true, data: Array.from(rule2Result.values()) };
    } catch (ex) {
        return { isSucceeded: false, data: ex };
    }
}