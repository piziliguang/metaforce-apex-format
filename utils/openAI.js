import OpenAI from 'openai';
const DEEPSEEK_API_KEY = 'sk-ca24d80d455c4bb285de9a7a33ed02f8';
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/';
const DEEPSEEK_API_ENDPOINT_BETA = 'https://api.deepseek.com/beta';
const DEEPSEEK_API_MODEL_DEFAULT = 'deepseek-chat'; // deepseek-v3

const TONGYI_API_KEY = 'sk-f2265729ffb1488c97e920de3760466c';
const TONGYI_API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const TONGYI_API_MODEL_DEFAULT = 'qwen-plus-latest'; // deepseek-v3

const DOUBAO_API_KEY = '459008a9-4dcb-41e7-89d8-4cf4d85d55c6';
const DOUBAO_API_MODEL_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_API_MODEL_Name = 'doubao-seed-1-6-flash-250615';

const DOUBAO_API_BOT_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/bots';
const DOUBAO_API_BOT_SalesforceAssist = 'bot-20250724171909-k6bq6';
const DOUBAO_API_BOT_SalesforceCodeAnalyzer = 'bot-20250727094317-lnnwf';
const DOUBAO_API_BOT_SalesforceCodeCompletion = 'bot-20250725161517-c895d';

const AI_ACTION = {
    //使用豆包应用：Salesforce_Assistant
    async askAI (files, messages) {
        let aiClient = new OpenAI({ apiKey: DOUBAO_API_KEY, baseURL: DOUBAO_API_BOT_ENDPOINT });
        let aiParams = { model: DOUBAO_API_BOT_SalesforceAssist, temperature: 1.3, stream: true, thinking: { type: 'disabled' }, messages };
        if (files?.length > 0) {
            aiParams.model = DOUBAO_API_BOT_SalesforceCodeAnalyzer;
            aiParams.messages.unshift({
                "role": "user", "content": `Here is a salesforce code file: ${files[0]}`
            })
        }

        let completion = await aiClient.chat.completions.create(aiParams);
        return aiParams.stream ? completion : completion.choices[0].message.content.trim();
    },

    async completeCode ({ prefix, suffix, lang }) {
        let aiClient = new OpenAI({ apiKey: DOUBAO_API_KEY, baseURL: DOUBAO_API_BOT_ENDPOINT });
        let aiParams = {
            model: DOUBAO_API_BOT_SalesforceCodeCompletion, temperature: 1, max_tokens: 256, thinking: { type: 'disabled' },
            messages: [
                { "role": "user", "content": `Complete this code: ${prefix}` }
            ]
        }
        let completion = await aiClient.chat.completions.create(aiParams);
        return completion.choices[0].message.content;
    },


    async documentCode (developerName, code) {
        let aiClient = new OpenAI({ apiKey: DOUBAO_API_KEY, baseURL: DOUBAO_API_MODEL_ENDPOINT });
        let currDate = new Date().toISOString().split('T')[0];
        let aiParams = {
            model: DOUBAO_API_MODEL_Name, temperature: 0.2, thinking: { type: 'disabled' }, messages: [
                {
                    "role": "system", "content": `You're a Salesforce expert tasked with generating code documentation. Follow these steps meticulously:
1. Code Analysis
- Identify ONLY class/method declarations in the input code
- Ignore variables, properties, and non-declarative code
2. Documentation Rules
For Classes:
- Place directly before apex class declaration, including apex test class.
- Put version/date/author in the modification log. The initial version is "1.0", the author is "${developerName}", and the log date is "${currDate}".
- Keep logs vertically aligned
Example:
/*
 * @description: <Concise class purpose summary>
 * @author: ${developerName}
 *
 * Modification Log:
 * Version         Date          Author           Modification
 * <Log Version>   <Log Date>    <Author Name>    Initial Version
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
        };

        let completion = await aiClient.chat.completions.create(aiParams);
        let aiResponseContent = completion.choices[0].message.content.trim();
        return aiResponseContent.split('-$$-')[1].replace(/^\n|\n$/g, '');
    }
}
export { AI_ACTION }
