import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { SentenceBreakdown } from '../../components/SentenceBreakdown';
import { NormalizedTranscript, normalizeTranscript } from '../../lib/normalize';
import { calculateScores, getMotivationalMessage, SpeechScore } from '../../lib/scoring';
import { saveSession } from '../../lib/storage';
import { generateSuggestions, Suggestion } from '../../lib/suggestions';
import { getRandomTopic, PRACTICE_EXERCISES } from '../../lib/topics';
import { transcribeAudio } from '../../lib/transcribe';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- THEME DEFINITIONS (The 10-year dev way: Centralized constants) ---
const THEME = {
  colors: {
    bg: '#050505',
    surface: '#0F0F10',
    border: '#1C1C1E',
    borderLight: '#2C2C2E',
    textPrimary: '#F2F2F7',
    textSecondary: '#8E8E93',
    textTertiary: '#48484A',
    accent: '#6366F1', // Indigo
    accentSecondary: '#8B5CF6', // Violet
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9F0A',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
  }
};

export default function HomeScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [status, setStatus] = useState<string>('Ready');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [score, setScore] = useState<SpeechScore | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [normalizedData, setNormalizedData] = useState<NormalizedTranscript | null>(null);
  const [activeTopic, setActiveTopic] = useState(getRandomTopic());
  const [activeExercise, setActiveExercise] = useState<typeof PRACTICE_EXERCISES[0] | null>(null);
  const [practiceMode, setPracticeMode] = useState<'topic' | 'exercise'>('topic');

  // Animation values
  const recordingPulse = useSharedValue(0);
  const contentFade = useSharedValue(1);

  useEffect(() => {
    if (recording) {
      recordingPulse.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        -1,
        true
      );
    } else {
      recordingPulse.value = withTiming(0);
    }
  }, [recording]);

  const recordingWaveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(recordingPulse.value, [0, 1], [1, 1.4]) }],
    opacity: interpolate(recordingPulse.value, [0, 1], [0.5, 0]),
  }));

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (recording && !isAnalyzing) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime) / 1000;
        setRecordingDuration(elapsed);
        if (elapsed >= 30) {
          stopRecording();
        }
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording, recordingStartTime, isAnalyzing]);

  async function startRecording() {
    try {
      setTranscript('');
      setScore(null);
      setSuggestion(null);
      setNormalizedData(null);
      setRecordingDuration(0);
      setStatus('Warming up...');

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setRecordingStartTime(Date.now());
      setStatus('Live');
    } catch (err) {
      console.error(err);
      setStatus('System Error');
    }
  }

  async function stopRecording() {
    if (!recording || isAnalyzing) return;

    const currentRecording = recording;
    const startTime = recordingStartTime;
    const mode = practiceMode;
    const topic = activeTopic;
    const exercise = activeExercise;

    try {
      setIsAnalyzing(true);
      setStatus('Analyzing frequency...');
      setRecording(null);

      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      const duration = Math.round((Date.now() - startTime) / 1000);

      if (!uri || duration < 2) {
        setStatus(duration < 2 ? 'Session too short' : 'Capture failed');
        setIsAnalyzing(false);
        return;
      }

      setTimeout(async () => {
        try {
          const text = await transcribeAudio(uri);
          setTranscript(text);

          const normalized = normalizeTranscript(text, duration);
          const speechScore = calculateScores(normalized);
          const suggestions = generateSuggestions(
            speechScore,
            normalized,
            mode === 'exercise' ? exercise?.id : null
          );

          setScore(speechScore);
          setSuggestion(suggestions[0]);
          setNormalizedData(normalized);
          setStatus('Ready');

          await saveSession(
            text,
            speechScore,
            normalized.grammarErrorCount,
            normalized.fillerCount,
            normalized.profanityCount,
            suggestions[0].title,
            mode,
            mode === 'topic' ? topic.title : (exercise?.title || 'Unknown')
          );
        } catch (err) {
          console.error(err);
          setStatus('Analysis bottleneck');
        } finally {
          setIsAnalyzing(false);
        }
      }, 400);
    } catch (err) {
      setIsAnalyzing(false);
      setRecording(null);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShuffle = useCallback(() => {
    contentFade.value = 0;
    setTimeout(() => {
      setActiveTopic(getRandomTopic());
      contentFade.value = withTiming(1, { duration: 300 });
    }, 150);
  }, []);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentFade.value,
    transform: [{ translateY: interpolate(contentFade.value, [0, 1], [10, 0]) }]
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>

        {/* Navigation / Header */}
        <View style={styles.navHeader}>
          <View>
            <Text style={styles.brandName}>SPEAKDAILY</Text>
            <Text style={styles.sessionStatus}>{recording ? 'RECORDING' : isAnalyzing ? 'PROCESSING' : 'IDLE'}</Text>
          </View>
          <View style={styles.navRight}>
            <View style={styles.indicatorDot(recording ? THEME.colors.error : THEME.colors.success)} />
            <Text style={styles.indicatorText}>{status}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[]}>

          {!recording && !score && (
            <Animated.View style={[styles.mainStage, animatedContentStyle]}>
              {/* Type Toggle */}
              <View style={styles.typeSwitcher}>
                <TouchableOpacity
                  onPress={() => setPracticeMode('topic')}
                  style={[styles.typeItem, practiceMode === 'topic' && styles.typeItemActive]}
                >
                  <Text style={[styles.typeText, practiceMode === 'topic' && styles.typeTextActive]}>Open Topic</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPracticeMode('exercise');
                    if (!activeExercise) setActiveExercise(PRACTICE_EXERCISES[0]);
                  }}
                  style={[styles.typeItem, practiceMode === 'exercise' && styles.typeItemActive]}
                >
                  <Text style={[styles.typeText, practiceMode === 'exercise' && styles.typeTextActive]}>Daily Exercise</Text>
                </TouchableOpacity>
              </View>

              {/* Prompt Area */}
              <View style={styles.promptWrapper}>
                <View style={styles.promptHeader}>
                  <Text style={styles.categoryLabel}>
                    {practiceMode === 'topic' ? activeTopic.category.toUpperCase() : 'SKILL PROGRESSION'}
                  </Text>
                  {practiceMode === 'topic' && (
                    <TouchableOpacity onPress={handleShuffle}>
                      <Text style={styles.shuffleAction}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {practiceMode === 'topic' ? (
                  <View>
                    <Text style={styles.promptMainText}>{activeTopic.title}</Text>
                    <View style={styles.hintBox}>
                      <View style={styles.hintIcon} />
                      <Text style={styles.hintText}>{activeTopic.tip}</Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseScroll}>
                      {PRACTICE_EXERCISES.map((ex) => (
                        <TouchableOpacity
                          key={ex.id}
                          onPress={() => setActiveExercise(ex)}
                          style={[styles.exercisePill, activeExercise?.id === ex.id && styles.exercisePillActive]}
                        >
                          <Text style={[styles.exercisePillText, activeExercise?.id === ex.id && styles.exercisePillTextActive]}>
                            {ex.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {activeExercise && (
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.promptMainText}>{activeExercise.title}</Text>
                        <Text style={styles.exerciseGoalText}>{activeExercise.instruction}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Active Recording State */}
          {recording && (
            <View style={styles.recordingStage}>
              <View style={styles.timerWrapper}>
                <Text style={styles.timeDigit}>{formatTime(recordingDuration)}</Text>
                <Text style={styles.timeLabel}>ELAPSED</Text>
              </View>

              <View style={styles.waveformContainer}>
                <Animated.View style={[styles.wavePulse, recordingWaveStyle]} />
                <View style={styles.centerNode} />
              </View>

              <Text style={styles.recordingInstruction}>Speak clearly and naturally...</Text>

              <TouchableOpacity
                style={styles.actionStop}
                onPress={stopRecording}
                activeOpacity={0.9}
              >
                <View style={styles.actionStopInner} />
              </TouchableOpacity>
            </View>
          )}

          {/* Results State */}
          {score && (
            <View style={styles.resultsStage}>
              <View style={styles.reportHeader}>
                <View style={styles.scoreGroup}>
                  <Text style={styles.scoreValue}>{score.overall}</Text>
                  <Text style={styles.scoreMax}>/ 100</Text>
                </View>
                <Text style={styles.motivationLabel}>{getMotivationalMessage(score.overall)}</Text>
              </View>

              <View style={styles.metricsGrid}>
                {(Object.entries(score.metrics) as [keyof typeof score.metrics, number][]).map(([key, val]) => (
                  <View key={key} style={styles.metricCard}>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricName}>{key}</Text>
                      <Text style={[styles.metricScore, { color: getScoreStatusColor(val) }]}>{val}</Text>
                    </View>
                    <View style={styles.progressBase}>
                      <View style={[styles.progressIndicator, { width: `${val}%`, backgroundColor: getScoreStatusColor(val) }]} />
                    </View>
                  </View>
                ))}
              </View>

              {suggestion && (
                <View style={styles.expertTip}>
                  <Text style={styles.tipHeader}>COACH INSIGHT</Text>
                  <Text style={styles.tipMessage}>{suggestion.message}</Text>
                  <View style={styles.exampleWrapper}>
                    <Text style={styles.exampleTitle}>SUGGESTED PHRASING</Text>
                    <Text style={styles.exampleContent}>"{suggestion.example}"</Text>
                  </View>
                </View>
              )}

              {normalizedData && (
                <SentenceBreakdown analyses={normalizedData.sentenceAnalyses} />
              )}

              <View style={styles.logSection}>
                <Text style={styles.logLabel}>TRANSCRIPT DATA</Text>
                <Text style={styles.logContent}>{transcript}</Text>
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => { setScore(null); setTranscript(''); }}
              >
                <Text style={styles.resetButtonText}>New Session</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Idle State Action */}
          {!recording && !score && (
            <View style={styles.footerAction}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={startRecording}
                disabled={isAnalyzing}
              >
                <View style={[styles.primaryButtonInner, isAnalyzing && { opacity: 0.5 }]}>
                  <Text style={styles.primaryButtonText}>
                    {isAnalyzing ? 'WORKING...' : 'START CAPTURE'}
                  </Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.footerLegal}>Ensure your microphone is accessible for best results.</Text>
            </View>
          )}

          <View style={{ height: THEME.spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getScoreStatusColor(s: number) {
  if (s >= 85) return THEME.colors.success;
  if (s >= 70) return THEME.colors.accent;
  if (s >= 55) return THEME.colors.warning;
  return THEME.colors.error;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg
  },
  safeArea: {
    flex: 1
  },
  navHeader: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 2
  },
  sessionStatus: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  indicatorDot: (color: string) => ({
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color,
    marginRight: 6
  }),
  indicatorText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  scrollContent: {
    padding: THEME.spacing.lg
  },
  mainStage: {
    marginTop: THEME.spacing.md,
  },
  typeSwitcher: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.xl,
    backgroundColor: THEME.colors.surface,
    padding: 4,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  typeItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.sm,
  },
  typeItemActive: {
    backgroundColor: THEME.colors.borderLight,
  },
  typeText: {
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    fontSize: 12
  },
  typeTextActive: {
    color: THEME.colors.textPrimary
  },
  promptWrapper: {
    paddingVertical: THEME.spacing.xl,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md
  },
  categoryLabel: {
    fontSize: 11,
    color: THEME.colors.accent,
    fontWeight: '800',
    letterSpacing: 1.5
  },
  shuffleAction: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  promptMainText: {
    fontSize: 28,
    color: THEME.colors.textPrimary,
    fontWeight: '700',
    lineHeight: 38,
    marginBottom: THEME.spacing.lg
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  hintIcon: {
    width: 4,
    height: 16,
    backgroundColor: THEME.colors.accent,
    borderRadius: 2,
    marginRight: THEME.spacing.md,
    marginTop: 2
  },
  hintText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
    flex: 1
  },
  exerciseScroll: {
    marginBottom: THEME.spacing.xl
  },
  exercisePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: THEME.spacing.sm
  },
  exercisePillActive: {
    borderColor: THEME.colors.accent,
    backgroundColor: 'rgba(99, 102, 241, 0.05)'
  },
  exercisePillText: {
    color: THEME.colors.textTertiary,
    fontSize: 12,
    fontWeight: '700'
  },
  exercisePillTextActive: {
    color: THEME.colors.accent
  },
  exerciseGoalText: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    lineHeight: 22
  },
  footerAction: {
    marginTop: THEME.spacing.xxl,
    alignItems: 'center'
  },
  primaryButton: {
    width: '100%',
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButtonInner: {
    height: 60,
    backgroundColor: THEME.colors.textPrimary,
    borderRadius: THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: THEME.colors.bg,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2
  },
  footerLegal: {
    marginTop: THEME.spacing.md,
    fontSize: 11,
    color: THEME.colors.textTertiary,
  },
  recordingStage: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xxl,
  },
  timerWrapper: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xxl
  },
  timeDigit: {
    fontSize: 64,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontVariant: ['tabular-nums']
  },
  timeLabel: {
    fontSize: 10,
    color: THEME.colors.textTertiary,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: THEME.spacing.xs
  },
  waveformContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.xl
  },
  wavePulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.colors.error,
  },
  centerNode: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.colors.error,
  },
  recordingInstruction: {
    color: THEME.colors.textSecondary,
    fontSize: 15,
    marginBottom: THEME.spacing.xxl
  },
  actionStop: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: THEME.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionStopInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: THEME.colors.error
  },
  resultsStage: {
    paddingTop: THEME.spacing.md
  },
  reportHeader: {
    marginBottom: THEME.spacing.xl,
    paddingBottom: THEME.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border
  },
  scoreGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: THEME.spacing.sm
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    lineHeight: 72
  },
  scoreMax: {
    fontSize: 18,
    color: THEME.colors.textTertiary,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: THEME.spacing.xs
  },
  motivationLabel: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    fontWeight: '600'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.xxl
  },
  metricCard: {
    width: (width - (THEME.spacing.lg * 2) - THEME.spacing.md) / 2,
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  metricName: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  metricScore: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBase: {
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 2
  },
  expertTip: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xxl
  },
  tipHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.warning,
    letterSpacing: 2,
    marginBottom: THEME.spacing.md
  },
  tipMessage: {
    fontSize: 15,
    color: THEME.colors.textPrimary,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: THEME.spacing.lg
  },
  exampleWrapper: {
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  exampleTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textTertiary,
    marginBottom: 6
  },
  exampleContent: {
    fontSize: 14,
    color: THEME.colors.success,
    fontStyle: 'italic',
    lineHeight: 20
  },
  logSection: {
    marginTop: THEME.spacing.xxl,
    marginBottom: THEME.spacing.xl
  },
  logLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textTertiary,
    marginBottom: THEME.spacing.sm,
    letterSpacing: 1
  },
  logContent: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 22,
  },
  resetButton: {
    height: 56,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderLight
  },
  resetButtonText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700'
  }
});
