export interface ImportedProblemResult {
  success: boolean;
  data?: {
    title: string;
    url: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    statement: string;
    examples?: string;
    constraints?: string;
    tags: string[];
  };
  error?: string;
}

export async function importDSAProblem(urlStr: string): Promise<ImportedProblemResult> {
  try {
    const url = new URL(urlStr.trim());

    if (url.hostname.includes('leetcode.com')) {
      return await importLeetCodeProblem(urlStr);
    } else if (url.hostname.includes('geeksforgeeks.org')) {
      return await importGeeksForGeeksProblem(urlStr);
    } else {
      return await importGenericProblem(urlStr);
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Invalid URL or network error: ${err.message || err}`
    };
  }
}

async function importLeetCodeProblem(urlStr: string): Promise<ImportedProblemResult> {
  try {
    // Extract title slug from URL: e.g. https://leetcode.com/problems/two-sum/
    const match = urlStr.match(/problems\/([^/?#]+)/);
    if (!match) {
      throw new Error('Could not find LeetCode problem title slug in URL');
    }
    const titleSlug = match[1];

    // Query LeetCode's public GraphQL API for problem data
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          difficulty
          content
          topicTags {
            name
          }
        }
      }
    `;

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug }
      })
    });

    if (!response.ok) {
      throw new Error(`LeetCode API returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const q = json.data?.question;

    if (!q) {
      // Fallback: format title from slug
      const formattedTitle = titleSlug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return {
        success: true,
        data: {
          title: formattedTitle,
          url: urlStr,
          difficulty: 'Medium',
          statement: `Problem extracted from ${urlStr}.\n\nPlease review and paste the details.`,
          tags: ['LeetCode']
        }
      };
    }

    let cleanStatement = cleanHtmlStatement(q.content || '');
    const tags = (q.topicTags || []).map((t: any) => t.name);

    return {
      success: true,
      data: {
        title: q.title || titleSlug,
        url: urlStr,
        difficulty: (q.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
        statement: cleanStatement,
        tags: tags.length > 0 ? tags : ['LeetCode']
      }
    };
  } catch (err: any) {
    // Fallback gracefully to URL title extraction
    const slugMatch = urlStr.match(/problems\/([^/?#]+)/);
    const fallbackTitle = slugMatch
      ? slugMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'DSA Problem';

    return {
      success: true,
      data: {
        title: fallbackTitle,
        url: urlStr,
        difficulty: 'Medium',
        statement: `Problem imported from: ${urlStr}\n\n(Network request to auto-extract full description was restricted. You can paste the problem description here.)`,
        tags: ['LeetCode']
      }
    };
  }
}

function cleanHtmlStatement(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<pre>[\s\S]*?<\/pre>/gi, (match: string) => {
      const inner = match
        .replace(/<\/?pre>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&le;/g, '≤')
        .replace(/&ge;/g, '≥')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .trim();
      return '\n```\n' + inner + '\n```\n';
    })
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function importGeeksForGeeksProblem(urlStr: string): Promise<ImportedProblemResult> {
  try {
    const res = await fetch(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!res.ok) {
      throw new Error(`GeeksforGeeks returned HTTP ${res.status}`);
    }

    const html = await res.text();

    // Strategy 1: Extract __NEXT_DATA__ JSON (GFG Practice & Article pages)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const pageProps = nextData.props?.pageProps;

        // Check if it's a Practice Problem page
        const probData = pageProps?.initialState?.problemData?.allData?.probData;
        if (probData && (probData.problem_question || probData.problem_name)) {
          const title = probData.problem_name || 'GFG Problem';
          
          let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
          const rawDiff = (probData.difficulty || probData.problem_level_text || '').toLowerCase();
          if (rawDiff.includes('easy') || rawDiff.includes('basic') || rawDiff.includes('school')) {
            difficulty = 'Easy';
          } else if (rawDiff.includes('hard')) {
            difficulty = 'Hard';
          } else {
            difficulty = 'Medium';
          }

          const rawStatement = probData.problem_question || '';
          let cleanStatement = cleanHtmlStatement(rawStatement);

          // Add constraints if present
          if (probData.constraints_display) {
            cleanStatement += '\n\n**Constraints:**\n' + cleanHtmlStatement(probData.constraints_display);
          }

          const topicTags: string[] = probData.tags?.topic_tags || [];
          const companyTags: string[] = probData.tags?.company_tags || [];
          const allTags = Array.from(new Set(['GeeksforGeeks', ...topicTags, ...companyTags.slice(0, 3)]));

          return {
            success: true,
            data: {
              title,
              url: urlStr,
              difficulty,
              statement: cleanStatement || `Problem details extracted from GeeksforGeeks:\n${urlStr}`,
              tags: allTags
            }
          };
        }

        // Check if it's an Article/Tutorial problem page
        if (pageProps?.postTitle || pageProps?.postDataFromWriteApi) {
          const title = pageProps.postTitle || 'GFG Article';
          const postContent = pageProps.postDataFromWriteApi?.post_content || '';
          const cleanStatement = cleanHtmlStatement(postContent);

          const topicTags: string[] = Array.isArray(pageProps.topicTags) ? pageProps.topicTags : [];
          const allTags = Array.from(new Set(['GeeksforGeeks', ...topicTags]));

          return {
            success: true,
            data: {
              title: title.replace(/ - GeeksforGeeks.*$/i, '').trim(),
              url: urlStr,
              difficulty: 'Medium',
              statement: cleanStatement || `Article extracted from GeeksforGeeks:\n${urlStr}`,
              tags: allTags
            }
          };
        }
      } catch (parseErr) {
        console.warn('Failed parsing GFG NEXT_DATA, falling back to HTML regex:', parseErr);
      }
    }

    // Strategy 2: Fallback to HTML DOM extraction
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].replace(/ \| Practice \| GeeksforGeeks.*$/i, '').replace(/ - GeeksforGeeks.*$/i, '').trim() : 'GFG Problem';

    // Try finding problem-statement container in HTML
    const problemDivMatch = html.match(/class="[^"]*problem-statement[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                            html.match(/class="[^"]*problems_problem_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    let statement = '';
    if (problemDivMatch) {
      statement = cleanHtmlStatement(problemDivMatch[1]);
    } else {
      statement = `Problem imported from GeeksforGeeks:\n${urlStr}`;
    }

    return {
      success: true,
      data: {
        title,
        url: urlStr,
        difficulty: 'Medium',
        statement,
        tags: ['GeeksforGeeks']
      }
    };
  } catch (err: any) {
    // Graceful slug-based fallback
    const slugMatch = urlStr.match(/problems\/([^/?#]+)/);
    const fallbackTitle = slugMatch
      ? slugMatch[1].replace(/-\d+$/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'GeeksforGeeks Problem';

    return {
      success: true,
      data: {
        title: fallbackTitle,
        url: urlStr,
        difficulty: 'Medium',
        statement: `Problem URL: ${urlStr}\n\n(Network request to auto-extract full description was restricted. You can paste the problem description here.)`,
        tags: ['GeeksforGeeks']
      }
    };
  }
}

async function importGenericProblem(urlStr: string): Promise<ImportedProblemResult> {
  try {
    const res = await fetch(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'DSA Problem';

    return {
      success: true,
      data: {
        title,
        url: urlStr,
        difficulty: 'Medium',
        statement: `Imported from ${urlStr}`,
        tags: ['DSA']
      }
    };
  } catch (err: any) {
    return {
      success: true,
      data: {
        title: 'New DSA Problem',
        url: urlStr,
        difficulty: 'Medium',
        statement: `Problem URL: ${urlStr}`,
        tags: ['DSA']
      }
    };
  }
}
