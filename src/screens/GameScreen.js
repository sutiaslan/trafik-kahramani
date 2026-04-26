import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, SafeAreaView, StatusBar,
  ScrollView, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { questions } from '../data/questions';

const { width, height } = Dimensions.get('window');
const TIMER_SECONDS = 15;
const QUESTIONS_PER_GAME = 20; // 100 sorudan 20'si rastgele seçilir (tam oyun için 100 yap)

// Soruları karıştır
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Çember progress bar
const CircleTimer = ({ seconds, total }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / total;
  const dashOffset = circumference * (1 - progress);

  const color = seconds > 8 ? '#27ae60' : seconds > 4 ? '#f39c12' : '#e74c3c';

  return (
    <View style={timerStyles.container}>
      <View style={timerStyles.circle}>
        <View style={[timerStyles.innerCircle, { borderColor: color }]}>
          <Text style={[timerStyles.timerText, { color }]}>{seconds}</Text>
        </View>
      </View>
    </View>
  );
};

const timerStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  circle: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  innerCircle: {
    width: 66, height: 66, borderRadius: 33, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  timerText: { fontSize: 26, fontWeight: '900' },
});

// Konfeti parçacığı
const Confetti = ({ visible }) => {
  const pieces = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-20),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
      color: ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c'][i % 6],
      emoji: ['🎉', '⭐', '🌟', '✨', '🎊', '🏆'][i % 6],
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      pieces.forEach((p, i) => {
        p.x.setValue(Math.random() * width);
        p.y.setValue(-20);
        p.opacity.setValue(0);
        p.rotate.setValue(0);
        Animated.parallel([
          Animated.timing(p.y, { toValue: height * 0.8, duration: 1800 + i * 60, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(p.rotate, { toValue: 360, duration: 1500, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            fontSize: 20 + (i % 3) * 8,
            transform: [{ translateX: p.x }, { translateY: p.y }],
            opacity: p.opacity,
          }}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

export default function GameScreen({ onFinish, onHome }) {
  const [gameQuestions] = useState(() => shuffle(questions).slice(0, QUESTIONS_PER_GAME));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [streak, setStreak] = useState(0);

  const timerRef = useRef(null);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const signBounce = useRef(new Animated.Value(1)).current;

  const currentQ = gameQuestions[currentIndex];
  const isCorrect = selectedOption === currentQ?.correct;

  // Timer
  useEffect(() => {
    if (answered) return;
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIndex]);

  // Progress bar
  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: ((currentIndex) / gameQuestions.length) * 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  // Sign bounce animation
  useEffect(() => {
    Animated.spring(signBounce, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
    signBounce.setValue(0.5);
  }, [currentIndex]);

  const handleTimeout = () => {
    setAnswered(true);
    setStreak(0);
    showResultAnimation(false);
    Vibration.vibrate([0, 50, 50, 50]);
    scheduleNext();
  };

  const showResultAnimation = (correct) => {
    if (correct) {
      setShowConfetti(true);
      Animated.spring(resultScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
      Animated.timing(resultOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      setTimeout(() => setShowConfetti(false), 2000);
    } else {
      setShowWrong(true);
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
      Animated.spring(resultScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
      Animated.timing(resultOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  const scheduleNext = () => {
    setTimeout(() => {
      goToNext();
    }, 2800);
  };

  const handleAnswer = (optionIndex) => {
    if (answered) return;
    clearInterval(timerRef.current);
    setSelectedOption(optionIndex);
    setAnswered(true);
    const correct = optionIndex === currentQ.correct;
    if (correct) {
      const bonus = timeLeft > 10 ? 3 : timeLeft > 5 ? 2 : 1;
      setScore(s => s + bonus);
      setStreak(s => s + 1);
      showResultAnimation(true);
    } else {
      setStreak(0);
      Vibration.vibrate([0, 60, 40, 60]);
      showResultAnimation(false);
    }
    scheduleNext();
  };

  const goToNext = () => {
    // Slide out
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: -width, duration: 300, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      if (currentIndex + 1 >= gameQuestions.length) {
        onFinish(score, gameQuestions.length);
        return;
      }
      cardAnim.setValue(width);
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setAnswered(false);
      setShowConfetti(false);
      setShowWrong(false);
      resultScale.setValue(0);
      resultOpacity.setValue(0);
      // Slide in
      Animated.parallel([
        Animated.spring(cardAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const getOptionStyle = (index) => {
    if (!answered) return styles.optionDefault;
    if (index === currentQ.correct) return styles.optionCorrect;
    if (index === selectedOption) return styles.optionWrong;
    return styles.optionDimmed;
  };

  const getOptionTextStyle = (index) => {
    if (!answered) return styles.optionTextDefault;
    if (index === currentQ.correct) return styles.optionTextCorrect;
    if (index === selectedOption) return styles.optionTextWrong;
    return styles.optionTextDimmed;
  };

  const timerColor = timeLeft > 8 ? '#27ae60' : timeLeft > 4 ? '#f39c12' : '#e74c3c';

  if (!currentQ) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1b2a" />
      <LinearGradient colors={['#0d1b2a', '#1a2a3a', '#0d1b2a']} style={styles.container}>
        <Confetti visible={showConfetti} />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onHome} style={styles.homeBtn}>
            <Text style={styles.homeBtnText}>🏠</Text>
          </TouchableOpacity>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>PUAN</Text>
            <Text style={styles.scoreValue}>⭐ {score}</Text>
          </View>

          {streak >= 2 && (
            <View style={styles.streakBox}>
              <Text style={styles.streakText}>🔥 {streak} seri!</Text>
            </View>
          )}

          <CircleTimer seconds={timeLeft} total={TIMER_SECONDS} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, {
              width: progressWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            }]}
          />
          <Text style={styles.progressText}>
            {currentIndex + 1} / {gameQuestions.length}
          </Text>
        </View>

        {/* Question Card */}
        <Animated.View style={[styles.cardContainer, {
          transform: [{ translateX: cardAnim }, { translateX: shakeAnim }],
          opacity: cardOpacity,
        }]}>
          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {currentQ.sign} {currentQ.category?.toUpperCase()}
            </Text>
          </View>

          {/* Main sign */}
          <Animated.Text style={[styles.mainEmoji, { transform: [{ scale: signBounce }] }]}>
            {currentQ.emoji}
          </Animated.Text>

          {/* Question */}
          <Text style={styles.questionText}>{currentQ.question}</Text>

          {/* Result overlay */}
          {answered && (
            <Animated.View style={[
              styles.resultOverlay,
              isCorrect ? styles.resultCorrect : styles.resultWrong,
              { transform: [{ scale: resultScale }], opacity: resultOpacity }
            ]}>
              <Text style={styles.resultEmoji}>{isCorrect ? '✅' : '❌'}</Text>
              <Text style={styles.resultTitle}>{isCorrect ? 'DOĞRU! 🎉' : 'YANLIŞ! 😢'}</Text>
              <Text style={styles.resultExplanation}>{currentQ.explanation}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQ.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleAnswer(index)}
              disabled={answered}
              activeOpacity={0.8}
              style={[styles.optionButton, getOptionStyle(index)]}
            >
              <View style={styles.optionRow}>
                <View style={[styles.optionLabel, answered && index === currentQ.correct && styles.optionLabelCorrect]}>
                  <Text style={styles.optionLabelText}>
                    {['A', 'B', 'C', 'D'][index]}
                  </Text>
                </View>
                <Text style={[styles.optionText, getOptionTextStyle(index)]}>{option}</Text>
                {answered && index === currentQ.correct && <Text style={styles.checkMark}>✓</Text>}
                {answered && index === selectedOption && index !== currentQ.correct && <Text style={styles.xMark}>✗</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer warning */}
        {!answered && timeLeft <= 5 && (
          <Animated.View style={styles.urgentBanner}>
            <Text style={styles.urgentText}>⏰ Acele et! {timeLeft} saniye kaldı!</Text>
          </Animated.View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d1b2a' },
  container: { flex: 1, paddingHorizontal: 16 },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 12, paddingBottom: 8, gap: 10,
  },
  homeBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  homeBtnText: { fontSize: 20 },
  scoreBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  scoreLabel: { color: '#718096', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  scoreValue: { color: '#fbbf24', fontSize: 18, fontWeight: '900' },
  streakBox: {
    backgroundColor: 'rgba(231,76,60,0.2)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#e74c3c',
  },
  streakText: { color: '#e74c3c', fontSize: 12, fontWeight: '800' },
  progressContainer: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4, marginBottom: 12, overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%', backgroundColor: '#3498db',
    borderRadius: 4,
  },
  progressText: {
    position: 'absolute', right: 4, top: -14,
    color: '#718096', fontSize: 11, fontWeight: '600',
  },
  cardContainer: {
    backgroundColor: '#1e2d3d', borderRadius: 24,
    padding: 20, marginBottom: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
    overflow: 'hidden', minHeight: 200,
  },
  categoryBadge: {
    backgroundColor: 'rgba(52,152,219,0.2)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(52,152,219,0.4)',
  },
  categoryText: { color: '#3498db', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  mainEmoji: { fontSize: 64, marginBottom: 12 },
  questionText: {
    color: '#ffffff', fontSize: 18, fontWeight: '700',
    textAlign: 'center', lineHeight: 26,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24, padding: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  resultCorrect: { backgroundColor: 'rgba(39,174,96,0.97)' },
  resultWrong: { backgroundColor: 'rgba(231,76,60,0.97)' },
  resultEmoji: { fontSize: 48, marginBottom: 6 },
  resultTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  resultExplanation: {
    color: 'rgba(255,255,255,0.92)', fontSize: 14,
    textAlign: 'center', lineHeight: 20,
  },
  optionsContainer: { gap: 10 },
  optionButton: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 2,
  },
  optionDefault: {
    backgroundColor: '#1e2d3d', borderColor: 'rgba(255,255,255,0.12)',
  },
  optionCorrect: {
    backgroundColor: 'rgba(39,174,96,0.25)', borderColor: '#27ae60',
  },
  optionWrong: {
    backgroundColor: 'rgba(231,76,60,0.25)', borderColor: '#e74c3c',
  },
  optionDimmed: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)',
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  optionLabel: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionLabelCorrect: { backgroundColor: '#27ae60' },
  optionLabelText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600' },
  optionTextDefault: { color: '#cbd5e0' },
  optionTextCorrect: { color: '#2ecc71' },
  optionTextWrong: { color: '#e74c3c' },
  optionTextDimmed: { color: '#4a5568' },
  checkMark: { color: '#2ecc71', fontSize: 20, fontWeight: '900' },
  xMark: { color: '#e74c3c', fontSize: 20, fontWeight: '900' },
  urgentBanner: {
    marginTop: 10, backgroundColor: 'rgba(231,76,60,0.2)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: '#e74c3c', alignItems: 'center',
  },
  urgentText: { color: '#e74c3c', fontSize: 14, fontWeight: '800' },
});
