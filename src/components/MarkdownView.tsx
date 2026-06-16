import { createElement, type ReactNode } from "react";

const safeProtocols = new Set(["http:", "https:", "mailto:"]);

function safeHref(value: string): string | undefined {
  try {
    const url = new URL(value, "https://local-note.invalid");
    if (url.origin === "https://local-note.invalid" && value.startsWith("#")) return value;
    return safeProtocols.has(url.protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let index = 0;

  for (const match of text.matchAll(pattern)) {
    const value = match[0];
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));

    if (value.startsWith("`")) {
      nodes.push(<code key={`${keyPrefix}-code-${index}`}>{value.slice(1, -1)}</code>);
    } else if (value.startsWith("**")) {
      nodes.push(<strong key={`${keyPrefix}-strong-${index}`}>{value.slice(2, -2)}</strong>);
    } else if (value.startsWith("*")) {
      nodes.push(<em key={`${keyPrefix}-em-${index}`}>{value.slice(1, -1)}</em>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(value);
      const href = link ? safeHref(link[2]) : undefined;
      nodes.push(href
        ? <a key={`${keyPrefix}-link-${index}`} href={href} target="_blank" rel="noreferrer">{link?.[1]}</a>
        : value);
    }

    cursor = start + value.length;
    index += 1;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={`code-${index}`}><code>{code.join("\n")}</code></pre>
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(createElement(`h${level}`, { key: `heading-${index}` }, renderInline(heading[2], `h-${index}`)));
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(<blockquote key={`quote-${index}`}>{quote.map((item, itemIndex) => <p key={itemIndex}>{renderInline(item, `q-${index}-${itemIndex}`)}</p>)}</blockquote>);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(<ul key={`ul-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `ul-${index}-${itemIndex}`)}</li>)}</ul>);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(<ol key={`ol-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `ol-${index}-${itemIndex}`)}</li>)}</ol>);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={`hr-${index}`} />);
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length
      && lines[index].trim()
      && !/^(#{1,6})\s+/.test(lines[index])
      && !/^```/.test(lines[index])
      && !/^>\s?/.test(lines[index])
      && !/^\s*[-*]\s+/.test(lines[index])
      && !/^\s*\d+\.\s+/.test(lines[index])
      && !/^---+$/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={`p-${index}`}>{renderInline(paragraph.join(" "), `p-${index}`)}</p>);
  }

  return <div className="markdown-preview" aria-label="Markdown 预览">{blocks.length ? blocks : <p className="preview-empty">暂无内容</p>}</div>;
}

function highlightInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let index = 0;

  for (const match of text.matchAll(pattern)) {
    const value = match[0];
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(<span className="md-token md-inline" key={`${keyPrefix}-${index}`}>{value}</span>);
    cursor = start + value.length;
    index += 1;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function MarkdownHighlight({ content }: { content: string }) {
  return (
    <>
      {content.split(/(\r?\n)/).map((part, index) => {
        if (/^\r?\n$/.test(part)) return part;
        const lineToken = /^(#{1,6}\s+|>\s?|[-*]\s+|\d+\.\s+|```\w*|---+$)/.exec(part);
        if (!lineToken) return <span key={index}>{highlightInline(part, `line-${index}`)}</span>;
        return (
          <span key={index}>
            <span className="md-token md-block">{lineToken[1]}</span>
            {highlightInline(part.slice(lineToken[1].length), `line-${index}`)}
          </span>
        );
      })}
    </>
  );
}
