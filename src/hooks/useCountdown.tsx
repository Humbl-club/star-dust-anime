import { useState, useEffect } from 'react';

interface CountdownResult {
  timeLeft: string;
  isExpired: boolean;
  totalSeconds: number;
}

export const useCountdown = (targetDate: Date | null): CountdownResult => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft('Unknown');
      setIsExpired(true);
      setTotalSeconds(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft('Released');
        setIsExpired(true);
        setTotalSeconds(0);
        return;
      }

      setIsExpired(false);
      setTotalSeconds(Math.floor(difference / 1000));

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [targetDate]);

  return { timeLeft, isExpired, totalSeconds };
};