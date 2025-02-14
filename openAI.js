import OpenAI from 'openai';
const TONGYI_API_KEY = 'sk-f2265729ffb1488c97e920de3760466c';
const TONGYI_API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const TONGYI_API_MODEL_DEFAULT = 'qwen-plus-latest'; // deepseek-v3

const DOUBAO_API_KEY = '459008a9-4dcb-41e7-89d8-4cf4d85d55c6';
const DOUBAO_API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_API_MODEL_DEFAULT = 'ep-20250207172645-qxcjc';

const AI_PROVIDER = {
    TongYi: 'TongYi',
    DouBao: 'DouBao',
}

async function requestAIService ({ aiProvider, model, messages, isPartial }) {
    let aiClient = null, aiModel = null;
    if (aiProvider == AI_PROVIDER.TongYi) {
        aiClient = new OpenAI({ apiKey: TONGYI_API_KEY, baseURL: TONGYI_API_ENDPOINT });
        aiModel = model || TONGYI_API_MODEL_DEFAULT;
    }
    else if (aiProvider == AI_PROVIDER.DouBao) {
        aiClient = new OpenAI({ apiKey: DOUBAO_API_KEY, baseURL: DOUBAO_API_ENDPOINT });
        aiModel = model || DOUBAO_API_MODEL_DEFAULT;
    }

    console.log(`AI Provider: ${aiProvider}, Model: ${aiModel}`);
    let completion = await aiClient.chat.completions.create({
        messages, model: aiModel, temperature: 0.2
    });

    if (isPartial) {
        return completion.choices[0].message.content;
    } else {
        let newContent = completion.choices[0].message.content;
        if (newContent.includes('-$$-')) {
            return newContent.split('-$$-')[1].replace(/^\n|\n$/g, '');
        } else {
            return newContent.split('\n').slice(1, -1).join('\n');
        }
    }
}

const AI_ACTION = {
    async optimizeCode (aiProvider, model, code) {
        return await requestAIService({
            aiProvider, model,
            messages: [
                {
                    "role": "system", "content": `You are a Salesforce expert. Optimize the provided Salesforce code according to the following rules:
1. Improve the code logic and add an explanation comment above each optimized line.
   - For Apex code, follow Java coding conventions.
   - For JavaScript code, follow JavaScript coding conventions.
   - For Apex test classes, ensure each test method includes an assertion statement at least.
2. Preserve the original code comments, format, and indentation.
3. Return the optimized code wrapped in '-$$-'. For example:
Input: String a;
Return: -$$-String a;-$$-`
                },
                { "role": "user", "content": code }
            ]
        });
    },

    async generateApexTest (aiProvider, model, code) {
        return await requestAIService({
            aiProvider, model,
            messages: [
                {
                    "role": "system", "content": `You're a salesforce expert. You need to generate an Apex test class for the input Apex code based on following rules:
1. Analyze apex code and generate apex test class.
2. Add code documentaion to the apex test class based on Javadoc standard.
3. Return apex test class, and wrap it with '-$$-'。For example:  
Input: public class DemoController {}
Return: -$$-public class DemoControllerTest {}-$$-`
                },
                { "role": "user", "content": code }
            ]
        });
    },

    async documentCode (aiProvider, model, code) {
        return await requestAIService({
            aiProvider, model,
            messages: [
                {
                    "role": "system", "content": `You are a Salesforce expert. Generate documentation for the provided code according to the following rules:
1. Analyze the input code to identify the class and methods.
2. Add documentation to the class and methods based on Javadoc standards:
   - For the class, use the following format:
    /*
    * @description: <Insert description>
    * @author: <Insert author name>
    * 
    * Modification Log:
    * Ver   Date              Author                     Modification
    * 1.0   <Current Date>    <Insert author name>       Initial Version
    */
   - For the methods, use the following format:
    /*
    * @description: <Insert description>
    * @param <param name>: <param description>.
    * @return <return type name>: <description>.
    */
3. Do not update or delete any original code lines, and do not document properties or variables.
4. Maintain the original format and indentation of the code.
5. Return the documented code wrapped in '-$$-'. For example:
Input: String a;
Return: -$$-String a;-$$-`
                },
                { "role": "user", "content": code }
            ]
        });
    }
}

export { AI_PROVIDER, AI_ACTION }
