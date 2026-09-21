# Self Notes — Personal DSA Tracker & Notebook

<div align="center">

![Self Notes Logo](public/favicon.svg)

### The Offline-First Desktop Environment for Mastering Data Structures & Algorithms

[![License: Proprietary](https://img.shields.io/badge/License-Copyrighted-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-indigo.svg)](#-getting-started)
[![Tech Stack](https://img.shields.io/badge/Stack-Electron%20%7C%20React%2018%20%7C%20TypeScript%20%7C%20Tailwind%20%7C%20SQLite-emerald.svg)](#-tech-stack)
[![Author](https://img.shields.io/badge/Author-Avijit%20Debnath-purple.svg)](https://github.com/avijit-debnath)

</div>

---

## 📖 About Self Notes

**Self Notes** is an offline-first, high-performance desktop application engineered specifically for software engineers, competitive programmers, and technical interview candidates. 

When preparing for coding interviews, developers often solve hundreds of problems across LeetCode, Codeforces, and GeeksforGeeks. However, weeks later, the core intuitions, tricky edge cases, and algorithm trade-offs fade from memory. Generic note-taking tools like Notion or Obsidian lack built-in code execution, algorithmic complexity analysis, structured multiple-approach comparisons, and DSA-focused tree navigation.

**Self Notes bridges this gap** by combining:
1. **A dedicated DSA Problem Organizer** with hierarchical pattern-based nesting and automatic difficulty sorting.
2. **A Multi-Approach Solution Studio** that contrasts brute-force vs. optimal approaches side-by-side.
3. **An Algorithmic Complexity Engine** that automatically detects Time & Space Complexity upon pasting code.
4. **Multimodal Learning Artifacts** including verbal audio walkthroughs, handwritten whiteboard diagram galleries, and rich formatted intuition notes.
5. **Absolute Privacy & Reliability** via a local SQLite database that never leaves your machine unless you trigger an optional encrypted GitHub backup.

---

## ✨ Comprehensive Features

### 🌳 1. Hierarchical Topic & Pattern Explorer
- **Infinite Sub-topic Nesting**: Organize problems logically by paradigm (e.g., `Arrays` $\rightarrow$ `Two Pointers` $\rightarrow$ `Fast & Slow Pointers`).
- **Automatic Difficulty Sorting**: Questions automatically arrange themselves in ascending difficulty order: **Easy** $\rightarrow$ **Medium** $\rightarrow$ **Hard**.
- **Flexible Problem Relocation**: Move problems across different topics and categories using the interactive **"Move to..."** dialog, tree badge, or drag-and-drop.
- **Search & Quick Navigation**: Real-time filtering across problem titles, tags, and solution notes.
- **Trash & Safe Recovery**: Delete questions and folders with a safety net; recover or permanently purge items from the Trash tab.

### ⚡ 2. Automatic Time & Space Complexity Analyzer
- **Instant Generation on Paste**: Paste any code snippet into the editor, and Self Notes instantly detects and populates the **Time Complexity** (e.g. $O(n)$, $O(\log n)$, $O(n \log n)$, $O(n^2)$, $O(2^n)$) and **Space Complexity** (e.g. $O(1)$, $O(n)$, $O(n^2)$).
- **In-Code Comment Extraction**: Intelligently parses existing complexity comments (e.g., `// Time: O(n log n)`, `// TC: O(V + E)`, `// Space: O(1)`).
- **Static Heuristic Algorithm Analysis**: Employs static analysis to identify algorithmic patterns:
  - Binary search interval halving $\rightarrow$ $O(\log n)$
  - Sorting and Priority Queue loops $\rightarrow$ $O(n \log n)$
  - Linear loops & two-pointer traversals $\rightarrow$ $O(n)$
  - Nested & triple nested iteration $\rightarrow$ $O(n^2)$ / $O(n^3)$
  - Backtracking & branching recursion $\rightarrow$ $O(2^n)$
  - Dynamic Programming tables & Matrices $\rightarrow$ Space $O(n^2)$
  - Auxiliary HashMaps, Sets, Stacks, Queues $\rightarrow$ Space $O(n)$
  - In-place transformations $\rightarrow$ Space $O(1)$
- **Manual "✨ Auto" Trigger & Presets**: Dedicated one-click trigger button and preset dropdowns for instant manual customization.

### 💻 3. Multi-Approach Solution Studio
- **Tabbed Approaches**: Record and compare multiple solutions per problem (e.g., `Approach 1 (Brute Force)`, `Approach 2 (Optimized HashMap)`, `Approach 3 (Bit Manipulation)`).
- **Multi-Language Support**: Syntax highlighting and indentation for **C++**, **Java**, **Python 3**, **JavaScript**, **TypeScript**, **Go**, and **Rust**.
- **Dual View Modes**: Switch between inline syntax-highlighted review mode and active code editing mode.
- **Fullscreen Distraction-Free Coding**: Pop-out modal for deep code reading with line numbers and copy-to-clipboard utilities.

### 🎙️ 4. Voice Notes & Verbal Walkthroughs
- **Record Interview Explanations**: Record yourself talking through the problem intuition, base cases, and algorithmic invariants.
- **Interactive Audio Player**: Seekable progress bar, real-time duration counter, and quick **`-5s` Rewind** and **`+5s` Fast-Forward** jump buttons.
- **Local Waveform Storage**: Audio clips are encoded and saved directly to the local application storage.

### 📸 5. Photo Notes & Handwritten Diagrams
- **Visual Intuition Gallery**: Upload photos of handwritten recursion trees, graph state transitions, and whiteboard diagrams.
- **Interactive Lightbox**: Click to inspect high-resolution diagram screenshots side-by-side with your code.

### 🌐 6. One-Click Problem Importer
- **Automated Metadata Extraction**: Paste a URL from **LeetCode**, **GeeksforGeeks**, **Codeforces**, or **HackerRank** to auto-fill title, tags, description, constraints, and difficulty level.

### 💾 7. Offline-First SQLite Engine & GitHub Sync
- **Local SQLite (`sql.js`)**: Sub-millisecond read/write speeds, stored safely in your user data directory (`selfnote.db`).
- **Encrypted GitHub Backup**: Sync your entire DSA library to a private GitHub repository using OS-level encrypted Personal Access Tokens.
- **Portable ZIP Archive**: Export and import full `.zip` archives containing your database, notes, photos, and voice recordings.

### 🎨 8. Premium Developer Ergonomics
- **Curated Themes**: Fully responsive **Dark**, **Light**, and **System** themes with glassmorphism and modern typography.
- **Split Screen / Stacked Layouts**: Toggle between a LeetCode-style dual pane and a unified vertical canvas.

---

## 🚀 Getting Started

### Download the Windows Installer
Download the pre-compiled standalone installer directly from the project directory:
- **Installer**: `D:\SelfNote\SelfNote.exe` or `D:\SelfNote\release\SelfNote.exe`
- Follow the NSIS setup wizard to choose your preferred installation location and launch **Self Notes**.

### Running from Source

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

#### Installation
```bash
# Clone the repository
git clone https://github.com/avijit-debnath/Self-Notes---DSA-Tracker.git

# Navigate into the project folder
cd Self-Notes---DSA-Tracker

# Install dependencies
npm install
```

#### Development Mode
```bash
# Start Vite and launch Electron simultaneously
npm run electron:dev
```

#### Production Build & Installer Generation
```bash
# Build web bundles and compile TypeScript
npm run build

# Generate Windows installer (SelfNote.exe)
npm run dist
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Desktop Shell** | [Electron 34](https://www.electronjs.org/) |
| **Frontend Framework** | [React 18](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & Design** | [Tailwind CSS 3](https://tailwindcss.com/), Vanilla CSS, Glassmorphism |
| **Local Database** | [SQLite / sql.js](https://sql.js.org/) (WebAssembly Embedded DB) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/) |
| **Build & Tooling** | [Vite 6](https://vitejs.dev/), [electron-builder](https://www.electron.build/), [NSIS](https://nsis.sourceforge.io/) |

---

## 👤 Author

**Avijit Debnath**  
*Data Scientist and Developer*  
- **GitHub**: [@avijit-debnath](https://github.com/avijit-debnath)  
- **Repository**: [Self-Notes---DSA-Tracker](https://github.com/avijit-debnath/Self-Notes---DSA-Tracker)

---

## ⚖️ Legal & Copyright

Copyright © 2026 **Avijit Debnath - Data Scientist and Developer**. All rights reserved.

This software, its source code, design architecture, and documentation are the proprietary intellectual property of **Avijit Debnath - Data Scientist and Developer**. 

Unauthorized copying, modification, distribution, or reverse engineering of this software and its algorithms without explicit written permission is strictly prohibited.
