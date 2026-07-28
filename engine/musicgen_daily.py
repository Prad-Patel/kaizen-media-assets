#!/usr/bin/env python3
"""Kaizen daily-social music bed — procedural, in-house, no external tracks.

Same palette as the campaign ads: 124 BPM, A minor, Am/F/C/G, warm pads +
rounded bass + legato lead. Energy comes from groove and layering, never from
time-stretching (stretching is what made every licensed track sound wrong).

Structure is beat-mapped to the daily template:
  hook   0.0 - 4.5   pad + soft pulse, no kick
  points 4.5 - 13.5  kick enters, groove builds across the three points
  stat  13.5 - 17.5  impact on the stat, lead peaks
  end   17.5 - 22.0  chorus resolve, eased down under the CTA, clean fade

Usage: musicgen_daily.py [total_seconds] [out.wav]
Defaults: 22.0 seconds, ./music.wav
"""
import numpy as np, sys, wave

SR = 44100
BPM = 124.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT

total = float(sys.argv[1]) if len(sys.argv) > 1 else 22.0
OUT = sys.argv[2] if len(sys.argv) > 2 else "music.wav"

# section boundaries scaled from the 22s reference timeline
K = total / 22.0
S_POINTS, S_STAT, S_END = 4.5 * K, 13.5 * K, 17.5 * K

N = int(total * SR)
L = np.zeros(N); R = np.zeros(N)
LL = np.zeros(N); RL = np.zeros(N)   # lead layer, separately enveloped


def add(sig, t0, l=1.0, r=1.0):
    i0 = int(t0 * SR); n = min(len(sig), N - i0)
    if n <= 0: return
    L[i0:i0+n] += sig[:n] * l; R[i0:i0+n] += sig[:n] * r


def add_lead(sig, t0, l=1.0, r=1.0):
    i0 = int(t0 * SR); n = min(len(sig), N - i0)
    if n <= 0: return
    LL[i0:i0+n] += sig[:n] * l; RL[i0:i0+n] += sig[:n] * r


def adsr(n, a, shape=2.2):
    e = np.ones(n); na = max(int(a * SR), 1)
    e[:na] = np.linspace(0, 1, na)
    if n - na > 0: e[na:] = np.exp(-np.linspace(0, shape, n - na))
    return e


def lowpass(x, a):
    out = np.zeros(len(x)); y = 0.0
    for i in range(len(x)):
        y += a * (x[i] - y); out[i] = y
    return out


def kick(vel=1.0):
    n = int(0.30 * SR); t = np.arange(n) / SR
    ph = np.cumsum(2 * np.pi * (130 * np.exp(-t * 24) + 46) / SR)
    return np.sin(ph) * np.exp(-t * 13) * vel * 0.9


def bass(freq, dur, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t)
         + 0.12 * np.sin(2 * np.pi * freq * 3 * t))
    return s * adsr(n, 0.015, 1.4) * vel * 0.42


def hat(vel=1.0, open_=False):
    n = int((0.16 if open_ else 0.055) * SR)
    x = np.random.default_rng(int(vel * 1e6) % 9973).uniform(-1, 1, n)
    x = np.diff(x, prepend=0); x = np.diff(x, prepend=0)
    return x * np.exp(-np.linspace(0, (3.5 if open_ else 7), n)) * vel * 0.13


def clap(vel=1.0):
    n = int(0.24 * SR)
    x = np.diff(np.random.default_rng(11).uniform(-1, 1, n), prepend=0)
    e = np.exp(-np.linspace(0, 9, n))
    for off in (0.012, 0.026):
        i = int(off * SR); e[i:] += np.exp(-np.linspace(0, 9, n - i)) * 0.6
    return x * e * vel * 0.12


def lead(freq, dur, vel=1.0, cutoff=0.28):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for det in (-0.9, 0, 1.1):
        f = freq * (1 + det / 900)
        s += (2 * ((f * t) % 1) - 1)
    s = lowpass(s, cutoff) * (1 + 0.04 * np.sin(2 * np.pi * 5.2 * t))
    return s * adsr(n, 0.06, 1.6) * vel * 0.11


def pad(freqs, dur, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-1.3, 1.0):
            s += (2 * (((f * (1 + det / 700)) * t) % 1) - 1) * 0.5
    s = lowpass(s, 0.10)
    e = np.ones(n); na = int(0.35 * SR); nr = int(0.35 * SR)
    e[:na] = np.linspace(0, 1, na) ** 1.5
    e[-nr:] *= np.linspace(1, 0.55, nr)
    return s * e * vel * 0.085


def impact(vel=1.0):
    n = int(1.3 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (58 * np.exp(-t * 3) + 29) * t) * np.exp(-t * 3.2)
    noise = np.random.default_rng(3).uniform(-1, 1, n) * np.exp(-t * 8)
    return (boom * 0.9 + noise * 0.22) * vel


CHORDS = [
    (55.00, (110.00, 130.81, 164.81)),   # Am
    (43.65, (87.31, 110.00, 130.81)),    # F
    (65.41, (130.81, 164.81, 196.00)),   # C
    (49.00, (98.00, 123.47, 146.83)),    # G
]
MOTIF = [
    [(0.0, 440.00, 1.5), (2.0, 523.25, 1.0), (3.0, 493.88, 1.0)],
    [(0.0, 523.25, 2.0), (2.5, 440.00, 1.5)],
    [(0.0, 659.25, 1.5), (2.0, 587.33, 2.0)],
    [(0.0, 493.88, 1.5), (2.0, 440.00, 2.0)],
]

for bar in range(int(total / BAR) + 1):
    tb = bar * BAR
    if tb >= total: break
    root, triad = CHORDS[bar % 4]
    mid = tb + BAR / 2
    in_hook = mid < S_POINTS
    in_end = mid >= S_END

    # continuous climb through hook + points, peak over the stat, held to the end
    if mid < S_STAT:
        ramp = 0.5 + 0.5 * min(1.0, mid / S_STAT) ** 1.3
    else:
        ramp = 1.0

    add(pad(triad, BAR * 1.05, 0.7 if in_hook else 1.0), tb, l=0.9, r=1.0)

    for beat in range(4):
        t = tb + beat * BEAT
        if t >= total: break
        if not in_hook:
            if mid < (S_POINTS + S_STAT) / 2:
                if beat in (0, 2): add(kick(0.85 * ramp), t)
            else:
                add(kick(0.95 * ramp), t)
            if beat in (1, 3): add(clap(0.9 * ramp), t)
            add(hat(0.7 * ramp, open_=(beat == 3)), t + BEAT / 2)
        add(bass(root, BEAT * 0.95, (0.55 if in_hook else 0.9) * ramp), t)

    if not in_hook and not in_end:
        for (off, f, dur) in MOTIF[bar % 4]:
            add_lead(lead(f, BEAT * dur), tb + off * BEAT, l=1.0, r=0.92)
    if in_end:
        for (off, f, dur) in MOTIF[bar % 4]:
            add_lead(lead(f * 1.0, BEAT * dur, 0.9), tb + off * BEAT, l=0.92, r=1.0)

# stat hit
add(impact(0.55), S_STAT)

# lead envelope: fades in over the points, peaks on the stat, resolves under the CTA
tax = np.arange(N) / SR
cos = lambda t, a, b: 0.5 - 0.5 * np.cos(np.pi * np.clip((t - a) / (b - a), 0, 1))
env = np.clip(cos(tax, S_POINTS, S_POINTS + 1.2) * (1 - 0.15 * cos(tax, S_END, S_END + 1.0)), 0, 1)
L += LL * env; R += RL * env

# ease the whole bed down 15% under the end card so the CTA reads clean
duck = 1.0 - 0.15 * cos(tax, S_END + 0.4, S_END + 1.4)
L *= duck; R *= duck

mix = np.tanh(np.stack([L, R])) * 0.8
fi, fo = int(0.3 * SR), int(1.2 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi)
mix[:, -fo:] *= np.linspace(1, 0, fo)

with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').T.tobytes())
print(f"wrote {OUT} ({total:.1f}s)")
