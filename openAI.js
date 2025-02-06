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
        temperature: 0.2
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

const TongYi = {

    async optimizeCode (code) {
        return await requestAI({
            model: "qwen-coder-plus",
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

    async generateApexTest (code) {
        return await requestAI({
            model: "qwen-coder-plus",
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
4. 保留代码的原始格式和缩进，不要修改代码逻辑，不添加任何解释。
5. 返回代码段，并使用"-$$-"包裹。例如：输入代码段 String a; 输出 -$$-String a;-$$-。` },
                { "role": "user", "content": code }
            ]
        });
    }
}

export { TongYi }
