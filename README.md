# Hercules DJControl Inpulse 300mk2 — 4-Deck Mixxx Mapping

A custom [Mixxx](https://mixxx.org/) MIDI mapping for the **Hercules DJControl Inpulse 300mk2**, extending the original community mapping with 4-deck support, real-time LED feedback, stem control, stem echo-out, and a Toneplay (key) pad mode.

**Forked from:** [DJ Phatso's mapping (v1.0, August 2023)](https://mixxx.discourse.group/t/hercules-djcontrol-inpulse-300mk2/27960)
**Mixxx version:** 2.4+ (the **stem** modes require a Mixxx build with STEM support)

---

## Performance Pads

The 300mk2 has **8 pads per deck**, arranged in two rows of four:

```
        ┌─────┬─────┬─────┬─────┐
 top    │  1  │  2  │  3  │  4  │
        ├─────┼─────┼─────┼─────┤
 bottom │  5  │  6  │  7  │  8  │
        └─────┴─────┴─────┴─────┘
```

There are **8 pad modes**. The four mode buttons above the pads (**HOT CUE, ROLL, SLICER, SAMPLER**) select the primary modes; **hold SHIFT** and press a mode button for its secondary mode (the mode button's LED blinks).

| # | Mode | How to select | What the pads do |
|---|------|---------------|------------------|
| 1 | **Hot Cue** | `HOT CUE` | Set / jump to hot cues 1–8 |
| 2 | **Loop Roll** | `ROLL` | Momentary beat-loop rolls |
| 3 | **Stems** | `SLICER` | Mute (1–4) + echo-out (5–8) the 4 stems |
| 4 | **Sampler** | `SAMPLER` | Trigger sampler slots 1–8 |
| 5 | **Toneplay / Key** | `SHIFT` + `HOT CUE` | Shift the track key in semitones |
| 6 | **FX** | `SHIFT` + `ROLL` | Toggle / cycle the FX-rack effects |
| 7 | **Slicer Loop** | `SHIFT` + `SLICER` | *Unassigned — free for future use* |
| 8 | **Beat Jump** | `SHIFT` + `SAMPLER` | Jump backward / forward by 1–8 beats |

> All pad modes follow the **active deck pair** — see [4-Deck Support](#1-4-deck-support-via-the-assistant-button). Deck A pads send MIDI status `0x96`, Deck B `0x97`.

---

## Pad Mode Reference

Each grid below shows the two physical rows of pads (columns ①–④ = the four pads in each row).

### Mode 1 — Hot Cue  · `HOT CUE`

| Row | ① | ② | ③ | ④ |
|-----|:--:|:--:|:--:|:--:|
| **1–4** | Cue 1 | Cue 2 | Cue 3 | Cue 4 |
| **5–8** | Cue 5 | Cue 6 | Cue 7 | Cue 8 |

- Press an empty pad to **set** a hot cue; press a lit pad to **jump** to it.
- **SHIFT + pad** = **clear** that hot cue.
- **LED:** lit when a hot cue exists on that pad.

### Mode 2 — Loop Roll  · `ROLL`

| Row | ① | ② | ③ | ④ |
|-----|:--:|:--:|:--:|:--:|
| **1–4** | 1/8 | 1/4 | 1/2 | 1 |
| **5–8** | 2 | 4 | 8 | 16 |

- Values are **beats**. **Hold** a pad to roll, **release** to drop back in place.
- **LED:** lit while the roll is active.

### Mode 3 — Stems  · `SLICER`

| Row | ① | ② | ③ | ④ |
|-----|:--:|:--:|:--:|:--:|
| **1–4 (mute)** | S4 mute | S3 mute | S2 mute | S1 mute |
| **5–8 (echo)** | S4 echo | S3 echo | S2 echo | S1 echo |

- **Top row** toggles each stem's mute. **LED lit = stem playing**, off = muted.
- **Bottom row** *echoes a stem out*: mutes it and rings out a tail via the dedicated echo unit (auto-stops after ~1.2 s). Bring the stem back with the top-row pad above it.
- Stems (typical order): **S1 = Vocals, S2 = Melody, S3 = Bass, S4 = Other** (actual content depends on the stem file).
- ⚠️ The echo is **deck-level** (Mixxx has no per-stem effect routing), so the tail approximates the removed stem rather than perfectly isolating it. Requires **Echo loaded into FX Unit 4** (see [Installation](#installation)).

### Mode 4 — Sampler  · `SAMPLER`

| Row | ① | ② | ③ | ④ |
|-----|:--:|:--:|:--:|:--:|
| **1–4** | Smp 1 | Smp 2 | Smp 3 | Smp 4 |
| **5–8** | Smp 5 | Smp 6 | Smp 7 | Smp 8 |

- Plays the sampler slot from its cue point. Deck A → samplers 1–8, Deck B → samplers 9–16.
- **LED:** lit while the sampler is playing.

### Mode 5 — Toneplay / Key  · `SHIFT` + `HOT CUE`

| Row | ① | ② | ③ | ④ |
|-----|:--:|:--:|:--:|:--:|
| **1–4** | −1 | +1 | Reset | Keylock |
| **5–8** | — | — | — | — |

- **−1 / +1** nudge the track key down/up one semitone — **repeatable** (press again to go further, clamped to ±6), independent of tempo. **Reset** returns to the original key.
- **Pad 4** toggles **Keylock**.
- **LED:** the **Reset** pad lights when the key is shifted from the original; pad 4 lit when keylock is on.

### Mode 6 — FX  · `SHIFT` + `ROLL`

| Row | ① | ② | ③ | ④ |
|-----|:--:|:--:|:--:|:--:|
| **1–4** | Slot 1 on | Slot 2 on | Slot 3 on | Unit on |
| **5–8** | Slot 1 ▶ | Slot 2 ▶ | Slot 3 ▶ | — |

- Toggles the three effect slots, the whole unit on/off, and steps each slot to the **next effect** (▶).
- Deck A pads drive **FX Unit 1**, Deck B pads drive **FX Unit 2**. **SHIFT** extends the same layout to **FX Units 3 & 4**.
- ⚠️ **FX Unit 4 is reserved for the stem echo-out** (Mode 3), so toggling Unit 4 here also affects that echo.

### Mode 7 — Slicer Loop  · `SHIFT` + `SLICER`

| Row | ① | ② | ③ | ④ |
|-----|:--:|:--:|:--:|:--:|
| **1–4** | — | — | — | — |
| **5–8** | — | — | — | — |

- **Currently unassigned** (MIDI notes `0x60–0x67`). Free for a future mode.

### Mode 8 — Beat Jump  · `SHIFT` + `SAMPLER`

| Row | ① | ② | ③ | ④ |
|-----|:--:|:--:|:--:|:--:|
| **1–4** | −1 | +1 ⚠️ | −2 | +2 |
| **5–8** | −4 | +4 | −8 | +8 |

- Jumps backward / forward by the shown number of **beats**.
- ⚠️ **Known issue:** pad 2 (**+1 beat**) is currently inactive — its binding (`deckBeatjump1F`) sits on note `0x00`, colliding with **Hot Cue pad 1**. Fix: move it to note `0x51` and remove the stray `0x00` bindings.

---

## MIDI Note Map (developer reference)

Pad note ranges per mode (Deck A status `0x96`, Deck B `0x97`):

| Mode | Notes (pads 1–8) | SHIFT layer |
|------|------------------|-------------|
| Hot Cue | `0x00–0x07` | `0x08–0x0F` (clear) |
| Loop Roll | `0x10–0x17` | — |
| Stems | `0x20–0x27` (1–4 mute, 5–8 echo) | — |
| Sampler | `0x30–0x37` | — |
| Toneplay | `0x40–0x43` (pads 5–8 free) | — |
| Beat Jump | `0x50–0x57` | — |
| Slicer Loop | `0x60–0x67` (free) | — |
| FX | `0x70–0x77` (Units 1/2) | `0x78–0x7F` (Units 3/4) |

---

## What's New vs the Original

The original mapping by DJ Phatso handles scratching, jog wheels, loops, FX, pad modes, and the hardware quirks of the 300mk2. This fork adds the following on top.

### 1. 4-Deck Support via the Assistant Button

Pressing the **Assistant** button toggles the controller between two deck pairs:

| Mode | Deck A (left) | Deck B (right) |
|------|---------------|----------------|
| Default | Channel 1 | Channel 2 |
| Assistant ON | Channel 3 | Channel 4 |

The Assistant LED is **solid on** when controlling decks 3/4. Every deck-dependent control (play, cue, sync, hotcues, loop, slip, stems, key, …) switches to the new channel pair instantly.

### 2. Real-Time LED Tracking

All deck-dependent LEDs are managed in script via `engine.makeConnection`, so they always reflect the **currently active deck** and update in real time (play, cue, sync, loop, hotcues, stems, keylock, end-of-track). Loading a track immediately re-syncs the pad LEDs.

### 3. Mixer Controls Stay on Decks 1/2

Volume faders, filter knobs, EQ, and pregain are **statically bound to Channel 1/2** and do not follow the deck switch — mirroring how a physical mixer channel strip works.

### 4. Stem Control (Mode 3)

Top-row pads mute/unmute the four stems of the active deck with inverted LEDs (lit = playing). See [Mode 3](#mode-3--stems--slicer).

### 5. Stem Echo-Out (Mode 3, pads 5–8)

Bottom-row pads mute a stem and ring out an Echo tail via the dedicated FX Unit 4. A deck-level approximation of the Serato/rekordbox "echo out" move.

### 6. Toneplay / Key Mode (Mode 5)

Four pads on the `SHIFT + HOT CUE` page: nudge the track key ±1 semitone (repeatable), reset, and toggle keylock. See [Mode 5](#mode-5--toneplay--key--shift--hot-cue).

### 7. Bug Fixes

- **Hotcue LED conflict with beatjump pads** — removed beatjump entries from the LED connection map (beatjump is a one-shot with no persistent state) so pad 1's light no longer flickers during playback.

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

2. Open Mixxx → **Preferences → Controllers**, select **Hercules DJControl Inpulse 300mk2 - 4 deck**, and enable it.

3. **For stem echo-out:** load the **Echo** effect into **FX Unit 4, slot 1** (you can use Reverb/Delay instead for a different tail). The script sets the unit's wet/dry and routes it onto the deck; it cannot load an effect by name for you. Tunables live at the top of the script: `stemEchoUnit`, `stemEchoMix`, `stemEchoTimeoutMs`.

---

## Credits

- **DJ Phatso** — original mapping (v1.0, August 2023)
- **Kerrick Staley** — contributions to original
- Based on the Hercules DJControl Inpulse 300 mapping shipped with Mixxx v2.3.0
- Forum thread: https://mixxx.discourse.group/t/hercules-djcontrol-inpulse-300mk2/27960
