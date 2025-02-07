import OpenAI from 'openai';
const TONGYI_API_KEY = 'sk-f2265729ffb1488c97e920de3760466c';
const TONGYI_API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const TONGYI_API_MODEL = 'qwen-coder-plus';

const DOUBAO_API_KEY = '459008a9-4dcb-41e7-89d8-4cf4d85d55c6';
const DOUBAO_API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_API_MODEL = 'ep-20250207172645-qxcjc';

const AI_PROVIDER = {
    TongYi: 'TongYi',
    DouBao: 'DouBao',
}

async function requestAIService ({ aiProvider, messages, isPartial }) {
    let aiClient = null, aiModel = null;
    if (aiProvider == AI_PROVIDER.TongYi) {
        aiClient = new OpenAI({ apiKey: TONGYI_API_KEY, baseURL: TONGYI_API_ENDPOINT });
        aiModel = TONGYI_API_MODEL;
    }
    else if (aiProvider == AI_PROVIDER.DouBao) {
        aiClient = new OpenAI({ apiKey: DOUBAO_API_KEY, baseURL: DOUBAO_API_ENDPOINT });
        aiModel = DOUBAO_API_MODEL;
    }

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
    async optimizeCode (aiProvider, code) {
        return await requestAIService({
            aiProvider,
            messages: [
                {
                    "role": "system", "content": `你是一个salesforce开发专家，专门优化改进 Salesforce Apex, LWC, Aura 的代码逻辑。请按照以下规则处理输入的代码段：
1. 检查代码中变量的命名是否有错别字，代码逻辑是否冗余。
2. 尝试纠正并优化代码逻辑，不添加任何解释。
3. 保持代码的原始格式和缩进。
4. 返回代码段，并使用"-$$-"包裹。例如：输入代码段 String a; 输出 -$$-String a;-$$-。` },
                { "role": "user", "content": code }
            ]
        });
    },

    async generateApexTest (aiProvider, code) {
        return await requestAIService({
            aiProvider,
            messages: [
                {
                    "role": "system", "content": `你是一个salesforce apex 专家，为输入的Apex代码生成相应的测试类或测试方法。请按照以下规则处理输入的代码段：
1. 分析输入的Apex代码。
- 如果不是一个apex test class, 则生成相应的测试类以及测试方法。
- 否则, 尝试优化代码逻辑，不添加任何解释。
2. 返回代码段，并使用"-$$-"包裹。例如：输入代码段 String a; 输出 -$$-String a;-$$-。` },
                { "role": "user", "content": code }
            ]
        });
    },

    async documentCode (aiProvider, code) {
        return await requestAIService({
            aiProvider,
            messages: [
                {
                    "role": "system", "content": `你是一个Salesforce代码分析工具，能够自动为apex, LWC, Aura, Javascript代码生成文档注释。请按照以下规则处理输入的代码段：
1. 如果代码中没有类或方法，直接返回原代码，并且不要添加任何注释。
2. 如果代码中有类或方法，只为类或者方法生成规范的文档注释：
   - 对于类：生成类的简要描述。
   - 对于方法：生成方法的简要描述，列出其参数、返回值和功能说明。
3. 不要修改或删除任何原有代码行，不需要为属性或者变量添加注释。
4. 生成的文档注释应符合相应语言的规范（Apex语言使用Javadoc的格式，Javascript语言使用JSDoc）。
5. 保留代码的原始格式和缩进，不添加任何解释。
6. 返回代码段，并使用"-$$-"包裹。例如：输入代码段 String a; 输出 -$$-String a;-$$-。` },
                { "role": "user", "content": code }
            ]
        });
    }
}

export { AI_PROVIDER, AI_ACTION }
