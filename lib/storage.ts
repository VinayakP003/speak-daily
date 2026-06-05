/**
 * Session Storage Utility
 * Persists user performance history using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpeechScore } from './scoring';

const HISTORY_KEY = '@speak_daily_history';
const MAX_HISTORY_ITEMS = 20;

export interface SessionRecord {
    id: string;
    timestamp: number;
    transcript: string;
    overallScore: number;
    metrics: {
        clarity: number;
        fluency: number;
        richness: number;
        structure: number;
    };
    suggestionTitle: string;
    grammarErrors: number;
    fillerCount: number;
    profanityCount: number;
    sessionType: 'topic' | 'exercise';
    sessionName: string;
}

/**
 * Save a new session to history
 */
export async function saveSession(
    transcript: string,
    score: SpeechScore,
    grammarErrors: number,
    fillerCount: number,
    profanityCount: number,
    suggestionTitle: string,
    sessionType: 'topic' | 'exercise',
    sessionName: string
): Promise<void> {
    try {
        const history = await getHistory();

        const newSession: SessionRecord = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            transcript,
            overallScore: score.overall,
            metrics: score.metrics,
            suggestionTitle,
            grammarErrors,
            fillerCount,
            profanityCount,
            sessionType,
            sessionName,
        };

        const updatedHistory = [newSession, ...history].slice(0, MAX_HISTORY_ITEMS);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        console.log('✅ Session saved to history');
    } catch (error) {
        console.error('❌ Failed to save session:', error);
    }
}

/**
 * Get all saved sessions
 */
export async function getHistory(): Promise<SessionRecord[]> {
    try {
        const data = await AsyncStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('❌ Failed to load history:', error);
        return [];
    }
}

/**
 * Clear all session history
 */
export async function clearHistory(): Promise<void> {
    try {
        await AsyncStorage.removeItem(HISTORY_KEY);
        console.log('🗑️ History cleared');
    } catch (error) {
        console.error('❌ Failed to clear history:', error);
    }
}

/**
 * Calculate progress trends
 */
export function calculateTrends(history: SessionRecord[]) {
    if (history.length < 2) return null;

    const latest = history[0];
    const previous = history[1];

    return {
        scoreDiff: latest.overallScore - previous.overallScore,
        profanityReduced: previous.profanityCount > latest.profanityCount,
        fillerReduced: previous.fillerCount > latest.fillerCount,
    };
}

/**
 * Calculate the current practice streak in days
 */
export function calculateStreak(history: SessionRecord[]): number {
    if (history.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unique days from history (sorted newest to oldest)
    const uniqueDays = Array.from(new Set(
        history.map(s => {
            const d = new Date(s.timestamp);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        })
    )).sort((a, b) => b - a);

    const latestDay = uniqueDays[0];
    const yesterday = today.getTime() - 86400000;

    // If latest practice was before yesterday, streak is 0
    if (latestDay < yesterday && latestDay !== today.getTime()) {
        return 0;
    }

    let streak = 0;
    let expectedDay = latestDay;

    for (const day of uniqueDays) {
        if (day === expectedDay) {
            streak++;
            expectedDay -= 86400000;
        } else {
            break;
        }
    }

    return streak;
}
