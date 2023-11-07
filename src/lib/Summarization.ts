import { Document } from 'langchain/document';
import { loadSummarizationChain } from 'langchain/chains';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { WebPages } from './WebPages.ts';
import { v4 as uuidv4 } from 'uuid';

export class Summarization {
  static async generateVectorsFromChunks(llm, url, chunks?) {
    // get existing document 
    const doc = (await WebPages.db.find({ selector: { _id: url } })).docs?.[0];

    const fullUrl = new URL(url);
    return Promise.allSettled(
      chunks.map((chunk) => {
        return WebPages.vectorStore.addDocuments([
          {
            pageContent: `
              [URL]: ${fullUrl.hostname}${fullUrl.pathname}\n
              [TITLE]: ${doc.title}\n
              [CREATED AT]: ${doc.createdAt}\n\n
              [SECTION]: \n
              ${chunk}\n
          `,
            metadata: {
              index: uuidv4(),
              title: doc.title,
              url: doc._id,
              createdAt: doc.createdAt,
              description: doc.description,
            },
          },
        ]);
      })
    );
  }

  static async findVectorsWithContext(llm, url, context) {
    WebPages.vectorStore.similaritySearch
  }

  static async generateSummaryFromChunks(llm, url, chunks?, context?) {
    try {
      const newDocuments = chunks.map(
        (pageContent) =>
          new Document({
            pageContent,
            metadata: { url },
          })
      );

      console.info(
        `WebPages::generateSummary newDocuments ${newDocuments.length} chars: ${newDocuments.reduce(
          (sum, doc) => sum + doc.pageContent.length,
          0
        )} `
      );

      const chain = loadSummarizationChain(llm, { type: 'map_reduce', verbose: true });
      const res = await chain.call({
        input_documents: newDocuments,
        timeout: 45000,
      });
      // res.text <-- summary
      console.info('WebPages::generateSummary res.text', res?.text);
      return res?.text;
    } catch (err) {
      console.error(err);
    }
  }

  static async generateStructuredSummaryFromChunks(llm, url, chunks?, structure?) {
    try {
      const newDocuments = chunks.map(
        (pageContent) =>
          new Document({
            pageContent,
            metadata: { url },
          })
      );

      // TODO: semantic ranking to figure out sections with information at the top of the page
      // TODO: better clean-up html
      newDocuments.splice(2);

      const tokens = await Promise.allSettled(newDocuments.map((doc) => llm.getNumTokens(doc.pageContent))).then(
        (result) => {
          const tokens = result.map((r) => (r.status === 'fulfilled' ? r.value : 0));
          const tokensEstimate = tokens.reduce((sum, token) => sum + token, 0);
          return tokensEstimate;
        }
      );

      console.info(`tokens ${tokens}`);
      console.info(`WebPages::generateStructuredSummaryFromChunks newDocuments ${newDocuments.length} `);

      const parser = StructuredOutputParser.fromNamesAndDescriptions(structure);
      const instructions = parser.getFormatInstructions();
      const combinePrompt = new PromptTemplate({
        inputVariables: ['text'],
        template: `
        Extract data about the product from this "WEB PAGE EXCERPT" and provide a response in JSON format. "WEB PAGE EXCERPT" is a section from a web page with information regarding a specific product, either from the product manufacturer, a distributor or a retailer. The "WEB PAGE EXCERPT" may or may not include all the data requested. Only include data that can be clearly referenced.\n
        You must format your output as a JSON value that adheres to a given "JSON Schema" instance.\n
        Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!\n
        Here is the "JSON Schema" instance your output must adhere to:\n
        {format_instructions}\n\n
        The response should be presented in a markdown JSON codeblock.\n
        \n
        "WEB PAGE EXCERPT": \n
        {text}`,
        partialVariables: { format_instructions: JSON.stringify(structure) },
      });
      console.info('WebPages::generateStructuredSummaryFromChunks combinePrompt', combinePrompt);

      // const chain = loadSummarizationChain(WebPages.llm, {
      //   type: 'map_reduce',
      //   verbose: true,
      //   combinePrompt,
      // });
      //
      // const res = await chain.call({
      //   input_documents: newDocuments,
      //   timeout: 45000,
      // });
      // console.info('WebPages::generateStructuredSummaryFromChunks res.text', res?.text);
      // return res?.text;
    } catch (err) {
      console.error(err);
    }
  }
}
