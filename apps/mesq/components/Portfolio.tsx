"use client";

// Markup adapted from mesq — https://mesq.me/. Attribution: ../CREDITS.md.
import { useEffect } from "react";
import { mountExperience } from "../lib/mesq/experience";

export default function Portfolio() {
  useEffect(() => mountExperience(), []);
  return (
    <>
      <div id="loader" className="loader">
        <span
          className="loader__status sr-only"
          role="status"
          aria-live="polite"
        >
          Loading
        </span>
        <div className="loader__sky" aria-hidden="true">
          <svg className="loader__cloud loader__cloud--a" viewBox="0 0 200 90">
            <g className="loader__cloud-body">
              <circle cx="44" cy="56" r="25" />
              <circle cx="96" cy="44" r="36" />
              <circle cx="152" cy="59" r="20" />
              <rect x="8" y="56" width="184" height="28" rx="14" />
            </g>
            <rect
              className="loader__cloud-belly"
              x="8"
              y="64"
              width="184"
              height="20"
              rx="10"
            />
          </svg>
          <svg className="loader__cloud loader__cloud--b" viewBox="0 0 240 70">
            <g className="loader__cloud-body">
              <circle cx="78" cy="40" r="24" />
              <rect x="54" y="16" width="70" height="40" rx="22" />
              <rect x="6" y="34" width="228" height="30" rx="15" />
            </g>
            <rect
              className="loader__cloud-belly"
              x="6"
              y="48"
              width="228"
              height="16"
              rx="8"
            />
          </svg>
        </div>

        <button
          type="button"
          className="loader__start"
          aria-label="Start, with sound"
          aria-hidden="true"
          disabled
        >
          <span className="loader__stage">
            <svg className="loader__mesq" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="#fffdf6"
                stroke="#1b1540"
                strokeWidth="2"
              />
              <rect
                className="loader__eye"
                x="10"
                y="9"
                width="4"
                height="9"
                rx="2"
                fill="#1b1540"
              />
              <rect
                className="loader__eye"
                x="18"
                y="9"
                width="4"
                height="9"
                rx="2"
                fill="#1b1540"
              />

              <clipPath id="loader-mouth">
                <rect x="14.3" y="19.4" width="3.4" height="3.1" rx="1.55" />
              </clipPath>
              <g className="loader__mouth">
                <rect
                  x="14.3"
                  y="19.4"
                  width="3.4"
                  height="3.1"
                  rx="1.55"
                  fill="#1b1540"
                />
                <ellipse
                  className="loader__tongue"
                  cx="16"
                  cy="22.4"
                  rx="1.3"
                  ry="1.15"
                  clipPath="url(#loader-mouth)"
                />
              </g>
            </svg>
            <span className="loader__shadow"></span>
          </span>
          <svg className="loader__ring" viewBox="0 0 120 120">
            <circle className="loader__track" cx="60" cy="60" r="52" />
            <circle
              className="loader__bar loader__bar--cyan"
              cx="60"
              cy="60"
              r="52"
              pathLength="100"
            />
            <circle
              className="loader__bar loader__bar--pink"
              cx="60"
              cy="60"
              r="52"
              pathLength="100"
            />
            <circle className="loader__face" cx="60" cy="60" r="52" />
            <circle
              className="loader__bar"
              cx="60"
              cy="60"
              r="52"
              pathLength="100"
            />
            <circle
              className="loader__rim"
              cx="60"
              cy="60"
              r="52"
              pathLength="100"
            />
          </svg>
          <span className="loader__label">
            <svg className="loader__play" viewBox="0 0 24 24">
              <path d="M7.4 4.9v14.2a1.3 1.3 0 0 0 2 1.1l11-7.1a1.3 1.3 0 0 0 0-2.2l-11-7.1a1.3 1.3 0 0 0-2 1.1z" />
            </svg>
            <span className="loader__word">Start</span>
          </span>
          <span className="loader__speaker">
            <svg viewBox="0 0 24 24">
              <path
                className="loader__speaker-body"
                d="M3.6 9.3h3.1l4.5-3.9v13.2l-4.5-3.9H3.6z"
              />
              <path
                className="loader__speaker-wave"
                d="M15 9.4a3.7 3.7 0 0 1 0 5.2"
              />
              <path
                className="loader__speaker-wave loader__speaker-wave--2"
                d="M17.6 6.8a7.4 7.4 0 0 1 0 10.4"
              />
            </svg>
          </span>

          <svg className="loader__sticker" viewBox="0 0 100 100">
            <g className="loader__sticker-cut">
              <rect x="12" y="16" width="76" height="52" rx="22" />
              <path d="M30 58 24 86 48 64z" />
            </g>
            <g className="loader__sticker-base">
              <rect x="12" y="16" width="76" height="52" rx="22" />
              <path d="M30 58 24 86 48 64z" />
            </g>
            <text x="50" y="43">
              hi
            </text>
          </svg>
        </button>
        <p className="loader__line" aria-hidden="true">
          <span className="loader__pct"></span>
          <span className="loader__step">mixing the ink</span>
        </p>
        <div className="loader__gate" hidden>
          <button type="button" className="loader__quiet">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                className="loader__quiet-body"
                d="M3.6 9.3h3.1l4.5-3.9v13.2l-4.5-3.9H3.6z"
              />
              <path
                className="loader__quiet-x"
                d="M15.2 9.6l4.8 4.8M20 9.6l-4.8 4.8"
              />
            </svg>
            <span>enter without sound</span>
          </button>
          <a
            className="loader__quiet loader__simple"
            href="?view=simple"
            data-view="simple"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                className="loader__quiet-x"
                d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"
              />
            </svg>
            <span>enter without 3D</span>
          </a>
        </div>
      </div>

      <div id="no3d" className="no3d" tabIndex={-1} hidden>
        <p className="no3d__hi">
          Hi, I'm <b>mesq</b> — technical artist &amp; three.js developer. I
          build small worlds for games and web experiences. Here’s the short
          version.
        </p>
        <p className="no3d__return">
          <a href="/" data-view="world">
            Enter the 3D world ↗
          </a>
        </p>
        <h2 className="no3d__head">Projects</h2>
        <ul className="no3d__list no3d__list--num">
          <li>
            <a
              href="https://wave-shaders.vercel.app/"
              target="_blank"
              rel="noopener"
            >
              <span>01</span>Wave Shaders
            </a>
          </li>
          <li>
            <a
              href="https://gameboy-tawny.vercel.app/"
              target="_blank"
              rel="noopener"
            >
              <span>02</span>Gameboy
            </a>
          </li>
          <li>
            <a
              href="https://tatooine.vercel.app/"
              target="_blank"
              rel="noopener"
            >
              <span>03</span>Tatooine
            </a>
          </li>
          <li>
            <a href="https://mesq.me/cabin/" target="_blank" rel="noopener">
              <span>04</span>Cabin
            </a>
          </li>
          <li>
            <a
              href="https://mesq.me/infinite-terrain/"
              target="_blank"
              rel="noopener"
            >
              <span>05</span>Infinite Terrain
            </a>
          </li>
          <li>
            <a href="https://mesq.me/utanomori/" target="_blank" rel="noopener">
              <span>06</span>Utanomori
            </a>
          </li>
          <li>
            <a
              href="https://typos-voyage.edclub.io/#/intermediate/a-new-chart"
              target="_blank"
              rel="noopener"
            >
              <span>07</span>Typo's Voyage
            </a>
          </li>
          <li>
            <a
              href="https://mesq.me/jelly-painting/"
              target="_blank"
              rel="noopener"
            >
              <span>08</span>Jelly Painting
            </a>
          </li>
        </ul>
        <h2 className="no3d__head">Say hi</h2>
        <ul className="no3d__list">
          <li>
            <a
              href="https://www.artstation.com/mesq"
              target="_blank"
              rel="noopener"
            >
              ArtStation
            </a>
          </li>
          <li>
            <a
              href="https://www.flickr.com/photos/202073981@N08/"
              target="_blank"
              rel="noopener"
            >
              Film photos
            </a>
          </li>
          <li>
            <a href="https://x.com/mesqme" target="_blank" rel="noopener">
              X
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/mesqme/"
              target="_blank"
              rel="noopener"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a href="mailto:mkiiatkin@gmail.com">mkiiatkin@gmail.com</a>
          </li>
        </ul>
      </div>

      <canvas id="scene"></canvas>

      <button
        id="menu"
        className="menu"
        aria-label="Open menu"
        aria-expanded="false"
        aria-controls="menu-panel"
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path
            className="bar bar-1"
            d="M10.5 15.2 L37.6 14.1 Q39.4 14.2 39.2 16.3 L38.9 18.4 Q38.6 19.9 36.9 19.9 L11.2 20.6 Q9.4 20.5 9.4 18.6 L9.5 16.6 Q9.7 15.3 10.5 15.2 Z"
          />
          <path
            className="bar bar-2"
            d="M11.8 21.6 L36.3 21.3 Q38.2 21.4 38.1 23.3 L38.0 25.1 Q37.8 26.8 36.1 26.8 L12.2 27.2 Q10.4 27.1 10.4 25.4 L10.5 23.1 Q10.7 21.7 11.8 21.6 Z"
          />
          <path
            className="bar bar-3"
            d="M10.2 28.4 L37.2 28.9 Q39.0 29.1 38.9 31.0 L38.7 32.9 Q38.5 34.4 36.8 34.4 L11.0 33.9 Q9.3 33.8 9.3 32.0 L9.4 29.9 Q9.6 28.5 10.2 28.4 Z"
          />
        </svg>
      </button>

      <nav id="menu-panel" className="menu-panel" aria-label="Sections" hidden>
        <a href="#start" data-section="start">
          <span>01</span>Start
        </a>
        <a href="#about" data-section="about">
          <span>02</span>About
        </a>
        <a href="#projects" data-section="projects">
          <span>03</span>Projects
        </a>
        <a href="#contacts" data-section="contacts">
          <span>04</span>Contacts
        </a>
        <a href="#end" data-section="end">
          <span>05</span>The end
        </a>
      </nav>

      <button id="helper" className="helper" aria-label="Helper"></button>

      <main>
        <section id="start" tabIndex={-1} className="section section-start">
          <h1 className="sr-only">mesq</h1>
        </section>

        <section
          id="about"
          tabIndex={-1}
          className="section section-about"
          aria-labelledby="about-title"
        >
          <h2 id="about-title" className="sr-only">
            About
          </h2>

          <p className="sr-only" id="about-text"></p>
        </section>

        <section
          id="projects"
          tabIndex={-1}
          className="section section-projects"
          aria-labelledby="projects-title"
        >
          <h2 id="projects-title" className="sr-only">
            Projects
          </h2>
        </section>

        <section
          id="contacts"
          tabIndex={-1}
          className="section section-contacts"
          aria-labelledby="contacts-title"
        >
          <h2 id="contacts-title" className="sr-only">
            Contacts
          </h2>

          <ul className="contact-links"></ul>
        </section>

        <section
          id="end"
          tabIndex={-1}
          className="section section-end"
          aria-labelledby="end-title"
        >
          <h2 id="end-title" className="sr-only">
            The end
          </h2>
          <ul className="contact-links">
            <li>
              <button type="button" data-to-start>
                Back to the start ↑
              </button>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
