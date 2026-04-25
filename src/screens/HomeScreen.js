import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const TrafficSign = ({ emoji, style, delay = 0 }) => {
  const float = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(float, { toValue: -12, duration: 1800, useNativeDriver: true }),
            Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rotate, { toValue: 1, duration: 2200, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: -1, duration: 2200, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
        ]),
      ])
    ).start();
  }, []);

  const rot = rotate.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Animated.View style={[style, { transform: [{ translateY: float }, { rotate: rot }] }]}>
      <Text style={styles.signEmoji}>{emoji}</Text>
    </Animated.View>
  );
};

export default function HomeScreen({ onStart }) {
  const titleScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0)).current;
  const carAnim = useRef(new Animated.Value(-120)).current;
  const lightBlink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Title entrance
    Animated.spring(titleScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
    Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Button
    setTimeout(() => {
      Animated.spring(btnScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
    }, 500);

    // Car driving across
    Animated.loop(
      Animated.sequence([
        Animated.timing(carAnim, { toValue: width + 120, duration: 4000, useNativeDriver: true }),
        Animated.timing(carAnim, { toValue: -120, duration: 0, useNativeDriver: true }),
        Animated.delay(1500),
      ])
    ).start();

    // Traffic light blink
    Animated.loop(
      Animated.sequence([
        Animated.timing(lightBlink, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(lightBlink, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.delay(1000),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
      >
        {/* Floating Traffic Signs */}
        <TrafficSign emoji="🚦" style={styles.sign1} delay={0} />
        <TrafficSign emoji="⛔" style={styles.sign2} delay={300} />
        <TrafficSign emoji="🚸" style={styles.sign3} delay={600} />
        <TrafficSign emoji="⚠️" style={styles.sign4} delay={900} />
        <TrafficSign emoji="🅿️" style={styles.sign5} delay={200} />
        <TrafficSign emoji="🛑" style={styles.sign6} delay={700} />

        {/* Road at bottom */}
        <View style={styles.road}>
          <View style={styles.roadLine} />
          <Animated.Text style={[styles.carEmoji, { transform: [{ translateX: carAnim }] }]}>
            🚗
          </Animated.Text>
        </View>

        {/* Header */}
        <View style={styles.headerBadge}>
          <Animated.Text style={[styles.headerBadgeText, { opacity: lightBlink }]}>
            🟢 GÜVENLİ OYUN
          </Animated.Text>
        </View>

        {/* Title */}
        <Animated.View style={[styles.titleContainer, {
          transform: [{ scale: titleScale }],
          opacity: titleOpacity,
        }]}>
          <Text style={styles.titleEmoji}>🦸</Text>
          <Text style={styles.title}>TRAFİK{'\n'}KAHRAMAN</Text>
          <View style={styles.titleUnderline} />
          <Text style={styles.subtitle}>Trafik ve Toplum Kurallarını{'\n'}Öğren, Kahraman Ol!</Text>
        </Animated.View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: '❓', label: '100 Soru' },
            { icon: '⏱️', label: '15 Sn Süre' },
            { icon: '🏆', label: 'Puan Kazan' },
          ].map((item, i) => (
            <View key={i} style={styles.statBadge}>
              <Text style={styles.statIcon}>{item.icon}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Start Button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity onPress={onStart} activeOpacity={0.85}>
            <LinearGradient
              colors={['#e94560', '#c62a47']}
              style={styles.startButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.startButtonText}>🚀 OYUNU BAŞLAT</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>6+ yaş | Eğitici ve Eğlenceli</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a2e' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  sign1: { position: 'absolute', top: '8%', left: '5%' },
  sign2: { position: 'absolute', top: '8%', right: '5%' },
  sign3: { position: 'absolute', top: '22%', left: '2%' },
  sign4: { position: 'absolute', top: '22%', right: '2%' },
  sign5: { position: 'absolute', top: '38%', left: '3%' },
  sign6: { position: 'absolute', top: '38%', right: '3%' },
  signEmoji: { fontSize: 36 },
  road: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 60, backgroundColor: '#2c2c2c', justifyContent: 'center', overflow: 'hidden',
  },
  roadLine: {
    position: 'absolute', left: 0, right: 0, top: '50%',
    height: 4, backgroundColor: '#f1c40f', opacity: 0.6,
  },
  carEmoji: { fontSize: 32, position: 'absolute', top: 10 },
  headerBadge: {
    backgroundColor: 'rgba(39,174,96,0.2)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16,
    borderWidth: 1, borderColor: '#27ae60',
  },
  headerBadgeText: { color: '#2ecc71', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  titleContainer: { alignItems: 'center', marginBottom: 28 },
  titleEmoji: { fontSize: 72, marginBottom: 8 },
  title: {
    fontSize: 48, fontWeight: '900', color: '#ffffff',
    textAlign: 'center', letterSpacing: 2, lineHeight: 52,
    textShadowColor: '#e94560', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  titleUnderline: {
    width: 120, height: 4, backgroundColor: '#e94560',
    borderRadius: 2, marginTop: 8, marginBottom: 16,
  },
  subtitle: { fontSize: 16, color: '#a0aec0', textAlign: 'center', lineHeight: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  statIcon: { fontSize: 22 },
  statLabel: { color: '#cbd5e0', fontSize: 11, fontWeight: '600', marginTop: 4 },
  startButton: {
    paddingHorizontal: 48, paddingVertical: 18, borderRadius: 32,
    shadowColor: '#e94560', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
  footer: { color: '#4a5568', fontSize: 13, marginTop: 24 },
});
