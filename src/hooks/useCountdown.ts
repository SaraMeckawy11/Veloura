import { useEffect, useMemo, useState } from "react";

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

const emptyCountdown: CountdownState = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isPast: false
};

function getCountdown(targetDate: string): CountdownState {
  const diff = new Date(targetDate).getTime() - Date.now();

  if (Number.isNaN(diff)) {
    return emptyCountdown;
  }

  if (diff <= 0) {
    return { ...emptyCountdown, isPast: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isPast: false };
}

export function useCountdown(targetDate: string) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(targetDate));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetDate]);

  return useMemo(() => countdown, [countdown]);
}
