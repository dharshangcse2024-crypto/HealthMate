/**
 * Skiper 31 ScrollAnimation_002 — React + framer motion + lenis
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 * Twitter: https://x.com/Gur__vi
 */

import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { motion, useScroll, useTransform } from "framer-motion";
import ReactLenis from "lenis/react";
import React, { useRef } from "react";
import { cn } from "../lib/utils";

const CharacterV1 = ({ char, index, centerIndex, scrollYProgress }) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;
  const x = useTransform(scrollYProgress, [0, 0.5], [distanceFromCenter * 50, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [distanceFromCenter * 50, 0]);

  return (
    <motion.span
      className={cn("inline-block text-white", isSpace && "w-4")}
      style={{ x, rotateX }}
    >
      {char}
    </motion.span>
  );
};

const CharacterV2 = ({ char, index, centerIndex, scrollYProgress }) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;
  const x = useTransform(scrollYProgress, [0, 0.5], [distanceFromCenter * 50, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.75, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [Math.abs(distanceFromCenter) * 50, 0]);

  return (
    <motion.span
      className={cn("inline-block", isSpace && "w-4")}
      style={{ x, scale, y, transformOrigin: "center" }}
    >
      {char}
    </motion.span>
  );
};

const CharacterV3 = ({ char, index, centerIndex, scrollYProgress }) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;
  const x = useTransform(scrollYProgress, [0, 0.5], [distanceFromCenter * 90, 0]);
  const rotate = useTransform(scrollYProgress, [0, 0.5], [distanceFromCenter * 50, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [-Math.abs(distanceFromCenter) * 20, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.75, 1]);

  return (
    <motion.span
      className={cn("inline-block", isSpace && "w-4")}
      style={{ x, rotate, y, scale, transformOrigin: "center" }}
    >
      {char}
    </motion.span>
  );
};

const Bracket = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 27 78" className={className}>
      <path fill="#fff" d="M26.52 77.21h-5.75c-6.83 0-12.38-5.56-12.38-12.38V48.38C8.39 43.76 4.63 40 .01 40v-4c4.62 0 8.38-3.76 8.38-8.38V12.4C8.38 5.56 13.94 0 20.77 0h5.75v4h-5.75c-4.62 0-8.38 3.76-8.38 8.38V27.6c0 4.34-2.25 8.17-5.64 10.38 3.39 2.21 5.64 6.04 5.64 10.38v16.45c0 4.62 3.76 8.38 8.38 8.38h5.75v4.02Z"></path>
    </svg>
  );
};

const Landing = () => {
  const targetRef = useRef(null);
  const targetRef2 = useRef(null);
  const targetRef3 = useRef(null);

  const { scrollYProgress } = useScroll({ target: targetRef });
  const { scrollYProgress: scrollYProgress2 } = useScroll({ target: targetRef2 });
  const { scrollYProgress: scrollYProgress3 } = useScroll({ target: targetRef3 });

  const text = "TRACK YOUR HEALTH";
  const characters = text.split("");
  const centerIndex = Math.floor(characters.length / 2);

  const iconsText = "💡⚡🚀🛡️🔥✨📊🤖💻";
  const iconCharsArray = [...iconsText];
  const iconCenterIndex = Math.floor(iconCharsArray.length / 2);

  return (
    <ReactLenis root>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#9333ea', /* Fallback */
        background: 'radial-gradient(circle at 30% 20%, #6b21a8 0%, #9333ea 50%, #c084fc 100%)',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Navbar Section */}
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem 3rem',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          position: 'fixed',
          width: '100%',
          top: 0,
          zIndex: 50,
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: '800' }}>
            <Activity size={24} />
            HEALTHMATE
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>LOG IN</Link>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: 'white',
                color: 'black',
                border: 'none',
                padding: '0.8rem 1.5rem',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                borderRadius: '8px'
              }}>
                GET STARTED
              </button>
            </Link>
          </div>
        </nav>

        <main className="w-full flex flex-col items-center pt-24">
          <div className="top-22 absolute left-1/2 z-10 grid -translate-x-1/2 content-start justify-items-center gap-6 text-center text-white mt-10">
            <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-80 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-[#f5f4f3] after:to-transparent after:content-['']">
              Scroll to see more
            </span>
          </div>

          <div
            ref={targetRef}
            className="relative box-border flex h-[210vh] items-center justify-center gap-[2vw] overflow-hidden p-[2vw]"
          >
            <div
              className="font-geist w-full max-w-[100vw] text-center text-5xl md:text-7xl font-bold uppercase tracking-tighter text-white whitespace-nowrap"
              style={{ perspective: "500px" }}
            >
              {characters.map((char, index) => (
                <CharacterV1
                  key={index}
                  char={char}
                  index={index}
                  centerIndex={centerIndex}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>
          </div>

          <div
            ref={targetRef2}
            className="relative -mt-[100vh] box-border flex h-[210vh] flex-col items-center justify-center gap-[2vw] overflow-hidden p-[2vw]"
          >
            <p className="font-geist flex items-center justify-center gap-3 text-xl md:text-3xl font-medium tracking-tight text-white mb-8">
              <Bracket className="h-12 text-white fill-white" />
              <span className="font-geist font-medium">
                seamless health tracking
              </span>
              <Bracket className="h-12 scale-x-[-1] text-white fill-white" />
            </p>
            <div className="font-geist w-full max-w-[100vw] text-center text-5xl md:text-7xl font-bold uppercase tracking-tighter text-white whitespace-nowrap">
              {iconCharsArray.map((char, index) => (
                <CharacterV2
                  key={index}
                  char={char}
                  index={index}
                  centerIndex={iconCenterIndex}
                  scrollYProgress={scrollYProgress2}
                />
              ))}
            </div>
          </div>

          <div
            ref={targetRef3}
            className="relative -mt-[95vh] box-border flex h-[210vh] flex-col items-center justify-center gap-[2vw] overflow-hidden p-[2vw]"
          >
            <p className="font-geist flex items-center justify-center gap-3 text-xl md:text-3xl font-medium tracking-tight text-white mb-8">
              <Bracket className="h-12 text-white fill-white" />
              <span className="font-geist font-medium">
                get started for free today
              </span>
              <Bracket className="h-12 scale-x-[-1] text-white fill-white" />
            </p>
            <div
              className="font-geist w-full max-w-[100vw] text-center text-5xl md:text-7xl font-bold uppercase tracking-tighter text-white whitespace-nowrap"
              style={{ perspective: "500px" }}
            >
              {iconCharsArray.map((char, index) => (
                <CharacterV3
                  key={index}
                  char={char}
                  index={index}
                  centerIndex={iconCenterIndex}
                  scrollYProgress={scrollYProgress3}
                />
              ))}
            </div>
            
            <Link to="/register" className="mt-20 z-20">
              <button style={{
                backgroundColor: 'white',
                color: '#6b21a8',
                border: 'none',
                padding: '1.2rem 3rem',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                borderRadius: '50px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}>
                JOIN NOW
              </button>
            </Link>
          </div>
        </main>
      </div>
    </ReactLenis>
  );
};

export default Landing;
