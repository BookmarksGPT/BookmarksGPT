import { Document } from 'langchain/document';
import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text';

import { loadSummarizationChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export class Website {
  constructor() {}
  static async getDescription(url) {
    let description;

    try {
      // TODO: timeout fetch per URL at ~10 seconds
      const web_site = await fetch(url);
      const html = await web_site.text();

      // Description
      const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
      description = match ? match[1] : '';

      console.log(`[${url}] Description: ${description}`);
    } catch (err) {
      throw new Error(err.message);
    }

    return description;
  }

  async getSummary({ title, url }) {
    console.log('FETCHING:', title, url);
    // maybe we need an LLM class
    const llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.9,
    });

    const fullUrl = new URL(url);

    try {
      const web_site = await fetch(url);
      const html = await web_site.text();

      // Description
      const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
      const description = match ? match[1] : null;

      // TODO: "https://youtu.be", localhost or .local, github
      if (fullUrl.hostname === 'github' || fullUrl.hostname === 'youtube') {
        return '';
      }

      // Summarization
      const transformer = new HtmlToTextTransformer();
      const splitter = RecursiveCharacterTextSplitter.fromLanguage('html');
      const sequence = splitter.pipe(transformer);
      const newDocuments = await sequence.invoke([
        new Document({
          pageContent: html,
          metadata: {},
        }),
      ]);
      // This convenience function creates a document chain prompted to summarize a set of documents.
      const chain = loadSummarizationChain(llm, { type: 'map_reduce' });
      const res = await chain.call({
        input_documents: newDocuments,
      });
      console.log(`[${title}/${url}] Description: ${description}`);
      console.log('RESULT:');
      // res.text <-- summary
      console.log(res?.text);
    } catch (err) {
      // TODO: store metadata if failed to retrieve content.
      console.error(`ERROR: ${url}`);
      console.error(err.message);
    }
  }
}
