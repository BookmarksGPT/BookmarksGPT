import { LLMChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { VectorStore } from './vector-store.ts';

export class Conversation {
  constructor() {}

  static async getResponse(message) {
    const llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.9,
    });

    // "I found some matches for the title and some for the page content."
    // If both title and page content rank higher.
    const VS = await VectorStore.get();
    const matches = await VS?.vectorStore.similaritySearchWithScore(message, 20);
    const matches_as_context = matches
      ?.map((match, index) => {
        const { pageContent: title } = match[0];
        const score = match[1];
        return `{ title: '${title}', score: ${~~((score * 10000) / 100)}% }`;
      })
      .join('\n');

    const prompt_template = `You are a bookmarks manager. Answer the following QUESTION based on the CONTEXT given. If QUESTION is not a question then assume that the user wants to know if he has bookmarks related to the words in his question. You answer should mention how many bookmarks that have a score of 85% or above were found and the titles of those bookmarks. If you do not know the answer and the CONTEXT doesn't contain the answer truthfully say "I don't know". 
    
    CONTEXT:
    The user has the following bookmarks stored:
    {context}
    
    QUESTION:
    {question}
    
    ANSWER:
    `;

    const prompt = PromptTemplate.fromTemplate(prompt_template);

    const chain = new LLMChain({
      llm,
      prompt,
      verbose: true,
    });

    return {
      matches,
      response: await chain.predict({
        context: matches_as_context,
        question: message,
      }),
    };
  }
}
