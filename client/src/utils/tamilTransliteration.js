// Shared cache across all instances to minimize API calls
const translationCache = {};

// Dictionary of common events
export const eventTypeDictionary = {
  'marriage': 'திருமணம்',
  'engagement': 'நிச்சயதார்த்தம்',
  'reception': 'வரவேற்பு',
  'birthday': 'பிறந்தநாள்',
  'baby shower': 'வளைகாப்பு',
  'house warming': 'புதுமனை புகுவிழா',
  'anniversary': 'ஆண்டு விழா'
};

export const transliterateWord = async (word) => {
  // Skip empty, all caps (abbreviations), or strings containing numbers
  if (!word || /^[A-Z]+$/.test(word) || /\d/.test(word) || !/[a-zA-Z]/.test(word)) {
    return word;
  }
  
  const lowerWord = word.toLowerCase();
  
  // First check if it's an exact match in our dictionary (mostly useful for multi-word or known events when called on the whole string)
  if (eventTypeDictionary[lowerWord]) {
      return eventTypeDictionary[lowerWord];
  }

  if (translationCache[lowerWord]) {
    return translationCache[lowerWord];
  }

  try {
    const res = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=ta-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`);
    const data = await res.json();
    if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
      const transliterated = data[1][0][1][0]; // Extract the first suggestion
      translationCache[lowerWord] = transliterated;
      return transliterated;
    }
  } catch (e) {
    console.error('Transliteration error', e);
  }
  return word;
};

// Transliterate an entire sentence/phrase
export const transliterateText = async (text) => {
  if (!text) return '';
  
  const lowerText = text.toLowerCase().trim();
  // Check exact phrase match in dictionary first
  if (eventTypeDictionary[lowerText]) {
      return eventTypeDictionary[lowerText];
  }

  // Otherwise transliterate word by word
  const words = text.split(/(\s+)/);
  const transliteratedWords = await Promise.all(words.map(async (part) => {
      if (part.trim() === '') return part; // Preserve spaces
      return await transliterateWord(part);
  }));
  
  return transliteratedWords.join('');
};
