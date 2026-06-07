import Link from "next/link";

interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, any> }[];
}

export function TiptapRenderer({ content }: { content: any }) {
  if (!content || typeof content !== "object") return null;
  const doc = content as TiptapNode;

  if (doc.type === "doc" && doc.content) {
    return (
      <div className="space-y-4">
        {doc.content.map((node, index) => (
          <RenderNode key={index} node={node} />
        ))}
      </div>
    );
  }

  return null;
}

function RenderNode({ node }: { node: TiptapNode }) {
  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level ?? 1;
      const HeadingTag = `h${level}` as any;
      const classes =
        {
          1: "font-title text-4xl md:text-5xl text-teal mt-12 mb-6 leading-tight",
          2: "font-title text-3xl md:text-4xl text-teal mt-10 mb-5 leading-tight",
          3: "font-subtitle text-xl font-bold text-teal mt-8 mb-4 tracking-wide",
          4: "font-subtitle text-lg font-bold text-teal mt-6 mb-3",
          5: "font-subtitle text-base font-bold text-teal mt-4 mb-2",
          6: "font-subtitle text-sm font-bold text-teal mt-4 mb-2",
        }[level as 1 | 2 | 3 | 4 | 5 | 6] ||
        "font-title text-3xl text-teal mt-10 mb-5";

      return (
        <HeadingTag className={classes}>
          <RenderChildren nodes={node.content} />
        </HeadingTag>
      );
    }
    case "paragraph":
      return (
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          <RenderChildren nodes={node.content} />
        </p>
      );
    case "blockquote":
      return (
        <blockquote className="border-l-4 border-terracotta bg-cream/10 p-6 my-8 rounded-r-2xl italic text-teal/95 font-body text-lg">
          <RenderChildren nodes={node.content} />
        </blockquote>
      );
    case "bulletList":
      return (
        <ul className="list-disc pl-6 mb-6 space-y-2 font-body text-lg text-teal/80">
          <RenderChildren nodes={node.content} />
        </ul>
      );
    case "orderedList":
      return (
        <ol className="list-decimal pl-6 mb-6 space-y-2 font-body text-lg text-teal/80">
          <RenderChildren nodes={node.content} />
        </ol>
      );
    case "listItem":
      return (
        <li>
          <RenderChildren nodes={node.content} />
        </li>
      );
    case "horizontalRule":
      return <hr className="my-8 border-cream/50" />;
    case "image":
      if (node.attrs?.src) {
        return (
          <div className="my-8 rounded-2xl overflow-hidden shadow-md max-w-full">
            <img
              src={node.attrs.src}
              alt={node.attrs.alt || ""}
              className="w-full h-auto"
            />
          </div>
        );
      }
      return null;
    default:
      return null;
  }
}

function RenderChildren({ nodes }: { nodes?: TiptapNode[] }) {
  if (!nodes) return null;
  return (
    <>
      {nodes.map((child, index) => {
        if (child.type === "text") {
          return <RenderText key={index} node={child} />;
        }
        return <RenderNode key={index} node={child} />;
      })}
    </>
  );
}

function RenderText({ node }: { node: TiptapNode }) {
  let content: React.ReactNode = node.text ?? "";

  if (node.marks) {
    for (const mark of node.marks) {
      if (mark.type === "bold") {
        content = <strong>{content}</strong>;
      }
      if (mark.type === "italic") {
        content = <em>{content}</em>;
      }
      if (mark.type === "strike") {
        content = <span className="line-through">{content}</span>;
      }
      if (mark.type === "code") {
        content = (
          <code className="bg-cream/20 px-1 py-0.5 rounded text-sm">
            {content}
          </code>
        );
      }
      if (mark.type === "link" && mark.attrs?.href) {
        content = (
          <Link
            href={mark.attrs.href}
            className="text-terracotta hover:underline decoration-terracotta/40"
          >
            {content}
          </Link>
        );
      }
    }
  }

  return <>{content}</>;
}
