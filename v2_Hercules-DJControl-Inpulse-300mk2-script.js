// DJControl_Inpulse_300_script.js
//
// ***************************************************************************
// * Mixxx mapping script file for the Hercules DJControl Inpulse 300mk2.
// * Author: DJ Phatso, contributions by Kerrick Staley
// * Version 1.0 (August 2023)
// * Forum: https://www.mixxx.org/forums/viewtopic.php?f=7&t=12599
//
// * Based on Hercules DJControl Inpulse 300 mapping released with Mixxx v2.3.0
//
// *  -Remapped LOOP and VINYL section according to new DJControl 300 MK2 layout
// *  -FX section "Depth" knob works a SuperKnob / "Beat" works as Dry/Wet for Effect rack
// *  -Fix for pad 8 LED in Deck A PAD Mode 5 (FX)
// *  -Fix soft-takeover for Pitch sliders Deck1/Deck2
// ****************************************************************************
var DJCi300mk2 = {};
///////////////////////////////////////////////////////////////
//                       USER OPTIONS                        //
///////////////////////////////////////////////////////////////

// How fast scratching is.
DJCi300mk2.scratchScale = 1.0;

// How much faster seeking (shift+scratch) is than scratching.
DJCi300mk2.scratchShiftMultiplier = 4;

// How fast bending is.
DJCi300mk2.bendScale = 1.0;

// Other scratch related options
DJCi300mk2.kScratchActionNone = 0;
DJCi300mk2.kScratchActionScratch = 1;
DJCi300mk2.kScratchActionSeek = 2;
DJCi300mk2.kScratchActionBend = 3;

DJCi300mk2.vuMeterUpdateMaster = function(value, _group, _control) {
    value = (value * 122) + 5;
    midi.sendShortMsg(0xB0, 0x40, value);
    midi.sendShortMsg(0xB0, 0x41, value);
};

DJCi300mk2.vuMeterUpdateDeck = function(value, group, _control, _status) {
    value = (value * 122) + 5;
    var status = (group === "[Channel1]") ? 0xB1 : 0xB2;
    midi.sendShortMsg(status, 0x40, value);
};

DJCi300mk2.init = function() {
    // Scratch button state
    DJCi300mk2.scratchButtonState = true;
    // Scratch Action
    DJCi300mk2.scratchAction = {
    1: DJCi300mk2.kScratchActionNone,
    2: DJCi300mk2.kScratchActionNone
    };

    // Deck 3/4 control mode (toggled by Assistant button)
    DJCi300mk2.deck34Active = false;

    // Turn On Vinyl buttons LED(one for each deck).
    midi.sendShortMsg(0x94, 0x01, 0x7F);
    midi.sendShortMsg(0x95, 0x01, 0x7F);

    //Turn On Browser button LED
    midi.sendShortMsg(0x90, 0x04, 0x05);

   //Softtakeover for Pitch fader
   engine.softTakeover("[Channel1]", "rate", true);
   engine.softTakeover("[Channel2]", "rate", true);
   engine.softTakeoverIgnoreNextValue("[Channel1]", "rate");
   engine.softTakeoverIgnoreNextValue("[Channel2]", "rate");

   // Connect the VUMeters
    engine.connectControl("[Channel1]", "VuMeter", "DJCi300mk2.vuMeterUpdateDeck");
	engine.getValue("[Channel1]", "VuMeter", "DJCi300mk2.vuMeterUpdateDeck");
    engine.connectControl("[Channel2]", "VuMeter", "DJCi300mk2.vuMeterUpdateDeck");
	engine.getValue("[Channel2]", "VuMeter", "DJCi300mk2.vuMeterUpdateDeck");
    engine.connectControl("[Master]", "VuMeterL", "DJCi300mk2.vuMeterUpdateMaster");
    engine.connectControl("[Master]", "VuMeterR", "DJCi300mk2.vuMeterUpdateMaster");
	engine.getValue("[Master]", "VuMeterL", "DJCi300mk2.vuMeterUpdateMaster");
    engine.getValue("[Master]", "VuMeterR", "DJCi300mk2.vuMeterUpdateMaster");

    // Ask the controller to send all current knob/slider values over MIDI, which will update
    // the corresponding GUI controls in MIXXX.
    midi.sendShortMsg(0xB0, 0x7F, 0x7F);

    // Connect deck-dependent LED feedback (hotcues, play, cue, sync, etc.)
    DJCi300mk2._connectDeckLEDs();
};

// The Vinyl button, used to enable or disable scratching on the jog wheels (One per deck).
DJCi300mk2.vinylButton = function(_channel, _control, value, status, _group) {
    if (value) {
        if (DJCi300mk2.scratchButtonState) {
            DJCi300mk2.scratchButtonState = false;
            midi.sendShortMsg(status, 0x03, 0x00);
        } else {
            DJCi300mk2.scratchButtonState = true;
            midi.sendShortMsg(status, 0x03, 0x7F);
        }
    }
};

DJCi300mk2._scratchEnable = function(deck) {
    var alpha = 1.0/8;
    var beta = alpha/32;
    engine.scratchEnable(deck, 248, 33 + 1/3, alpha, beta);
};

DJCi300mk2._convertWheelRotation = function(value) {
    // When you rotate the jogwheel, the controller always sends either 0x1
    // (clockwise) or 0x7F (counter clockwise). 0x1 should map to 1, 0x7F
    // should map to -1 (IOW it's 7-bit signed).
    return value < 0x40 ? 1 : -1;
};

// Resolve physical deck (1 or 2) to active deck (3 or 4 in deck34 mode)
DJCi300mk2._physicalDeck = function(channel) {
    // MIDI channel → physical deck:
    //  1 = Deck A normal,  4 = Deck A shift,  6 = Deck A PADs
    //  2 = Deck B normal,  5 = Deck B shift,  7 = Deck B PADs
    return (channel === 1 || channel === 4 || channel === 6) ? 1 : 2;
};

DJCi300mk2.activeDeck = function(physicalDeck) {
    return DJCi300mk2.deck34Active ? (physicalDeck === 1 ? 3 : 4) : physicalDeck;
};

// Factory: press-only one-shot trigger (ignores release events, sends 1)
DJCi300mk2._mkDeckBtn = function(key) {
    return function(channel, _control, value, _status, _group) {
        if (!value) { return; }
        var deck = DJCi300mk2.activeDeck(DJCi300mk2._physicalDeck(channel));
        engine.setValue("[Channel" + deck + "]", key, 1);
    };
};

// Factory: press-only binary state toggle (uses script.toggleControl to flip 0↔1)
DJCi300mk2._mkDeckToggle = function(key) {
    return function(channel, _control, value, _status, _group) {
        if (!value) { return; }
        var deck = DJCi300mk2.activeDeck(DJCi300mk2._physicalDeck(channel));
        script.toggleControl("[Channel" + deck + "]", key);
    };
};

// Factory: press+release held button (cue, hotcue activate, beatlooproll)
DJCi300mk2._mkDeckHeld = function(key) {
    return function(channel, _control, value, _status, _group) {
        var deck = DJCi300mk2.activeDeck(DJCi300mk2._physicalDeck(channel));
        engine.setValue("[Channel" + deck + "]", key, value > 0 ? 1 : 0);
    };
};

// --- Deck-redirectable button functions (all route to activeDeck) ---
// Binary state toggles (script.toggleControl flips 0↔1 on each press)
DJCi300mk2.deckSlip        = DJCi300mk2._mkDeckToggle("slip_enabled");
DJCi300mk2.deckQuantize    = DJCi300mk2._mkDeckToggle("quantize");
DJCi300mk2.deckSync        = DJCi300mk2._mkDeckToggle("sync_enabled");
DJCi300mk2.deckPlay        = DJCi300mk2._mkDeckToggle("play");
DJCi300mk2.deckPfl         = DJCi300mk2._mkDeckToggle("pfl");
DJCi300mk2.deckKeylock     = DJCi300mk2._mkDeckToggle("keylock");
DJCi300mk2.deckSyncMaster  = DJCi300mk2._mkDeckToggle("sync_master");
// Cue (held — hold to preview, release to return to cue point)
DJCi300mk2.deckCue         = DJCi300mk2._mkDeckHeld("cue_default");
// One-shot triggers (send 1 on press, Mixxx handles the action/reset)
DJCi300mk2.deckLoop        = DJCi300mk2._mkDeckBtn("beatloop_activate");
DJCi300mk2.deckLoopIn      = DJCi300mk2._mkDeckBtn("beatloop_4_activate");
DJCi300mk2.deckLoopOut     = DJCi300mk2._mkDeckBtn("reloop_toggle");
DJCi300mk2.deckLoad        = DJCi300mk2._mkDeckBtn("LoadSelectedTrack");
DJCi300mk2.deckStartPlay   = DJCi300mk2._mkDeckBtn("start_play");
DJCi300mk2.deckPlayStutter = DJCi300mk2._mkDeckBtn("play_stutter");
DJCi300mk2.deckLoopHalve   = DJCi300mk2._mkDeckBtn("loop_halve");
DJCi300mk2.deckLoopDouble  = DJCi300mk2._mkDeckBtn("loop_double");
// Hotcue activate (held — press starts, release ends)
// Uses a dedicated factory that immediately re-asserts the LED after every
// press/release to override the hardware echo (controller lights pad on
// note-on regardless of hotcue state, causing false flashes).
DJCi300mk2._mkHotcueHeld = function(num) {
    var midino = num - 1; // hotcue 1→0x00, 2→0x01, … 8→0x07
    return function(channel, _control, value, _status, _group) {
        var physDeck = DJCi300mk2._physicalDeck(channel);
        var deck     = DJCi300mk2.activeDeck(physDeck);
        engine.setValue("[Channel" + deck + "]", "hotcue_" + num + "_activate", value > 0 ? 1 : 0);
        // Re-assert LED immediately so hardware echo can't leave a false light
        var enabled = engine.getValue("[Channel" + deck + "]", "hotcue_" + num + "_enabled");
        var ledVal  = enabled ? 0x7E : 0x00;
        var status  = (physDeck === 1) ? 0x96 : 0x97;
        midi.sendShortMsg(status, midino,        ledVal); // primary LED address
        midi.sendShortMsg(status, midino + 0x08, ledVal); // alternate LED address
    };
};
DJCi300mk2.deckHotcue1     = DJCi300mk2._mkHotcueHeld(1);
DJCi300mk2.deckHotcue2     = DJCi300mk2._mkHotcueHeld(2);
DJCi300mk2.deckHotcue3     = DJCi300mk2._mkHotcueHeld(3);
DJCi300mk2.deckHotcue4     = DJCi300mk2._mkHotcueHeld(4);
DJCi300mk2.deckHotcue5     = DJCi300mk2._mkHotcueHeld(5);
DJCi300mk2.deckHotcue6     = DJCi300mk2._mkHotcueHeld(6);
DJCi300mk2.deckHotcue7     = DJCi300mk2._mkHotcueHeld(7);
DJCi300mk2.deckHotcue8     = DJCi300mk2._mkHotcueHeld(8);
// Hotcue clear (one-shot trigger)
DJCi300mk2.deckHotcue1C    = DJCi300mk2._mkDeckBtn("hotcue_1_clear");
DJCi300mk2.deckHotcue2C    = DJCi300mk2._mkDeckBtn("hotcue_2_clear");
DJCi300mk2.deckHotcue3C    = DJCi300mk2._mkDeckBtn("hotcue_3_clear");
DJCi300mk2.deckHotcue4C    = DJCi300mk2._mkDeckBtn("hotcue_4_clear");
DJCi300mk2.deckHotcue5C    = DJCi300mk2._mkDeckBtn("hotcue_5_clear");
DJCi300mk2.deckHotcue6C    = DJCi300mk2._mkDeckBtn("hotcue_6_clear");
DJCi300mk2.deckHotcue7C    = DJCi300mk2._mkDeckBtn("hotcue_7_clear");
DJCi300mk2.deckHotcue8C    = DJCi300mk2._mkDeckBtn("hotcue_8_clear");
// Beatlooproll (held — hold to loop, release to exit)
DJCi300mk2.deckRoll0125    = DJCi300mk2._mkDeckHeld("beatlooproll_0.125_activate");
DJCi300mk2.deckRoll025     = DJCi300mk2._mkDeckHeld("beatlooproll_0.25_activate");
DJCi300mk2.deckRoll05      = DJCi300mk2._mkDeckHeld("beatlooproll_0.5_activate");
DJCi300mk2.deckRoll1       = DJCi300mk2._mkDeckHeld("beatlooproll_1_activate");
DJCi300mk2.deckRoll2       = DJCi300mk2._mkDeckHeld("beatlooproll_2_activate");
DJCi300mk2.deckRoll4       = DJCi300mk2._mkDeckHeld("beatlooproll_4_activate");
DJCi300mk2.deckRoll8       = DJCi300mk2._mkDeckHeld("beatlooproll_8_activate");
DJCi300mk2.deckRoll16      = DJCi300mk2._mkDeckHeld("beatlooproll_16_activate");
// Beatjump (one-shot trigger)
DJCi300mk2.deckBeatjump1F  = DJCi300mk2._mkDeckBtn("beatjump_1_forward");
DJCi300mk2.deckBeatjump1B  = DJCi300mk2._mkDeckBtn("beatjump_1_backward");
DJCi300mk2.deckBeatjump2F  = DJCi300mk2._mkDeckBtn("beatjump_2_forward");
DJCi300mk2.deckBeatjump2B  = DJCi300mk2._mkDeckBtn("beatjump_2_backward");
DJCi300mk2.deckBeatjump4F  = DJCi300mk2._mkDeckBtn("beatjump_4_forward");
DJCi300mk2.deckBeatjump4B  = DJCi300mk2._mkDeckBtn("beatjump_4_backward");
DJCi300mk2.deckBeatjump8F  = DJCi300mk2._mkDeckBtn("beatjump_8_forward");
DJCi300mk2.deckBeatjump8B  = DJCi300mk2._mkDeckBtn("beatjump_8_backward");

// The touch action on the jog wheel's top surface
DJCi300mk2.wheelTouch = function(channel, control, value, _status, _group) {
    var deck = channel;
    var aDeck = DJCi300mk2.activeDeck(deck);
    if (value > 0) {
        //  Touching the wheel.
        if (engine.getValue("[Channel" + aDeck + "]", "play") !== 1 || DJCi300mk2.scratchButtonState) {
            DJCi300mk2._scratchEnable(aDeck);
            DJCi300mk2.scratchAction[deck] = DJCi300mk2.kScratchActionScratch;
        } else {
            DJCi300mk2.scratchAction[deck] = DJCi300mk2.kScratchActionBend;
        }
    } else {
        // Released the wheel.
        engine.scratchDisable(aDeck);
        DJCi300mk2.scratchAction[deck] = DJCi300mk2.kScratchActionNone;
    }
};

// The touch action on the jog wheel's top surface while holding shift
DJCi300mk2.wheelTouchShift = function(channel, control, value, _status, _group) {
    var deck = channel - 3;
    var aDeck = DJCi300mk2.activeDeck(deck);
    // We always enable scratching regardless of button state.
    if (value > 0) {
        DJCi300mk2._scratchEnable(aDeck);
        DJCi300mk2.scratchAction[deck] = DJCi300mk2.kScratchActionSeek;
    } else {
        // Released the wheel.
        engine.scratchDisable(aDeck);
        DJCi300mk2.scratchAction[deck] = DJCi300mk2.kScratchActionNone;
    }
};

// Scratching on the jog wheel (rotating it while pressing the top surface)
DJCi300mk2.scratchWheel = function(channel, control, value, status, _group) {
    var deck;
    switch (status) {
    case 0xB1:
    case 0xB4:
        deck  = 1;
        break;
    case 0xB2:
    case 0xB5:
        deck  = 2;
        break;
    default:
        return;
    }
    var aDeck = DJCi300mk2.activeDeck(deck);
    var interval = DJCi300mk2._convertWheelRotation(value);
    var scratchAction = DJCi300mk2.scratchAction[deck];
    if (scratchAction === DJCi300mk2.kScratchActionScratch) {
        engine.scratchTick(aDeck, interval * DJCi300mk2.scratchScale);
    } else if (scratchAction === DJCi300mk2.kScratchActionSeek) {
        engine.scratchTick(aDeck,
            interval *  DJCi300mk2.scratchScale *
            DJCi300mk2.scratchShiftMultiplier);
    } else {
        engine.setValue(
            "[Channel" + aDeck + "]", "jog", interval * DJCi300mk2.bendScale);
    }
};

// Bending on the jog wheel (rotating using the edge)
DJCi300mk2.bendWheel = function(channel, control, value, _status, _group) {
    var interval = DJCi300mk2._convertWheelRotation(value);
    engine.setValue(
        "[Channel" + DJCi300mk2.activeDeck(channel) + "]", "jog", interval * DJCi300mk2.bendScale);
};

// ===================== Stem Mode Toggle (Pad Mode 3) =====================
// Pads 1-4 toggle stems 4,3,2,1 between unmuted (volume_set_one) and muted.
// LED lit = stem unmuted (volume == 1.0).
// Stem index: pad 1→Stem4, pad 2→Stem3, pad 3→Stem2, pad 4→Stem1
DJCi300mk2._stemForPad = [4, 3, 2, 1];

DJCi300mk2._mkStemToggle = function(padIndex) {
    var stemNum = DJCi300mk2._stemForPad[padIndex];
    return function(channel, _control, value, _status, _group) {
        if (!value) { return; }
        var deck = DJCi300mk2.activeDeck(DJCi300mk2._physicalDeck(channel));
        var group = "[Channel" + deck + "_Stem" + stemNum + "]";
        var muted = engine.getValue(group, "mute");
        if (muted) {
            // Unmute: set volume to 1
            engine.setValue(group, "mute", 0);
            engine.setValue(group, "volume", 1.0);
        } else {
            // Mute
            engine.setValue(group, "mute", 1);
        }
    };
};

DJCi300mk2.deckStemToggle1 = DJCi300mk2._mkStemToggle(0);  // pad 1 → Stem4
DJCi300mk2.deckStemToggle2 = DJCi300mk2._mkStemToggle(1);  // pad 2 → Stem3
DJCi300mk2.deckStemToggle3 = DJCi300mk2._mkStemToggle(2);  // pad 3 → Stem2
DJCi300mk2.deckStemToggle4 = DJCi300mk2._mkStemToggle(3);  // pad 4 → Stem1

DJCi300mk2.shutdown = function() {
    DJCi300mk2._disconnectDeckLEDs();
    midi.sendShortMsg(0x90, 0x03, 0x00);
    midi.sendShortMsg(0xB0, 0x7F, 0x00);
};

// ===================== LED Management =====================
// All deck-dependent LED feedback is handled here via engine.makeConnection,
// so LEDs always track the active deck in real time (including after track loads).
// Format: [controlKey, onValue, [[sideA_status, sideA_midino], ...], [[sideB_status, sideB_midino], ...]]
DJCi300mk2._ledMap = [
    // Hotcue pads (on = 0x7E)
    ["hotcue_1_enabled", 0x7E, [[0x96,0x00],[0x96,0x08]], [[0x97,0x00],[0x97,0x08]]],
    ["hotcue_2_enabled", 0x7E, [[0x96,0x01],[0x96,0x09]], [[0x97,0x01],[0x97,0x09]]],
    ["hotcue_3_enabled", 0x7E, [[0x96,0x02],[0x96,0x0A]], [[0x97,0x02],[0x97,0x0A]]],
    ["hotcue_4_enabled", 0x7E, [[0x96,0x03],[0x96,0x0B]], [[0x97,0x03],[0x97,0x0B]]],
    ["hotcue_5_enabled", 0x7E, [[0x96,0x04],[0x96,0x0C]], [[0x97,0x04],[0x97,0x0C]]],
    ["hotcue_6_enabled", 0x7E, [[0x96,0x05],[0x96,0x0D]], [[0x97,0x05],[0x97,0x0D]]],
    ["hotcue_7_enabled", 0x7E, [[0x96,0x06],[0x96,0x0E]], [[0x97,0x06],[0x97,0x0E]]],
    ["hotcue_8_enabled", 0x7E, [[0x96,0x07],[0x96,0x0F]], [[0x97,0x07],[0x97,0x0F]]],
    // Beatlooproll pads
    ["beatlooproll_0.125_activate", 0x7F, [[0x96,0x10]], [[0x97,0x10]]],
    ["beatlooproll_0.25_activate",  0x7F, [[0x96,0x11]], [[0x97,0x11]]],
    ["beatlooproll_0.5_activate",   0x7F, [[0x96,0x12]], [[0x97,0x12]]],
    ["beatlooproll_1_activate",     0x7F, [[0x96,0x13]], [[0x97,0x13]]],
    ["beatlooproll_2_activate",     0x7F, [[0x96,0x14]], [[0x97,0x14]]],
    ["beatlooproll_4_activate",     0x7F, [[0x96,0x15]], [[0x97,0x15]]],
    ["beatlooproll_8_activate",     0x7F, [[0x96,0x16]], [[0x97,0x16]]],
    ["beatlooproll_16_activate",    0x7F, [[0x96,0x17]], [[0x97,0x17]]],
    // Beatjump pads removed — beatjump is a one-shot action with no persistent
    // state, and its MIDI addresses (0x96/0x00 etc.) conflict with hotcue LEDs.
    // Deck buttons
    ["slip_enabled",       0x7F, [[0x91,0x01]], [[0x92,0x01]]],
    ["quantize",           0x7F, [[0x91,0x02]], [[0x92,0x02]]],
    ["beatloop_4_enabled", 0x7F, [[0x91,0x03]], [[0x92,0x03]]],
    ["sync_enabled",       0x7F, [[0x91,0x05]], [[0x92,0x05]]],
    ["sync_master",        0x7F, [[0x93,0x05]], [[0x94,0x05]]],
    ["cue_indicator",      0x7F, [[0x91,0x06]], [[0x92,0x06]]],
    ["start_play",         0x7F, [[0x94,0x06]], []],
    ["play_indicator",     0x7F, [[0x91,0x07]], [[0x92,0x07]]],
    ["pfl",                0x7F, [[0x91,0x0C]], [[0x92,0x0C]]],
    ["end_of_track",       0x7F, [[0x91,0x1C],[0x91,0x1D]], [[0x92,0x1C],[0x92,0x1D]]]
];

// Stem LED map: tracks mute state, LED ON when NOT muted (inverted logic).
// Format: [stemNum, onValue, [[sideA_status, sideA_midino], ...], [[sideB_status, sideB_midino], ...]]
DJCi300mk2._stemLedMap = [
    [4, 0x7F, [[0x96,0x20]], [[0x97,0x20]]],  // pad 1 → Stem4
    [3, 0x7F, [[0x96,0x21]], [[0x97,0x21]]],  // pad 2 → Stem3
    [2, 0x7F, [[0x96,0x22]], [[0x97,0x22]]],  // pad 3 → Stem2
    [1, 0x7F, [[0x96,0x23]], [[0x97,0x23]]]   // pad 4 → Stem1
];

DJCi300mk2._ledConnections = [];

DJCi300mk2._connectOneLED = function(group, key, onVal, midiPairs) {
    if (!midiPairs || midiPairs.length === 0) { return; }
    var conn = engine.makeConnection(group, key, function(value) {
        var v = (value >= 0.5) ? onVal : 0x00;
        for (var j = 0; j < midiPairs.length; j++) {
            midi.sendShortMsg(midiPairs[j][0], midiPairs[j][1], v);
        }
    });
    conn.trigger();
    DJCi300mk2._ledConnections.push(conn);
};

// Inverted variant: LED ON when value < 0.5 (used for mute → LED on when NOT muted)
DJCi300mk2._connectOneLEDInverted = function(group, key, onVal, midiPairs) {
    if (!midiPairs || midiPairs.length === 0) { return; }
    var conn = engine.makeConnection(group, key, function(value) {
        var v = (value < 0.5) ? onVal : 0x00;
        for (var j = 0; j < midiPairs.length; j++) {
            midi.sendShortMsg(midiPairs[j][0], midiPairs[j][1], v);
        }
    });
    conn.trigger();
    DJCi300mk2._ledConnections.push(conn);
};

DJCi300mk2._connectDeckLEDs = function() {
    DJCi300mk2._disconnectDeckLEDs();
    var aDeck = DJCi300mk2.activeDeck(1);
    var bDeck = DJCi300mk2.activeDeck(2);
    var map = DJCi300mk2._ledMap;
    for (var i = 0; i < map.length; i++) {
        DJCi300mk2._connectOneLED("[Channel" + aDeck + "]", map[i][0], map[i][1], map[i][2]);
        DJCi300mk2._connectOneLED("[Channel" + bDeck + "]", map[i][0], map[i][1], map[i][3]);
    }
    // Stem LEDs: track mute state (inverted — LED on when NOT muted)
    var stemMap = DJCi300mk2._stemLedMap;
    for (var s = 0; s < stemMap.length; s++) {
        var stemGroup = "_Stem" + stemMap[s][0];
        DJCi300mk2._connectOneLEDInverted("[Channel" + aDeck + stemGroup + "]", "mute", stemMap[s][1], stemMap[s][2]);
        DJCi300mk2._connectOneLEDInverted("[Channel" + bDeck + stemGroup + "]", "mute", stemMap[s][1], stemMap[s][3]);
    }
};

DJCi300mk2._disconnectDeckLEDs = function() {
    for (var i = 0; i < DJCi300mk2._ledConnections.length; i++) {
        DJCi300mk2._ledConnections[i].disconnect();
    }
    DJCi300mk2._ledConnections = [];
};

// Assistant button: toggle Deck 3/4 control mode — solid LED on, off when back to 1/2
DJCi300mk2.assistantButton = function(_channel, _control, value, _status, _group) {
    if (!value) {
        return;
    }
    DJCi300mk2.deck34Active = !DJCi300mk2.deck34Active;
    midi.sendShortMsg(0x90, 0x03, DJCi300mk2.deck34Active ? 0x7F : 0x00);
    DJCi300mk2._connectDeckLEDs();
};
