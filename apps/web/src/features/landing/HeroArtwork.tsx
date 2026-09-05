import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

/** Decorative token-to-route sketch. It conveys no live balances or swap status. */
export function HeroArtwork() {
  const artwork = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = artwork.current;
    if (!element) return;
    let inView = false;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      update();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  const motionLabel = paused ? 'Resume icon motion' : 'Pause icon motion';
  return (
    <>
      <div
        ref={artwork}
        className="hero-artwork"
        aria-hidden="true"
        data-motion={paused || !visible ? 'paused' : 'running'}
      >
        <svg className="hero-artwork-left" viewBox="0 0 260 490" fill="none">
          <g className="hero-guide">
            <path d="M22 0v490M238 0v490M0 94h260M0 394h260" />
            <circle cx="108" cy="166" r="100" strokeDasharray="2 9" />
            <path d="M0 294h260M108 0v490" strokeDasharray="2 9" />
          </g>
          <g className="hero-route">
            <path d="M108 94v32c0 74 100 58 100 132v60c0 40-37 38-70 38H83" />
            <path d="M39 194v37c0 28 23 29 52 29h61" strokeDasharray="4 6" />
            <path d="m145 254 7 6-7 6M90 350l-7 6 7 6" />
            <circle cx="208" cy="294" r="4" className="hero-route-dot" />
            <circle cx="108" cy="126" r="3" className="hero-route-dot" />
          </g>
          <g className="hero-token" transform="translate(108 62) rotate(-16)">
            <g className="hero-token-motion">
              <circle r="34" />
              <circle r="27" className="hero-token-inner" />
              <path d="m-14-8 14-8L14-8 0 0Zm0 8L0 8l14-8M-14 8l14 8 14-8" />
            </g>
          </g>
          <g
            className="hero-token hero-token-muted"
            transform="translate(40 166) rotate(18)"
          >
            <g className="hero-token-motion">
              <circle r="28" />
              <path d="M-13-10h26L0 13Zm13 0v23" />
            </g>
          </g>
          <g
            className="hero-token hero-token-peach"
            transform="translate(190 214) rotate(12)"
          >
            <g className="hero-token-motion">
              <circle r="25" />
              <path
                d="M0-14v28M9-8H-4a6 6 0 0 0 0 12h8a6 6 0 0 1 0 12H-9"
                transform="translate(0 -4) scale(.8)"
              />
            </g>
          </g>
          <g className="hero-token" transform="translate(65 356) rotate(-12)">
            <g className="hero-token-motion">
              <rect x="-43" y="-32" width="86" height="64" rx="15" />
              <path d="M-42-15h69M43-5H18a10 10 0 0 0 0 20h25" />
              <circle cx="21" cy="5" r="2" />
              <path d="M-26 15h15" />
            </g>
          </g>
          <g className="hero-guide">
            <path d="M163 425h10m-5-5v10M23 47h10m-5-5v10" />
            <circle cx="232" cy="55" r="3" />
          </g>
        </svg>
        <svg className="hero-artwork-right" viewBox="0 0 260 490" fill="none">
          <g className="hero-guide">
            <path d="M22 0v490M238 0v490M0 94h260M0 394h260" />
            <circle cx="158" cy="280" r="109" strokeDasharray="2 9" />
            <path d="M0 194h260M158 0v490" strokeDasharray="2 9" />
          </g>
          <g className="hero-route">
            <path d="M170 106h-40c-54 0-80 28-80 73v93c0 43 28 55 72 55h36v39" />
            <path d="M52 230h88c39 0 55 18 55 49" strokeDasharray="4 6" />
            <path d="m189 272 6 7 6-7M152 359l6 7 6-7" />
            <circle cx="50" cy="194" r="4" className="hero-route-dot" />
            <circle cx="105" cy="327" r="3" className="hero-route-dot" />
          </g>
          <g className="hero-token" transform="translate(192 80) rotate(14)">
            <g className="hero-token-motion">
              <circle r="44" />
              <circle r="36" className="hero-token-inner" />
              <path d="M-19-14h38L0 22Zm19 0v36" />
            </g>
          </g>
          <g
            className="hero-token hero-token-peach"
            transform="translate(66 180) rotate(-12)"
          >
            <g className="hero-token-motion">
              <circle r="27" />
              <path d="M-13-5h25m-6-6 6 6-6 6M13 7h-25m6-6-6 6 6 6" />
            </g>
          </g>
          <g
            className="hero-token hero-token-muted"
            transform="translate(194 279) rotate(12)"
          >
            <g className="hero-token-motion">
              <circle r="24" />
              <path d="M-10 10V-10l20 20V-10" />
            </g>
          </g>
          <g className="hero-token" transform="translate(158 398) rotate(10)">
            <g className="hero-token-motion">
              <path d="m0-35 30 13v24c0 19-16 29-30 36C-14 31-30 21-30 2v-24Z" />
              <path
                d="m0-22 19 8v16c0 12-9 20-19 26C-10 22-19 14-19 2v-16Z"
                className="hero-token-inner"
              />
              <path d="M0-8v16m0 7v1" />
            </g>
          </g>
          <g className="hero-guide">
            <path d="M53 412h10m-5-5v10M106 38h10m-5-5v10" />
            <circle cx="233" cy="182" r="3" />
          </g>
        </svg>
      </div>
      <button
        type="button"
        className="hero-motion-toggle"
        aria-label={motionLabel}
        title={motionLabel}
        onClick={() => setPaused(!paused)}
      >
        {paused ? (
          <Play size={14} aria-hidden="true" />
        ) : (
          <Pause size={14} aria-hidden="true" />
        )}
      </button>
    </>
  );
}
