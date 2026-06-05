import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SessionRecord, calculateStreak } from '../lib/storage';
import { ProgressChart } from './ProgressChart';

interface HistoryListProps {
    sessions: SessionRecord[];
    onClose: () => void;
    onClear: () => void;
}

const COLORS = {
    bg: '#050505',
    surface: '#0F0F10',
    border: '#1C1C1E',
    textPrimary: '#F2F2F7',
    textSecondary: '#8E8E93',
    textTertiary: '#48484A',
    accent: '#6366F1',
    success: '#34C759',
    error: '#FF3B30',
};

export function HistoryList({ sessions, onClear }: HistoryListProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const trendSessions = [...sessions].slice(0, 8).reverse();
    const trendScores = trendSessions.map(s => s.overallScore);
    const trendLabels = trendSessions.map(s => new Date(s.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }));

    const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((acc, s) => acc + s.overallScore, 0) / sessions.length)
        : 0;

    const streak = calculateStreak(sessions);

    return (
        <View style={styles.container}>
            {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No activity recorded</Text>
                    <Text style={styles.emptySubtext}>Complete a practice session to begin tracking performance.</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.sessionList}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Insights Hub */}
                    <View style={styles.insightsHub}>
                        <View style={styles.hubHeader}>
                            <View>
                                <Text style={styles.hubTitle}>ANALYTICS OVERVIEW</Text>
                                <Text style={styles.streakText}>{streak} DAY CONTINUITY</Text>
                            </View>
                            <View style={styles.avgCircle}>
                                <Text style={styles.avgText}>{avgScore}</Text>
                                <Text style={styles.avgLabel}>AVG</Text>
                            </View>
                        </View>

                        <ProgressChart scores={trendScores} labels={trendLabels} />

                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryCell}>
                                <Text style={styles.summaryValue}>{sessions.length}</Text>
                                <Text style={styles.summaryLabel}>SESSIONS</Text>
                            </View>
                            <View style={styles.summaryCell}>
                                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                                    {Math.max(...sessions.map(s => s.overallScore))}
                                </Text>
                                <Text style={styles.summaryLabel}>PEAK SCORE</Text>
                            </View>
                            <View style={styles.summaryCell}>
                                <Text style={styles.summaryValue}>{sessions.reduce((acc, s) => acc + s.transcript.split(' ').length, 0)}</Text>
                                <Text style={styles.summaryLabel}>TOTAL WORDS</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionHeader}>SESSION LOG</Text>
                    {sessions.map((session) => {
                        const isExpanded = selectedId === session.id;
                        return (
                            <TouchableOpacity
                                key={session.id}
                                style={[styles.row, isExpanded && styles.rowActive]}
                                onPress={() => setSelectedId(isExpanded ? null : session.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.rowLead}>
                                    <View style={[styles.statusDot, { backgroundColor: getScoreStatusColor(session.overallScore) }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.rowName}>{session.sessionName || 'Capture Data'}</Text>
                                        <Text style={styles.rowMeta}>
                                            {session.sessionType.toUpperCase()} • {new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <Text style={[styles.rowScore, { color: getScoreStatusColor(session.overallScore) }]}>
                                        {session.overallScore}
                                    </Text>
                                </View>

                                {isExpanded && (
                                    <View style={styles.expanded}>
                                        <View style={styles.miniMetrics}>
                                            <MiniStat label="Clarity" val={session.metrics.clarity} />
                                            <MiniStat label="Fluency" val={session.metrics.fluency} />
                                            <MiniStat label="Richness" val={session.metrics.richness} />
                                            <MiniStat label="Structure" val={session.metrics.structure} />
                                        </View>
                                        <View style={styles.transcriptBox}>
                                            <Text style={styles.transcriptText}>"{session.transcript}"</Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity onPress={onClear} style={styles.clearAction}>
                        <Text style={styles.clearText}>PURGE LOG DATA</Text>
                    </TouchableOpacity>
                    <View style={{ height: 60 }} />
                </ScrollView>
            )}
        </View>
    );
}

function MiniStat({ label, val }: { label: string, val: number }) {
    return (
        <View style={styles.miniStat}>
            <Text style={styles.miniLabel}>{label}</Text>
            <Text style={styles.miniVal}>{val}</Text>
        </View>
    );
}

function getScoreStatusColor(s: number) {
    if (s >= 85) return COLORS.success;
    if (s >= 70) return COLORS.accent;
    if (s >= 55) return '#FF9F0A';
    return COLORS.error;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scrollContent: { padding: 24 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
    emptyText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
    emptySubtext: { color: COLORS.textTertiary, fontSize: 13, textAlign: 'center', marginTop: 8 },
    sessionList: { flex: 1 },
    insightsHub: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 24,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    hubHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    hubTitle: { color: COLORS.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    streakText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 4 },
    avgCircle: { alignItems: 'flex-end' },
    avgText: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
    avgLabel: { fontSize: 10, color: COLORS.textTertiary, fontWeight: '700' },
    summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: THEME_BACKUP_SPACING_MD || 16 },
    summaryCell: { flex: 1 },
    summaryValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
    summaryLabel: { color: COLORS.textTertiary, fontSize: 9, fontWeight: '700', marginTop: 4 },
    sectionHeader: { color: COLORS.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
    row: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    rowActive: { borderColor: COLORS.accent },
    rowLead: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 4, height: 16, borderRadius: 2, marginRight: 16 },
    rowName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
    rowMeta: { color: COLORS.textTertiary, fontSize: 11, marginTop: 4, fontWeight: '600' },
    rowScore: { fontSize: 18, fontWeight: '800' },
    expanded: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
    miniMetrics: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    miniStat: { flex: 1 },
    miniLabel: { color: COLORS.textTertiary, fontSize: 9, fontWeight: '700', marginBottom: 4 },
    miniVal: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
    transcriptBox: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    transcriptText: { color: COLORS.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
    clearAction: { marginTop: 40, alignItems: 'center', padding: 12 },
    clearText: { color: COLORS.textTertiary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
});

// Polyfill for missing spacing variable in some contexts
const THEME_BACKUP_SPACING_MD = 16;
