import React from 'react';

interface FlatApproachViewProps {
  content: string;
}

export const FlatApproachView: React.FC<FlatApproachViewProps> = ({ content }) => {
  if (!content || !content.trim()) {
    return (
      <div className="py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-[#161b22]/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        No approach notes added yet. Click &ldquo;Edit Approach&rdquo; above to write your algorithm explanation, steps, or intuition.
      </div>
    );
  }

  // Parse lines into clean markdown paragraphs, headings, bullet lists, numbered lists
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let isNumberedList = false;

  const flushList = (key: string | number) => {
    if (currentList.length === 0) return null;
    const items = [...currentList];
    currentList = [];

    if (isNumberedList) {
      return (
        <ol key={key} className="list-decimal pl-5 my-2 space-y-1 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
          {items.map((it, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: renderInlineFormatting(it) }} />
          ))}
        </ol>
      );
    } else {
      return (
        <ul key={key} className="list-disc pl-5 my-2 space-y-1 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
          {items.map((it, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: renderInlineFormatting(it) }} />
          ))}
        </ul>
      );
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      const listNode = flushList(`list_${i}`);
      if (listNode) elements.push(listNode);
      continue;
    }

    // Heading 2 or 3
    if (line.startsWith('### ') || line.startsWith('## ')) {
      const listNode = flushList(`list_${i}`);
      if (listNode) elements.push(listNode);
      const headingText = line.replace(/^#{2,3}\s*/, '');
      elements.push(
        <h4 key={`h_${i}`} className="text-xs font-bold text-slate-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: renderInlineFormatting(headingText) }} />
        </h4>
      );
      continue;
    }

    // Numbered list: e.g. "1. Step", "2. Step"
    if (/^\d+\.\s+/.test(line)) {
      if (currentList.length > 0 && !isNumberedList) {
        const listNode = flushList(`list_${i}`);
        if (listNode) elements.push(listNode);
      }
      isNumberedList = true;
      currentList.push(line.replace(/^\d+\.\s+/, ''));
      continue;
    }

    // Bullet list: e.g. "- item" or "* item"
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentList.length > 0 && isNumberedList) {
        const listNode = flushList(`list_${i}`);
        if (listNode) elements.push(listNode);
      }
      isNumberedList = false;
      currentList.push(line.replace(/^[-*]\s+/, ''));
      continue;
    }

    // Otherwise standard paragraph
    const listNode = flushList(`list_${i}`);
    if (listNode) elements.push(listNode);

    elements.push(
      <p
        key={`p_${i}`}
        className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed my-2 font-sans"
        dangerouslySetInnerHTML={{ __html: renderInlineFormatting(line) }}
      />
    );
  }

  // Flush any remaining list
  if (currentList.length > 0) {
    const listNode = flushList('list_end');
    if (listNode) elements.push(listNode);
  }

  return (
    <div className="py-2 px-1 select-text">
      {elements}
    </div>
  );
};

// Formats inline markdown and preserves HTML marks/spans
function renderInlineFormatting(text: string): string {
  if (!text) return '';

  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-[#21262d] text-indigo-600 dark:text-indigo-400 font-mono text-[11px] border border-slate-200/60 dark:border-slate-700/60">$1</code>');
}
