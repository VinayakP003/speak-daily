# 🎓 Professionalism Training Feature

## Overview
The app now detects and penalizes vulgar/profane language to help users develop professional communication skills. This feature teaches users to express themselves professionally while maintaining emotional authenticity.

---

## 🎯 How It Works

### 1. Detection
The app scans every transcript for:
- **Mild profanity**: damn, hell, crap
- **Common vulgar terms**: f-words, s-words, etc. (censored in display)
- **Offensive language**: Derogatory terms, insults
- **Unprofessional words**: stupid, idiot, dumb, moron

### 2. Scoring Impact
**HEAVY PENALTY to Clarity Score:**
- **-20 to -40 points** depending on frequency
- Minimum score becomes 20 (instead of 40) if profanity detected
- Score label changes to "Unprofessional language"

**Example:**
```
Without profanity: Clarity = 95/100
With 2 profane words: Clarity = 55/100 (-40 penalty)
With 5 profane words: Clarity = 20/100 (severe penalty)
```

### 3. Priority Feedback
**Profanity detection OVERRIDES all other suggestions.**

Even if you have:
- Low fluency score
- Poor structure
- Many repetitions

**The app will FIRST address professionalism.**

Why? Because vulgar language is the most damaging to credibility and is immediately fixable.

---

## 💡 What Users See

### Score Display
```
💎 Clarity: 45/100
   2 fillers + 3 profane
```

### Suggestion Card
```
⚠️ Unprofessional Language Detected

Your speech contained 3 inappropriate words: 
"d**n" (1x), "s**t" (2x)

Professional communication requires respectful language. 
Vulgarity undermines your credibility and makes you sound 
less educated.

IMPORTANT: Replace ALL profanity with professional 
alternatives. Pause and rephrase when you catch yourself 
about to use vulgar language.

Professional Alternatives:

• "This is frustrating" → not "This is [profanity]"
• "I strongly disagree" → not "That's [profanity]"
• "I'm extremely annoyed" → not "I'm [profanity] off"
• "This is challenging" → not "This is [profanity] hard"
• "That person is difficult" → not "They're a [profanity]"
• "I made a mistake" → not "I [profanity] up"

Remember: Professional speakers express strong emotions using:
1. Precise vocabulary ("frustrated", "disappointed")
2. Clear descriptions ("extremely challenging")
3. Respectful terms (never insults or vulgarity)

Practice: Say "I'm frustrated with this situation" 5 times 
before your next recording.
```

---

## 📊 Scoring Formula

### Base Clarity Calculation
```typescript
fillerPercentage = (filler words / total words) × 100
score = 40-100 based on filler percentage
```

### Profanity Penalty
```typescript
if (profanityDetected) {
  profanityPercentage = profanityCount / wordCount
  penalty = min(40, 20 + (profanityPercentage × 100 × 10))
  score -= penalty
  score = max(20, score) // Floor at 20 instead of 40
}
```

### Examples
| Profanity Count | Profanity % | Penalty | Final Clarity |
|-----------------|-------------|---------|---------------|
| 0 | 0% | 0 | 100 |
| 1 out of 50 | 2% | -22 | 78 → 58 |
| 3 out of 50 | 6% | -26 | 95 → 69 |
| 5 out of 50 | 10% | -30 | 90 → 60 |
| 10 out of 50 | 20% | -40 | 85 → 45 |

---

## 🎯 Educational Approach

### Not Censorship, But Education
This feature is designed to:
- ✅ **Teach** professional communication
- ✅ **Provide alternatives** for expressing emotions
- ✅ **Build awareness** of language choices
- ❌ **NOT** shame or judge users
- ❌ **NOT** restrict creative expression

### Why It Matters
Professional communication skills are critical for:
- **Job interviews**
- **Workplace presentations**
- **Customer interactions**
- **Academic settings**
- **Public speaking**

### The Message
> "Professional speakers express strong emotions using precise vocabulary, clear descriptions, and respectful terms."

---

## 🔧 Technical Implementation

### Files Modified

1. **`lib/normalize.ts`**
   - Added `profanityCount`, `profanityWords`, `profanityDetected` to interface
   - Created `PROFANITY_WORDS` list (censored)
   - Added `detectProfanity()` function
   - Added `censorWord()` helper for display

2. **`lib/scoring.ts`**
   - Modified `calculateClarity()` to apply profanity penalty
   - Added -20 to -40 point penalty
   - Changed minimum score to 20 when profanity present
   - Updated data display to show profanity count

3. **`lib/suggestions.ts`**
   - Added profanity priority check in `generateSuggestions()`
   - Created `getProfessionalismSuggestion()` function
   - Created `getProfessionalAlternatives()` with 8+ examples
   - Profanity feedback overrides all other suggestions

### Detection Logic
```typescript
// Check each profane word (case-insensitive)
for (const profaneWord of PROFANITY_WORDS) {
    const wordPattern = profaneWord.replace(/\*/g, '.');
    const regex = new RegExp(`\\b${wordPattern}\\b`, 'gi');
    const matches = text.match(regex);
    
    if (matches) {
        profanityWords.set(censorWord(matches[0]), matches.length);
        profanityCount += matches.length;
    }
}
```

---

## 🧪 Testing

### Test Cases

**Test 1: Clean Speech**
```
Input: "I'm frustrated with this situation."
Result: 
- Profanity count: 0
- Clarity: 100/100
- Suggestion: Works on weakest metric
```

**Test 2: Mild Profanity**
```
Input: "This damn project is challenging."
Result:
- Profanity count: 1
- Clarity: ~70/100 (penalty applied)
- Suggestion: Professionalism (overrides others)
```

**Test 3: Heavy Profanity**
```
Input: "This f***ing s**t is so stupid."
Result:
- Profanity count: 3
- Clarity: ~30/100 (heavy penalty)
- Overall score: Significantly reduced
- Suggestion: Professionalism with alternatives
```

---

## 📚 Word List Management

### Current Categories
1. **Mild**: damn, hell, crap
2. **Vulgar**: Common curse words (censored)
3. **Derogatory**: stupid, idiot, dumb, moron

### Intentionally Limited
The list is kept small and focused on:
- Most common inappropriate terms
- Educational value
- Clear alternatives available

### Not Included
- Context-dependent terms
- Slang that varies by region
- Words with legitimate professional uses

---

## ✅ Benefits

### For Users
- ✅ Learn professional communication
- ✅ Build better language habits
- ✅ Improve credibility and presentation skills
- ✅ Practice emotional intelligence through word choice

### For App Quality
- ✅ Encourages respectful speech patterns
- ✅ Teachable moment with every detection
- ✅ Concrete, actionable feedback
- ✅ Aligns with professional development goals

---

## 🎓 User Journey

### Before Feature
```
User: "This f***ing project is stupid"
App: "Structure: 75/100, try completing sentences"
User: Doesn't realize vulgar language is unprofessional
```

### After Feature
```
User: "This f***ing project is stupid"
App: ⚠️ "Unprofessional Language Detected"
     "Replace 's****d' with 'challenging'"
     "Say: 'This project is extremely challenging'"
User: Learns professional alternative
Next session: "This project is challenging"
App: "Great! Clarity: 95/100"
```

---

## 🔄 Iteration Opportunities

Future enhancements could include:
1. **Severity levels**: Distinguish between mild and severe profanity
2. **Context awareness**: Detect phrases, not just individual words
3. **Progress tracking**: Show improvement over time
4. **Custom word lists**: Industry-specific terminology
5. **Positive reinforcement**: Celebrate profanity-free sessions

---

## 📝 Summary

This feature transforms the app from a speech coach into a **holistic communication trainer**. It doesn't just measure speaking skills—it teaches **professional behavior**, **emotional intelligence**, and **respectful communication**.

**Key Principle:**  
> "You can express ANY emotion professionally. You don't need vulgarity to be authentic or impactful."

The app now helps users become not just better speakers, but better communicators in professional settings.
