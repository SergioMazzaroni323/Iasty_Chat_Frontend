"use client";

import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

function extractCodeFromPre(children: ReactNode): { code: string; language?: string } | null {
  const child = Array.isArray(children) ? children[0] : children;
  if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) return null;

  const code = String(child.props.children ?? "").replace(/\n$/, "");
  if (!code) return null;

  const language = /language-(\w+)/.exec(child.props.className || "")?.[1];
  return { code, language };
}

const markdownComponents: Components = {
  pre({ children }: ComponentPropsWithoutRef<"pre">) {
    const extracted = extractCodeFromPre(children);
    if (extracted) {
      return <CodeBlock code={extracted.code} language={extracted.language} />;
    }
    return <pre className="prose-pre-fallback">{children}</pre>;
  },
  code({ className, children, ...props }) {
    return (
      <code className={className ? className : "prose-inline-code"} {...props}>
        {children}
      </code>
    );
  },
};

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none text-[0.9375rem] leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
