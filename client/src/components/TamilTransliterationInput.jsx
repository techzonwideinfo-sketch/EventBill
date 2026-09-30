import React, { useState, useRef, useEffect, forwardRef } from 'react';

import { transliterateWord } from '../utils/tamilTransliteration';

const TamilTransliterationInput = forwardRef(({ value, onChange, language, className, as: Component = 'input', ...props }, ref) => {
  const [internalVal, setInternalVal] = useState(value || '');
  const internalRef = useRef(null);
  
  // Use the passed ref or the internal one
  const inputRef = ref || internalRef;

  // Sync with external value changes
  useEffect(() => {
    setInternalVal(value || '');
  }, [value]);

  const handleChange = (e) => {
    setInternalVal(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  const handleKeyDown = async (e) => {
    // Only intercept if language is Tamil
    if (language !== 'ta' && language !== 'Tamil') {
      if (props.onKeyDown) props.onKeyDown(e);
      return;
    }

    // Trigger on Space or Enter
    if (e.key === ' ' || e.key === 'Enter') {
      const el = e.target;
      const cursor = el.selectionStart;
      const textBeforeCursor = internalVal.slice(0, cursor);
      const textAfterCursor = internalVal.slice(cursor);

      // Match the last English word before the cursor (allows mixed typing)
      const match = textBeforeCursor.match(/([a-zA-Z]+)$/);
      
      if (match) {
        e.preventDefault(); // Temporarily prevent the space/enter
        
        const word = match[1];
        const translatedWord = await transliterateWord(word);
        
        const newTextBefore = textBeforeCursor.slice(0, match.index) + translatedWord;
        const insertChar = e.key === ' ' ? ' ' : '\n';
        const newTotalText = newTextBefore + insertChar + textAfterCursor;
        
        setInternalVal(newTotalText);
        
        // Notify parent immediately
        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: { ...el, name: props.name, value: newTotalText }
          };
          onChange(syntheticEvent);
        }
        
        // Restore cursor position immediately after React updates
        setTimeout(() => {
          if (inputRef.current) {
            const newCursor = newTextBefore.length + insertChar.length;
            inputRef.current.setSelectionRange(newCursor, newCursor);
          }
        }, 0);
        return; // Event handled
      }
    }
    
    if (props.onKeyDown) props.onKeyDown(e);
  };

  const handleBlur = async (e) => {
    if (language !== 'ta' && language !== 'Tamil') {
      if (props.onBlur) props.onBlur(e);
      return;
    }
    
    // Transliterate on blur just in case the last word wasn't space-terminated
    const match = internalVal.match(/([a-zA-Z]+)$/);
    if (match) {
       const word = match[1];
       const translatedWord = await transliterateWord(word);
       if (translatedWord !== word) {
           const newText = internalVal.slice(0, match.index) + translatedWord + internalVal.slice(internalVal.length);
           setInternalVal(newText);
           if (onChange) {
             const syntheticEvent = {
               ...e,
               target: { ...e.target, name: props.name, value: newText }
             };
             onChange(syntheticEvent);
           }
       }
    }
    
    if (props.onBlur) props.onBlur(e);
  };

  const isTamilActive = language === 'ta' || language === 'Tamil';

  return (
    <div className="relative w-full">
      <Component
        ref={inputRef}
        value={internalVal}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={className}
        {...props}
      />
      {isTamilActive && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
           <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-80 border border-orange-200">
             தமிழ்
           </span>
        </div>
      )}
    </div>
  );
});

TamilTransliterationInput.displayName = 'TamilTransliterationInput';

export default TamilTransliterationInput;
