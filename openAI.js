import OpenAI from 'openai';
const DEEPSEEK_API_KEY = 'sk-ca24d80d455c4bb285de9a7a33ed02f8';
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1';
const DEEPSEEK_API_MODEL_DEFAULT = 'deepseek-chat'; // deepseek-v3

const TONGYI_API_KEY = 'sk-f2265729ffb1488c97e920de3760466c';
const TONGYI_API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const TONGYI_API_MODEL_DEFAULT = 'qwen-plus-latest'; // deepseek-v3

const DOUBAO_API_KEY = '459008a9-4dcb-41e7-89d8-4cf4d85d55c6';
const DOUBAO_API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_API_MODEL_DEFAULT = 'ep-20250207172645-qxcjc';

const AI_PROVIDER = {
    TongYi: 'TongYi',
    DouBao: 'DouBao',
    DeepSeek: 'DeepSeek',
}

async function requestAIService ({ aiProvider, model, messages, isPartial }) {
    let aiClient = null, aiModel = null;
    if (aiProvider == AI_PROVIDER.DeepSeek) {
        aiClient = new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: DEEPSEEK_API_ENDPOINT });
        aiModel = model || DEEPSEEK_API_MODEL_DEFAULT;
    }
    else if (aiProvider == AI_PROVIDER.TongYi) {
        aiClient = new OpenAI({ apiKey: TONGYI_API_KEY, baseURL: TONGYI_API_ENDPOINT });
        aiModel = model || TONGYI_API_MODEL_DEFAULT;
    }
    else if (aiProvider == AI_PROVIDER.DouBao) {
        aiClient = new OpenAI({ apiKey: DOUBAO_API_KEY, baseURL: DOUBAO_API_ENDPOINT });
        aiModel = model || DOUBAO_API_MODEL_DEFAULT;
    }

    console.log(`AI Provider: ${aiProvider}, Model: ${aiModel}`);
    let completion = await aiClient.chat.completions.create({
        messages, model: aiModel, temperature: 0
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
                    "role": "system", "content": `You're a salesforce expert. You need to analyze and optimize salesforce code based on following rules：
1. Optimize the code logic by following rules, then add explanation comment above the optimized line.
   - if it's apex code, optimize it by java coding conventions.
   - if it's javascript code, optimize it by javascript coding conventions.
   - if it's apex test class, each test method should have assertion statement.
2. Maintain the original code comments, code format, indentation of the code.
3. Return optimized code, and wrap it with '-$$-'. For example:  
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
2. Add code documentation to the apex test class based on Javadoc standard.
3. Return apex test class, and wrap it with '-$$-'。For example:  
Input: public class DemoController {}
Return: -$$-public class DemoControllerTest {}-$$-`
                },
                { "role": "user", "content": code }
            ]
        });
    },

    async documentCode (aiProvider, model, code) {
        let currDate = new Date().toISOString().split('T')[0];
        return await requestAIService({
            aiProvider, model,
            messages: [
                {
                    "role": "system", "content":
                        `You're a Salesforce expert tasked with generating code documentation. Follow these steps meticulously:
1. Code Analysis
- Identify ONLY class/method declarations in the input code
- Ignore variables, properties, and non-declarative code
2. Documentation Rules
For Classes:
- Place directly before class declaration
- Keep version/date/author placeholders
Example:
/*
 * @description: <Concise class purpose summary>
 * @author: <Insert author name>
 *
 * Modification Log:
 * Version   Date             Author                     Modification
 * 1.0       ${currDate}       <Insert author name>       Initial Version
 */

For Methods,
- Include one @param per parameter: * @param [name]: [purpose]
- Include @return for non-void methods: * @return [type]: [description]
Example:
/*
 * @description: <Verbose method functionality>
 * <@param lines only if parameters exist>
 * <@return line only for non-void methods>
 */

3. Format Preservation
- Maintain original indentation
- Never modify existing code/comments
- Insert documentation blocks WITHOUT altering surrounding code

4. Output Formatting
- Return final code wrapped between -$$- markers
- Keep original code structure intact

Prioritize accuracy in parameter/return type detection. Use Apex syntax awareness for proper context analysis.
`
                },
                { "role": "user", "content": code }
            ]
        });
    }
}

export { AI_PROVIDER, AI_ACTION }
