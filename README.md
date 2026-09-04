# Knowledge Runner

<div align="center">

<img src="icons/icon-192.png" alt="Knowledge Runner Icon" width="120" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(0,240,255,0.3);" />

### Fast-Paced 3D Educational Quiz Runner Powered by LLMs

[![Three.js](https://img.shields.io/badge/3D_Engine-Three.js_r128-00f0ff?style=flat-square&logo=three.js)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Web_Audio_API-ff0077?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-00ff66?style=flat-square)](manifest.json)
[![JavaScript](https://img.shields.io/badge/Vanilla_JS-ES_Modules-ffe600?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

*Sprint down the neon highway, dodge wrong answers, and test your knowledge on any topic under the sun.*

---

</div>

## Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <img src="screenshots/mobile/1_titlescreen.webp" alt="Title Screen" width="100%" style="border-radius: 12px;"/>
        <br />
        <b>1. Topic Selector</b>
      </td>
      <td align="center" width="33%">
        <img src="screenshots/mobile/2_gameplay.webp" alt="Gameplay" width="100%" style="border-radius: 12px;"/>
        <br />
        <b>2. High-Speed 3D Sprint</b>
      </td>
      <td align="center" width="33%">
        <img src="screenshots/mobile/3_results.webp" alt="Results Screen" width="100%" style="border-radius: 12px;"/>
        <br />
        <b>3. Revision & Diagnostics</b>
      </td>
    </tr>
  </table>
</div>

---

## Overview

**Knowledge Runner** is an endless 3D educational runner game built with vanilla JavaScript and **Three.js**. Type in **any topic**—from *Quantum Mechanics* to *Ancient Rome* or *AI Ethics*—and the game dynamically synthesizes questions on the fly using a background LLM pipeline.

Dash through three neon-lit lanes, read the approaching gates, and steer through the portal showing the correct answer before impact!

---

## Key Features

- **LLM Question Engine**:
  - Endless, non-repeating questions generated in real-time.
  - **Dynamic Tier Escalation**:
    - **Tier 1**: Foundational high-school concepts.
    - **Tier 2**: College & advanced mechanisms.
    - **Tier 3+**: Master/Expert level testing nuances, dates, formulas, and deep domain mastery.
  - Seamless background prefetching ensures zero gameplay interruption between question tiers.

- **Cyberpunk 3D World**:
  - Low-poly runner character with synchronized running animations.
  - Procedurally generated neon pillars, ground grid lines, and particle dust.
  - Dynamic responsive camera that automatically reframes FOV and lane-tracking for ultra-narrow phones, tablets, or widescreen monitors.

- **Risk & Reward Mechanics**:
  - **Streak Multipliers**: Consecutive correct answers boost your score calculation: `100 + (streak * 20)`.
  - **Life Recovery**: Nailing answers when damaged restores hearts back to max (3 lives).
  - **Dynamic Speed**: Velocity increases with each correct door hit.

- **Post-Run Revision & Diagnostics**:
  - Full game over breakdown showcasing your final score, accuracy, and best streak.
  - Color-coded interactive revision list displaying chosen vs. correct answers and LLM-generated explanations for every question answered.

- **Mobile-Ready**:
  - Full touch swipe navigation + tap-to-select HUD cards.
  - Safe-area inset support for modern edge-to-edge mobile displays.
  - Offline-ready web app manifest.

---

## Controls

You can play seamlessly via keyboard, touch swipes, or direct HUD interaction:

| Action | Keyboard | Mobile / Touch | On-Screen HUD |
| :--- | :--- | :--- | :--- |
| **Move Left** | `←` or `A` or `1` | Swipe Left | Tap **Lane A** Card |
| **Center Lane** | `↑` or `W` or `2` | — | Tap **Lane B** Card |
| **Move Right** | `→` or `D` or `3` | Swipe Right | Tap **Lane C** Card |
| **Pause / Resume** | `Escape` | Tap Header Pause Button `⏸` | Header Pause Button |

---

## Getting Started

### Play Online

https://knowledgerunner.alexwr.cc/

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/alex24106429/Knowledge-Runner
   cd Knowledge-Runner
   ```

2. **Serve the directory** using any static web server:

   *Using Python 3:*
   ```bash
   python -m http.server 8080
   ```

   *Using Node.js (`npx`):*
   ```bash
   npx serve .
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8080` in Firefox, Chromium, or any other browser.
