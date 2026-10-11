"use client";
// Full-viewport landing hero, built from the "Meridian" reference spec with
// Spokiva copy. Every layout value comes from the spec. Mono labels keep the
// reference's exact character counts so the fixed pixel positions still centre.
// Styles are scoped under .hero so they don't leak into the rest of the page.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const VIDEO_SRC = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/0e1b18f2-b590-4b97-96f0-b05e019d07eb.mp4";
const POSTER_SRC = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/19548534-c502-431f-904d-24d31b17c471.jpg";
const HEADLINE = "Speak English with confidence";

const CSS = `
@font-face{font-family:"M Display";src:url(assets/fonts/m-display.woff2) format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"M Sans";src:url(assets/fonts/m-sans.woff2) format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"M Mono";src:url(assets/fonts/m-mono-bold.woff2) format("woff2");font-weight:700;font-display:block}
:root{
  --ink-bg:#020816; --glass:rgba(51,52,74,.6); --glass-blur:14px; --navy:rgba(45,56,92,.85);
  --peach:#f2b380; --cta:#f93f28; --peach-ink:#331200; --white:#ffffff; --display:#f6f8fc;
  --body:#cfd3e0; --chip:#c9ccd4; --rail:#989eac; --u:1; --vh:100vh; --cap-shift:-0.055em;
  --f-display:"M Display","ITC Avant Garde Gothic","Avant Garde","URW Gothic","Century Gothic",sans-serif;
  --f-sans:"M Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
  --f-mono:"M Mono","Courier New",Courier,monospace;
}
html,body{margin:0;height:100%;background:#020816}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
.hero,.hero *,.hero *::before,.hero *::after{box-sizing:border-box}
.hero{color:#fff;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:geometricPrecision}
.hero a{color:inherit;text-decoration:none}
.hero button{font:inherit;color:inherit;border:0;margin:0;-webkit-appearance:none;appearance:none;cursor:pointer}
.hero :focus-visible{outline:2px solid #f2b380;outline-offset:3px}

.hero{position:relative;width:100%;height:100vh;height:100dvh;height:var(--vh);min-height:100%;overflow:hidden;background:#020816;isolation:isolate}

.hero .photo{position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;will-change:transform;transform-origin:0 0}
.js .hero .photo{width:calc(1586px*var(--s,1));height:calc(992px*var(--s,1));transform:translate3d(var(--x0,0px),var(--y0,0px),0)}
.hero .photo video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 100%;display:block;-webkit-user-select:none;user-select:none}
.hero .photo::after{content:"";position:absolute;inset:-1px;pointer-events:none;background:linear-gradient(180deg, rgba(2,8,22,1) 0%, rgba(2,8,22,.55) 6%, rgba(2,8,22,.15) 14%, rgba(2,8,22,0) 22%, rgba(2,8,22,0) 100%)}

.hero .nav-l,.hero .nav-r{position:absolute;top:0;z-index:3;width:0;height:0}
.hero .nav-l{left:0;transform-origin:0 0;transform:scale(var(--u))}
.hero .nav-r{right:0;transform-origin:100% 0;transform:scale(var(--u))}

.hero .brand{position:absolute;left:16px;top:29.3px;display:flex;align-items:flex-start;white-space:nowrap}
.hero .brand svg{width:24px;height:24px;overflow:visible;flex:none}
.hero .brand span{font-family:var(--f-sans);font-weight:400;font-size:21px;letter-spacing:-0.1px;line-height:1;margin-left:4px;position:relative;left:var(--nx);top:var(--ny)}

.hero .more{position:absolute;right:29.65px;top:23.83px;width:80.45px;height:35.35px;display:flex;align-items:center;padding:0 14.76px 0 15.14px;background:var(--glass);-webkit-backdrop-filter:blur(var(--glass-blur));backdrop-filter:blur(var(--glass-blur));border-radius:0;white-space:nowrap;transition:background-color .2s}
.hero .more .dots{width:8.4px;height:8.4px;flex:none;position:relative;left:0.2px;transform:translateY(0.31px)}
.hero .more span{font-family:var(--f-mono);font-weight:700;font-size:12px;letter-spacing:0.2px;line-height:1;margin-left:13.4px;position:relative;left:var(--nx);top:calc(var(--ny) + var(--cap-shift))}
.hero .rail{position:absolute;right:8.7px;top:11.9px;width:1.9px;height:47.2px;background:#989eac;border-radius:1px;pointer-events:none;transform-origin:50% 0}

/* MORE menu (the reference defines the button but not its popup) */
.hero .menu{position:absolute;right:29.65px;top:65.18px;min-width:200px;padding:6px 0;background:var(--glass);-webkit-backdrop-filter:blur(var(--glass-blur));backdrop-filter:blur(var(--glass-blur));display:flex;flex-direction:column}
.hero .menu a{display:block;padding:10px 15.14px;font-family:var(--f-mono);font-weight:700;font-size:12px;letter-spacing:0.2px;line-height:1;white-space:nowrap;transition:background-color .2s}

.hero .stage{position:absolute;left:50%;top:0;width:1280px;height:800px;z-index:2;transform-origin:50% 0;transform:translateX(-50%) scale(var(--u))}

.hero .pill{position:absolute;left:506px;top:99.76px;height:35.3px;display:flex;align-items:center;padding:0 11.78px 0 11.92px;background:var(--glass);-webkit-backdrop-filter:blur(var(--glass-blur));backdrop-filter:blur(var(--glass-blur));border-radius:0;white-space:nowrap;transition:background-color .2s}
.hero .pill .sq{display:block;width:9.3px;height:11.1px;background:#c9ccd4;position:relative;top:0.1px;flex:none}
.hero .pill span{font-family:var(--f-mono);font-weight:700;font-size:12px;letter-spacing:0.6px;line-height:1;margin-left:18.3px;position:relative;left:var(--nx);top:calc(var(--ny) + var(--cap-shift))}
.hero .pill svg{width:11px;height:10.5px;margin-left:13.5px;position:relative;top:0.15px;flex:none}

.hero h1{position:absolute;left:0;top:0;width:1280px;margin:0;text-align:center;white-space:nowrap;transform:translate(var(--nx),var(--ny));font-family:var(--f-display);font-weight:400;font-size:53px;letter-spacing:0;line-height:1;color:#f6f8fc}
.hero h1 .w{display:inline-block;overflow:hidden;vertical-align:top;padding:.08em 0 .2em;margin:-.08em 0 -.2em}
.hero h1 .w>span{display:inline-block}

.hero .lede{position:absolute;left:0;top:0;width:1280px;margin:0;text-align:center;transform:translate(var(--nx),var(--ny));font-family:var(--f-sans);font-weight:400;font-size:18px;line-height:23px;color:#cfd3e0}
.hero br.d{display:inline}

.hero .cta{position:absolute;left:441.1px;top:326.55px;display:flex;gap:8.76px}
.hero .btn{height:51.2px;display:inline-flex;align-items:center;white-space:nowrap;border-radius:0;font-family:var(--f-mono);font-weight:700;font-size:13.5px;letter-spacing:0.4px;line-height:1;transition:filter .2s, background-color .2s}
.hero .btn span{position:relative;left:var(--nx);top:calc(var(--ny) + var(--cap-shift))}
.hero .b1{padding:0 30.35px;background:rgba(45,56,92,.85);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);color:#fff}
.hero .b2{padding:0 25.92px 0 25.78px;background:#f93f28;color:#331200}
.hero .b2 svg{width:12px;height:12px;margin-right:22.5px;position:relative;top:0.34px;flex:none}

@media (hover:hover){
  .hero .more:hover,.hero .pill:hover,.hero .menu a:hover{background:rgba(66,66,96,.66)}
  .hero .b1:hover{background:rgba(58,72,114,.9)}
  .hero .b2:hover{filter:brightness(1.05)}
}

html.intro .hero .brand,html.intro .hero .more,html.intro .hero .rail,html.intro .hero .pill,
html.intro .hero h1,html.intro .hero .lede,html.intro .hero .btn{opacity:0}

/* Tablet */
@media (min-width:511px) and (max-width:1151.98px), (min-width:511px) and (max-height:719.98px){
  .hero{--k:.9;--gut:clamp(32px,5vw,48px);height:auto;min-height:var(--vh)}
  .hero .nav-l,.hero .nav-r{transform:scale(var(--k))}
  .hero .stage{position:relative;left:auto;top:auto;width:auto;height:auto;transform:none;display:flex;flex-direction:column;align-items:center;text-align:center;padding:calc(clamp(70px,12.47vh,89.8px) + env(safe-area-inset-top,0px)) var(--gut) 0}
  .hero .pill,.hero h1,.hero .lede,.hero .cta{position:relative;left:auto;top:auto;transform:none}
  .hero .pill,.hero .cta{zoom:var(--k)}
  .hero .pill span,.hero .btn span{left:0;top:var(--cap-shift)}
  .hero h1{width:auto;margin-top:min(calc(24.44px*var(--k)),2.9vh);font-size:clamp(40px,calc((100vw - 2*var(--gut))/16.4),calc(53px*var(--k)))}
  .hero .lede{width:auto;margin-top:min(calc(24px*var(--k)),2.85vh);font-size:min(calc(18px*var(--k)),calc((100vw - 2*var(--gut))/27.9));line-height:1.278}
  .hero .cta{margin-top:min(21.05px,2.8vh)}
  .hero .more::after,.hero .pill::after{content:"";position:absolute;inset:-6px -2px}
}
@media (min-width:511px) and (max-width:719.98px){
  .hero h1{white-space:normal;font-size:clamp(40px,6.9vw,46px);line-height:1.06;max-width:9.6em;text-wrap:balance}
}
/* Portrait tablet */
@media (min-width:511px) and (max-width:1151.98px) and (orientation:portrait){
  .hero{--k:1}
  .hero .stage{padding-top:calc(clamp(96px,10.5vh,150px) + env(safe-area-inset-top,0px))}
  .hero h1{white-space:normal;font-size:clamp(44px,7.6vw,78px);line-height:1.04;max-width:9.6em;text-wrap:balance;margin-top:clamp(24px,2.6vh,34px)}
  .hero .lede{margin-top:clamp(22px,2.4vh,30px)}
  .hero .cta{margin-top:clamp(24px,2.6vh,34px)}
}
/* Phone */
@media (max-width:510.98px){
  .hero{--gut:clamp(20px,5.5vw,24px);height:auto;min-height:100svh;min-height:var(--vh)}
  .hero .nav-l,.hero .nav-r{transform:scale(.88);top:env(safe-area-inset-top,0px)}
  .hero .stage{position:relative;left:auto;top:auto;width:auto;height:auto;transform:none;display:flex;flex-direction:column;align-items:center;text-align:center;padding:calc(clamp(80px,10.5vh,94px) + env(safe-area-inset-top,0px)) var(--gut) 0}
  .hero .pill,.hero h1,.hero .lede,.hero .cta{position:relative;left:auto;top:auto;transform:none}
  .hero .pill{zoom:.86}
  .hero .pill span,.hero .btn span{left:0;top:var(--cap-shift)}
  .hero h1{width:auto;margin-top:clamp(17px,2.2vh,21px);white-space:normal;font-size:clamp(32px,9.25vw,37px);line-height:1.06;max-width:9.6em;text-wrap:balance}
  .hero .lede{width:auto;margin-top:clamp(13px,1.8vh,16px);font-size:clamp(14px,3.72vw,15px);line-height:1.42;max-width:32em;text-wrap:pretty}
  .hero br.d{display:none}
  .hero .cta{margin-top:clamp(18px,2.4vh,22px);gap:8px;flex-wrap:wrap;justify-content:center;width:100%;max-width:330px}
  .hero .btn{height:46px;flex:1 1 auto;justify-content:center;font-size:11.5px;letter-spacing:.35px}
  .hero .b1{padding:0 clamp(13px,3.5vw,20px)}
  .hero .b2{padding:0 calc(clamp(13px,3.5vw,20px) - .34px) 0 calc(clamp(13px,3.5vw,20px) + .34px)}
  .hero .b2 svg{width:11px;height:11px;margin-right:clamp(12px,3.5vw,16px)}
  .hero .more::after,.hero .pill::after{content:"";position:absolute;inset:-8px -4px}
}
@media (prefers-reduced-motion:reduce){
  .hero,.hero *,.hero *::before,.hero *::after{transition:none!important}
}
`;

// Runs during HTML parsing, before the hero paints (the reference puts this in <head>).
const PREPAINT = `(function(){var d=document.documentElement;d.style.setProperty('--u',Math.min(d.clientWidth/1280,innerHeight/800));d.style.setProperty('--vh',innerHeight+'px');d.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'animate' in d){d.classList.add('intro');setTimeout(function(){d.classList.remove('intro')},4000)}})();`;

const VIDEO_HTML = `<video autoplay muted loop playsinline preload="auto" width="1586" height="992" poster="${POSTER_SRC}" src="${VIDEO_SRC}"></video>`;

type El = HTMLElement | SVGElement;

export default function LandingHero() {
  const { isSignedIn } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const navRRef = useRef<HTMLDivElement | null>(null);

  // Layout engine, entrance and video playback.
  useEffect(() => {
    const root = document.documentElement;
    const hero = heroRef.current;
    if (!hero) return;
    const photo = hero.querySelector<HTMLElement>("#photo")!;
    const stage = hero.querySelector<HTMLElement>("#stage")!;
    const cta = hero.querySelector<HTMLElement>("#cta")!;
    const video = photo.querySelector("video");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");

    // Client-side navigation doesn't execute the pre-paint script, so repeat it.
    const firstLoad = root.classList.contains("js");
    root.classList.add("js");
    if (!firstLoad && !reduce.matches && "animate" in root) root.classList.add("intro");

    // ── Layout engine ──
    const IW = 1586, IH = 992, CROWN = 530, GAP_D = 49.24, GAP_M = 26, OVERSCAN = 1.00078, K_T = .9, MAX_ZOOM = 1.4;
    const DESK = matchMedia("(min-width:1152px) and (min-height:720px)");
    const PHONE = matchMedia("(max-width:510.98px)");
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

    function layout() {
      const vw = root.clientWidth, vh = innerHeight;
      const u = Math.min(vw / 1280, vh / 800);
      root.style.setProperty("--u", String(u));
      root.style.setProperty("--vh", vh + "px");
      const d = DESK.matches, m = PHONE.matches, t = !d && !m;
      const cb = cta.getBoundingClientRect().bottom - hero!.getBoundingClientRect().top;
      const kv = parseFloat(getComputedStyle(hero!).getPropertyValue("--k"));
      const k = isFinite(kv) ? kv : K_T;
      let crown = cb + (d ? GAP_D * u : t ? GAP_D * k : GAP_M);
      const H = hero!.clientHeight;
      const cover = Math.max(vw / IW, H / IH);
      let s = Math.max(cover, (H - crown) / (IH - CROWN));
      if (s > cover * MAX_ZOOM) { s = cover * MAX_ZOOM; crown = H - (IH - CROWN) * s; }
      s *= OVERSCAN;
      const fx = (vw / H < 1) ? 815 : IW / 2;
      const x0 = clamp(vw / 2 - fx * s, vw - IW * s, 0);
      const y0 = crown - CROWN * s;
      photo.style.setProperty("--s", String(s));
      photo.style.setProperty("--x0", x0 + "px");
      photo.style.setProperty("--y0", y0 + "px");
    }
    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; layout(); }); };
    layout();
    addEventListener("load", schedule);
    addEventListener("resize", schedule);
    visualViewport?.addEventListener("resize", schedule);
    DESK.addEventListener("change", schedule);
    PHONE.addEventListener("change", schedule);
    document.fonts?.ready.then(schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(stage);

    // ── Entrance ──
    let cancelled = false;
    let anims: Animation[] = [];
    function entrance() {
      if (cancelled || !root.classList.contains("intro")) return;
      const EXPO = "cubic-bezier(.16,1,.3,1)", QUART = "cubic-bezier(.25,1,.5,1)", SHUTTER = "cubic-bezier(.76,0,.24,1)";
      const d = PHONE.matches ? .75 : 1;
      const q = <T extends El>(sel: string) => hero!.querySelector<T>(sel);
      const tween = (el: El | null, kf: Keyframe[], delay: number, duration: number, easing: string) => {
        if (!el) return null;
        const a = el.animate(kf, { delay: delay * 1000, duration: duration * 1000, easing, fill: "backwards" });
        anims.push(a);
        return a;
      };
      const rise = (px: number): Keyframe[] => [{ opacity: 0, translate: `0 ${px * d}px` }, { opacity: 1, translate: "0 0" }];

      // Split the headline into masked words.
      const h1 = q<HTMLElement>("h1")!;
      const original = h1.innerHTML;
      h1.innerHTML = original.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");

      tween(q(".brand"), rise(-8), .15, .8, QUART);
      tween(q(".more"), rise(-8), .25, .8, QUART);
      tween(q(".rail"), [{ scale: "1 0" }, { scale: "1 1" }], .35, .9, EXPO);
      tween(q(".pill"), [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], .30, .75, SHUTTER);
      const words = Array.from(h1.querySelectorAll<HTMLElement>(".w > span"))
        .map((w, i) => tween(w, [{ translate: "0 132%" }, { translate: "0 0" }], .45 + i * .055, 1.05, EXPO)!);
      tween(q(".lede"), rise(12), .85, .9, QUART);
      tween(q(".b1"), [{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)" }], 1.05, .75, EXPO);
      tween(q(".b1 span"), rise(8), 1.15, .7, QUART);
      tween(q(".b2"), [{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)" }], 1.13, .75, EXPO);
      tween(q(".b2 span"), rise(8), 1.23, .7, QUART);
      tween(q(".b2 svg"), rise(8), 1.23, .7, QUART);

      root.classList.remove("intro");

      Promise.all(words.map((a) => a.finished)).then(() => { h1.innerHTML = original; }).catch(() => {});
      Promise.all(anims.map((a) => a.finished)).then(() => {
        anims.forEach((a) => a.cancel());
        anims = [];
        root.classList.add("intro-done");
      }).catch(() => {});
    }
    (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(entrance));

    // ── Video playback ──
    const play = () => {
      if (!video) return;
      video.muted = true;
      const p = video.play();
      if (p) p.catch(() => {});
    };
    const onVisible = () => { if (document.visibilityState === "visible") play(); };
    const firstGesture = () => {
      play();
      ["pointerdown", "touchstart", "scroll"].forEach((ev) => removeEventListener(ev, firstGesture));
    };
    play();
    video?.addEventListener("canplay", play);
    document.addEventListener("visibilitychange", onVisible);
    ["pointerdown", "touchstart", "scroll"].forEach((ev) => addEventListener(ev, firstGesture, { passive: true }));

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      anims.forEach((a) => a.cancel());
      removeEventListener("load", schedule);
      removeEventListener("resize", schedule);
      visualViewport?.removeEventListener("resize", schedule);
      DESK.removeEventListener("change", schedule);
      PHONE.removeEventListener("change", schedule);
      ro.disconnect();
      video?.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", onVisible);
      ["pointerdown", "touchstart", "scroll"].forEach((ev) => removeEventListener(ev, firstGesture));
      root.classList.remove("js", "intro", "intro-done");
      root.style.removeProperty("--u");
      root.style.removeProperty("--vh");
    };
  }, []);

  // Close the MORE menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (!navRRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  const v = (nx: string, ny: string) => ({ "--nx": nx, "--ny": ny }) as React.CSSProperties;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      <section className="hero" id="hero" aria-label="Spokiva" ref={heroRef}>
        <div className="photo" id="photo" aria-hidden="true" dangerouslySetInnerHTML={{ __html: VIDEO_HTML }} />

        <div className="nav-l">
          <Link className="brand" href="/" aria-label="Spokiva home" style={v("-0.5px", "-2.75px")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" overflow="visible" aria-hidden="true">
              <circle cx="12.2" cy="11.9" r="8.45" strokeWidth="2" />
              <path d="M12.2 0.1V24" strokeWidth="1.9" />
              <path d="M0 11.9H24.4" strokeWidth="1.95" />
            </svg>
            <span>spokiva</span>
          </Link>
        </div>

        <div className="nav-r" ref={navRRef}>
          <button
            className="more" type="button" aria-haspopup="true" aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)} style={v("0.25px", "-1.0px")}
          >
            <svg className="dots" width="8.4" height="8.4" viewBox="0 0 8.4 8.4" fill="#fff" aria-hidden="true">
              <rect x="0" y="0" width="2.4" height="2.4" /><rect x="6" y="0" width="2.4" height="2.4" />
              <rect x="0" y="6" width="2.4" height="2.4" /><rect x="6" y="6" width="2.4" height="2.4" />
            </svg>
            <span>MORE</span>
          </button>
          <span className="rail" aria-hidden="true" />
          {menuOpen && (
            <nav className="menu" aria-label="More">
              <Link href="/features">FEATURES</Link>
              <Link href="/ielts-speaking">IELTS SPEAKING</Link>
              <Link href="/business">BUSINESS</Link>
              <Link href="/interview-coach">INTERVIEW COACH</Link>
              <Link href="/pricing">PRICING</Link>
              {isSignedIn
                ? <Link href="/dashboard/script-writer">OPEN APP</Link>
                : <Link href="/login">SIGN IN</Link>}
            </nav>
          )}
        </div>

        <main className="stage" id="stage">
          <Link className="pill" href="/features" style={v("0.75px", "0px")}>
            <i className="sq" />
            <span>MEET THE SPOKIVA* COACH</span>
            <svg width="11" height="10.5" viewBox="0 0 11 10.5" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
              <path d="M1 0.9l4.2 4.35L1 9.6" /><path d="M6.2 0.9l4.2 4.35L6.2 9.6" />
            </svg>
          </Link>
          <h1 style={v("-3.0px", "159.5px")} dangerouslySetInnerHTML={{ __html: HEADLINE }} />
          <p className="lede" style={v("-3.0px", "236.5px")}>
            Smart coaching from Spokiva to write scripts, rehearse talks,<br className="d" />{" "}
            and sharpen pronunciation as you grow. Every session stays<br className="d" />{" "}
            focused, measurable, and personal.
          </p>
          <div className="cta" id="cta">
            <a className="btn b1" href="#how-it-works" style={v("-0.25px", "0px")}><span>SEE IT HAPPEN</span></a>
            <Link className="btn b2" href="/signup" style={v("0.5px", "0px")}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.05" aria-hidden="true">
                <circle cx="2.3" cy="2.3" r="1.75" /><circle cx="9.7" cy="2.3" r="1.75" />
                <circle cx="2.3" cy="9.7" r="1.75" /><circle cx="9.7" cy="9.7" r="1.75" />
                <path d="M3.6 3.9L8.4 8.1" />
              </svg>
              <span>START FOR FREE</span>
            </Link>
          </div>
        </main>
      </section>
    </>
  );
}
