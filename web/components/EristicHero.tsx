'use client';

import { useEffect, useRef } from 'react';
// @ts-ignore — plain JS engine, intentionally untyped
import { initEristic } from './eristicEngine';

declare global {
  interface Window { __ERISTIC_IMG__?: string; THREE?: any; }
}

const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

function loadThree(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.THREE) return resolve(window.THREE);
    const prev = document.querySelector('script[data-eristic-three]') as HTMLScriptElement | null;
    if (prev) {
      prev.addEventListener('load', () => resolve(window.THREE));
      prev.addEventListener('error', () => reject(new Error('three load failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = THREE_SRC;
    s.async = true;
    s.dataset.eristicThree = '1';
    s.addEventListener('load', () => resolve(window.THREE));
    s.addEventListener('error', () => reject(new Error('three load failed')));
    document.head.appendChild(s);
  });
}

export interface EristicHeroProps {
  /** Path to the goddess image in /public. Default: /eristicgod.jpg */
  image?: string;
}

export default function EristicHero({ image = '/eristicgod.jpg' }: EristicHeroProps) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let disposed = false;
    window.__ERISTIC_IMG__ = image;

    loadThree()
      .then((THREE) => {
        if (disposed) return;
        cleanupRef.current = initEristic(THREE);
      })
      .catch((e) => console.error('[EristicHero]', e));

    return () => {
      disposed = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [image]);

  return (
    <div className="eristic-hero">
      <style>{CSS}</style>
      <div id="scroller" />
      <div id="stage"><canvas id="gl" /></div>
      <div id="mark">ERIS<span>TIC</span></div>
      {/* Engine indexes cap0/cap1/cap2 by id without null-checking — leaving
          them in the DOM (empty) keeps the render loop alive while showing
          nothing visible to the user. cap3 is the only caption we surface. */}
      <div className="cap" id="cap0" aria-hidden="true" />
      <div className="cap" id="cap1" aria-hidden="true" />
      <div className="cap" id="cap2" aria-hidden="true" />
      <div className="cap" id="cap3"><h2>Enter the Arena.</h2></div>
      <div id="cta"><a href="/arena">Enter the Arena</a></div>
      <div id="hint">Scroll</div>
      <div id="toast" />
    </div>
  );
}

const CSS = `
.eristic-hero * { margin:0; padding:0; box-sizing:border-box; }
.eristic-hero #scroller { height:560vh; }
.eristic-hero #stage { position:fixed; inset:0; z-index:1; filter: saturate(0.62) contrast(1.06) brightness(0.92); }
.eristic-hero #gl { display:block; width:100%; height:100%; }
.eristic-hero #mark { position:fixed; top:28px; left:32px; z-index:10; font-size:13px; letter-spacing:.55em; font-weight:500; color:rgba(217,212,199,.85); text-transform:uppercase; user-select:none; mix-blend-mode:screen; font-family: ui-monospace, "SF Mono", Menlo, monospace; }
.eristic-hero #mark span { color:#8b5cf6; }
.eristic-hero .cap { position:fixed; left:50%; z-index:9; transform:translate(-50%,0); text-align:center; opacity:0; pointer-events:none; will-change:opacity,transform; width:min(86vw,720px); font-family: ui-monospace, "SF Mono", Menlo, monospace; }
.eristic-hero .cap h2 { font-weight:400; font-size:clamp(20px,2.4vw,30px); line-height:1.15; color:#d9d4c7; letter-spacing:.32em; text-transform:uppercase; }
.eristic-hero #cap3 { top:42vh; }
.eristic-hero #cta { position:fixed; bottom:14vh; left:50%; transform:translate(-50%,12px); z-index:11; opacity:0; pointer-events:none; text-align:center; }
.eristic-hero #cta a { display:inline-block; padding:13px 40px; color:#0a0a0a; text-decoration:none; font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size:11px; letter-spacing:.32em; text-transform:uppercase; font-weight:700; background:#8b5cf6; border-radius:9999px; transition: background .25s, box-shadow .25s; }
.eristic-hero #cta a:hover { background:#7c3aed; box-shadow:0 0 32px rgba(139,92,246,.5); }
.eristic-hero #hint { position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:9; font-size:10px; letter-spacing:.5em; text-transform:uppercase; color:rgba(217,212,199,.5); pointer-events:none; transition:opacity .6s; font-family: ui-monospace, "SF Mono", Menlo, monospace; }
.eristic-hero #hint::after { content:""; display:block; width:1px; height:34px; margin:10px auto 0; background:linear-gradient(rgba(217,212,199,.6),transparent); animation:eristicFall 1.8s ease-in-out infinite; }
@keyframes eristicFall { 0%{transform:scaleY(0);transform-origin:top} 55%{transform:scaleY(1);transform-origin:top} 56%{transform-origin:bottom} 100%{transform:scaleY(0);transform-origin:bottom} }
.eristic-hero #toast { position:fixed; bottom:24px; right:24px; z-index:50; opacity:0; font-size:11px; letter-spacing:.18em; color:rgba(217,212,199,.85); background:rgba(10,10,10,.7); border:1px solid rgba(139,92,246,.25); padding:10px 18px; border-radius:4px; transition:opacity .4s; pointer-events:none; font-family: ui-monospace, "SF Mono", Menlo, monospace; }
@media (prefers-reduced-motion: reduce) { .eristic-hero #hint::after { animation:none; } }
`;
