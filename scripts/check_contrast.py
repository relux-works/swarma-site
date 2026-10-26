#!/usr/bin/env python3
"""Browser contrast entry point and pure token-pair/WCAG contract.

Pair selection, forced-color roles and luminance arithmetic are adapted from
relux-works/swarma-platform-design-system at d39d98efb898fa2609bed4d48c83edb85d02b349.
CSS values are always resolved in Chromium; no stylesheet parser decides a verdict.
"""
import argparse
import json
from pathlib import Path
import re
import subprocess
import sys
PALETTES = ["light", "dark", "light-contrast", "dark-contrast"]
SURFACES = ["bg", "surface-subtle", "surface", "surface-raised", "surface-hover"]
ROLES = ["human", "agent", "service", "store", "key", "external", "alert", "neutral"]
STATUSES = ["now", "decided", "proposed", "spec", "open"]

# Targets: (normal appearance, increased-contrast appearance).
TEXT = (4.5, 7.0)
NON_TEXT = (3.0, 3.0)


def forced_roles():
    groups = {
        "Canvas": SURFACES + ["figure-ground", "text-inverse", "on-accent", "scrim", "material"],
        "CanvasText": ["brand-red", "brand-ink", "brand-white", "text", "text-muted", "text-faint",
                       "border", "border-strong", "divider", "success", "warning", "error", "info", "figure-frame"],
        "ButtonFace": ["control", "control-hover", "strong-action", "strong-action-hover"],
        "ButtonText": ["control-text", "on-strong-action"],
        "Highlight": ["control-pressed", "focus", "selection-bg"],
        "HighlightText": ["selection-text", "control-text-pressed"],
        "LinkText": ["accent", "accent-hover", "accent-pressed", "link", "link-hover"],
        "transparent": ["accent-soft"],
    }
    groups["Canvas"] += [f"role-{role}-fill" for role in ROLES] + [f"status-{status}-bg" for status in STATUSES]
    groups["CanvasText"] += [f"role-{role}-{part}" for role in ROLES for part in ["stroke", "text"]]
    groups["CanvasText"] += [f"status-{status}-text" for status in STATUSES]
    return {key: color.lower() for color, keys in groups.items() for key in keys}


def validate(palettes):
    required = set(forced_roles())
    for tokens in palettes.values():
        if not required <= tokens.keys():
            raise ValueError("missing semantic color token")
        for value in tokens.values():
            to_rgba(value)
        if to_rgba(tokens["bg"])[3] != 1:
            raise ValueError("root background must be opaque")


def to_rgba(value):
    value = value.strip().lower()
    if re.fullmatch(r"#[0-9a-f]{6}", value):
        return tuple(int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)) + (1.0,)
    match = re.fullmatch(r"rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)", value)
    if match:
        r, g, b, a = match.groups()
        a = a or "1"
        if all(0 <= float(channel) <= 255 for channel in (r, g, b)) and 0 <= float(a) <= 1:
            return (float(r) / 255, float(g) / 255, float(b) / 255, float(a))
    raise ValueError("unsupported or invalid color value")


def over(fg, bg):
    a = fg[3]
    return tuple(f * a + b * (1 - a) for f, b in zip(fg[:3], bg[:3]))


def luminance(rgb):
    channels = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


def ratio(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def pairs():
    """Yield (label, foreground token, background token, targets)."""
    for fg in ["text", "text-muted", "text-faint"]:
        for bg in SURFACES:
            yield f"{fg} on {bg}", fg, bg, TEXT
    for fg in ["accent", "accent-hover", "link", "link-hover"]:
        for bg in SURFACES:
            yield f"{fg} on {bg}", fg, bg, TEXT
    for fg in ["focus", "border-strong"]:
        for bg in SURFACES:
            yield f"{fg} on {bg}", fg, bg, NON_TEXT
    for fg in ["success", "warning", "error", "info"]:
        for bg in SURFACES:
            yield f"{fg} on {bg}", fg, bg, TEXT
    yield "on-accent on accent", "on-accent", "accent", TEXT
    yield "on-accent on accent-hover", "on-accent", "accent-hover", TEXT
    yield "on-strong-action on strong-action", "on-strong-action", "strong-action", TEXT
    yield "on-strong-action on strong-action-hover", "on-strong-action", "strong-action-hover", TEXT
    for bg in ["control", "control-hover"]:
        yield f"control-text on {bg}", "control-text", bg, TEXT
    yield "control-text-pressed on control-pressed", "control-text-pressed", "control-pressed", TEXT
    yield "selection-text on selection-bg", "selection-text", "selection-bg", TEXT
    yield "text on accent-soft", "text", "accent-soft", TEXT
    yield "accent on accent-soft", "accent", "accent-soft", TEXT
    for role in ROLES:
        yield f"role-{role}-text on role-{role}-fill", f"role-{role}-text", f"role-{role}-fill", TEXT
        for bg in SURFACES:
            yield f"role-{role}-text on {bg}", f"role-{role}-text", bg, TEXT
        yield f"role-{role}-stroke on role-{role}-fill", f"role-{role}-stroke", f"role-{role}-fill", NON_TEXT
        for bg in SURFACES:
            yield f"role-{role}-stroke on {bg}", f"role-{role}-stroke", bg, NON_TEXT
    for status in STATUSES:
        yield (f"status-{status}-text on status-{status}-bg", f"status-{status}-text",
               f"status-{status}-bg", TEXT)


def check(palettes, computed):
    results = []
    for name, tokens in palettes.items():
        bg = to_rgba(tokens["bg"])
        more = name.split("/")[0].endswith("contrast")
        for (label, fg_key, bg_key, targets), measured in zip(pairs(), computed[name], strict=True):
            target = targets[1] if more else targets[0]
            back = to_rgba(measured["background"])
            back_rgb = over(back, bg) if back[3] < 1 else back[:3]
            fore = to_rgba(measured["foreground"])
            fore_rgb = over(fore, back_rgb + (1.0,)) if fore[3] < 1 else fore[:3]
            value = ratio(fore_rgb, back_rgb)
            results.append((name, label, value, target, value + 1e-9 >= target))
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("tokens", nargs="?", default="src/styles/tokens.css")
    parser.add_argument("--control", action="store_true")
    args = parser.parse_args()
    bridge = Path(__file__).resolve().parent / "checks/contrast.mjs"
    command = ["node", str(bridge), "--tokens=" + str(Path(args.tokens).resolve())]
    if args.control:
        command.append("--control")
    try:
        return subprocess.run(command, timeout=90).returncode
    except (OSError, subprocess.TimeoutExpired):
        print("contrast-browser: measurement unavailable")
        return 1

if __name__ == "__main__":
    sys.exit(main())
