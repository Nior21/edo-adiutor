type LoadingCaptionProps = {
  text: string;
};

export function LoadingCaption({ text }: LoadingCaptionProps) {
  return (
    <p className="loading-caption loading-caption-css" aria-live="polite">
      {text}
    </p>
  );
}
