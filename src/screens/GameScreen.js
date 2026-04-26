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

const BEAR_MOODS = {
  idle: '🐻',
  happy: '🐻',
  sad: '🐻',
  thinking: '🐻',
  correct: '🐻',
  wrong: '🐻',
};

const CircleTimer = ({ seconds, total }) => {
  const color = seconds > 8 ? '#27ae60' : seconds > 4 ? '#f39c12' : '#e74c3c';
  return (
    <View style={timerStyles.container}>
      <View style={[timerStyles.innerCircle, { borderColor: color }]}>
        <Text style={[timerStyles.timerText, { color }]}>{seconds}</Text>
      </View>
    </View>
  );
};

const timerStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  innerCircle: {
    width: 66, height: 66, borderRadius: 33, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  timerText: { fontSize: 26, fontWeight: '900' },
});

const Confetti = ({ visible }) => {
  const pieces = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-20),
      opacity: new Animated.Value(0),
      emoji: ['🎉', '⭐', '🌟', '✨', '🎊', '🏆'][i % 6],
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      pieces.forEach((p, i) => {
        p.x.setValue(Math.random() * width);
        p.y.setValue(-20);
        p.opacity.setValue(0);
        Animated.parallel([
          Animated.timing(p.y, { toValue: height * 0.8, duration: 1800 + i * 60, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.Text key={i} style={{
          position: 'absolute', fontSize: 20 + (i % 3) * 8,
          transform: [{ translateX: p.x }, { translateY: p.y }],
          opacity: p.opacity,
        }}>
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

// Ayı karakteri konuşma balonu
const BearSpeech = ({ text, mood, bearBounce }) => {
  const bearEmojis = {
    idle: '🐻', happy: '🐻‍🎄', sad: '😢', correct: '🥳', wrong: '😅', thinking: '🤔',
  };
  return (
    <View style={bearStyles.container}>
      <Animated.Text style={[bearStyles.bear, { transform: [{ scale: bearBounce }] }]}>
        {bearEmojis[mood] || '🐻'}
      </Animated.Text>
      {text ? (
        <View style={bearStyles.bubble}>
          <Text style={bearStyles.bubbleText}>{text}</Text>
          <View style={bearStyles.bubbleTail} />
        </View>
      ) : null}
    </View>
  );
};

const bearStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, paddingHorizontal: 8 },
  bear: { fontSize: 56, marginRight: 8 },
  bubble: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 12, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  bubbleText: { color: '#1a1a2e', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  bubbleTail: {
    position: 'absolute', left: -10, bottom: 12,
    width: 0, height: 0,
    borderTopWidth: 8, borderTopColor: 'transparent',
    borderBottomWidth: 8, borderBottomColor: 'transparent',
    borderRightWidth: 10, borderRightColor: '#fff',
  },
});

export default function GameScreen({ onFinish, onHome }) {
  const [gameQuestions] = useState(() => shuffle(questions).slice(0, QUESTIONS_PER_GAME));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bearMood, setBearMood] = useState('idle');
  const [bearText, setBearText] = useState('');

  const timerRef = useRef(null);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const bearBounce = useRef(new Animated.Value(1)).current;

  const currentQ = gameQuestions[currentIndex];
  const isCorrect = selectedOption === currentQ?.correct;

  const bounceBear = () => {
    Animated.sequence([
      Animated.timing(bearBounce, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(bearBounce, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(bearBounce, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // Soruyu sesli oku (Text-to-Speech)
  const speakQuestion = (text) => {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = 'tr-TR';
        utter.rate = 0.85;
        utter.pitch = 1.2;
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!currentQ) return;
    setBearMood('thinking');
    setBearText(currentQ.question);
    bounceBear();
    speakQuestion(currentQ.question);
  }, [currentIndex]);

  useEffect(() => {
    if (answered) return;
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
