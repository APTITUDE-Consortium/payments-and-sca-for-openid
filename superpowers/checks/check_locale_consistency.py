"""Check PaSO example metadata against the no-locale-mixing rule.

For every transaction data type metadata object found in a JSON code block
(an object with a "claims" array), all claim `display` arrays and all
`ui_labels` entry arrays must carry the same set of `locale` tags, and
either all contain a default entry (no `locale`) or none do.

Usage: python3 -I check_locale_consistency.py <file.md> [...]
Exit 0 when all checked objects conform, 1 otherwise.
"""

import json
import re
import sys

FENCE = re.compile(r"```json\n(.*?)```", re.S)


def type_objects(node):
    """Yield every dict that looks like transaction data type metadata."""
    if isinstance(node, dict):
        if isinstance(node.get("claims"), list):
            yield node
        for value in node.values():
            yield from type_objects(value)
    elif isinstance(node, list):
        for value in node:
            yield from type_objects(value)


def signature(entries):
    tags = frozenset(e["locale"].lower() for e in entries if "locale" in e)
    has_default = any("locale" not in e for e in entries)
    return tags, has_default


def check(obj):
    arrays = []
    for claim in obj["claims"]:
        if "display" in claim:
            arrays.append((f"claims{claim.get('path')}", claim["display"]))
    for key, entries in (obj.get("ui_labels") or {}).items():
        arrays.append((f"ui_labels.{key}", entries))
    sigs = {name: signature(entries) for name, entries in arrays}
    if len(set(sigs.values())) <= 1:
        return []
    return [f"  {name}: tags={sorted(t)} default={d}" for name, (t, d) in sigs.items()]


def main(paths):
    failures = checked = 0
    for path in paths:
        try:
            with open(path, encoding="utf-8") as handle:
                text = handle.read()
        except OSError as err:
            failures += 1
            print(f"{path}: cannot read: {err}")
            continue
        for match in FENCE.finditer(text):
            line = text[: match.start()].count("\n") + 1
            try:
                doc = json.loads(match.group(1))
            except json.JSONDecodeError:
                continue  # abbreviated or illustrative block
            for obj in type_objects(doc):
                checked += 1
                problems = check(obj)
                if problems:
                    failures += 1
                    print(f"{path}:{line}: mixed locale sets")
                    print("\n".join(problems))
    print(f"checked {checked} type metadata objects, {failures} non-conforming")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
