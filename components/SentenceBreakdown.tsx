import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SentenceAnalysis, getSentenceSummary, getStatusColor } from '../lib/sentence-analysis';

interface SentenceBreakdownProps {
    analyses: SentenceAnalysis[];
}

export function SentenceBreakdown({ analyses }: SentenceBreakdownProps) {
    if (analyses.length === 0) return null;

    const summary = getSentenceSummary(analyses);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>LINGUISTIC ANALYSIS</Text>
                <Text style={styles.count}>{summary.total} SEGMENTS</Text>
            </View>

            {/* Individual sentences - List style instead of card style */}
            <View style={styles.list}>
                {analyses.map((analysis, idx) => (
                    <SentenceRow key={idx} analysis={analysis} />
                ))}
            </View>
        </View>
    );
}

function SentenceRow({ analysis }: { analysis: SentenceAnalysis }) {
    const rawColor = getStatusColor(analysis.status);
    const statusColor = rawColor === '#3B82F6' ? '#6366F1' : rawColor;

    return (
        <View style={styles.row}>
            <View style={styles.rowTop}>
                <View style={[styles.indicator, { backgroundColor: statusColor }]} />
                <Text style={styles.index}>SEGMENT {analysis.index + 1}</Text>
                <Text style={[styles.score, { color: statusColor }]}>{analysis.score}</Text>
            </View>

            <Text style={styles.text}>"{analysis.sentence}"</Text>

            {analysis.issues.length > 0 && (
                <View style={styles.issues}>
                    {analysis.issues.map((issue, idx) => (
                        <View key={idx} style={styles.issue}>
                            <Text style={styles.issueDesc}>• {issue.description}</Text>
                            {issue.correction && (
                                <View style={styles.correction}>
                                    <Text style={styles.fixedLabel}>REVISED:</Text>
                                    <Text style={styles.fixedContent}>{issue.correction}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 32,
        marginBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E'
    },
    title: {
        fontSize: 11,
        fontWeight: '800',
        color: '#48484A',
        letterSpacing: 1.5,
    },
    count: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
    },
    list: {
        gap: 24,
    },
    row: {
        paddingRight: 8,
    },
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    indicator: {
        width: 3,
        height: 12,
        borderRadius: 1.5,
        marginRight: 10,
    },
    index: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        flex: 1,
        letterSpacing: 0.5
    },
    score: {
        fontSize: 14,
        fontWeight: '800',
    },
    text: {
        fontSize: 15,
        color: '#F2F2F7',
        lineHeight: 22,
        fontWeight: '500',
    },
    issues: {
        marginTop: 12,
        paddingLeft: 12,
    },
    issue: {
        marginBottom: 8,
    },
    issueDesc: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '600',
    },
    correction: {
        marginTop: 6,
        paddingLeft: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#1C1C1E',
    },
    fixedLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#34C759',
        marginBottom: 2,
    },
    fixedContent: {
        fontSize: 13,
        color: '#F2F2F7',
        fontWeight: '600',
        fontStyle: 'italic'
    },
});
