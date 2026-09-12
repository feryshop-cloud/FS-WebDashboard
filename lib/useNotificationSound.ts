"use client";

import { useCallback, useRef } from "react";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.wav");
      audioRef.current.volume = 0.5;
    }
    audioRef.current.play().catch(() => {});
  }, []);

  return { play };
}
