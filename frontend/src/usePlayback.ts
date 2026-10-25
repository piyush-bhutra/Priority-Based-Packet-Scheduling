import { useEffect, useMemo, useState } from "react";
import { replay } from "./playback";
import type { Result } from "./types";

export function usePlayback(result: Result | undefined) {
  const [position, setPosition] = useState({ time: 0, sequence: -1 });
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const end = result?.metrics.makespan ?? 0;
  useEffect(() => {
    setPlaying(false);
    setPosition({ time: 0, sequence: -1 });
  }, [result]);
  useEffect(() => {
    if (!playing || !result) return;
    let frame: number;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (Math.min(now - last, 100) / 1000) * speed;
      last = now;
      setPosition((previous) => ({
        time: Math.min(previous.time + delta, end),
        sequence: Infinity,
      }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, result, speed, end]);
  useEffect(() => {
    if (position.time >= end) setPlaying(false);
  }, [position.time, end]);
  const snapshot = useMemo(
    () => replay(result?.events ?? [], position.time, position.sequence),
    [result, position],
  );
  const seek = (time: number) => {
    setPlaying(false);
    setPosition({ time: Math.max(0, Math.min(time, end)), sequence: Infinity });
  };
  const reset = () => {
    setPlaying(false);
    setPosition({ time: 0, sequence: -1 });
  };
  const toggle = () => {
    if (!result) return;
    if (position.time >= end) setPosition({ time: 0, sequence: -1 });
    setPlaying((previous) => !previous);
  };
  const step = () => {
    setPlaying(false);
    const next = result?.events.find(
      (event) => event.sequence > (snapshot.last?.sequence ?? -1),
    );
    if (next) setPosition({ time: next.time, sequence: next.sequence });
  };
  return {
    time: position.time,
    playing,
    speed,
    setSpeed,
    snapshot,
    seek,
    reset,
    toggle,
    step,
  };
}
