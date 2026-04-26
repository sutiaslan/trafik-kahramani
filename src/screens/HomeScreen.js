import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ onStart }) {
  const titleScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0)).current;
  const bearBounce = useRef(new Animated.Value(1)).current;
  const carAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    Animated.spring(titleScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
    Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.spring(btnScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
    }, 500);

    // Ayı zıplama animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(bearBounce, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(bearBounce, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.delay(800),
      ])
    ).start();

    // Araba animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(carAnim, { toValue: width + 120, duration: 4000, useNativeDriver: true }),
        Animated.timing(carAnim, { toValue: -120, duration: 0, useNativeDriver: true }),
        Animated.delay(1500),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>

        {/* Yüzen işaretler */}
        <Text style={[styles.floatSign, { top: '8%', left: '5%' }]}>🚦</Text>
        <Text style={[styles.floatSign, { top: '8%', right: '5%' }]}>⛔</Text>
        <Text style={[styles.floatSign, { top: '20%', left: '3%' }]}>🚸</Text>
        <Text style={[styles.floatSign, { top: '20%', right: '3%' }]}>⚠️</Text>

        {/* Yol */}
        <View style={styles.road}>
          <View style={styles.roadLine} />
          <Animated.Text style={[styles.carEmoji, { transform: [{ translateX: carAnim }] }]}>
            🚗
          </Animated.Text>
        </View>

        {/* Ayı Karakter */}
        <Animated.Text style={[styles.bearEmoji, { transform: [{ scale: bearBounce }] }]}>
          🐻
        </Animated.Text>

        {/* Konuşma balonu */}
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>Merhaba! Benimle öğrenmeye hazır mısın? 🌟</Text>
        </View>

        {/* Başlık */}
        <Animated.View style={[styles.titleContainer, {
          transform: [{ scale: titleScale }], opacity: titleOpacity,
        }]}>
          <Text style={styles.title}>AKILLI{'\n'}ÇOCUK</Text>
          <View style={styles.titleUnderline} />
          <Text style={styles.subtitle}>Eğlenerek Öğren, Büyü! 🌈</Text>
        </Animated.View>

        {/* Özellikler */}
        <View style={styles.statsRow}>
          {[
            { icon: '❓', label: '100 Soru' },
            { icon: '⏱️', label: '15 Sn' },
            { icon: '🏆', label: 'Puan Kazan' },
          ].map((item, i) => (
            <View key={i} style={styles.statBadge}>
              <Text style={styles.statIcon}>{item.icon}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Başlat Butonu */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity onPress={onStart} activeOpacity={0.85}>
            <LinearGradient
              colors={['#e94560', '#c62a47']}
              style={styles.startButton}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.startButtonText}>🚀 HADI BAŞLAYALIM!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>3-7 yaş | Eğitici ve Eğlenceli 🎈</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a2e' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  floatSign: { position: 'absolute', fontSize: 32 },
  road: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#2c2c2c', justifyContent: 'center', overflow: 'hidden' },
  roadLine: { position: 'absolute', left: 0, right: 0, top: '50%', height: 4, backgroundColor: '#f1c40f', opacity: 0.6 },
  carEmoji: { fontSize: 32, position: 'absolute', top: 10 },
  bearEmoji: { fontSize: 80, marginBottom: 4 },
  speechBubble: {
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    marginBottom: 16, maxWidth: width * 0.75,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  speechText: { color: '#1a1a2e', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  titleContainer: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 44, fontWeight: '900', color: '#ffffff', textAlign: 'center', letterSpacing: 2, lineHeight: 48, textShadowColor: '#e94560', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  titleUnderline: { width: 120, height: 4, backgroundColor: '#e94560', borderRadius: 2, marginTop: 8, marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#a0aec0', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  statIcon: { fontSize: 22 },
  statLabel: { color: '#cbd5e0', fontSize: 11, fontWeight: '600', marginTop: 4 },
  startButton: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: 32, shadowColor: '#e94560', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  footer: { color: '#4a5568', fontSize: 13, marginTop: 20 },
});
