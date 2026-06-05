/**
 * Daily Practice Topics
 * Prompts to help users get started with speaking
 */

export const PRACTICE_TOPICS = [
    {
        category: 'Personal',
        title: 'Tell me about your morning routine.',
        tip: 'Try to use sequential words like "first", "then", and "finally".'
    },
    {
        category: 'Work',
        title: 'What is a challenge you solved recently?',
        tip: 'Focus on the problem, your action, and the positive result.'
    },
    {
        category: 'Future',
        title: 'Where do you see yourself in five years?',
        tip: 'Use future tenses and expressing goals or aspirations.'
    },
    {
        category: 'Hobbies',
        title: 'Explain your favorite hobby to someone who knows nothing about it.',
        tip: 'Practice descriptive language and simplify complex concepts.'
    },
    {
        category: 'Opinions',
        title: 'What is a book or movie that changed your perspective?',
        tip: 'Explain the "why" behind your opinion with specific examples.'
    },
    {
        category: 'Travel',
        title: 'Describe your dream vacation destination.',
        tip: 'Use sensory details: what would you see, hear, or taste?'
    },
    {
        category: 'Technology',
        title: 'How do you think AI will change our daily lives?',
        tip: 'Practice expressing complex thoughts and using technical vocabulary.'
    },
    {
        category: 'Health',
        title: 'What does a "healthy lifestyle" mean to you?',
        tip: 'Think about physical, mental, and social well-being.'
    }
];

export function getRandomTopic() {
    return PRACTICE_TOPICS[Math.floor(Math.random() * PRACTICE_TOPICS.length)];
}

export const PRACTICE_EXERCISES = [
    {
        id: 'no-fillers',
        title: 'Zero Filler Challenge',
        goal: 'Speak without using "um", "uh", or "like".',
        focusMetric: 'fluency',
        instruction: 'If you get stuck, stay silent for a moment instead of using a filler word.'
    },
    {
        id: 'clue-master',
        title: 'Dictionary Mode',
        goal: 'Explain a simple object without saying its name.',
        focusMetric: 'richness',
        instruction: 'Use descriptive adjectives and analogies. Try to avoid repetitive sentence structures.'
    },
    {
        id: 'concise-boss',
        title: 'The Elevator Pitch',
        goal: 'Explain your current project in exactly 30 seconds.',
        focusMetric: 'structure',
        instruction: 'Focus on being concise and logical. Use a Hook, a Meat, and a Conclusion.'
    }
];
