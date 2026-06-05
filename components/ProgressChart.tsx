import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface ProgressChartProps {
    scores: number[];
    labels: string[];
}

export function ProgressChart({ scores, labels }: ProgressChartProps) {
    if (scores.length < 2) return null;

    const width = Dimensions.get('window').width - 48; // Sidebar padding
    const height = 120;
    const padding = 15;

    const maxScore = 100;
    const minScore = 0;

    // Calculate scaling
    const getX = (i: number) => (i / (scores.length - 1)) * (width - 2 * padding) + padding;
    const getY = (s: number) => height - ((s - minScore) / (maxScore - minScore)) * (height - 2 * padding) - padding;

    // Generate Path (Cubic Bezier for smoothness)
    let d = `M ${getX(0)} ${getY(scores[0])}`;
    for (let i = 0; i < scores.length - 1; i++) {
        const x1 = getX(i);
        const y1 = getY(scores[i]);
        const x2 = getX(i + 1);
        const y2 = getY(scores[i + 1]);
        const cx = (x1 + x2) / 2;
        d += ` C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
    }

    // Fill area
    const fillD = `${d} L ${getX(scores.length - 1)} ${height} L ${getX(0)} ${height} Z`;

    return (
        <View style={styles.container}>
            <Svg height={height} width={width}>
                <Defs>
                    <LinearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#6366F1" stopOpacity="0.2" />
                        <Stop offset="1" stopColor="#6366F1" stopOpacity="0" />
                    </LinearGradient>
                </Defs>

                {/* Area under curve */}
                <Path d={fillD} fill="url(#pathGrad)" />

                {/* The Main Curve */}
                <Path
                    d={d}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />

                {/* Refined Points (Markers) */}
                {scores.map((score, i) => (
                    <Circle
                        key={i}
                        cx={getX(i)}
                        cy={getY(score)}
                        r="3"
                        fill="#050505"
                        stroke="#6366F1"
                        strokeWidth="2"
                    />
                ))}
            </Svg>

            <View style={styles.axis}>
                <Text style={styles.axisText}>{labels[0]}</Text>
                <Text style={styles.axisText}>RECENT PERFORMANCE</Text>
                <Text style={styles.axisText}>{labels[labels.length - 1]}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        marginBottom: 24,
    },
    axis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 4,
    },
    axisText: {
        color: '#48484A',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase'
    },
});
