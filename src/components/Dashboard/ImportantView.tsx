import React, { useState } from 'react';
import { Star, Search, ArrowLeft, ExternalLink, Hash, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useTreeStore } from '../../stores/useTreeStore';
import { Question } from '../../types';

export const ImportantView: React.FC = () => {
  const { questions, branches, setActiveQuestion, setActiveView, toggleImportantQuestion } = useTreeStore();
  const [filterBranchId, setFilterBranchId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const importantQuestions = questions.filter(q => q.isImportant && !q.isDeleted);

  const filtered = importantQuestions.filter(q => {
    if (filterBranchId !== 'all' && q.branchId !== filterBranchId) return false;
    if (searchQuery.trim()) {
      const match = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-[#0d1117] p-6 sm:p-10 select-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('dashboard')}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-[#21262d] text-slate-500 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Important DSA Problems</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {importantQuestions.length} flagged for revision and core interview prep
              </p>
            </div>
          </div>
        </div>

        {/* Filters and search bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search important problems by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 shadow-sm"
            />
          </div>

          <select
            value={filterBranchId}
            onChange={(e) => setFilterBranchId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Questions Cards List */}
        <div className="flex flex-col gap-3">
          {filtered.length > 0 ? (
            filtered.map(q => {
              const branch = branches.find(b => b.id === q.branchId);
              return (
                <div
                  key={q.id}
                  onClick={() => setActiveQuestion(q.id)}
                  className="flex flex-col gap-2 p-4 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImportantQuestion(q.id);
                        }}
                        className="text-amber-500 hover:text-slate-400 transition"
                      >
                        <Star className="w-4 h-4 fill-amber-500" />
                      </button>

                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {q.title}
                      </h3>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          q.difficulty === 'Easy'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            : q.difficulty === 'Hard'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      {branch ? branch.name : 'Unknown Branch'}
                    </div>
                  </div>

                  {/* Summary / Notes snippet */}
                  {q.specialNotes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-[#0d1117] p-2 rounded-md font-mono">
                      {q.specialNotes}
                    </p>
                  )}

                  {/* Tags & complexities */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {q.timeComplexity && (
                      <span className="text-[11px] font-mono text-slate-400">
                        Time: {q.timeComplexity}
                      </span>
                    )}
                    {q.spaceComplexity && (
                      <span className="text-[11px] font-mono text-slate-400">
                        • Space: {q.spaceComplexity}
                      </span>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      {q.tags.map(t => (
                        <span
                          key={t}
                          className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-[#21262d] text-slate-600 dark:text-slate-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No important problems found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
