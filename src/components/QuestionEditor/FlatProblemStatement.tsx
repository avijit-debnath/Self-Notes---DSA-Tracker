import React from 'react';

interface FlatProblemStatementProps {
  content: string;
}

export const FlatProblemStatement: React.FC<FlatProblemStatementProps> = ({ content }) => {
  if (!content || !content.trim()) {
    return (
      <div className="py-8 px-4 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-[#161b22]/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        No problem statement yet. Paste a problem link above to auto-sync, or click &ldquo;Edit Text&rdquo; to write your own.
      </div>
    );
  }

  // Parse sections (Description, Examples, Constraints, Notes)
  const lines = content.split('\n');
  const sections: React.ReactNode[] = [];
  let currentBlock: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const flushParagraph = (block: string[], key: string | number) => {
    if (block.length === 0) return null;
    const text = block.join('\n').trim();
    if (!text) return null;

    // Check if this block is an Example heading
    if (/^(\*\*|\#\#\#\s*)?Example\s*\d+/i.test(text)) {
      return (
        <h4 key={key} className="text-xs font-bold text-slate-900 dark:text-white mt-4 mb-2">
          {text.replace(/[\*#]/g, '').trim()}
        </h4>
      );
    }

    // Check if this block is Constraints heading
    if (/^(\*\*|\#\#\#\s*)?Constraints:?/i.test(text)) {
      return (
        <h4 key={key} className="text-xs font-bold text-slate-900 dark:text-white mt-5 mb-2">
          Constraints:
        </h4>
      );
    }

    // Format inline markdown (bold and inline code `code`)
    const formattedNodes = formatInlineMarkdown(text);

    // If it's a list item
    if (text.startsWith('- ') || text.startsWith('* ') || text.startsWith('\t- ')) {
      const items = text.split(/\n(?=[-*\t])/);
      return (
        <ul key={key} className="list-disc pl-5 my-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          {items.map((item, idx) => (
            <li key={idx}>
              {formatInlineMarkdown(item.replace(/^[-*\t\s]+/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={key} className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed my-2.5 font-sans">
        {formattedNodes}
      </p>
    );
  };

  const flushCodeBlock = (codeLines: string[], key: string | number) => {
    const rawCode = codeLines.join('\n').trim();
    if (!rawCode) return null;

    // Clean markdown bold markers inside code if present
    const cleanLines = rawCode.split('\n').map(line => {
      return line.replace(/\*\*(.*?)\*\*/g, '$1');
    });

    return (
      <div
        key={key}
        className="my-3 p-3.5 rounded-lg bg-slate-100/90 dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm overflow-x-auto whitespace-pre-wrap"
      >
        {cleanLines.map((line, idx) => {
          if (line.startsWith('Input:') || line.startsWith('Output:') || line.startsWith('Explanation:')) {
            const [prefix, ...rest] = line.split(':');
            return (
              <div key={idx} className="my-0.5">
                <span className="font-bold text-slate-900 dark:text-white">{prefix}:</span>
                <span className="text-slate-700 dark:text-slate-300 ml-1.5">{rest.join(':')}</span>
              </div>
            );
          }
          return <div key={idx}>{line}</div>;
        })}
      </div>
    );
  };

  let nodeIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        const node = flushCodeBlock(codeBlockContent, `code_${nodeIndex++}`);
        if (node) sections.push(node);
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block - flush previous paragraph first
        const node = flushParagraph(currentBlock, `p_${nodeIndex++}`);
        if (node) sections.push(node);
        currentBlock = [];
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
    } else {
      if (line.trim() === '') {
        const node = flushParagraph(currentBlock, `p_${nodeIndex++}`);
        if (node) sections.push(node);
        currentBlock = [];
      } else {
        currentBlock.push(line);
      }
    }
  }

  // Flush remaining
  if (inCodeBlock && codeBlockContent.length > 0) {
    const node = flushCodeBlock(codeBlockContent, `code_${nodeIndex++}`);
    if (node) sections.push(node);
  } else if (currentBlock.length > 0) {
    const node = flushParagraph(currentBlock, `p_${nodeIndex++}`);
    if (node) sections.push(node);
  }

  return (
    <div className="flat-statement bg-white dark:bg-[#0d1117] py-1 select-text">
      {sections}
    </div>
  );
};

// Helper to format inline code (`code`) and bold (**bold**)
function formatInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to split on code `...` or bold **...**
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 text-[11px] font-mono rounded bg-slate-100 dark:bg-[#21262d] text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
