# Hercules DJControl Inpulse 300mk2 — 4-Deck Mixxx Mapping

A custom [Mixxx](https://mixxx.org/) MIDI mapping for the **Hercules DJControl Inpulse 300mk2**, extending the original community mapping with 4-deck support, real-time LED feedback, and stem mode integration.

**Forked from:** [DJ Phatso's mapping (v1.0, August 2023)](https://mixxx.discourse.group/t/hercules-djcontrol-inpulse-300mk2/27960)
**Mixxx version:** 2.4+

---

## What's New vs the Original

The original mapping by DJ Phatso is a solid base — it handles scratching, jog wheels, loops, FX, pad modes, and all the hardware quirks of the 300mk2. This fork adds the following on top.

### 1. 4-Deck Support via the Assistant Button

Pressing the **Assistant** button toggles the controller between two deck pairs:

| Mode | Deck A (left side) | Deck B (right side) |
|------|--------------------|---------------------|
| Default | Channel 1 | Channel 2 |
| Assistant ON | Channel 3 | Channel 4 |

The Assistant button LED is **solid on** when controlling decks 3/4 and off when back on 1/2. Every deck-dependent button (play, cue, sync, hotcues, loop, slip, etc.) instantly switches to the new channel pair when you toggle.

### 2. Real-Time LED Tracking for All Deck-Dependent Buttons

In the original mapping, LEDs were wired statically in the XML to Channel 1 and Channel 2. This meant:
- LEDs went out of sync when switching to decks 3/4
- Hotcue LEDs didn't update when a track was loaded while playing
- LED state could conflict between the XML and script layers

This fork removes all Channel 1/2 LED output entries from the XML and manages all deck-dependent LEDs in script using `engine.makeConnection`. This means:

- LEDs always reflect the **currently active deck**, not just 1/2
- They update **in real time**: play state, cue point, sync, loop — everything
- Loading a track on any deck immediately syncs all pad LEDs to that track's hotcues
- On deck switch, all LEDs reconnect to the new channels instantly

Buttons tracked this way:

| Control | LED |
|---------|-----|
| Hotcue pads 1–8 | Lit when hotcue exists |
| Beatlooproll pads | Lit while loop is active |
| Play | Lit while playing |
| Cue | Lit at cue point |
| Sync | Lit when sync is on |
| Loop | Lit when a loop is active |
| Slip | Lit when slip mode is on |
| Quantize | Lit when quantize is on |
| PFL (headphone cue) | Lit when active |
| End of track | Lit when track is near end |

### 3. Mixer Controls Stay on Decks 1/2

Volume faders, filter knobs, EQ (low/mid/high), and pregain are **statically bound to Channel 1 and Channel 2** and do not follow the deck switch. This is intentional — it mirrors how a real mixer works, where the channel strip belongs to a physical input, not a software virtual deck. Decks 3/4 would typically be routed through the same faders in a 4-deck software setup.

### 4. Stem Mode Toggle (Pad Mode 3)

In **Pad Mode 3**, pads 1–4 control the four stems of the active deck:

| Pad | Stem |
|-----|------|
| 1 | Stem 4 (e.g. Other) |
| 2 | Stem 3 (e.g. Bass) |
| 3 | Stem 2 (e.g. Melody) |
| 4 | Stem 1 (e.g. Vocals) |

Each pad **toggles** the stem between unmuted and muted:
- **LED lit** = stem is playing (unmuted, volume at 1.0)
- **LED off** = stem is muted

Stems follow the active deck — switching to decks 3/4 updates all four stem LEDs to reflect the state of those decks' stems.

> Note: Stem separation requires a track to be analyzed with Mixxx's stem separation feature.

### 5. Bug Fixes

**Hotcue LED conflict with beatjump pads:** The original LED setup connected both hotcue and beatjump callbacks to the same MIDI pad addresses (the controller reuses pads across pad modes). When a beatjump completed, its callback fired with value 0 and cleared the hotcue LED — causing pad 1's light to flicker off during playback. Fixed by removing beatjump entries from the LED connection map (beatjump is a one-shot action and doesn't need persistent LED state).

---

## Installation

1. Copy both files to your Mixxx controllers folder:
   - **Windows:** `%LOCALAPPDATA%\Mixxx\controllers\`
   - **macOS:** `~/Library/Application Support/Mixxx/controllers/`
   - **Linux:** `~/.mixxx/controllers/`

   Files to copy:
   ```
   Hercules DJControl Inpulse 300mk2 - 4 deck.midi.xml
   v2_Hercules-DJControl-Inpulse-300mk2-script.js
   ```

2. Open Mixxx → Preferences → Controllers
3. Select **Hercules DJControl Inpulse 300mk2 - 4 deck** and enable it

---

## Credits

- **DJ Phatso** — original mapping (v1.0, August 2023)
- **Kerrick Staley** — contributions to original
- Based on the Hercules DJControl Inpulse 300 mapping shipped with Mixxx v2.3.0
- Forum thread: https://mixxx.discourse.group/t/hercules-djcontrol-inpulse-300mk2/27960
