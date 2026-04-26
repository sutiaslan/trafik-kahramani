import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const getRank = (score, total) => {
  const pct = score / (total * 3) * 100;
  if (pct >= 85) return { emoji: '🏆', title: 'TRAFIK KAHRAMANI!', color: '#f1c40f', desc: 'Mükemmel! Sen gerçek bir trafik kahramanısın!' };
  if (pct >= 65) return { emoji: '🥇', title: 'SÜPER ÇOCUK!', color: '#e67e22', desc: 'Harika iş çıkardın! Biraz daha pratik yaparak zirveye ulaşabilirsin.' };
  if (pct >= 45) return { emoji: '🥈', title: 'İYİ GİDİYOR!', color: '#95a5a6', desc: 'Güzel başlangıç! Tekrar dene ve daha iyi ol!' };
  return { emoji: '📚', title: 'DAHA FAZLA ÖĞREN!', color: '#3498db', desc: 'Trafik kurallarını öğrenmek için tekrar oyna. Başarabilirsin!' };
};

export default function ResultScreen({ score, total, onRestart, onHome }) {
  const rank = getRank(score, total);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starAnim1 = useRef(new Animated.Value(0)).current;
  const starAnim2 = useRef(new Animated.Value(0)).current;
  const starAnim3 = useRef(new Animated.Value(0)).current;
  const scoreCount = useRef(new Animated.Value(0)).current;
  const btnScale1 = useRef(new Animated.Value(0)).current;
  const btnScale2 = useRef(new Animated.Value(0)).current;

  const pct = Math.round((score / (total * 3)) * 100);

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();

    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Stars
    setTimeout(() => {
      Animated.spring(starAnim1, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }, 300);
    setTimeout(() => {
      Animated.spring(starAnim2, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }, 500);
    setTimeout(() => {
      Animated.spring(starAnim3, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }, 700);

    // Buttons
    setTimeout(() => {
      Animated.spring(btnScale1, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }, 900);
    setTimeout(() => {
      Animated.spring(btnScale2, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }, 1100);
  }, []);

  const stars = pct >= 85 ? 3 : pct >= 55 ? 2 : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>

        {/* Result card */}
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
            style={styles.cardInner}
          >
            {/* Trophy / rank emoji */}
            <Text style={styles.rankEmoji}>{rank.emoji}</Text>
            <Text style={[styles.rankTitle, { color: rank.color }]}>{rank.title}</Text>

            {/* Stars */}
            <View style={styles.starsRow}>
              {[starAnim1, starAnim2, starAnim3].map((anim, i) => (
                <Animated.Text
                  key={i}
                  style={[
                    styles.star,
                    { transform: [{ scale: anim }] },
                    i >= stars && styles.starEmpty,
                  ]}
                >
                  {i < stars ? '⭐' : '☆'}
                </Animated.Text>
              ))}
            </View>

            {/* Score display */}
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{score}</Text>
              <Text style={styles.scoreLabel}>PUAN</Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Soru</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#27ae60' }]}>{pct}%</Text>
                <Text style={styles.statLabel}>Başarı</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#3498db' }]}>{score}</Text>
                <Text style={styles.statLabel}>Puan</Text>
              </View>
            </View>

            <Text style={styles.rankDesc}>{rank.desc}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Safety reminder */}
        <View style={styles.reminderBox}>
          <Text style={styles.reminderTitle}>🚦 Unutma!</Text>
          <Text style={styles.reminderText}>
            Trafik kuralları hayat kurtarır. Her zaman dikkatli ve kurallara uygun davran!
          </Text>
        </View>

        {/* Buttons */}
        <Animated.View style={{ transform: [{ scale: btnScale1 }], width: '100%' }}>
          <TouchableOpacity onPress={onRestart} activeOpacity={0.85}>
            <LinearGradient
              colors={['#e94560', '#c62a47']}
              style={styles.btnPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.btnPrimaryText}>🔄 TEKRAR OYNA</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: btnScale2 }], width: '100%', marginTop: 12 }}>
          <TouchableOpacity onPress={onHome} style={styles.btnSecondary} activeOpacity={0.85}>
            <Text style={styles.btnSecondaryText}>🏠 Ana Menü</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>Trafik Kahramanı • Güvenli Yaşam</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a2e' },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, gap: 16,
  },
  card: { width: '100%', borderRadius: 28, overflow: 'hidden' },
  cardInner: {
    padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 28,
  },
  rankEmoji: { fontSize: 72, marginBottom: 8 },
  rankTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  star: { fontSize: 40 },
  starEmpty: { opacity: 0.3 },
  scoreCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(233,69,96,0.15)', borderWidth: 3,
    borderColor: '#e94560', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  scoreNumber: { color: '#e94560', fontSize: 38, fontWeight: '900' },
  scoreLabel: { color: '#e94560', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 20, marginBottom: 16,
    gap: 20,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#718096', fontSize: 11, marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  rankDesc: { color: '#a0aec0', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  reminderBox: {
    backgroundColor: 'rgba(52,152,219,0.12)', borderRadius: 16,
    padding: 16, width: '100%', borderWidth: 1,
    borderColor: 'rgba(52,152,219,0.3)',
  },
  reminderTitle: { color: '#3498db', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  reminderText: { color: '#90cdf4', fontSize: 13, lineHeight: 20 },
  btnPrimary: {
    borderRadius: 24, paddingVertical: 16,
    alignItems: 'center', width: '100%',
    shadowColor: '#e94560', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  btnPrimaryText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  btnSecondary: {
    borderRadius: 24, paddingVertical: 14,
    alignItems: 'center', width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  btnSecondaryText: { color: '#cbd5e0', fontSize: 16, fontWeight: '700' },
  footer: { color: '#2d3748', fontSize: 12, marginTop: 8 },
});
