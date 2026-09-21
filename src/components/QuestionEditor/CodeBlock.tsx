import React, { useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Edit3,
  Eye,
  Plus,
  X,
  Clock,
  Cpu,
  Sparkles
} from 'lucide-react';
import { useQuestionStore } from '../../stores/useQuestionStore';
import { SolutionApproach } from '../../types';
import { parseApproaches, serializeApproaches } from '../../utils/approaches';
import { analyzeComplexity } from '../../utils/complexityAnalyzer';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';

const LANGUAGES = [
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python 3' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' }
];

const COMPLEXITY_PRESETS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'];

export const CodeBlock: React.FC = () => {
  const { currentQuestion, updateField, forceSave } = useQuestionStore();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeApproachId, setActiveApproachId] = useState<string>('app_1');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [showTimePresets, setShowTimePresets] = useState(false);
  const [showSpacePresets, setShowSpacePresets] = useState(false);
  const [detectedToast, setDetectedToast] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!currentQuestion) return null;

  const approaches = parseApproaches(currentQuestion);

  // Ensure activeApproachId is valid
  const currentApproach = approaches.find(a => a.id === activeApproachId) || approaches[0] || {
    id: 'app_1',
    name: 'Approach 1',
    code: '',
    language: 'cpp',
    timeComplexity: '',
    spaceComplexity: ''
  };

  const handleUpdateApproach = (field: keyof SolutionApproach, value: any) => {
    const updated = approaches.map(a => {
      if (a.id === currentApproach.id) {
        return { ...a, [field]: value };
      }
      return a;
    });

    const serialized = serializeApproaches(updated);
    updateField('solutionCode', serialized.solutionCode);
    updateField('solutionLanguage', serialized.solutionLanguage);
    updateField('timeComplexity', serialized.timeComplexity);
    updateField('spaceComplexity', serialized.spaceComplexity);
  };

  const handleUpdateApproachMultiple = (updates: Partial<SolutionApproach>) => {
    const updated = approaches.map(a => {
      if (a.id === currentApproach.id) {
        return { ...a, ...updates };
      }
      return a;
    });

    const serialized = serializeApproaches(updated);
    updateField('solutionCode', serialized.solutionCode);
    updateField('solutionLanguage', serialized.solutionLanguage);
    updateField('timeComplexity', serialized.timeComplexity);
    updateField('spaceComplexity', serialized.spaceComplexity);
  };

  const triggerAutoDetect = (targetCode?: string, force = false) => {
    const codeToAnalyze = targetCode !== undefined ? targetCode : (currentApproach.code || '');
    if (!codeToAnalyze || !codeToAnalyze.trim()) return;

    const result = analyzeComplexity(codeToAnalyze, currentApproach.language);
    if (!result.timeComplexity && !result.spaceComplexity) return;

    const newTime = (force || !currentApproach.timeComplexity)
      ? (result.timeComplexity || currentApproach.timeComplexity)
      : currentApproach.timeComplexity;
    const newSpace = (force || !currentApproach.spaceComplexity)
      ? (result.spaceComplexity || currentApproach.spaceComplexity)
      : currentApproach.spaceComplexity;

    handleUpdateApproachMultiple({
      timeComplexity: newTime,
      spaceComplexity: newSpace,
      ...(targetCode !== undefined ? { code: targetCode } : {})
    });

    setDetectedToast(`${newTime} / ${newSpace}`);
    setTimeout(() => setDetectedToast(null), 3500);
  };

  const handlePasteCode = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText || !pastedText.trim()) return;

    // After paste settles in textarea, auto-detect time & space complexity
    setTimeout(() => {
      const textarea = e.target as HTMLTextAreaElement;
      const fullCode = textarea?.value || pastedText;
      triggerAutoDetect(fullCode, true);
    }, 50);
  };

  const handleAddApproach = () => {
    const newId = 'app_' + Math.random().toString(36).substring(2, 9);
    const newApproachNumber = approaches.length + 1;
    const newApproach: SolutionApproach = {
      id: newId,
      name: `Approach ${newApproachNumber}`,
      code: '',
      language: currentApproach.language || 'cpp',
      timeComplexity: '',
      spaceComplexity: ''
    };

    const updated = [...approaches, newApproach];
    const serialized = serializeApproaches(updated);
    updateField('solutionCode', serialized.solutionCode);
    setActiveApproachId(newId);
    setIsEditing(true);
  };

  const handleDeleteApproach = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (approaches.length <= 1) return;

    const updated = approaches.filter(a => a.id !== idToDelete);
    const serialized = serializeApproaches(updated);
    updateField('solutionCode', serialized.solutionCode);
    if (activeApproachId === idToDelete) {
      setActiveApproachId(updated[0].id);
    }
  };

  const handleCopy = () => {
    if (!currentApproach.code) return;
    navigator.clipboard.writeText(currentApproach.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const code = currentApproach.code || '';
  const lang = currentApproach.language || 'cpp';

  // Renders the horizontal approach tabs
  const renderApproachTabs = () => (
    <div className="flex items-center gap-1.5 px-3 pt-2 bg-[#161b22] border-b border-slate-800 overflow-x-auto select-none">
      {approaches.map((app, index) => {
        const isActive = app.id === currentApproach.id;
        const isRenaming = editingTabId === app.id;

        return (
          <div
            key={app.id}
            onClick={() => {
              setActiveApproachId(app.id);
            }}
            onDoubleClick={() => setEditingTabId(app.id)}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition text-xs font-medium border-t border-x ${
              isActive
                ? 'bg-[#0d1117] text-white border-slate-700/80 -mb-px z-10 shadow-sm'
                : 'bg-[#1c2128] text-slate-400 border-transparent hover:bg-[#21262d] hover:text-slate-200'
            }`}
          >
            {isRenaming ? (
              <input
                type="text"
                value={app.name}
                autoFocus
                onChange={(e) => handleUpdateApproach('name', e.target.value)}
                onBlur={() => setEditingTabId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingTabId(null);
                }}
                className="w-28 bg-transparent text-xs font-semibold text-white focus:outline-none border-b border-indigo-500"
              />
            ) : (
              <span className="truncate max-w-[150px]">{app.name || `Approach ${index + 1}`}</span>
            )}

            {/* Delete approach tab (if more than 1 approach) */}
            {approaches.length > 1 && (
              <button
                type="button"
                onClick={(e) => handleDeleteApproach(app.id, e)}
                title="Delete this approach"
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-900/60 hover:text-rose-300 text-slate-500 transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* + Add Approach Button */}
      <button
        type="button"
        onClick={handleAddApproach}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-t-md text-xs font-medium text-slate-400 hover:text-indigo-400 hover:bg-[#21262d] transition ml-1"
        title="Add another solution approach"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Add Approach</span>
      </button>
    </div>
  );

  // Renders the code editor / syntax highlighter
  const renderCodeBody = (fullscreen = false) => {
    if (isEditing) {
      const lineCount = Math.max((code.match(/\n/g) || []).length + 1, fullscreen ? 24 : 12);
      return (
        <div className="flex bg-[#0d1117] text-slate-100 font-mono text-xs overflow-hidden">
          {/* Gutter Line Numbers */}
          <div className="py-3 px-2.5 select-none text-right text-slate-600 bg-[#0b0f19] border-r border-slate-800 shrink-0 min-w-[40px]">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="leading-relaxed">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            value={code}
            onChange={(e) => handleUpdateApproach('code', e.target.value)}
            onPaste={handlePasteCode}
            placeholder="// Write or paste solution code for this approach..."
            rows={fullscreen ? 28 : 14}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent font-mono text-xs leading-relaxed text-slate-200 placeholder:text-slate-600 focus:outline-none resize-y selection:bg-indigo-500/30 whitespace-pre overflow-x-auto"
          />
        </div>
      );
    }

    return (
      <div
        tabIndex={0}
        onClick={() => {
          if (!code.trim()) setIsEditing(true);
        }}
        onPaste={(e) => {
          setIsEditing(true);
          const pastedText = e.clipboardData.getData('text');
          if (pastedText && pastedText.trim()) {
            handleUpdateApproach('code', pastedText);
            setTimeout(() => {
              triggerAutoDetect(pastedText, true);
            }, 50);
          }
        }}
        className={`cursor-pointer focus:outline-none ${fullscreen ? 'h-[calc(100vh-160px)] overflow-y-auto' : 'max-h-[500px] overflow-y-auto'}`}
      >
        <CodeSyntaxHighlighter code={code} language={lang} showLineNumbers={true} />
      </div>
    );
  };

  return (
    <>
      {/* Standard In-Page Code Block with Horizontal Approaches */}
      <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0d1117] text-slate-100 shadow-sm">
        {/* Horizontal Approach Tabs */}
        {renderApproachTabs()}

        {/* Sub-Header: Complexity pills, Language selector, Copy & Fullscreen */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#12161f] border-b border-slate-800 text-xs">
          {/* Approach-specific Time & Space Complexity */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Time */}
            <div className="relative flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] text-slate-400">Time:</span>
              <input
                type="text"
                value={currentApproach.timeComplexity || ''}
                onChange={(e) => handleUpdateApproach('timeComplexity', e.target.value)}
                onFocus={() => setShowTimePresets(true)}
                placeholder="e.g. O(n)"
                className="w-20 px-1.5 py-0.5 font-mono text-xs rounded bg-[#1c2128] border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {showTimePresets && (
                <div
                  className="absolute top-7 left-10 z-20 flex gap-1 p-1 bg-[#1c2128] rounded-md shadow-lg border border-slate-700"
                  onMouseLeave={() => setShowTimePresets(false)}
                >
                  {COMPLEXITY_PRESETS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        handleUpdateApproach('timeComplexity', p);
                        setShowTimePresets(false);
                      }}
                      className="px-1.5 py-0.5 text-[10px] font-mono rounded hover:bg-indigo-950 text-slate-300 hover:text-indigo-400"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Space */}
            <div className="relative flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-slate-400">Space:</span>
              <input
                type="text"
                value={currentApproach.spaceComplexity || ''}
                onChange={(e) => handleUpdateApproach('spaceComplexity', e.target.value)}
                onFocus={() => setShowSpacePresets(true)}
                placeholder="e.g. O(1)"
                className="w-20 px-1.5 py-0.5 font-mono text-xs rounded bg-[#1c2128] border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              {showSpacePresets && (
                <div
                  className="absolute top-7 left-10 z-20 flex gap-1 p-1 bg-[#1c2128] rounded-md shadow-lg border border-slate-700"
                  onMouseLeave={() => setShowSpacePresets(false)}
                >
                  {COMPLEXITY_PRESETS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        handleUpdateApproach('spaceComplexity', p);
                        setShowSpacePresets(false);
                      }}
                      className="px-1.5 py-0.5 text-[10px] font-mono rounded hover:bg-emerald-950 text-slate-300 hover:text-emerald-400"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auto Complexity Detect Button */}
            <button
              type="button"
              onClick={() => triggerAutoDetect(undefined, true)}
              title="Automatically detect Time & Space Complexity from code"
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-indigo-200 transition shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Auto</span>
            </button>

            {/* Toast feedback pill */}
            {detectedToast && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded animate-in fade-in duration-150">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Auto-detected: {detectedToast}</span>
              </span>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={lang}
              onChange={(e) => handleUpdateApproach('language', e.target.value)}
              className="px-2 py-0.5 text-xs rounded bg-[#1c2128] text-slate-200 border border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>

            {/* Toggle Edit / Syntax Highlight View */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-[#1c2128] hover:bg-[#282e37] text-slate-300 transition"
              title={isEditing ? 'View with syntax highlighting' : 'Edit code'}
            >
              {isEditing ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px]">View Color</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px]">Edit Code</span>
                </>
              )}
            </button>

            {/* Copy Code Button */}
            <button
              onClick={handleCopy}
              title="Copy code to clipboard"
              className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-[#1c2128] hover:bg-[#282e37] text-slate-300 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>

            {/* Pop-up Full Screen Icon */}
            <button
              onClick={() => setIsFullscreen(true)}
              title="Expand Full Screen"
              className="p-1 rounded bg-[#1c2128] hover:bg-[#282e37] text-slate-400 hover:text-white transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        {renderCodeBody(false)}
      </div>

      {/* Pop-up Full Screen Modal with Horizontal Approaches */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0d1117] text-slate-100 select-none animate-in fade-in duration-150">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#161b22] border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{currentQuestion.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
                    {currentApproach.name} • Full Screen
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Complexity in Fullscreen */}
              <div className="flex items-center gap-2 mr-2 bg-[#0d1117] px-2.5 py-1 rounded-lg border border-slate-700/80 text-xs">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] text-slate-400">Time:</span>
                <input
                  type="text"
                  value={currentApproach.timeComplexity || ''}
                  onChange={(e) => handleUpdateApproach('timeComplexity', e.target.value)}
                  placeholder="O(n)"
                  className="w-16 px-1.5 py-0.5 font-mono text-xs rounded bg-[#1c2128] border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <Cpu className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                <span className="text-[11px] text-slate-400">Space:</span>
                <input
                  type="text"
                  value={currentApproach.spaceComplexity || ''}
                  onChange={(e) => handleUpdateApproach('spaceComplexity', e.target.value)}
                  placeholder="O(1)"
                  className="w-16 px-1.5 py-0.5 font-mono text-xs rounded bg-[#1c2128] border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => triggerAutoDetect(undefined, true)}
                  title="Auto-detect Time & Space Complexity"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 transition ml-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Auto</span>
                </button>
              </div>

              {/* Language Selector */}
              <select
                value={lang}
                onChange={(e) => handleUpdateApproach('language', e.target.value)}
                className="px-2.5 py-1 text-xs rounded bg-[#21262d] text-slate-200 border border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>

              {/* Toggle Edit / Syntax Highlight View */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 transition"
              >
                {isEditing ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>View Colors</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit Code</span>
                  </>
                )}
              </button>

              {/* Copy Code Button */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>

              {/* Exit Fullscreen */}
              <button
                onClick={() => setIsFullscreen(false)}
                title="Exit Fullscreen (Esc)"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition ml-2"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Tabs inside Fullscreen */}
          {renderApproachTabs()}

          {/* Fullscreen Code Area */}
          <div className="flex-1 overflow-auto bg-[#0d1117]">
            {renderCodeBody(true)}
          </div>
        </div>
      )}
    </>
  );
};
