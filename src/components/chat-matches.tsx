import * as React from 'react';

export default function ChatMatches(flatten_matches: any) {
  return (
    <ol className="list-decimal pl-5 space-y-2">
      {flatten_matches?.map(({ pageContent, metadata, score }) => (
        <li className="">
          <a
            onClick={() => {
              chrome.tabs.create({ url: metadata?.url });
            }}
            className="dark:text-blue-200 text-blue-800 hover:text-blue-500 hover:underline cursor-pointer"
          >
            {pageContent}
          </a>
          <br />
          <small>{metadata?.url?.split('?')[0]}</small>
          <br />
          <small>
            [{~~((score * 10000) / 100)}%] created at {new Date(metadata?.createdAt).toLocaleDateString()}
          </small>
        </li>
      ))}
    </ol>
  );
}
