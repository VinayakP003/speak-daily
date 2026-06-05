import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { HistoryList } from '../../components/HistoryList';
import { clearHistory, getHistory, SessionRecord } from '../../lib/storage';

export default function HistoryScreen() {
    const [history, setHistory] = useState<SessionRecord[]>([]);

    const loadHistoryData = async () => {
        const data = await getHistory();
        setHistory(data);
    };

    useFocusEffect(
        React.useCallback(() => {
            loadHistoryData();
        }, [])
    );

    const handleClear = async () => {
        await clearHistory();
        loadHistoryData();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>ACTIVITY LOG</Text>
                    <Text style={styles.subtitle}>Historical capture of speaking performance</Text>
                </View>
                <HistoryList
                    sessions={history}
                    onClose={() => { }}
                    onClear={handleClear}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' },
    header: {
        padding: 24,
        paddingTop: 32,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    title: {
        fontSize: 14,
        color: '#F2F2F7',
        fontWeight: '800',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 11,
        color: '#48484A',
        marginTop: 6,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
});
