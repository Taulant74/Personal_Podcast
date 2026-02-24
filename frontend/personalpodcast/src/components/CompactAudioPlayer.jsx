import { useEffect, useRef, useState } from "react";

export default function CompactAudioPlayer({ src, onFirstPlay }) {
  const audioRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const a = audioRef.current;
    if (!a) return;

    a.play().catch(() => {});
  }, [expanded]);

  const handleClick = () => {
    if (!src) return;

    setExpanded(true);

    if (!fired) {
      setFired(true);
      onFirstPlay?.();
    }
  };

  return (
    <div className={`cap ${expanded ? "cap--expanded" : ""}`}>
      {!expanded ? (
        <button className="cap-btn" onClick={handleClick} aria-label="Play">
          ▶
        </button>
      ) : (
        <audio ref={audioRef} controls className="cap-audio">
          <source src={src} />
        </audio>
      )}
    </div>
  );
}