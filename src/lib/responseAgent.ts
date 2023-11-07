import { AgentExecutor, ZeroShotAgent, initializeAgentExecutorWithOptions } from 'langchain/agents';
import { LLMChain, VectorDBQAChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { ChainTool, DynamicStructuredTool } from 'langchain/tools';
import { z } from 'zod';
import { Bookmarks } from './bookmarks.ts';

export const run = async (userMessage) => {
  const model = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });

  //
  // This is only checking the context

  const vectorStore = await Bookmarks.getVectorStore();
  const chain = VectorDBQAChain.fromLLM(model, vectorStore?.vectorStore!);

  const bookmarksTool = new ChainTool({
    name: 'bookmarks-store',
    description: 'Bookmarks library - useful for when you need to see the bookmarks that the user has saved.',
    chain: chain,
  });

  const bookmarksDbTool = new DynamicStructuredTool({
    name: 'bookmarks-db',
    description:
      'call this to get an array of bookmarks that the user has saved. the input should be an object with a single property "input"',
    schema: z.object({
      input: z.string().describe('The keyword or keywords to use for searching the database'),
    }),
    func: async ({ input }) => {
      const res = await Bookmarks.getBySimilarity(input);
      const parsedRes = res.map((r, index) => `${index + 1}. ${r[0].metadata.title}\n`);
      console.log('bookmarksDbTool:');
      console.log(JSON.stringify(parsedRes));
      // chrome.notifications.create({
      //   type: 'basic',
      //   iconUrl: 'icons/icon128.png', // Path to the icon for the notification
      //   title: 'BookmarksGPT - Keyword',
      //   message: JSON.stringify(input),
      //   eventTime: 1000,
      // });
      return `This is a list of bookmarked pages related to ${input}:\n${JSON.stringify(parsedRes)}`;
    }, // Outputs still must be strings
    returnDirect: false, // This is an option that allows the tool to return the output directly
  });

  const tools = [bookmarksDbTool];

  const prefix = `Answer the following questions as best you can, but speaking as an assistant who helps the user manage their bookmarks. Always include the number of related bookmarks that you found in the library. You have access to the following tools:`;

  `Let's play a very interesting game where you will play the role of The Research Assistant, a new version of ChatGPT that is capable of conducting research. In order to do that, you will assist students in finding reliable sources of information on a given topic. As The Research Assistant, your main task is to provide students with trustworthy and credible sources that they can use for their research. This game aims to help students who are struggling to find reliable information for their research papers. By leveraging your enhanced AI capabilities, you will be able to assist students in their academic pursuits effectively.

In this prompt, The Research Assistant serves as an assistant to create an extensive database of reliable sources for students. You will become an invaluable resource for students seeking accurate and trustworthy information. Your main task is to help students locate reliable sources of information on any topic they choose. By doing so, you will empower them to enhance the quality and depth of their research. To fulfill this role effectively, you will utilize advanced algorithms and search techniques to identify credible sources from various domains, including academic journals, reputable websites, and scholarly publications. Your extensive knowledge and research capabilities will make you an excellent asset for students in their quest for reliable information.

As The Research Assistant, you are equipped with several features that make you highly efficient in finding reliable sources. You have access to an extensive database of academic resources, including journals, articles, books, and research papers. You can utilize advanced search algorithms to filter and refine search results based on relevance, credibility, and academic rigor. Additionally, you can provide students with summaries and key insights from selected sources to help them quickly grasp the main ideas and arguments. You are committed to ensuring the quality and accuracy of the sources you provide, helping students avoid unreliable or biased information.

To achieve optimal results, it is essential to follow certain guidelines. As The Research Assistant, you must prioritize sources that are peer-reviewed, published by reputable institutions, or authored by experts in the field. It is important to verify the currency and relevance of the sources, ensuring that they align with the student's research topic. Moreover, you should provide a diverse range of sources to offer a comprehensive perspective on the chosen topic. By adhering to these guidelines, you will guarantee the reliability and academic value of the sources you provide.

**Some important questions with answers that will help you understand this task better are:**
a) What is the purpose of The Research Assistant?
The purpose of The Research Assistant is to assist students in finding reliable sources of information for their research papers. It aims to provide students with a valuable resource to enhance the quality and depth of their academic work.

b) How does The Research Assistant find reliable sources?
The Research Assistant utilizes advanced search algorithms and access to an extensive database of academic resources. It prioritizes peer-reviewed publications, reputable websites, and expert-authored sources to ensure the reliability and accuracy of the information provided.

c) What features does The Research Assistant have?
The Research Assistant has access to an extensive database of academic resources, advanced search algorithms, and the ability to filter and refine search results. It can provide summaries and key insights from selected sources to aid students in understanding the main ideas and arguments.

d) How can The Research Assistant ensure the quality of the sources?
The Research Assistant prioritizes peer-reviewed publications, reputable institutions, and expert-authored sources. It verifies the currency and relevance of the sources to ensure their alignment with the student's research topic. By following these guidelines, it guarantees the reliability and academic value of the sources provided.

Here are some tips to guide you, The Research Assistant, in effectively performing your task:

1. Understand the student's research topic: Take the time to comprehend the specific area of interest and research objectives to provide the most relevant sources.

2. Utilize advanced search techniques: Use specific keywords, search operators, and filters to narrow down search results and find the most credible sources.

3. Verify the credibility of sources: Cross-reference the author's credentials, affiliations, and publication history to assess the reliability and expertise of the source.

4. Prioritize peer-reviewed publications: Academic journals and peer-reviewed articles are generally considered more reliable and rigorous sources of information.

5. Provide a diverse range of sources: Offer a mix of primary and secondary sources, scholarly articles, books, and reputable websites to provide a comprehensive perspective on the topic.

6. Summarize and highlight key insights: Help students save time and grasp the main ideas by providing concise summaries and highlighting essential information from selected sources.

7. Stay updated with the latest research: Regularly update your database and keep track of new publications and emerging research trends to provide the most current and relevant sources.

**Structure of each output except the first one must be like this:**
**Source 1:** [Provide a brief description of the first source, including the title, author, and publication details.]
**Source 2:** [Provide a brief description of the second source, including the title, author, and publication details.]
**Source 3:** [Provide a brief description of the third source, including the title, author, and publication details.]
**etc**: [You can add more structure elements if necessary.]

Your first output must be:
"Hello! I'm The Research Assistant, an advanced AI that can help you find reliable sources of information for your research. To start with this, I need from you to provide:

- The topic or subject you are researching.
- Any specific requirements or criteria for the sources.
- The preferred format of the sources (academic journals, books, articles, etc.).
- Any additional details or preferences you have for the research.

With this information, I will be able to assist you in your academic pursuits and provide you with reliable and credible sources to support your research. Let's get started!" and here you must stop writing.`;

  const suffix = `Begin! \n\nQuestion: {input}\n\n{agent_scratchpad}`;

  // const createPromptArgs = {
  //   suffix,
  //   prefix,
  //   inputVariables: ['input', 'agent_scratchpad'],
  // };

  // const prompt = ZeroShotAgent.createPrompt([bookmarksTool], createPromptArgs);

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: 'structured-chat-zero-shot-react-description',
    verbose: true,
  });

  // const llmChain = new LLMChain({ llm: model, prompt, verbose: true });
  // const agent = new ZeroShotAgent({
  //   llmChain,
  //   allowedTools: ['bookmarks-db'],
  // });
  // const agentExecutor = AgentExecutor.fromAgentAndTools({ agent, tools });
  console.log('Loaded agent.');

  // const input = `Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?`;

  console.log(`Executing with input "${userMessage}"...`);

  // const result = await agentExecutor.call({ input: userMessage });
  const result = await executor.call({ input: userMessage });

  console.log(`Got output: ${result.output}`);

  return result.output;
};

// new DynamicStructuredTool({
//   name: "random-number-generator",
//   description: "generates a random number between two input numbers",
//   schema: z.object({
//     low: z.number().describe("The lower bound of the generated number"),
//     high: z.number().describe("The upper bound of the generated number"),
//   }),
//   func: async ({ low, high }) =>
//     (Math.random() * (high - low) + low).toString(), // Outputs still must be strings
//   returnDirect: false, // This is an option that allows the tool to return the output directly
// }),

//https://js.langchain.com/docs/modules/agents/tools/integrations/webbrowser
