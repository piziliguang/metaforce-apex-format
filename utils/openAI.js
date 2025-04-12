import OpenAI from 'openai';
const DEEPSEEK_API_KEY = 'sk-ca24d80d455c4bb285de9a7a33ed02f8';
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/';
const DEEPSEEK_API_MODEL_DEFAULT = 'deepseek-chat'; // deepseek-v3

const TONGYI_API_KEY = 'sk-f2265729ffb1488c97e920de3760466c';
const TONGYI_API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const TONGYI_API_MODEL_DEFAULT = 'qwen-plus-latest'; // deepseek-v3

const DOUBAO_API_KEY = '459008a9-4dcb-41e7-89d8-4cf4d85d55c6';
const DOUBAO_API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_API_MODEL_DEFAULT = 'ep-20250207172645-qxcjc';

const AI_PROVIDER = { TongYi: 'TongYi', DouBao: 'DouBao', DeepSeek: 'DeepSeek' }

const AI_ACTION = {
    async chatCode (aiProvider, messages, language) {
        return await requestAIService(aiProvider, {
            temperature: 0.5, stream: true,
            messages: [
                {
                    "role": "system", "content": `Your are a senior salesforce developer and architect. 
Follow these rules meticulously:
1. If the input are generic questions about the salesforce, answer the question.
2. If the input is related to the salesforce code, generate or complete code based on the user input. 
3. If the input is not related to the salesforce knowledge, output this statement "Sorry, you can only ask questions related to Salesforce."

Output Format:
1. The output the response in a formatted html format. 
2. The code in the response must be wrapped by tag "pre".
3. Don't include any code Explanation after the code response.

For example,
Input: please write a sort method to sort a string list.
Output: <div>[Response Description]</div><pre>[Code Response]</pre>`
                },
                ...messages
            ]
        });
    },

    async optimizeCode (aiProvider, code) {
        return await requestAIService(aiProvider, {
            temperature: 0.5,
            messages: [
                {
                    "role": "system", "content": `Act as a seasoned Salesforce architect. Your task is to analyze and optimize the provided Salesforce code while preserving its original structure. Follow these rules meticulously:
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
    },

    async generateApexTest (aiProvider, code) {
        return await requestAIService(aiProvider, {
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
    },

    async documentCode (aiProvider, developerName, code) {
        let currDate = new Date().toISOString().split('T')[0];
        return await requestAIService(aiProvider, {
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
    }
}

async function requestAIService (aiProvider, aiParams = {}) {
    let aiClient = null, aiModel = null;
    if (aiProvider == AI_PROVIDER.DeepSeek) {
        aiClient = new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: DEEPSEEK_API_ENDPOINT });
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
    let completion = await aiClient.chat.completions.create({
        model: aiModel,
        ...aiParams
    });

    if (aiParams.stream) {
        return completion;
    } else if (newContent.includes('-$$-')) {
        let newContent = completion.choices[0].message.content;
        return newContent.split('-$$-')[1].replace(/^\n|\n$/g, '');
    } else {
        let newContent = completion.choices[0].message.content;
        return newContent.split('\n').slice(1, -1).join('\n');
    }
}

export { AI_PROVIDER, AI_ACTION }
