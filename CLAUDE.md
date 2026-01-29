# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookmarksGPT is a Chrome Extension (Manifest v3) that uses AI to organize, search, and manage bookmarks. It provides a chat interface shown as an iframe overlay on web pages.

## Build Commands

```bash
yarn build        # Full build: clears dist, compiles Tailwind CSS, runs Webpack
```

No test suite or lint npm scripts are currently defined.

## Architecture

### Entry Points
- **src/popup.tsx** - Main popup UI entry point (React)
- **src/service-workers/background.ts** - Extension service worker handling lifecycle and message passing

### Core Libraries (src/lib/)
- **bookmarks.ts** - Bookmark management and vector store operations
- **conversation.ts** - LangChain conversation chain setup
- **responseAgent.ts** - LangChain agent for bookmark queries
- **Summarization.ts** - Website summarization logic
- **WebPages.ts** - Web page database operations
- **website.ts** - Website content fetching and processing

### UI Components (src/components/)
React components for the chat interface (bubbles, input box, header, matches display).

### Data Storage
Three PouchDB databases (IndexedDB-backed):
1. `BookmarksGPT` - conversation history and messages
2. `BookmarksGPTVectors` - bookmark embeddings and vectors
3. `BookmarksGPTWebPages` - website content and summaries

## Tech Stack

- **UI**: React 18, TypeScript, Tailwind CSS, Flowbite
- **AI/ML**: LangChain (chains, embeddings, vector stores, agents), OpenAI API
- **Storage**: PouchDB with pouchdb-find and pouchdb-upsert plugins
- **Build**: Webpack, Babel
- **Monitoring**: Helicone.ai for OpenAI cost tracking (optional)

## Environment Variables

Copy `.env.sample` to `.env` and configure:
- `OPENAI_API_KEY` - Required
- `HELICONEAI_API_KEY` - Optional, for cost monitoring
- `COHERE_TRIAL_API_KEY` - Optional, for alternative summarization

## Development

1. Run `yarn build` after changes
2. Load `dist/` folder as unpacked extension in Chrome (chrome://extensions)
3. Toggle extension with `Cmd+Shift+F` (Mac) or `Ctrl+Shift+F` (Windows/Linux)
