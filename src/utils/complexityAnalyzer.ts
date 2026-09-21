/**
 * Automatic Time and Space Complexity Analyzer for DSA Solutions
 * Supports C++, Java, Python, JavaScript, TypeScript, Go, and Rust.
 */

export interface ComplexityResult {
  timeComplexity: string;
  spaceComplexity: string;
  detectedFrom: 'comments' | 'analysis' | 'default';
  reason?: string;
}

/**
 * Normalizes complexity strings like "O(N)" -> "O(n)", "O(N log N)" -> "O(n log n)"
 */
function normalizeComplexity(str: string): string {
  let cleaned = str.trim();
  // Remove wrapping quotes, brackets, colons, semicolons
  cleaned = cleaned.replace(/^['":`]+|['";.,`]+$/g, '').trim();

  // If already starts with O(...)
  if (!/^[oO]\s*\(/i.test(cleaned)) {
    cleaned = `O(${cleaned})`;
  } else {
    cleaned = cleaned.replace(/^[oO]\s*\(/i, 'O(');
  }

  // Capitalize O and lowercase standard variables
  cleaned = cleaned.replace(/\bN\b/g, 'n');
  cleaned = cleaned.replace(/\bM\b/g, 'm');
  cleaned = cleaned.replace(/\bK\b/g, 'k');
  cleaned = cleaned.replace(/\bLOG\b/gi, 'log');

  // Convert ^2 -> ², ^3 -> ³, ^n -> ⁿ
  cleaned = cleaned.replace(/\^2\b|\^2(?=\))/g, '²');
  cleaned = cleaned.replace(/\^3\b|\^3(?=\))/g, '³');
  cleaned = cleaned.replace(/\^[nN]\b|\^[nN](?=\))/g, 'ⁿ');

  // Clean inner spaces: O( n ) -> O(n), O(n+m) -> O(n + m)
  cleaned = cleaned.replace(/^O\(\s+/, 'O(').replace(/\s+\)$/, ')');
  cleaned = cleaned.replace(/([a-zA-Z0-9])\s*\+\s*([a-zA-Z0-9])/g, '$1 + $2');

  return cleaned;
}

/**
 * 1. Attempt to extract complexity explicitly written in comments or docstrings.
 */
function extractFromComments(code: string): { time?: string; space?: string } | null {
  // Common comment patterns:
  // Time: O(n), Space: O(1)
  // Time Complexity: O(n log n)
  // TC: O(n) | SC: O(1)
  // # Time: O(V + E)
  const timePatterns = [
    /(?:time\s*complexity|time\s*comp|\btc)\s*[:=-]\s*([^\n\r,;|]+)/i,
    /(?:time)\s*[:=-]\s*([oO]\([^)]+\)|[a-zA-Z0-9^()/*+\s-]+)/i
  ];

  const spacePatterns = [
    /(?:space\s*complexity|space\s*comp|auxiliary\s*space|\bsc)\s*[:=-]\s*([^\n\r,;|]+)/i,
    /(?:space)\s*[:=-]\s*([oO]\([^)]+\)|[a-zA-Z0-9^()/*+\s-]+)/i
  ];

  let foundTime: string | undefined;
  let foundSpace: string | undefined;

  for (const pattern of timePatterns) {
    const match = code.match(pattern);
    if (match && match[1]) {
      let candidate = match[1].split(/(?:,|\/|\||\band\b|\bspace\b|\bsc\b|\*\/)/i)[0].trim();
      candidate = candidate.replace(/^['":`]+|['";.,`]+$/g, '').trim();
      if (candidate.length > 0 && candidate.length < 25 && (candidate.includes('(') || /^[a-zA-Z0-9^/*+\s-]+$/.test(candidate))) {
        foundTime = normalizeComplexity(candidate);
        break;
      }
    }
  }

  for (const pattern of spacePatterns) {
    const match = code.match(pattern);
    if (match && match[1]) {
      let candidate = match[1].split(/(?:,|\/|\||\band\b|\btime\b|\btc\b|\*\/)/i)[0].trim();
      candidate = candidate.replace(/^['":`]+|['";.,`]+$/g, '').trim();
      if (candidate.length > 0 && candidate.length < 25 && (candidate.includes('(') || /^[a-zA-Z0-9^/*+\s-]+$/.test(candidate))) {
        foundSpace = normalizeComplexity(candidate);
        break;
      }
    }
  }

  if (foundTime || foundSpace) {
    return { time: foundTime, space: foundSpace };
  }

  return null;
}

/**
 * 2. Static heuristic code analysis
 */
export function analyzeComplexity(code: string, language = 'cpp'): ComplexityResult {
  if (!code || !code.trim()) {
    return {
      timeComplexity: '',
      spaceComplexity: '',
      detectedFrom: 'default'
    };
  }

  // First check comments
  const commentResult = extractFromComments(code);
  if (commentResult && (commentResult.time || commentResult.space)) {
    return {
      timeComplexity: commentResult.time || 'O(n)',
      spaceComplexity: commentResult.space || 'O(1)',
      detectedFrom: 'comments',
      reason: 'Extracted from solution comments'
    };
  }

  const cleanCode = code
    // Remove single line comments
    .replace(/\/\/.*$/gm, '')
    // Remove python comments
    .replace(/#.*$/gm, '')
    // Remove block comments
    .replace(/\/\*[\s\S]*?\*\//g, '');

  let estimatedTime = 'O(n)';
  let estimatedSpace = 'O(1)';
  let reason = '';

  // ---- TIME COMPLEXITY ANALYSIS ----

  // Check for Exponential/Backtracking patterns:
  const hasBacktrack = /\b(backtrack|subsets|permute|combinations|nqueens|solveSudoku)\b/i.test(cleanCode) ||
    /(\w+)\s*\([^)]*\)[\s\S]*?\1\s*\([^)]*\)[\s\S]*?\1\s*\([^)]*\)/.test(cleanCode);

  // Check for Binary Search:
  const hasBinarySearch = (
    /while\s*\(\s*\w+\s*(?:<=|<)\s*\w+\s*\)/.test(cleanCode) ||
    /while\s+\w+\s*<=\s*\w+/.test(cleanCode)
  ) && (
    /(>>\s*1|\/\s*2|mid\s*=\s*(?:left|low|start))/i.test(cleanCode) ||
    /\b(binary_search|lower_bound|upper_bound|bisect)\b/i.test(cleanCode)
  );

  // Check for Sorting:
  const hasSorting = /\b(sort|sorted|Arrays\.sort|std::sort|Collections\.sort|sort\.Slice)\b/i.test(cleanCode);

  // Check for Priority Queue / Heap in loop:
  const hasHeapOps = /\b(PriorityQueue|heapq|priority_queue|minHeap|maxHeap)\b/i.test(cleanCode) &&
    /\b(push|pop|poll|add|offer|heappop|heappush)\b/i.test(cleanCode);

  // Loop count heuristic (counting loop keywords):
  const loopMatches = cleanCode.match(/\b(for|while)\b/g) || [];
  const loopCount = loopMatches.length;

  // Nested loops detection (rough block indentation / nesting check):
  const hasNestedLoops = (
    /(?:for|while)\b[^{};]*\{[^}]*(?:for|while)\b/s.test(cleanCode) ||
    // Python indentation nesting
    /(?:for|while)\s+[^\n:]+:\s*\n(?:\s{4,}|\t+)[^\n]*\n(?:\s{4,}|\t+)(?:for|while)\s+/s.test(cleanCode)
  );

  const hasTripleNestedLoops = (
    /(?:for|while)\b[^{};]*\{[^}]*(?:for|while)\b[^{};]*\{[^}]*(?:for|while)\b/s.test(cleanCode) ||
    /(?:for|while)[^\n:]+:\s*\n(?:\s{4,}|\t+)[^\n]*\n(?:\s{4,}|\t+)(?:for|while)[^\n:]+:\s*\n(?:\s{8,}|\t\t+)(?:for|while)/s.test(cleanCode)
  );

  if (hasBacktrack) {
    estimatedTime = 'O(2ⁿ)';
    reason = 'Backtracking / branch exploration pattern detected';
  } else if (hasTripleNestedLoops) {
    estimatedTime = 'O(n³)';
    reason = 'Triple nested loops detected';
  } else if (hasNestedLoops) {
    estimatedTime = 'O(n²)';
    reason = 'Nested loop iteration detected';
  } else if (hasSorting || (hasHeapOps && loopCount > 0)) {
    estimatedTime = 'O(n log n)';
    reason = hasSorting ? 'Array sorting detected' : 'Heap operations in loop detected';
  } else if (hasBinarySearch) {
    estimatedTime = 'O(log n)';
    reason = 'Binary search interval halving detected';
  } else if (loopCount > 0 || /\.(map|forEach|filter|reduce)\b/.test(cleanCode)) {
    estimatedTime = 'O(n)';
    reason = 'Single linear pass detected';
  } else {
    estimatedTime = 'O(1)';
    reason = 'Constant time / direct arithmetic';
  }

  // ---- SPACE COMPLEXITY ANALYSIS ----

  // Check for 2D Matrix / DP Table:
  const has2DArray = (
    /(?:vector\s*<\s*vector|new\s+\w+\s*\[[^\]]+\]\s*\[[^\]]+\]|\[\s*\[\s*0\s*\]\s*\*\s*\w+\s+for|\bArray\s*\.\s*from\s*\([^)]*=>\s*new\s+Array)/i.test(cleanCode) ||
    /\bdp\s*\[[^\]]+\]\s*\[[^\]]+\]/.test(cleanCode)
  );

  // Check for 1D Data Structures (HashMap, HashSet, List, Queue, Stack, 1D DP):
  const has1DCollections = (
    /\b(HashMap|HashSet|unordered_map|unordered_set|Map|Set|dict|list|ArrayList|vector\s*<|Array|stack|queue|deque|heapq|PriorityQueue)\b/i.test(cleanCode) ||
    /new\s+\w+\s*\[\s*(?:n|len|size|\w+)\s*\]/i.test(cleanCode) ||
    /\bdp\s*=\s*(?:new|\[)/i.test(cleanCode) ||
    /\b(seen|visited|freq|memo|countMap)\b/i.test(cleanCode)
  );

  // Check for Recursion Stack:
  const hasRecursion = /(\w+)\s*\([^)]*\)\s*\{[^}]*\b\1\s*\(/s.test(cleanCode) ||
    /def\s+(\w+)\s*\([^)]*\):[^]*?\b\1\s*\(/s.test(cleanCode);

  if (has2DArray) {
    estimatedSpace = 'O(n²)';
  } else if (has1DCollections) {
    estimatedSpace = 'O(n)';
  } else if (hasRecursion && hasBinarySearch) {
    estimatedSpace = 'O(log n)';
  } else if (hasRecursion) {
    estimatedSpace = 'O(n)';
  } else {
    estimatedSpace = 'O(1)';
  }

  return {
    timeComplexity: estimatedTime,
    spaceComplexity: estimatedSpace,
    detectedFrom: 'analysis',
    reason
  };
}
