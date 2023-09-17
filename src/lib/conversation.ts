import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory } from 'langchain/memory';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate
} from 'langchain/prompts';
import { ChainValues } from 'langchain/schema';
import { Bookmarks } from './bookmarks.ts';

export class Conversation {
  static chatMemory = new BufferMemory({ returnMessages: true });
  constructor() {}

  static async generateChat(message): Promise<ChainValues> {
    // const llm = new OpenAI({
    //   openAIApiKey: process.env.OPENAI_API_KEY,
    //   temperature: 0.9,
    // });

    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
    });

    const system_prompt_template = `Let's play a game where you will play the role of a Query Assistant, a new version of ChatGPT that is capable of generating a JSON object which describes the user's intent. 
    In order to do that, you will assist the user in explaining what they are looking for by having a chat with them. 
    As The Query Assistant, your main task is to produce a JSON object which is an accurate representation of what the user wants. 
    The JSON Object should contain three properties: 'keywords', 'selector' and 'action'.
    'keywords' should contain any keywords that the user wishes to search for. 
    'selector' should contain a selector that can be used to query the database. 
    'action' should contain one of the following options and NOTHING else: 'search', 'copy_to_clipboard', 'export'. 
    The JSON Object MUST always include all three properties and nothing else except from these properties.
    If the user does not specify the action that they want to perform then the Query Assistant should set 'action' to be equal to 'search'.
    You should include the JSON object in ALL your responses.    
    

    Your first output must be:
"Hello! I'm The Query Assistant, an advanced AI that can help you find bookmarks from your library. To start with this, I need from you to provide:

- The topic or subject you are researching.
- Any specific requirements or criteria for the sources.
- The preferred format of the sources (academic journals, books, articles, etc.).
- Any additional details or preferences you have for the research.

With this information, I will be able to assist you in your academic pursuits and provide you with reliable and credible sources to support your research. Let's get started!" and here you must stop writing.
    `;
    // ${JSON.stringify({ selector: { keywords: ['guitars'] } })}
    // ${JSON.stringify({ selector: { keywords: ['electronics'], timestamp: { $gte: `yesterday` } } })}

    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(system_prompt_template),
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate(`{input}`),
    ]);

    // const prompt = PromptTemplate.fromTemplate(prompt_template);

    const chain = new ConversationChain({
      memory: Conversation.chatMemory,
      llm: chat,
      prompt: chatPrompt,
      verbose: true,
    });

    return await chain.call({
      input: message,
    });
  }

  static async getResponse(message) {
    const VS = await Bookmarks.getVectorStore();
    const matches = await VS?.vectorStore.similaritySearchWithScore(message, 20);

    return {
      matches,
      response: '',
    };
  }
}
