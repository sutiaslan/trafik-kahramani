import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, SafeAreaView, StatusBar, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { questions } from '../data/questions';

const { width, height } = Dimensions.get('window');
const TIMER_SECONDS = 15;
const QUESTIONS_PER_GAME = 20;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BearCharacter = ({ speaking, correct, wrong }) => {
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (speaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: 1.08, duration: 300, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      bounce.setValue(1);
    }
  }, [speaking]);

  useEffect(() => {
    if (correct || wrong) {
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [correct, wrong]);

  const eyeExpression = correct ? '😊' : wrong ? '😢' : speaking ? '😮' : '🙂';

  return (
    <Animated.View style={[bearStyles.container, { transform: [{ scale: bounce }] }]}>
      <LinearGradient
        colors={correct ? ['#27ae60', '#2ecc71'] : wrong ? ['#e74c3c', '#c0392b'] : ['#f39c12', '#e67e22']}
        style={bearStyles.body}
      >
        <View style={bearStyles.earsRow}>
          <View style={bearStyles.ear} />
          <View style={bearStyles.ear} />
        </View>
        <Text style={bearStyles.expression}>{eyeExpression}</Text>
        {speaking && (
          <View style={bearStyles.speechBubble}>
            <Text style={bearStyles.speechText}>💬</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const bearStyles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 6 },
  body: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  earsRow: { flexDirection: 'row', position: 'absolute', top: -8, justifyContent: 'space-between', width: 72 },
  ear: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#e67e22', borderWidth: 3, borderColor: '#fff' },
  expression: { fontSize: 32 },
  speechBubble: { position: 'absolute', top: -28, right: -18, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 2, borderColor: '#f39c12' },
  speechText: { fontSize: 14 },
});

const Confetti = ({ visible }) => {
  const pieces = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-30),
      opacity: new Animated.Value(0),
      emoji: ['🎉', '⭐', '🌟', '✨', '🎊', '🏆', '🌈', '💫'][i % 8],
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      pieces.forEach((p, i) => {
        p.x.setValue(Math.random() * width);
        p.y.setValue(-30);
        p.opacity.setValue(0);
        Animated.parallel([
          Animated.timing(p.y, { toValue: height * 0.9, duration: 2000 + i * 50, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.Text key={i} style={{ position: 'absolute', fontSize: 24 + (i % 3) * 8, transform: [{ translateX: p.x }, { translateY: p.y }], opacity: p.opacity }}>
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

const speakQuestion = (text) => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {}
};

export default function GameScreen({ onFinish, onHome }) {
  const [gameQuestions] = useState(() => shuffle(questions).slice(0, QUESTIONS_PER_GAME));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bearSpeaking, setBearSpeaking] = useState(true);
  const [bearCorrect, setBearCorrect] = useState(false);
  const [bearWrong, setBearWrong] = useState(false);

  const timerRef = useRef(null);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const signBounce = useRef(new Animated.Value(0.5)).current;

  const currentQ = gameQuestions[currentIndex];
  const isCorrect = selectedOption === currentQ?.correct;

  useEffect(() => {
    setBearSpeaking(true);
    setBearCorrect(false);
    setBearWrong(false);
    if (currentQ) {
      setTimeout(() => {
        speakQuestion(currentQ.question);
        setTimeout(() => setBearSpeaking(false), 3000);
      }, 500);
    }
    Animated.spring(signBounce, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
  }, [currentIndex]);

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

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: (currentIndex / gameQuestions.length) * 100,
      duration: 400, useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const handleTimeout = () => {
    setAnswered(true);
    setStreak(0);
    setBearWrong(true);
    Vibration.vibrate([0, 50, 50, 50]);
    speakQuestion('Süre doldu! Doğru cevap: ' + currentQ.options[currentQ.correct]);
    showResultAnim(false);
    scheduleNext();
  };

  const showResultAnim = (correct) => {
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    } else {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }
    Animated.spring(resultScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    Animated.timing(resultOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const scheduleNext = () => setTimeout(() => goToNext(), 3000);

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
      setBearCorrect(true);
      speakQuestion('Aferin! Doğru cevap! ' + currentQ.explanation);
    } else {
      setStreak(0);
      setBearWrong(true);
      Vibration.vibrate([0, 60, 40, 60]);
      speakQuestion('Üzgünüm! Doğru cevap: ' + currentQ.options[currentQ.correct]);
    }
    showResultAnim(correct);
    scheduleNext();
  };

  const goToNext = () => {
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
      setBearCorrect(false);
      setBearWrong(false);
      resultScale.setValue(0);
      resultOpacity.setValue(0);
      signBounce.setValue(0.5);
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

  const timerColor = timeLeft > 8 ? '#27ae60' : timeLeft > 4 ? '#f39c12' : '#e74c3c';

  if (!currentQ) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1b2a" />
      <LinearGradient colors={['#0d1b2a', '#1a2a3a', '#0d1b2a']} style={styles.container}>
        <Confetti visible={showConfetti} />
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
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
          )}
          <View style={[styles.timerBox, { borderColor: timerColor }]}>
            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, {
            width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }]} />
          <Text style={styles.progressText}>{currentIndex + 1} / {gameQuestions.length}</Text>
        </View>
        <BearCharacter speaking={bearSpeaking} correct={bearCorrect} wrong={bearWrong} />
        <Animated.View style={[styles.cardContainer, {
          transform: [{ translateX: cardAnim }, { translateX: shakeAnim }],
          opacity: cardOpacity,
        }]}>
          <Animated.Text style={[styles.mainEmoji, { transform: [{ scale: signBounce }] }]}>
            {currentQ.emoji}
          </Animated.Text>
          <Text style={styles.questionText}>{currentQ.question}</Text>
          <TouchableOpacity onPress={() => speakQuestion(currentQ.question)} style={styles.speakBtn}>
            <Text style={styles.speakBtnText}>🔊 Soruyu Dinle</Text>
          </TouchableOpacity>
          {answered && (
            <Animated.View style={[
              styles.resultOverlay,
              isCorrect ? styles.resultCorrect : styles.resultWrong,
              { transform: [{ scale: resultScale }], opacity: resultOpacity }
            ]}>
              <Text style={styles.resultEmoji}>{isCorrect ? '✅' : '❌'}</Text>
              <Text style={styles.resultTitle}>{isCorrect ? 'AFERİN! 🎉' : 'ÜZGÜNÜM! 😢'}</Text>
              <Text style={styles.resultExplanation}>{currentQ.explanation}</Text>
            </Animated.View>
          )}
        </Animated.View>
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
                  <Text style={styles.optionLabelText}>{['A', 'B', 'C', 'D'][index]}</Text>
                </View>
                <Text style={styles.optionText} numberOfLines={2}>{option}</Text>
                {answered && index === currentQ.correct && <Text style={styles.checkMark}>✓</Text>}
                {answered && index === selectedOption && index !== currentQ.correct && <Text style={styles.xMark}>✗</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {!answered && timeLeft <= 5 && (
          <View style={styles.urgentBanner}>
            <Text style={styles.urgentText}>⏰ Acele et! {timeLeft} saniye!</Text>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d1b2a' },
  container: { flex: 1, paddingHorizontal: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingBottom: 6, gap: 8 },
  homeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  homeBtnText: { fontSize: 18 },
  scoreBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  scoreLabel: { color: '#718096', fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  scoreValue: { color: '#fbbf24', fontSize: 16, fontWeight: '900' },
  streakBox: { backgroundColor: 'rgba(231,76,60,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: '#e74c3c' },
  streakText: { color: '#e74c3c', fontSize: 12, fontWeight: '800' },
  timerBox: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  timerText: { fontSize: 20, fontWeight: '900' },
  progressContainer: { height: 7, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8, overflow: 'hidden', position: 'relative' },
  progressBar: { height: '100%', backgroundColor: '#3498db', borderRadius: 4 },
  progressText: { position: 'absolute', right: 4, top: -14, color: '#718096', fontSize: 10, fontWeight: '600' },
  cardContainer: { backgroundColor: '#1e2d3d', borderRadius: 20, padding: 16, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', minHeight: 160 },
  mainEmoji: { fontSize: 52, marginBottom: 8 },
  questionText: { color: '#ffffff', fontSize: 16, fontWeight: '700', textAlign: 'center', lineHeight: 24, marginBottom: 10 },
  speakBtn: { backgroundColor: 'rgba(52,152,219,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#3498db' },
  speakBtnText: { color: '#3498db', fontSize: 13, fontWeight: '700' },
  resultOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center' },
  resultCorrect: { backgroundColor: 'rgba(39,174,96,0.97)' },
  resultWrong: { backgroundColor: 'rgba(231,76,60,0.97)' },
  resultEmoji: { fontSize: 44, marginBottom: 4 },
  resultTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  resultExplanation: { color: 'rgba(255,255,255,0.92)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  optionsContainer: { gap: 8 },
  optionButton: { borderRadius: 14, overflow: 'hidden', borderWidth: 2 },
  optionDefault: { backgroundColor: '#1e2d3d', borderColor: 'rgba(255,255,255,0.12)' },
  optionCorrect: { backgroundColor: 'rgba(39,174,96,0.25)', borderColor: '#27ae60' },
  optionWrong: { backgroundColor: 'rgba(231,76,60,0.25)', borderColor: '#e74c3c' },
  optionDimmed: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  optionLabel: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  optionLabelCorrect: { backgroundColor: '#27ae60' },
  optionLabelText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#cbd5e0' },
  checkMark: { color: '#2ecc71', fontSize: 18, fontWeight: '900' },
  xMark: { color: '#e74c3c', fontSize: 18, fontWeight: '900' },
  urgentBanner: { marginTop: 8, backgroundColor: 'rgba(231,76,60,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#e74c3c', alignItems: 'center' },
  urgentText: { color: '#e74c3c', fontSize: 13, fontWeight: '800' },
});
