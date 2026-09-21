import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Trash2, Tag, ChevronDown } from 'lucide-react';
import { useQuestionStore } from '../../stores/useQuestionStore';

export interface NoteItem {
  id: string;
  category: 'gotcha' | 'pattern' | 'optimization' | 'general';
  title?: string;
  content: string;
}

const CATEGORIES = [
  { id: 'gotcha', label: 'Gotcha / Edge Case', color: 'border-amber-400 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' },
  { id: 'pattern', label: 'Pattern Insight', color: 'border-indigo-400 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300' },
  { id: 'optimization', label: 'Optimization', color: 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300' },
  { id: 'general', label: 'Key Takeaway', color: 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161b22] text-slate-700 dark:text-slate-300' },
];

export const SpecialNotes: React.FC = () => {
  const { currentQuestion, updateField } = useQuestionStore();

  if (!currentQuestion) return null;

  // Parse notes from question specialNotes string
  const parseNotes = (): NoteItem[] => {
    const raw = currentQuestion.specialNotes || '';
    if (!raw.trim()) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Legacy format: plain text string
    }

    // Convert legacy plain text string into a single note item
    return [
      {
        id: 'note_initial',
        category: 'gotcha',
        title: 'Key Notes & Gotchas',
        content: raw
      }
    ];
  };

  const notes = parseNotes();

  const saveNotes = (updatedNotes: NoteItem[]) => {
    updateField('specialNotes', JSON.stringify(updatedNotes));
  };

  const handleAddNote = () => {
    const newNote: NoteItem = {
      id: 'note_' + Math.random().toString(36).substring(2, 9),
      category: 'gotcha',
      title: '',
      content: ''
    };
    saveNotes([...notes, newNote]);
  };

  const handleUpdateNote = (id: string, field: 'content' | 'title' | 'category', value: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, [field]: value } : n);
    saveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header with Title and + Add Note Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Special Notes & Gotchas
          </h3>
          {notes.length > 0 && (
            <span className="text-xs text-slate-400 font-mono">({notes.length})</span>
          )}
        </div>

        {/* Add Note Button with + icon */}
        <button
          type="button"
          onClick={handleAddNote}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition shadow-sm"
          title="Add a new special note"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {notes.map((note) => {
            const cat = CATEGORIES.find(c => c.id === note.category) || CATEGORIES[0];
            return (
              <div
                key={note.id}
                className={`flex flex-col gap-2 p-3 rounded-lg border shadow-sm transition ${cat.color}`}
              >
                {/* Note Top Bar: Category selector, Title, Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Category pill */}
                    <select
                      value={note.category}
                      onChange={(e) => handleUpdateNote(note.id, 'category', e.target.value)}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white/70 dark:bg-black/40 border border-current/20 cursor-pointer focus:outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    {/* Note Title Input */}
                    <input
                      type="text"
                      value={note.title || ''}
                      onChange={(e) => handleUpdateNote(note.id, 'title', e.target.value)}
                      placeholder="Note heading (e.g. Edge Case: Empty Array)..."
                      className="flex-1 px-1.5 py-0.5 text-xs font-semibold bg-transparent placeholder:text-current/40 focus:outline-none border-b border-transparent focus:border-current/30"
                    />
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    title="Delete note"
                    className="p-1 rounded text-current/60 hover:text-rose-500 hover:bg-black/10 dark:hover:bg-white/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Note Content */}
                <textarea
                  value={note.content}
                  onChange={(e) => handleUpdateNote(note.id, 'content', e.target.value)}
                  placeholder="Write your gotcha, edge case to remember, or pattern insight here..."
                  rows={2}
                  className="w-full bg-transparent text-xs leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none resize-y font-sans"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div
          onClick={handleAddNote}
          className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-lg cursor-pointer bg-slate-50/50 dark:bg-[#161b22]/30 transition group"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition">
            <Plus className="w-3.5 h-3.5" />
            <span>Click to add a special note (gotchas, edge cases, pattern insights)</span>
          </div>
        </div>
      )}
    </div>
  );
};
