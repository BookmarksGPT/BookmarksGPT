
# BookmarksGPT

BookmarksGPT is a chrome extension which organizes and searches your bookmarks using GPT.

**The project is still in progress**




## Run Locally

Clone the project

```bash
  git clone https://github.com/gevou/BookmarksGPT.git
```

Go to the project directory

```bash
  cd BookmarksGPT
```

Install dependencies

```bash
  yarn install
```

Create a `.env` file with your OpenAI API key. See `.env.sample`.

Build the extension

```bash
  yarn build
```

Go to Chrome
1. go to `Extensions` (click here: [chrome://extensions/](chrome://extensions/))
2. Enable `developer` mode (top right corner)
3. Click `Load unpacked` and select the generated `dist` directory inside the project directory.


