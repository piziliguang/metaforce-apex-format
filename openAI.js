import OpenAI from 'openai';
const TONGYI_API_KEY = 'sk-f2265729ffb1488c97e920de3760466c';
const TONGYI_API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

const openai = new OpenAI({
    apiKey: TONGYI_API_KEY,
    baseURL: TONGYI_API_ENDPOINT,
    dangerouslyAllowBrowser: true
})

async function requestAI ({ model, messages, isPartial }) {
    let completion = await openai.chat.completions.create({
        model, messages,
        temperature: 0
    });

    if (isPartial) {
        return completion.choices[0].message.content;
    } else {
        let newContent = completion.choices[0].message.content;
        return newContent.split('\n').slice(1, -1).join('\n');
    }
}

const TongYi = {
    async completeApex (code) {
        return await requestAI({
            model: "qwen-coder-plus",
            messages: [
                { "role": "system", "content": `你是一个salesforce apex编程专家，专门优化salesforce apex代码。通过分析输入的Apex代码，在原代码的基础上自动补全缺失的逻辑，代码缩进要根据输入代码的格式进行调整，最后返回补全之后的完整代码。` },
                { "role": "user", "content": code }
            ],
        });
    },

    async optimizeApex (code) {
        return await requestAI({
            model: "qwen-coder-plus",
            messages: [
                {
                    "role": "system", "content": `你是一个salesforce开发专家，专门优化改进 Salesforce Apex, LWC, Aura 的代码逻辑。请按照以下规则处理输入的代码段：
1. 检查代码中变量的命名是否有错别字，代码逻辑是否冗余，
2. 尝试纠正并优化代码逻辑
4. 只返回优化之后代码，不添加任何解释。` },
                { "role": "user", "content": code }
            ]
        });
    },

    async documentCode (code) {
        return await requestAI({
            model: "qwen-coder-plus",
            messages: [
                {
                    "role": "system", "content": `你是一个代码分析工具，能够自动为代码中的类和方法生成文档注释。请按照以下规则处理输入的代码段：
1. 如果代码中没有类或方法，直接返回原代码，并且不要添加任何注释。
2. 如果代码中有类或方法，为它们生成规范的文档注释：
   - 对于类：生成类的简要描述，列出其主要属性和方法。
   - 对于方法：生成方法的简要描述，列出其参数、返回值和功能说明。
3. 生成的文档注释应符合Apex语言的规范（使用类似Javadoc的格式）。
4. 保留代码的原始结构和格式，不要修改代码逻辑。
5. 只返回代码段，不添加任何解释。` },
                { "role": "user", "content": code }
            ]
        });
    },

    async generateApexTest (code) {
        return await requestAI({
            model: "qwen-coder-plus",
            messages: [
                { "role": "system", "content": `你是一个salesforce开发专家，专门为 Salesforce Apex, LWC, Aura 代码写测试类。依据 Salesforce Apex 的代码规范，分析输入的代码并写为其写出对应的Apex测试类。注意不要添加任何代码逻辑，不做额外解释。最后返回测试代码。` },
                { "role": "user", "content": code }
            ]
        });
    },
}

export { TongYi }
