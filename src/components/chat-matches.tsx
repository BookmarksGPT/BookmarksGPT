import React, { useEffect, useRef, useState } from 'react';

const ChatMatches = ({ matches }) => {
  const [expand, setExpand] = useState(false);
  const topMatchesRef = useRef<null | HTMLLIElement>(null);
  const bottomMatchesRef = useRef<null | HTMLLIElement>(null);
  console.log(`I have ${matches?.length} matches to display.`);
  function onClick() {
    setExpand((previous) => !previous);
  }

  useEffect(() => {
    if (expand) {
      bottomMatchesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      topMatchesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [expand]);

  return (
    <>
      <ol className="list-decimal pl-5 space-y-2">
        {matches?.slice(0, 3).map(({ pageContent, metadata, score }, index) => {
          return (
            <li
              className=""
              ref={index === 0 ? topMatchesRef : null}
            >
              <a
                onClick={() => {
                  chrome.tabs.create({ url: metadata?.url });
                }}
                className="dark:text-blue-200 text-blue-800 hover:text-blue-500 hover:underline cursor-pointer"
              >
                {metadata.title}
              </a>
              <br />
              <small>{metadata?.url?.split('?')[0]}</small>
              <br />
              <small>
                [{~~((score * 10000) / 100)}%] saved on {new Date(metadata?.createdAt).toLocaleDateString()}
                {/* saved on {new Date(metadata?.createdAt).toLocaleDateString()} */}
              </small>
            </li>
          );
        })}
        {matches?.slice(3).map(({ pageContent, metadata, score }, index) => {
          return (
            <li
              className={`${expand ? '' : 'hidden'}`}
              ref={index === matches.slice(3).length - 1 ? bottomMatchesRef : null}
            >
              <a
                onClick={() => {
                  chrome.tabs.create({ url: metadata?.url });
                }}
                className="dark:text-blue-200 text-blue-800 hover:text-blue-500 hover:underline cursor-pointer"
              >
                {metadata.title}
              </a>
              <br />
              <small>{metadata?.url?.split('?')[0]}</small>
              <br />
              <small>
                [{~~((score * 10000) / 100)}%] saved on {new Date(metadata?.createdAt).toLocaleDateString()}
                {/* saved on {new Date(metadata?.createdAt).toLocaleDateString()} */}
              </small>
            </li>
          );
        })}
        {matches?.length > 3 && <button onClick={onClick}>{expand ? 'click for less' : 'click for more'}</button>}
      </ol>
    </>
  );
};
export default ChatMatches;
