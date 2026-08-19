#!/usr/bin/env python3
"""
Check every text/background colour pair in assets/styles.css against WCAG 2.2 AA.

Run this after changing any colour:

    python3 scripts/check_contrast.py

Normal text must reach 4.5:1, large text and user interface borders 3:1.
Exits with an error if anything falls short.
"""

import re
import sys
import os

CSS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "styles.css")

# (foreground token, background token, minimum ratio, what it is)
PAIRS = [
    ("--text",        "--bg",      4.5, "body text on the page"),
    ("--text",        "--card",    4.5, "text inside a listing card"),
    ("--text",        "--surface", 4.5, "text on the filter/disclaimer panel"),
    ("--text-muted",  "--bg",      4.5, "quiet text (organization, dates)"),
    ("--text-muted",  "--card",    4.5, "quiet text inside a card"),
    ("--text-muted",  "--surface", 4.5, "quiet text on a panel"),
    ("--accent",      "--bg",      4.5, "link text"),
    ("--accent",      "--surface", 4.5, "link text on a panel"),
    ("--accent",      "--accent-soft", 4.5, "link text on hover background"),
    ("--accent-on",   "--accent-solid", 4.5, "button label on the accent button"),
    ("--border-strong", "--bg",    3.0, "input and chip borders"),
    ("--border-strong", "--card",  3.0, "chip borders inside a card"),
    ("--border-strong", "--surface", 3.0, "control borders on a panel"),
    ("--focus",       "--bg",      3.0, "focus ring on the page"),
    ("--focus",       "--surface", 3.0, "focus ring on a panel"),
    ("--focus",       "--card",    3.0, "focus ring on a card"),
]


def parse_blocks(css):
    """Return the light and dark custom-property maps."""
    dark_match = re.search(r"@media \(prefers-color-scheme: dark\)\s*\{(.*?)\n\}", css, re.S)
    dark_text = dark_match.group(1) if dark_match else ""
    light_text = css[:dark_match.start()] if dark_match else css

    def props(text):
        return dict(re.findall(r"(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;", text))

    light = props(light_text)
    dark = dict(light)
    dark.update(props(dark_text))
    return light, dark


def luminance(hex_colour):
    r, g, b = (int(hex_colour[i:i + 2], 16) / 255 for i in (1, 3, 5))

    def channel(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = channel(r), channel(g), channel(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(fg, bg):
    a, b = luminance(fg), luminance(bg)
    lighter, darker = max(a, b), min(a, b)
    return (lighter + 0.05) / (darker + 0.05)


def main():
    with open(CSS, encoding="utf-8") as fh:
        css = fh.read()
    light, dark = parse_blocks(css)

    failures = 0
    for name, palette in (("LIGHT MODE", light), ("DARK MODE", dark)):
        print("\n%s" % name)
        print("-" * 74)
        for fg_token, bg_token, minimum, description in PAIRS:
            fg, bg = palette.get(fg_token), palette.get(bg_token)
            if not fg or not bg:
                print("  ?      %-42s (colour not found)" % description)
                failures += 1
                continue
            value = ratio(fg, bg)
            ok = value >= minimum
            if not ok:
                failures += 1
            print("  %-4s %5.2f:1  (needs %.1f)  %s" % ("PASS" if ok else "FAIL", value, minimum, description))

    print("")
    if failures:
        print("%d pair(s) below the WCAG 2.2 AA threshold." % failures)
        return 1
    print("All %d pairs pass WCAG 2.2 AA in both light and dark mode." % (len(PAIRS) * 2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
