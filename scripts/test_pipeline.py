#!/usr/bin/env python3
"""
Test script for the three-pass analysis pipeline.
Runs Pass 1 (extract), Pass 2 (read), and Pass 3 (reframe) sequentially.

Usage:
    python scripts/test_pipeline.py
    python scripts/test_pipeline.py "Your custom query here"
"""

import json
import sys
from typing import Any

import requests

API_BASE = "http://localhost:5173/api"

SAMPLE_QUERY = """I've been thinking about starting my own business, but I'm worried about the financial risks. 
I have a stable job right now that pays well, but I feel unfulfilled. 
On one hand, entrepreneurship could give me the freedom and purpose I'm looking for. 
On the other hand, what if I fail and lose everything I've built up? 
My family depends on my income, so I can't just take reckless risks. 
But every day I stay in this job, I feel like I'm wasting my potential. 
Maybe I could start something on the side while keeping my job, but then I'd have no time for my family or myself. 
I keep going back and forth and can't make a decision."""


def print_header(title: str, char: str = "═") -> None:
    """Print a formatted header."""
    print(f"\n{char * 80}")
    print(title.center(80))
    print(f"{char * 80}\n")


def print_subheader(title: str) -> None:
    """Print a formatted subheader."""
    print(f"\n{'─' * 80}")
    print(f"  {title}")
    print(f"{'─' * 80}")


def print_pass_header(pass_num: int, title: str) -> None:
    """Print a pass header with clear visual separation."""
    print(f"\n{'▓' * 80}")
    print(f"▓{'PASS ' + str(pass_num) + ': ' + title:^78}▓")
    print(f"{'▓' * 80}")


def print_json(data: Any, indent: int = 2) -> None:
    """Print JSON data with syntax highlighting via ANSI colors."""
    json_str = json.dumps(data, indent=indent, ensure_ascii=False)

    # Simple syntax highlighting
    lines = json_str.split("\n")
    for line in lines:
        print(f"    {line}")


def run_pass_1(text: str) -> dict[str, Any] | None:
    """Run Pass 1: Structural extraction."""
    print_pass_header(1, "STRUCTURAL EXTRACTION")
    print_subheader("Input Text")
    print(f"    {text[:200]}{'...' if len(text) > 200 else ''}")

    try:
        response = requests.post(
            f"{API_BASE}/extract",
            json={"text": text},
            headers={"Content-Type": "application/json"},
            timeout=120,
        )

        print_subheader(f"Response Status: {response.status_code}")

        data = response.json()

        if "error" in data:
            print(f"❌ ERROR: {data['error']}")
            return None

        analysis = data.get("analysis")
        if not analysis:
            print("⚠️  No analysis in response")
            return None

        print_subheader("Summary")
        print(f"    {analysis.get('summary', 'N/A')}")
        print(f"\n    Quality: {analysis.get('extraction_quality', 'N/A')}")

        print_subheader("Phrase Groups")
        phrases = analysis.get("phrase_groups", [])
        print(f"    Count: {len(phrases)}")
        for i, phrase in enumerate(phrases, 1):
            print(
                f"\n    {i}. [{phrase.get('type', '?')}] {phrase.get('concept_label', 'N/A')}"
            )
            print(f'       Text: "{phrase.get("text", "")}"')
            print(
                f"       Span: {phrase.get('start')}-{phrase.get('end')}, Polarity: {phrase.get('polarity')}"
            )

        print_subheader("Statement Groups")
        statements = analysis.get("statement_groups", [])
        print(f"    Count: {len(statements)}")
        for i, stmt in enumerate(statements, 1):
            print(
                f'\n    {i}. [{stmt.get("role", "?")}] "{stmt.get("text", "")[:60]}{"..." if len(stmt.get("text", "")) > 60 else ""}"'
            )
            phrase_ids = stmt.get("phrase_ids", [])
            if phrase_ids:
                print(f"       Phrases: {', '.join(phrase_ids)}")

        print_subheader("Relations")
        relations = analysis.get("relations", [])
        print(f"    Count: {len(relations)}")
        for i, rel in enumerate(relations, 1):
            source = rel.get("source", {})
            target = rel.get("target", {})
            print(
                f"    {i}. [{rel.get('type', '?')}] {source.get('kind', '?')}.{source.get('id', '?')} → {target.get('kind', '?')}.{target.get('id', '?')}"
            )

        print_subheader("Issues")
        issues = analysis.get("issues", [])
        print(f"    Count: {len(issues)}")
        for i, issue in enumerate(issues, 1):
            print(f"    {i}. [{issue.get('type', '?')}] {issue.get('label', 'N/A')}")

        return analysis

    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Make sure the dev server is running (npm run dev)")
        return None
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None


def run_pass_2(text: str, extraction: dict[str, Any]) -> dict[str, Any] | None:
    """Run Pass 2: Deep structural reading."""
    print_pass_header(2, "DEEP STRUCTURAL READING")

    try:
        response = requests.post(
            f"{API_BASE}/read",
            json={"text": text, "extraction": extraction},
            headers={"Content-Type": "application/json"},
            timeout=60,
        )

        print_subheader(f"Response Status: {response.status_code}")

        data = response.json()

        if "error" in data:
            print(f"❌ ERROR: {data['error']}")
            return None

        reading = data.get("reading")
        if not reading:
            print("⚠️  No reading in response")
            return None

        print_subheader("Deep Tension")
        print(f"    {reading.get('deepTension', 'N/A')}")

        print_subheader("Hidden Assumption")
        print(f"    {reading.get('hiddenAssumption', 'N/A')}")

        print_subheader("Pattern")
        print(f"    {reading.get('pattern', 'N/A')}")

        print_subheader("Subtext")
        print(f"    {reading.get('subtext', 'N/A')}")

        return reading

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None


def run_pass_3(
    text: str, extraction: dict[str, Any], reading: dict[str, Any]
) -> dict[str, Any] | None:
    """Run Pass 3: Reframe question."""
    print_pass_header(3, "REFRAME QUESTION")

    try:
        response = requests.post(
            f"{API_BASE}/reframe",
            json={"text": text, "extraction": extraction, "reading": reading},
            headers={"Content-Type": "application/json"},
            timeout=60,
        )

        print_subheader(f"Response Status: {response.status_code}")

        data = response.json()

        if "error" in data:
            print(f"❌ ERROR: {data['error']}")
            return None

        reframe = data.get("reframe")
        if not reframe:
            print("⚠️  No reframe in response")
            return None

        print_subheader("Question")
        print(f"    ❓ {reframe.get('question', 'N/A')}")

        print_subheader("Rationale")
        print(f"    {reframe.get('rationale', 'N/A')}")

        return reframe

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None


def print_full_output(
    text: str,
    extraction: dict[str, Any],
    reading: dict[str, Any],
    reframe: dict[str, Any],
) -> None:
    """Print the complete three-pass output as JSON."""
    print_header("COMPLETE THREE-PASS OUTPUT", "█")

    full_output = {"extraction": extraction, "reading": reading, "reframe": reframe}

    print_json(full_output)
    print()


def main() -> None:
    """Main entry point."""
    text = sys.argv[1] if len(sys.argv) > 1 else SAMPLE_QUERY

    print_header("THREE-PASS ANALYSIS PIPELINE TEST")
    print(f"API Base: {API_BASE}")
    print(f"Input length: {len(text)} characters")

    # Pass 1: Extraction
    extraction = run_pass_1(text)
    if not extraction:
        print("\n❌ Pass 1 failed. Stopping pipeline.")
        sys.exit(1)

    # Pass 2: Reading
    reading = run_pass_2(text, extraction)
    if not reading:
        print("\n❌ Pass 2 failed. Stopping pipeline.")
        sys.exit(1)

    # Pass 3: Reframe
    reframe = run_pass_3(text, extraction, reading)
    if not reframe:
        print("\n❌ Pass 3 failed. Stopping pipeline.")
        sys.exit(1)

    # Print complete output
    print_full_output(text, extraction, reading, reframe)

    print_header("✓ PIPELINE COMPLETE", "═")


if __name__ == "__main__":
    main()
