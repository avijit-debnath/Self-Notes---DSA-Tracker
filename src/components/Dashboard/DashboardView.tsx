import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  FolderTree,
  ArrowRight,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { useTreeStore } from '../../stores/useTreeStore';
import { AppStats, Question } from '../../types';
import { api } from '../../services/api';

export const DashboardView: React.FC = () => {
  const { branches, questions, setActiveQuestion, setActiveBranch, setActiveView } = useTreeStore();
  const [stats, setStats] = useState<AppStats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats);
  }, [questions, branches]);

  const activeQuestions = questions.filter(q => !q.isDeleted);
  const recentlyEdited = [...activeQuestions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  // Top topic branches for "Continue Learning"
  const topicBranches = branches.filter(b => b.parentId === null).slice(0, 4);

  const solvedPercent = stats && stats.totalQuestions > 0
    ? Math.round((stats.solvedQuestions / stats.totalQuestions) * 100)
    : 0;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-[#0d1117] p-6 sm:p-10 select-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Good day, DSA Master</span>
              <span className="text-xl">👋</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your personal digital notebook for solved algorithms, patterns, and handwritten notes.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-[#161b22] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Solved Rate: </span>
              <span className="font-bold text-slate-900 dark:text-white">{solvedPercent}%</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Total Problems */}
          <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Problems</span>
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
              {stats?.totalQuestions || activeQuestions.length}
            </span>
          </div>

          {/* Solved */}
          <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Solved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
              {stats?.solvedQuestions || 0}
            </span>
          </div>

          {/* In Progress */}
          <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">In Progress</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
              {stats?.inProgressQuestions || 0}
            </span>
          </div>

          {/* Important */}
          <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Important ⭐</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-2xl font-bold text-amber-500 mt-2 font-mono">
              {stats?.importantQuestions || 0}
            </span>
          </div>
        </div>

        {/* Progress Breakdown Bar */}
        <div className="flex flex-col gap-2.5 p-5 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Overall Progress Breakdown</span>
            <span>{activeQuestions.length} Tracked Questions</span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div
              style={{ width: `${(stats?.solvedQuestions || 0) / (activeQuestions.length || 1) * 100}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`Solved: ${stats?.solvedQuestions || 0}`}
            />
            <div
              style={{ width: `${(stats?.inProgressQuestions || 0) / (activeQuestions.length || 1) * 100}%` }}
              className="bg-indigo-500 transition-all duration-300"
              title={`In Progress: ${stats?.inProgressQuestions || 0}`}
            />
            <div
              style={{ width: `${(stats?.needRevisionQuestions || 0) / (activeQuestions.length || 1) * 100}%` }}
              className="bg-amber-500 transition-all duration-300"
              title={`Need Revision: ${stats?.needRevisionQuestions || 0}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Solved ({stats?.solvedQuestions || 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>In Progress ({stats?.inProgressQuestions || 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Need Revision ({stats?.needRevisionQuestions || 0})</span>
            </div>
          </div>
        </div>

        {/* Recently Edited & Continue Learning Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recently Edited */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Recently Edited</span>
              <span className="text-xs text-slate-400 font-normal">Last modified</span>
            </h3>

            <div className="flex flex-col gap-2">
              {recentlyEdited.map(q => (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestion(q.id)}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#161b22] hover:bg-slate-50 dark:hover:bg-[#1c2128] border border-slate-200 dark:border-slate-800 transition text-left group shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        q.difficulty === 'Easy'
                          ? 'bg-emerald-500'
                          : q.difficulty === 'Hard'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {q.title}
                      </p>
                      <p className="text-[11px] text-slate-400 capitalize">{q.status.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Continue Learning Topics */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Continue Learning Topics
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {topicBranches.map(b => {
                const branchQuestions = activeQuestions.filter(q => {
                  let curr = branches.find(item => item.id === q.branchId);
                  while (curr) {
                    if (curr.id === b.id) return true;
                    curr = branches.find(item => item.id === curr?.parentId);
                  }
                  return false;
                });
                const solvedInBranch = branchQuestions.filter(q => q.status === 'solved').length;

                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBranch(b.id);
                      if (branchQuestions.length > 0) {
                        setActiveQuestion(branchQuestions[0].id);
                      }
                    }}
                    className="flex flex-col p-3 rounded-lg bg-white dark:bg-[#161b22] hover:bg-slate-50 dark:hover:bg-[#1c2128] border border-slate-200 dark:border-slate-800 transition text-left group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {b.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {solvedInBranch} / {branchQuestions.length} Solved
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{
                          width: `${(solvedInBranch / (branchQuestions.length || 1)) * 100}%`
                        }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
