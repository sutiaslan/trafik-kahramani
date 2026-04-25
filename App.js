import React, { useState } from 'react';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const goToGame = () => {
    setScore(0);
    setTotalAnswered(0);
    setScreen('game');
  };

  const goToResult = (finalScore, total) => {
    setScore(finalScore);
    setTotalAnswered(total);
    setScreen('result');
  };

  const goToHome = () => setScreen('home');

  if (screen === 'home') return <HomeScreen onStart={goToGame} />;
  if (screen === 'game') return <GameScreen onFinish={goToResult} onHome={goToHome} />;
  if (screen === 'result') return <ResultScreen score={score} total={totalAnswered} onRestart={goToGame} onHome={goToHome} />;
  return null;
}