import { useEffect, useState } from "react";
import { useJsPulse } from "./useJsPulse";

const SPIN_FRAMES = ["◴", "◷", "◶", "◵"];
const DOTS = ["", ".", "..", "..."];

type DemoRowProps = {
  label: string;
  children: React.ReactNode;
};

function DemoRow({ label, children }: DemoRowProps) {
  return (
    <tr className="anim-lab-row">
      <td colSpan={5}>
        <div className="anim-lab-line">
          <span className="anim-lab-tag">{label}</span>
          {children}
        </div>
      </td>
    </tr>
  );
}

/** Временные строки для проверки анимаций в WebKit 1С — отметьте живые варианты. */
export function LoadingAnimationLab() {
  const jsPulse = useJsPulse(true, 500);
  const [spinIndex, setSpinIndex] = useState(0);
  const [dotIndex, setDotIndex] = useState(0);
  const [barWide, setBarWide] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSpinIndex((v) => (v + 1) % SPIN_FRAMES.length);
      setDotIndex((v) => (v + 1) % DOTS.length);
      setBarWide((v) => !v);
    }, 450);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <tr className="anim-lab-header">
        <td colSpan={5}>Тест анимаций — какие строки «живые»?</td>
      </tr>
      <DemoRow label="A · JS opacity">
        <span className={`anim-lab-block ${jsPulse ? "anim-lab-block-bright" : ""}`} />
      </DemoRow>
      <DemoRow label="B · JS фон">
        <span className={`anim-lab-block anim-lab-bg ${jsPulse ? "anim-lab-bg-alt" : ""}`} />
      </DemoRow>
      <DemoRow label="C · JS точки">
        <span className="anim-lab-text">Загрузка{DOTS[dotIndex]}</span>
      </DemoRow>
      <DemoRow label="D · JS символы">
        <span className="anim-lab-text">{SPIN_FRAMES[spinIndex]} крутится</span>
      </DemoRow>
      <DemoRow label="E · JS полоска">
        <span className="anim-lab-progress-track">
          <span className="anim-lab-progress-fill" style={{ width: barWide ? "88%" : "32%" }} />
        </span>
      </DemoRow>
      <DemoRow label="F · CSS keyframes">
        <span className="anim-lab-block anim-lab-css-keyframes" />
        <span className="anim-lab-text anim-lab-css-spin">⟳ CSS</span>
      </DemoRow>
    </>
  );
}
