#!/usr/bin/env python3
"""Parse cloned awesome-lists and DESIGN.md brands into data.json."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path("/workspace")
OUT = Path("/workspace/design-atlas/data.json")

SKIP_HEADINGS = {
    "contents",
    "table of contents",
    "contributing",
    "contribute",
    "license",
    "related awesome lists",
    "already built with ponytail",
    "numbers",
    "before / after",
    "the review, rebuilt",
    "the audit, rebuilt",
    "how it works",
    "the prompt",
    "install",
    "commands",
    "faq",
    "sponsors",
    "what is design.md?",
    "request a design.md",
    "ai design + build ecosystem tools",
}

LINK_RE = re.compile(
    r"^[\s]*[-*]\s+\[([^\]]+)\]\(([^)]+)\)(?:\s*[-–—:]\s*(.+))?$",
    re.UNICODE,
)
HEADING_RE = re.compile(r"^#{2,3}\s+(.+)$")
EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001F9FF"
    "\U00002600-\U000026FF"
    "\U00002700-\U000027BF"
    "\U0000FE00-\U0000FE0F"
    "\U0001F000-\U0001F02F"
    "]+",
    flags=re.UNICODE,
)


def clean(text: str) -> str:
    text = EMOJI_RE.sub("", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.strip("*_` ")
    return text


def parse_readme(path: Path, source: str, source_label: str) -> list[dict]:
    items: list[dict] = []
    category = "General"
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return items

    for line in lines:
        heading = HEADING_RE.match(line)
        if heading:
            raw = clean(heading.group(1))
            if raw.lower() in SKIP_HEADINGS:
                category = None
            else:
                category = raw or "General"
            continue
        if category is None:
            continue
        m = LINK_RE.match(line)
        if not m:
            continue
        name, url, desc = m.group(1), m.group(2), m.group(3) or ""
        url = url.strip()
        if not url.startswith("http"):
            continue
        name = clean(name)
        desc = clean(desc)
        if not name:
            continue
        items.append(
            {
                "name": name,
                "url": url,
                "desc": desc,
                "category": category,
                "source": source,
                "sourceLabel": source_label,
                "kind": "resource",
            }
        )
    return items


def parse_frontmatter_colors(text: str) -> tuple[str, str, dict]:
    name = ""
    description = ""
    colors: dict[str, str] = {}
    in_colors = False
    for line in text.splitlines()[:80]:
        if line.strip() == "colors:":
            in_colors = True
            continue
        if in_colors:
            if line and not line.startswith(" ") and not line.startswith("\t"):
                break
            cm = re.match(r"^\s+([A-Za-z0-9_-]+):\s*[\"']?(#[0-9A-Fa-f]{3,8})[\"']?", line)
            if cm:
                colors[cm.group(1)] = cm.group(2)
            continue
        nm = re.match(r'^name:\s*"?(.+?)"?\s*$', line)
        if nm:
            name = clean(nm.group(1))
        dm = re.match(r'^description:\s*"(.+)$', line)
        if dm:
            description = dm.group(1).rstrip('"')
            continue
        if description and not line.startswith("colors:") and not re.match(r"^[a-z]+:", line):
            description += " " + line.strip().rstrip('"')
            if line.rstrip().endswith('"'):
                pass
    description = clean(description)[:280]
    return name, description, colors


def parse_brands(base: Path) -> list[dict]:
    brands = []
    if not base.is_dir():
        return brands
    for folder in sorted(p for p in base.iterdir() if p.is_dir()):
        design = folder / "DESIGN.md"
        if not design.exists():
            continue
        text = design.read_text(encoding="utf-8", errors="replace")
        name, description, colors = parse_frontmatter_colors(text)
        slug = folder.name
        display = name.replace("-design-analysis", "").replace("-Inspired", "").replace("Inspired", "")
        display = display.replace("design-analysis", "").strip(" -") or slug
        brands.append(
            {
                "name": display,
                "slug": slug,
                "desc": description,
                "url": f"https://{slug}" if "." in slug else f"https://{slug}.com",
                "category": "Brand systems",
                "source": "design-md",
                "sourceLabel": "DESIGN.md",
                "kind": "brand",
                "colors": colors,
            }
        )
    return brands


def dedupe(items: list[dict]) -> list[dict]:
    seen: dict[str, dict] = {}
    for item in items:
        key = item["url"].rstrip("/").lower()
        if key in seen:
            existing = seen[key]
            if item["kind"] == "brand":
                seen[key] = item
            elif len(item.get("desc", "")) > len(existing.get("desc", "")):
                existing["desc"] = item["desc"]
            continue
        seen[key] = item
    return list(seen.values())


def main() -> None:
    resources: list[dict] = []
    sources = [
        (ROOT / "Awesome-Design-Resources-List" / "README.md", "resources", "Design Resources"),
        (ROOT / "awesome-inspiration" / "README.md", "inspiration", "Inspiration"),
        (ROOT / "awesome-design" / "README.md", "open-source", "Open Source"),
        (ROOT / "awesome-web-design" / "README.md", "web-design", "Web Design"),
    ]
    for path, source, label in sources:
        if path.exists():
            resources.extend(parse_readme(path, source, label))

    brands = parse_brands(ROOT / "awesome-design-md" / "design-md")
    all_items = dedupe(resources + brands)

    categories = sorted({i["category"] for i in all_items})
    source_meta = [
        {"id": "resources", "label": "Design Resources"},
        {"id": "inspiration", "label": "Inspiration"},
        {"id": "open-source", "label": "Open Source"},
        {"id": "web-design", "label": "Web Design"},
        {"id": "design-md", "label": "Brand systems"},
    ]

    payload = {
        "generatedFrom": [s[2] for s in sources] + ["DESIGN.md brands"],
        "counts": {
            "total": len(all_items),
            "resources": sum(1 for i in all_items if i["kind"] == "resource"),
            "brands": sum(1 for i in all_items if i["kind"] == "brand"),
        },
        "sources": source_meta,
        "categories": categories,
        "items": all_items,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")
    print(f"wrote {OUT} ({payload['counts']})")


if __name__ == "__main__":
    main()
