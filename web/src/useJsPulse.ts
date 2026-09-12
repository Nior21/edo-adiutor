import { useEffect, useState } from "react";

/** Пульсация через JS — CSS @keyframes в WebKit 1С часто не работает. */
export function useJsPulse(active: boolean, intervalMs = 550) {
  const [bright, setBright] = useState(false);

  useEffect(() => {
    if (!active) {
      setBright(false);
      return;
    }

    setBright(true);
    const id = window.setInterval(() => {
      setBright((prev) => !prev);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [active, intervalMs]);

  return bright;
}

/** Вращение через JS для индикатора загрузки. */
export function useJsSpin(active: boolean, stepDeg = 36, intervalMs = 80) {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!active) {
      setAngle(0);
      return;
    }

    const id = window.setInterval(() => {
      setAngle((prev) => (prev + stepDeg) % 360);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [active, stepDeg, intervalMs]);

  return angle;
}
