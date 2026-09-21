import React from 'react';

interface CodeSyntaxHighlighterProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export const CodeSyntaxHighlighter: React.FC<CodeSyntaxHighlighterProps> = ({
  code,
  language = 'cpp',
  showLineNumbers = true
}) => {
  if (!code || !code.trim()) {
    return (
      <div className="p-4 text-xs italic text-slate-500 font-mono">
        // No code added yet. Click &quot;Edit Code&quot; to write or paste your solution.
      </div>
    );
  }

  const lines = code.split('\n');

  return (
    <div className="flex font-mono text-xs leading-relaxed overflow-x-auto select-text bg-[#0d1117] text-slate-200">
      {/* Line Numbers Gutter */}
      {showLineNumbers && (
        <div className="py-3 px-2.5 select-none text-right text-slate-600 bg-[#0d1117] border-r border-slate-800/80 shrink-0 min-w-[40px]">
          {lines.map((_, i) => (
            <div key={i} className="leading-relaxed">
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Highlighted Code Content */}
      <div className="py-3 px-4 flex-1 whitespace-pre">
        {lines.map((line, i) => (
          <div key={i} className="leading-relaxed">
            {highlightLine(line, language) || ' '}
          </div>
        ))}
      </div>
    </div>
  );
};

// Precise token-based line syntax highlighter
function highlightLine(line: string, language: string): React.ReactNode {
  if (!line) return null;

  // Check for full line comments
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || (language === 'python' && trimmed.startsWith('#')) || trimmed.startsWith('/*')) {
    return <span className="text-[#7f848e] italic">{line}</span>;
  }

  // Tokenize line using regex matching: comments, strings, numbers, identifiers, symbols
  const tokenRegex = /(\/\/.*$|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]\w*\b|[{}()[\];,=+\-*/%&|^!<>?:~]|\s+)/g;
  const tokens = line.split(tokenRegex).filter(Boolean);

  return tokens.map((token, idx) => {
    // 1. Comments
    if (token.startsWith('//') || (language === 'python' && token.startsWith('#'))) {
      return <span key={idx} className="text-[#7f848e] italic">{token}</span>;
    }

    // 2. Strings
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      return <span key={idx} className="text-[#98c379]">{token}</span>;
    }

    // 3. Numbers
    if (/^\d+(\.\d+)?$/.test(token)) {
      return <span key={idx} className="text-[#d19a66]">{token}</span>;
    }

    // 4. Keywords
    if (KEYWORDS.has(token)) {
      return <span key={idx} className="text-[#c678dd] font-medium">{token}</span>;
    }

    // 5. Types & Classes
    if (TYPES.has(token) || /^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
      return <span key={idx} className="text-[#e5c07b] font-medium">{token}</span>;
    }

    // 6. Built-in functions / methods (followed by '(' in original line or common names)
    if (METHODS.has(token)) {
      return <span key={idx} className="text-[#61afef]">{token}</span>;
    }

    // 7. Operators & Brackets
    if (/^[{}()[\]]$/.test(token)) {
      return <span key={idx} className="text-[#e06c75]">{token}</span>;
    }
    if (/^[=+\-*/%&|^!<>?:~;,]$/.test(token)) {
      return <span key={idx} className="text-[#56b6c2]">{token}</span>;
    }

    // Identifiers / Variables
    return <span key={idx} className="text-[#abb2bf]">{token}</span>;
  });
}

const KEYWORDS = new Set([
  'public', 'private', 'protected', 'static', 'final', 'class', 'interface', 'extends', 'implements',
  'return', 'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'switch', 'case', 'default',
  'new', 'this', 'super', 'void', 'import', 'package', 'try', 'catch', 'finally', 'throw', 'throws',
  'def', 'elif', 'pass', 'lambda', 'yield', 'with', 'as', 'from', 'in', 'is', 'not', 'and', 'or',
  'struct', 'typedef', 'const', 'auto', 'nullptr', 'NULL', 'null', 'true', 'false', 'bool', 'boolean',
  'func', 'package', 'type', 'var', 'let', 'async', 'await', 'fn', 'mut', 'pub', 'impl', 'match'
]);

const TYPES = new Set([
  'int', 'long', 'float', 'double', 'char', 'byte', 'short', 'String', 'Integer', 'Long', 'Float',
  'Double', 'Boolean', 'Character', 'Object', 'Arrays', 'Collections', 'List', 'ArrayList', 'LinkedList',
  'Map', 'HashMap', 'TreeMap', 'Set', 'HashSet', 'TreeSet', 'Queue', 'Deque', 'ArrayDeque', 'Stack',
  'PriorityQueue', 'Math', 'System', 'Solution', 'ListNode', 'TreeNode', 'vector', 'string', 'unordered_map',
  'unordered_set', 'pair', 'tuple', 'size_t'
]);

const METHODS = new Set([
  'length', 'size', 'sort', 'findContentChildren', 'max', 'min', 'abs', 'push', 'pop', 'push_back',
  'append', 'add', 'get', 'put', 'contains', 'containsKey', 'indexOf', 'charAt', 'substring',
  'println', 'print', 'reverse', 'fill', 'binarySearch', 'twoSum', 'threeSum', 'maxArea'
]);
