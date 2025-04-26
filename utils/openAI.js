import OpenAI from 'openai';
const DEEPSEEK_API_KEY = 'sk-ca24d80d455c4bb285de9a7a33ed02f8';
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/';
const DEEPSEEK_API_ENDPOINT_BETA = 'https://api.deepseek.com/beta';
const DEEPSEEK_API_MODEL_DEFAULT = 'deepseek-chat'; // deepseek-v3

const TONGYI_API_KEY = 'sk-f2265729ffb1488c97e920de3760466c';
const TONGYI_API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const TONGYI_API_MODEL_DEFAULT = 'qwen-plus-latest'; // deepseek-v3

const DOUBAO_API_KEY = '459008a9-4dcb-41e7-89d8-4cf4d85d55c6';
const DOUBAO_API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_API_MODEL_DEFAULT = 'ep-20250207172645-qxcjc';

const AI_PROVIDER = { TongYi: 'TongYi', DouBao: 'DouBao', DeepSeek: 'DeepSeek' }
const AI_COMPLETION_TYPE = { Chat: 'Chat', Fill_In_Middle: 'Fill_In_Middle' }

const AI_ACTION = {
    async askAI (aiProvider, messages) {
        return await requestAIService(aiProvider, AI_COMPLETION_TYPE.Chat, {
            temperature: 1.3, stream: true,
            messages: [
                {
                    "role": "system", "content": `You are an expert Senior Salesforce Developer and Architect with deep knowledge of Salesforce technologies, including Apex, javascript, Lightning Web Components (LWC), Visualforce, and Salesforce best practices.
Follow these rules meticulously:
1. Generic Salesforce Questions:
- If the input is a general Salesforce question (e.g., "What is a Trigger?"), provide a concise and accurate answer.
2. Salesforce Code Requests:
- If the input involves Salesforce code or Javascript (e.g., "Write an Apex trigger"), follow these steps:
  - Identify the language (Apex, Javascript, LWC, Visualforce, SOQL, etc.).
  - Generate or complete the code based on the request.
  - Do not include explanations unless explicitly asked.
3. If the input is not related to the salesforce knowledge and javascript, respond strictly with the statement: "Sorry, you can only ask questions related to Salesforce."

Output Format:
1. Wrap all responses in HTML format for readability.
2. Code blocks must be enclosed in <pre> tags (no syntax highlighting).
3. No extra commentary after code unless requested.

For example,
Input: "Write an Apex method to sort a list of strings."
Output: 
<div>Here's an Apex method to sort a list of strings alphabetically:</div>
<pre>
public static List<String> sortStringList(List<String> strings) {
    if (strings == null) return null;
    strings.sort();
    return strings;
}
</pre>`
                },
                ...messages
            ]
        });
    },

    async completeCode (aiProvider, { prefix, suffix, lang }) {
        return await requestAIService(aiProvider, AI_COMPLETION_TYPE.Fill_In_Middle, {
            model: 'deepseek-coder', temperature: 1, max_tokens: 256,
            prompt: `As a senior salesforce architect, please complete the following salesforce ${lang} code logic. \n\n` + prefix, suffix,
        });
    },

    async assistCode (aiProvider, { prefix, suffix, selection, command, lang }) {
        let langText = lang ? `Salesforce ${lang} code` : 'text';
        return await requestAIService(aiProvider, AI_COMPLETION_TYPE.Chat, {
            temperature: 1.3,
            messages: [
                {
                    "role": "system", "content": "Act as a seasoned Salesforce Developer. "
                },
                {
                    "role": "user", "content": `
You should answer the user's question (USERQUESTION) for the selected ${langText} (USERSELECTION), use the USERDOCUMENT as context if needed.
If the USERSELECTION is blank, output the statement "You have to select some code lines."

<USERDOCUMENT>${prefix}<USERSELECTION>${selection}</USERSELECTION>${suffix}</USERDOCUMENT>

USERQUESTION: ${command}

Output the answer only, do not explain.`.trim()
                }
            ]
        });
    },

    async optimizeCode (aiProvider, code) {
        let aiResponseContent = await requestAIService(aiProvider, AI_COMPLETION_TYPE.Chat, {
            temperature: 0.5,
            messages: [
                {
                    "role": "system", "content": `Act as a Salesforce architect. Your task is to analyze and optimize the provided Salesforce code while preserving its original structure. Follow these rules meticulously:
1. Code Optimization Logic
    - Apex Code:
        - Apply Java coding conventions (e.g., ternary operators, loop optimizations, guard clauses).
        - Replace verbose logic with efficient patterns (e.g., bulkification, SOQL/DML optimizations).
    - Apex Test Classes:
        - Ensure every test method includes System.assert()/Assert.areEqual() statements.
        - Add Test.startTest()/Test.stopTest() for governor limit resets if needed.
    - JavaScript (Lightning Web Components):
        - Follow modern ES6+ standards (e.g., const/let, arrow functions, error handling).
        - Avoid anti-patterns like nested promises; use async/await where applicable.
    - Add Explanations:
        - Insert a brief comment above the optimized line explaining the change (e.g., // Optimized: Simplified loop with guard clause).
2. Preservation Rules
    - Retain all original comments, formatting, and indentation.
    - Only modify code that violates Salesforce best practices or the conventions above.

3. Output Format
    - Return only the optimized code wrapped in -$$-.
    - Example:
        Input:  
        for (Integer i = 0; i < 10; i++) { if (x == 5) { System.debug('Found'); } }  

        Output:  
        -$$-  
        // Optimized: Simplified loop with guard clause  
        for (Integer i = 0; i < 10; i++) {  
            if (x != 5) continue; // Guard clause  
            System.debug('Found');  
        }  
-$$-  
`
                },
                { "role": "user", "content": code }
            ]
        });
        return aiResponseContent.split('-$$-')[1].replace(/^\n|\n$/g, '');
    },

    async generateApexTest (aiProvider, code) {
        let aiResponseContent = await requestAIService(aiProvider, AI_COMPLETION_TYPE.Chat, {
            messages: [
                {
                    "role": "system", "content": `Act as a seasoned Salesforce Developer. Your task is to generate a robust Apex test class for the provided Apex code. Follow these requirements strictly:
1. Code Analysis & Test Logic
- Analyze the input Apex code’s functionality, dependencies, and potential edge cases.
- Design test methods to cover:
  - Positive scenarios (expected outcomes).
  - Negative scenarios (exception/error handling).
  - Bulk data processing (if applicable).
- Use @IsTest annotations and ensure test setup (e.g., Test.startTest(), Test.stopTest()).
- Include System.assertEquals(expected, actual) statements to validate results.

2. Documentation
- Add Javadoc-style comments to the test class and methods.
- Class-level: Describe the purpose of the test class.
- Method-level: Explain the scenario being tested.
- Include @author, @description tags (if referencing other classes).

3. Output Format
- Return only the test class code wrapped between -$$-.
- Example:
Input: public class DemoController {}  
Output:  
-$$-  
/**  
 * @description: <Concise class purpose summary>
 * @author: <Insert author name>
 */  
@IsTest  
private class DemoControllerTest {  
    @TestSetup  
    static void setup() {  
        // Create test data  
    }  

    /**  
     * @description Validates successful execution of DemoController  
     */ 
    @IsTest  
    static void testDemoControllerSuccess() {  
        // Test logic  
        System.assert(true);  
    }  
}  
-$$-  
`
                },
                { "role": "user", "content": code }
            ]
        });
        return aiResponseContent.split('-$$-')[1].replace(/^\n|\n$/g, '');
    },

    async documentCode (aiProvider, developerName, code) {
        let currDate = new Date().toISOString().split('T')[0];
        let aiResponseContent = await requestAIService(aiProvider, AI_COMPLETION_TYPE.Chat, {
            temperature: 0.2,
            messages: [
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
        });
        return aiResponseContent.split('-$$-')[1].replace(/^\n|\n$/g, '');
    }
}

//completionType = Chat/FIM
async function requestAIService (aiProvider, completionType = AI_COMPLETION_TYPE.Chat, aiParams = {}) {
    let aiClient = null, aiModel = null, isFillInMiddle = completionType == AI_COMPLETION_TYPE.Fill_In_Middle;
    if (aiProvider == AI_PROVIDER.DeepSeek) {
        let baseURL = isFillInMiddle ? DEEPSEEK_API_ENDPOINT_BETA : DEEPSEEK_API_ENDPOINT;
        aiClient = new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL });
        aiModel = DEEPSEEK_API_MODEL_DEFAULT;
    }
    else if (aiProvider == AI_PROVIDER.TongYi) {
        aiClient = new OpenAI({ apiKey: TONGYI_API_KEY, baseURL: TONGYI_API_ENDPOINT });
        aiModel = TONGYI_API_MODEL_DEFAULT;
    }
    else if (aiProvider == AI_PROVIDER.DouBao) {
        aiClient = new OpenAI({ apiKey: DOUBAO_API_KEY, baseURL: DOUBAO_API_ENDPOINT });
        aiModel = DOUBAO_API_MODEL_DEFAULT;
    }
    console.log(`AI Provider: ${aiProvider}, Model: ${aiModel}`);

    if (isFillInMiddle) {
        let completion = await aiClient.completions.create({ model: aiModel, ...aiParams });
        return completion.choices[0].text;
    } else {
        let completion = await aiClient.chat.completions.create({
            model: aiModel,
            ...aiParams
        });

        if (aiParams.stream) {
            return completion;
        } else {
            return completion.choices[0].message.content.trim();
        }
    }
}

export { AI_PROVIDER, AI_ACTION }
