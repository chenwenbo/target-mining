import { Fragment } from "react";

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(
        <strong key={`${keyBase}-b-${i}`} className="font-semibold text-[#0f172a]">
          {m[1]}
        </strong>,
      );
    } else if (m[2] !== undefined) {
      parts.push(
        <code
          key={`${keyBase}-c-${i}`}
          className="px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[12px] font-mono text-[#0f172a]"
        >
          {m[2]}
        </code>,
      );
    }
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={key++} className="text-lg font-semibold text-[#0f172a] mt-2 mb-2">
          {renderInline(line.slice(2), `h1-${key}`)}
        </h1>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="text-[15px] font-semibold text-[#0f172a] mt-3 mb-1.5">
          {renderInline(line.slice(3), `h2-${key}`)}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={key++} className="text-sm font-semibold text-[#0f172a] mt-2 mb-1">
          {renderInline(line.slice(4), `h3-${key}`)}
        </h3>,
      );
      i += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={key++}
          className="border-l-2 border-amber-400 bg-amber-50 px-3 py-2 my-2 text-[13px] text-[#475569] rounded-r"
        >
          {renderInline(line.slice(2), `bq-${key}`)}
        </blockquote>,
      );
      i += 1;
      continue;
    }

    if (line.startsWith("|") && i + 1 < lines.length && /^\|[\s|:-]+\|$/.test(lines[i + 1])) {
      const headerCells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].startsWith("|")) {
        rows.push(
          lines[j]
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim()),
        );
        j += 1;
      }
      blocks.push(
        <div key={key++} className="overflow-x-auto my-2">
          <table className="text-[13px] border-collapse w-full">
            <thead>
              <tr className="bg-[#f8fafc]">
                {headerCells.map((c, ci) => (
                  <th
                    key={ci}
                    className="border border-[#e5e7eb] px-2.5 py-1.5 text-left font-semibold text-[#475569]"
                  >
                    {renderInline(c, `th-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border border-[#e5e7eb] px-2.5 py-1.5 text-[#0f172a]">
                      {renderInline(c, `td-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      i = j;
      continue;
    }

    if (/^(\d+)\.\s/.test(line) || line.startsWith("- ")) {
      const items: string[] = [];
      const ordered = /^\d+\.\s/.test(line);
      while (
        i < lines.length &&
        (ordered ? /^\d+\.\s/.test(lines[i]) : lines[i].startsWith("- "))
      ) {
        items.push(lines[i].replace(ordered ? /^\d+\.\s/ : /^- /, ""));
        i += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={key++}
          className={`${
            ordered ? "list-decimal" : "list-disc"
          } pl-5 my-1.5 space-y-0.5 text-[13.5px] text-[#334155]`}
        >
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `li-${idx}`)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    blocks.push(
      <p key={key++} className="text-[13.5px] text-[#334155] my-1.5 leading-relaxed">
        {renderInline(line, `p-${key}`)}
      </p>,
    );
    i += 1;
  }

  return <Fragment>{blocks}</Fragment>;
}
