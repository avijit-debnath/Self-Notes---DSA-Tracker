import React, { useState } from 'react';
import { Clock, Cpu } from 'lucide-react';
import { useQuestionStore } from '../../stores/useQuestionStore';

const COMPLEXITY_PRESETS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'];

export const ComplexityPills: React.FC = () => {
  const { currentQuestion, updateField } = useQuestionStore();
  const [showTimePresets, setShowTimePresets] = useState(false);
  const [showSpacePresets, setShowSpacePresets] = useState(false);

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 py-1">
      {/* Time Complexity */}
      <div className="relative flex items-center gap-1.5 text-xs">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Time:</span>
        </div>

        <input
          type="text"
          value={currentQuestion.timeComplexity}
          onChange={(e) => updateField('timeComplexity', e.target.value)}
          placeholder="e.g. O(n)"
          onFocus={() => setShowTimePresets(true)}
          className="w-24 px-2 py-0.5 rounded font-mono text-xs bg-slate-100 dark:bg-[#21262d] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
        />

        {showTimePresets && (
          <div
            className="absolute top-8 left-12 z-20 flex gap-1 p-1 bg-white dark:bg-[#1c2128] rounded-md shadow-lg border border-slate-200 dark:border-slate-700"
            onMouseLeave={() => setShowTimePresets(false)}
          >
            {COMPLEXITY_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  updateField('timeComplexity', preset);
                  setShowTimePresets(false);
                }}
                className="px-1.5 py-0.5 text-[11px] font-mono rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300"
              >
                {preset}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Space Complexity */}
      <div className="relative flex items-center gap-1.5 text-xs">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
          <Cpu className="w-3.5 h-3.5 text-emerald-500" />
          <span>Space:</span>
        </div>

        <input
          type="text"
          value={currentQuestion.spaceComplexity}
          onChange={(e) => updateField('spaceComplexity', e.target.value)}
          placeholder="e.g. O(1)"
          onFocus={() => setShowSpacePresets(true)}
          className="w-24 px-2 py-0.5 rounded font-mono text-xs bg-slate-100 dark:bg-[#21262d] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
        />

        {showSpacePresets && (
          <div
            className="absolute top-8 left-12 z-20 flex gap-1 p-1 bg-white dark:bg-[#1c2128] rounded-md shadow-lg border border-slate-200 dark:border-slate-700"
            onMouseLeave={() => setShowSpacePresets(false)}
          >
            {COMPLEXITY_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  updateField('spaceComplexity', preset);
                  setShowSpacePresets(false);
                }}
                className="px-1.5 py-0.5 text-[11px] font-mono rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300"
              >
                {preset}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
