import React, { useState } from 'react';
import { BIBLE_BOOKS } from '../types/constants';

export default function BibleSelectorModal({ isOpen, initialValue = '', onSave, onClose }) {
  const parseInitial = () => {
    if (!initialValue) {
      return { book: 'Psalm', chapter: 23, startVerse: 1, endVerse: 6, isRange: true, isChapterOnly: false };
    }
    // Try to parse format e.g. "John 3:16-21" or "1 Samuel 25" or "Psalm 23"
    const match = initialValue.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
    if (match) {
      return {
        book: match[1].trim(),
        chapter: parseInt(match[2], 10) || 1,
        startVerse: match[3] ? parseInt(match[3], 10) : 1,
        endVerse: match[4] ? parseInt(match[4], 10) : (match[3] ? parseInt(match[3], 10) : 6),
        isRange: !!match[4],
        isChapterOnly: !match[3]
      };
    }
    return { book: 'Psalm', chapter: 23, startVerse: 1, endVerse: 6, isRange: true, isChapterOnly: false };
  };

  const initial = parseInitial();
  const [selectedBook, setSelectedBook] = useState(initial.book);
  const [chapter, setChapter] = useState(initial.chapter);
  const [startVerse, setStartVerse] = useState(initial.startVerse);
  const [endVerse, setEndVerse] = useState(initial.endVerse);
  const [isChapterOnly, setIsChapterOnly] = useState(initial.isChapterOnly);
  const [isRange, setIsRange] = useState(initial.isRange);

  if (!isOpen) return null;

  const currentBookMeta = BIBLE_BOOKS.find(b => b.name === selectedBook) || BIBLE_BOOKS[0];
  const maxChapters = currentBookMeta.chapters;

  const generateReferenceString = () => {
    if (isChapterOnly) {
      return `${selectedBook} ${chapter}`;
    }
    if (isRange && endVerse && endVerse !== startVerse) {
      return `${selectedBook} ${chapter}:${startVerse}–${endVerse}`;
    }
    return `${selectedBook} ${chapter}:${startVerse}`;
  };

  const handleApply = () => {
    onSave(generateReferenceString());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-charcoal/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-sand overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand/60 flex items-center justify-between bg-cream/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center border border-gold/30">
              <i className="ti ti-book text-lg"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-charcoal">Scripture Reference Selector</h3>
              <p className="text-[11px] text-muted-text">Select book, chapter, and verse range without manual typing.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-muted-text hover:text-charcoal hover:bg-sand/40 flex items-center justify-center transition-all"
          >
            <i className="ti ti-x"></i>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Reference Preview Card */}
          <div className="bg-gold/10 border border-gold/30 p-4 rounded-xl flex items-center justify-between">
            <span className="text-muted-text font-medium">Selected Reference:</span>
            <span className="text-sm font-bold font-display text-gold-dark">
              {generateReferenceString()}
            </span>
          </div>

          {/* Book Selector */}
          <div>
            <label className="text-[10px] font-bold text-gold-dark uppercase tracking-wider block mb-1.5">
              1. Book of the Bible
            </label>
            <select
              value={selectedBook}
              onChange={(e) => {
                setSelectedBook(e.target.value);
                setChapter(1);
              }}
              className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-semibold text-charcoal focus:bg-white focus:border-gold outline-none transition-colors"
            >
              {BIBLE_BOOKS.map(b => (
                <option key={b.name} value={b.name}>{b.name} ({b.chapters} chapters)</option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="verseMode"
                checked={isChapterOnly}
                onChange={() => setIsChapterOnly(true)}
                className="accent-gold"
              />
              <span className="font-semibold text-charcoal">Whole Chapter (e.g. 1 Samuel 25)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="verseMode"
                checked={!isChapterOnly}
                onChange={() => setIsChapterOnly(false)}
                className="accent-gold"
              />
              <span className="font-semibold text-charcoal">Specific Verses (e.g. John 3:16–21)</span>
            </label>
          </div>

          {/* Chapter & Verses Selectors */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gold-dark block mb-1 uppercase tracking-wider">Chapter</label>
              <input
                type="number"
                min="1"
                max={maxChapters}
                value={chapter}
                onChange={(e) => setChapter(Math.max(1, Math.min(maxChapters, parseInt(e.target.value, 10) || 1)))}
                className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-bold text-charcoal text-center outline-none focus:bg-white focus:border-gold transition-colors"
              />
            </div>

            {!isChapterOnly && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-gold-dark block mb-1 uppercase tracking-wider">Starting Verse</label>
                  <input
                    type="number"
                    min="1"
                    value={startVerse}
                    onChange={(e) => setStartVerse(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-bold text-charcoal text-center outline-none focus:bg-white focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gold-dark block mb-1 uppercase tracking-wider">Ending Verse</label>
                  <input
                    type="number"
                    min={startVerse}
                    value={endVerse}
                    onChange={(e) => setEndVerse(Math.max(startVerse, parseInt(e.target.value, 10) || startVerse))}
                    className="w-full bg-cream border border-sand rounded-xl px-3 py-2 text-xs font-bold text-charcoal text-center outline-none focus:bg-white focus:border-gold transition-colors"
                  />
                </div>
              </>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider block mb-2">
              Common Midnight Prayer Passages:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['Psalm 23', 'Psalm 91:1-16', 'Psalm 100:1-5', 'Psalm 134:1-3', '1 Samuel 25', 'John 3:16-21', 'Colossians 1:9-12', '1 Timothy 2:1-4', 'Luke 18:1-8'].map(passage => (
                <button
                  key={passage}
                  type="button"
                  onClick={() => {
                    onSave(passage);
                    onClose();
                  }}
                  className="bg-cream hover:bg-gold/20 hover:text-gold-dark text-charcoal px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border border-sand hover:border-gold/40"
                >
                  {passage}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-cream/50 border-t border-sand/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onSave('');
              onClose();
            }}
            className="text-rose-600 hover:text-rose-700 text-xs font-semibold"
          >
            Clear Scripture
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-sand text-charcoal hover:bg-cream text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal text-xs font-bold shadow-sm transition-all"
            >
              Apply Reference
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
