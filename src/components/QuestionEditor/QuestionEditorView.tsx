import React, { useEffect, useState } from 'react';
import { useQuestionStore } from '../../stores/useQuestionStore';
import { useTreeStore } from '../../stores/useTreeStore';
import { EditorHeader } from './EditorHeader';
import { RichEditor } from './RichEditor';
import { FlatProblemStatement } from './FlatProblemStatement';
import { FlatApproachView } from './FlatApproachView';
import { ComplexityPills } from './ComplexityPills';
import { CodeBlock } from './CodeBlock';
import { SpecialNotes } from './SpecialNotes';
import { PhotoNotesGallery } from './PhotoNotesGallery';
import { VoiceNotesSection } from './VoiceNotesSection';
import { DetailsPanel } from '../Layout/DetailsPanel';
import { FileText, Code2, Edit3, Check, BrainCircuit } from 'lucide-react';

interface QuestionEditorViewProps {
  onOpenDeleteConfirm: (id: string, title: string) => void;
}

export const QuestionEditorView: React.FC<QuestionEditorViewProps> = ({ onOpenDeleteConfirm }) => {
  const { activeQuestionId } = useTreeStore();
  const { currentQuestion, loadQuestion, updateField, isLoading } = useQuestionStore();
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const [isEditingApproach, setIsEditingApproach] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>(() => {
    return (localStorage.getItem('selfnote_editor_layout') as 'split' | 'stacked') || 'split';
  });

  const toggleLayoutMode = () => {
    const nextMode = layoutMode === 'split' ? 'stacked' : 'split';
    setLayoutMode(nextMode);
    localStorage.setItem('selfnote_editor_layout', nextMode);
  };

  useEffect(() => {
    if (activeQuestionId) {
      loadQuestion(activeQuestionId);
      setIsEditingStatement(false);
      setIsEditingApproach(false);
    }
  }, [activeQuestionId, loadQuestion]);

  if (isLoading || !currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
        Loading question notes...
      </div>
    );
  }

  const hasStatement = Boolean(currentQuestion.problemStatement && currentQuestion.problemStatement.trim());
  const hasApproach = Boolean(currentQuestion.solutionApproach && currentQuestion.solutionApproach.trim());

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white dark:bg-[#0d1117]">
      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0d1117]">
          <EditorHeader
            onOpenDeleteConfirm={onOpenDeleteConfirm}
            layoutMode={layoutMode}
            onToggleLayout={toggleLayoutMode}
          />
        </div>

        {/* Content Viewport: Either Split (LeetCode Mode) or Stacked */}
        {layoutMode === 'split' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Pane: Problem Statement, Approach & Notes (Scrollable) */}
            <div className="w-1/2 h-full overflow-y-auto px-6 py-5 border-r border-slate-200 dark:border-slate-800 flex flex-col gap-6">
              {/* Problem Statement Section */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Problem Statement</h3>
                  </div>

                  {/* Edit Text button */}
                  <button
                    type="button"
                    onClick={() => setIsEditingStatement(!isEditingStatement)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shadow-sm"
                    title={isEditingStatement ? 'Done editing problem statement' : 'Edit problem statement text'}
                  >
                    {isEditingStatement ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Done Editing</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Edit Text</span>
                      </>
                    )}
                  </button>
                </div>

                {isEditingStatement ? (
                  <RichEditor
                    value={currentQuestion.problemStatement}
                    onChange={(val) => updateField('problemStatement', val)}
                    placeholder="Paste or write the problem statement here..."
                    minRows={10}
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (!hasStatement) setIsEditingStatement(true);
                    }}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-4 sm:p-5 shadow-sm min-h-[140px]"
                  >
                    <FlatProblemStatement content={currentQuestion.problemStatement} />
                  </div>
                )}
              </div>

              {/* Approach & Intuition (Plain text by default + Edit Approach button with highlights and colors) */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Approach & Intuition</h3>
                  </div>

                  {/* Edit Approach button */}
                  <button
                    type="button"
                    onClick={() => setIsEditingApproach(!isEditingApproach)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shadow-sm"
                    title={isEditingApproach ? 'Done editing approach' : 'Edit approach with highlights and colors'}
                  >
                    {isEditingApproach ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Done Editing</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Edit Approach</span>
                      </>
                    )}
                  </button>
                </div>

                {isEditingApproach ? (
                  <RichEditor
                    value={currentQuestion.solutionApproach}
                    onChange={(val) => updateField('solutionApproach', val)}
                    placeholder="Explain your approach (e.g. 1. Sort arrays, 2. Greedy match smallest content cookie... Use highlighter or text colors for key insights!)"
                    minRows={6}
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (!hasApproach) setIsEditingApproach(true);
                    }}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-4 sm:p-5 shadow-sm min-h-[100px]"
                  >
                    <FlatApproachView content={currentQuestion.solutionApproach} />
                  </div>
                )}
              </div>

              {/* Special Notes & Multiple Notes (+ Add Note) */}
              <SpecialNotes />

              {/* Photo Notes Gallery */}
              <PhotoNotesGallery />

              {/* Voice Notes Section */}
              <VoiceNotesSection />

              <div className="h-16" />
            </div>

            {/* Right Pane: Solution Code & Complexity (Scrollable) */}
            <div className="w-1/2 h-full overflow-y-auto px-6 py-5 flex flex-col gap-4 bg-slate-50/30 dark:bg-[#0d1117]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Solution Code & Multiple Approaches</h3>
                </div>
              </div>

              {/* Code Block with Horizontal Approach Tabs, Per-Approach Complexity, Syntax Highlighting & Fullscreen */}
              <CodeBlock />

              <div className="h-16" />
            </div>
          </div>
        ) : (
          /* Stacked Vertical Layout */
          <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 max-w-4xl mx-auto flex flex-col gap-6 w-full">
            {/* Section 1: Problem Statement */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Problem Statement</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingStatement(!isEditingStatement)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shadow-sm"
                >
                  {isEditingStatement ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Done Editing</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Edit Text</span>
                    </>
                  )}
                </button>
              </div>

              {isEditingStatement ? (
                <RichEditor
                  value={currentQuestion.problemStatement}
                  onChange={(val) => updateField('problemStatement', val)}
                  placeholder="Paste or write the problem statement here..."
                  minRows={8}
                />
              ) : (
                <div
                  onClick={() => {
                    if (!hasStatement) setIsEditingStatement(true);
                  }}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-4 sm:p-5 shadow-sm min-h-[100px]"
                >
                  <FlatProblemStatement content={currentQuestion.problemStatement} />
                </div>
              )}
            </div>

            {/* Section 2: Approach & Intuition (Plain text by default + Edit Approach) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Approach & Intuition</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingApproach(!isEditingApproach)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shadow-sm"
                >
                  {isEditingApproach ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Done Editing</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Edit Approach</span>
                    </>
                  )}
                </button>
              </div>

              {isEditingApproach ? (
                <RichEditor
                  value={currentQuestion.solutionApproach}
                  onChange={(val) => updateField('solutionApproach', val)}
                  placeholder="Explain your approach (e.g. 1. Sort array, 2. Two pointers... Use highlighter or text colors!)"
                  minRows={6}
                />
              ) : (
                <div
                  onClick={() => {
                    if (!hasApproach) setIsEditingApproach(true);
                  }}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-4 sm:p-5 shadow-sm min-h-[100px]"
                >
                  <FlatApproachView content={currentQuestion.solutionApproach} />
                </div>
              )}
            </div>

            {/* Section 3: Solution Code & Multiple Approaches */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Solution Code & Multiple Approaches</h3>
                </div>
              </div>

              <CodeBlock />
            </div>

            {/* Section 4: Special Notes & Multiple Notes */}
            <SpecialNotes />

            {/* Section 5: Photo Notes & Handwritten Diagrams */}
            <PhotoNotesGallery />

            {/* Section 6: Voice Notes & Audio Explanations */}
            <VoiceNotesSection />

            <div className="h-16" />
          </div>
        )}
      </div>

      {/* Right Details Sidebar */}
      <DetailsPanel />
    </div>
  );
};
