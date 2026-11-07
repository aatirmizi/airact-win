#!/usr/bin/env python3
"""Consistency checks across docs/, schema/, reference/ and sketches/.

Run:  python3 tools/check_docs.py
Exit status 0 only if every check passes. Prints one line per check, then details of failures.
"""
import json, re, sys, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT/"docs"; SCHEMA = ROOT/"schema"
docs = {p.name: p.read_text(encoding="utf-8") for p in sorted(DOCS.glob("*.md"))}
refs = {p.name: p.read_text(encoding="utf-8") for p in sorted((ROOT/"reference").glob("*.md"))}
if (ROOT/"README.md").exists(): docs["README.md"] = (ROOT/"README.md").read_text(encoding="utf-8")
results = []
def check(name, problems):
    results.append((name, not problems, problems)); print(("PASS " if not problems else "FAIL ") + name)

lim = json.loads((SCHEMA/"limits.json").read_text())["limits"]
err = json.loads((SCHEMA/"error-codes.json").read_text())["errors"]
rul = json.loads((SCHEMA/"validation-rules.json").read_text())["rules"]
limit_ids = {x["id"] for x in lim}; codes = {x["code"] for x in err}; rule_ids = {x["id"] for x in rul}

# 1. headings: numbered sections per document
heads = {}
for f, t in docs.items():
    s = set()
    for line in t.splitlines():
        m = re.match(r"^#{2,4}\s+(\d+(?:\.\d+)*)[\.\s]", line)
        if m: s.add(m.group(1))
    heads[f] = s

# 2. section cross-references
bad = []
for f, t in docs.items():
    for m in re.finditer(r"`([A-Za-z_]+\.md)`[^.\n|]{0,40}?\bsections?\s+(\d+(?:\.\d+)?)(?:\s*(?:,|and|to)\s*(\d+(?:\.\d+)?))*", t):
        doc = m.group(1)
        if doc not in docs: continue
        span = m.group(0)
        for sec in re.findall(r"\d+(?:\.\d+)?", span.split("section")[-1]):
            if heads[doc] and sec not in heads[doc]: bad.append(f"{f}: {doc} has no section {sec}")
    # same-document references
    for m in re.finditer(r"(?<![\w`.])(?:section|sections)\s+(\d+(?:\.\d+)?)", t):
        pre = t[max(0, m.start()-80):m.start()].split("\n")[-1]
        if ".md" in pre or "`" in pre[-3:]: continue
        if "of" in t[m.end():m.end()+6]: continue
        if m.group(1) not in heads[f]: bad.append(f"{f}: section {m.group(1)} (same document) not found")
    # "section N of `file.md`"
    for m in re.finditer(r"sections?\s+(\d+(?:\.\d+)?)\s+of\s+`([A-Za-z_]+\.md)`", t):
        if m.group(2) in docs and m.group(1) not in heads[m.group(2)]: bad.append(f"{f}: {m.group(2)} has no section {m.group(1)}")
check("section cross-references resolve", sorted(set(bad)))

# 3. document and file references
bad = []
for f, t in docs.items():
    for m in re.finditer(r"`((?:docs/|schema/|reference/|tools/|fixtures/|sketches/)?[A-Za-z0-9_./-]+\.(?:md|json|sql|svg|py|actvty))`", t):
        name = m.group(1)
        if "<" in name or "*" in name or name.startswith(".."): continue
        cands = [ROOT/name, DOCS/name, SCHEMA/name, ROOT/"reference"/name, ROOT/"tools"/name, ROOT/"sketches"/name, ROOT/"fixtures"/"golden"/name, SCHEMA/"migrations"/name]
        if not any(c.exists() for c in cands):
            if name in ("manifest.json", "theme.json", "settings.json", "roster.json", "data.db", "manifest.working.json") or name.startswith("slides/") or name.startswith("media/"): continue
            if name.endswith(".actvty") or name.endswith(".bak") or name.endswith(".lock"): continue
            if name.startswith("schema/components") or name.startswith("schema/released") or name.startswith("measurements"): continue
            bad.append(f"{f}: file `{name}` not found")
check("referenced files exist", sorted(set(bad)))

# 4. identifiers
dec = docs["DECISIONS.md"]
sec2 = dec[dec.index("## 2. Proposed"):dec.index("## 3. Open decisions")]
defined = {"D": set(re.findall(r"\|\s*(D-\d{3})\s*\|", dec)), "PR": set(re.findall(r"\|\s*(PR-\d{3})\s*\|", sec2)), "O": set(re.findall(r"\|\s*(O-\d{3})\s*\|", dec))}
legacy_pr = {f"PR-{n:03d}" for n in range(1, 38)}
defined["D"] |= {f"D-{n:03d}" for n in range(1, 1)}
bad = []
for f, t in docs.items():
    for k in ("D", "PR", "O"):
        for ident in set(re.findall(rf"\b({k}-\d{{3}})\b", t)):
            if ident not in defined[k] and not (k == "PR" and f == "DECISIONS.md" and ident in legacy_pr): bad.append(f"{f}: {ident} is not defined in DECISIONS.md")
check("decision identifiers (D, PR, O) are defined", sorted(bad))
led = docs["VERIFIED_VS_ASSUMED.md"]
ledger_ids = set(re.findall(r"\|\s*((?:V|RP|A)-\d{3})\s*\|", led))
bad = []
for f, t in docs.items():
    for ident in set(re.findall(r"\b((?:V|RP|A)-\d{3})\b", t)):
        if ident not in ledger_ids: bad.append(f"{f}: {ident} not in the ledger")
check("ledger identifiers (V, RP, A) exist", sorted(bad))
fnd = set(re.findall(r"\|\s*(F-\d{2})\s*\|", docs["READINESS_AUDIT.md"]))
bad = [f"{f}: {i} not in READINESS_AUDIT.md" for f, t in docs.items() for i in set(re.findall(r"\b(F-\d{2})\b", t)) if i not in fnd]
check("finding identifiers (F) exist", sorted(bad))

# 5. limits, codes, rules named in prose exist
bad = []
for f, t in list(docs.items()) + list(refs.items()):
    for ident in set(re.findall(r"\b(LIM-[A-Z0-9-]*[A-Z0-9])\b", t)):
        if ident.endswith("-"): continue
        if ident in limit_ids: continue
        # allow shorthand ranges such as LIM-CONTENT-POLL-OPTIONS-MIN/MAX and prefixes like LIM-CONTENT-*
        if any(l.startswith(ident) for l in limit_ids): continue
        bad.append(f"{f}: {ident} is not in the limits registry")
    for ident in set(re.findall(r"\b(VAL-[A-Z]-\d{3})\b", t)):
        if ident not in rule_ids: bad.append(f"{f}: {ident} is not a validation rule")
check("limit and rule IDs named in prose exist", sorted(bad))
bad = []
for f, t in docs.items():
    for code in set(re.findall(r"`([A-Z][A-Z0-9_]{5,})`", t)):
        if code in ("SLIDE_INCOMPLETE",) or code in codes: continue
        if code.startswith(("LIM_", "HTTP_")): continue
        if re.match(r"^(FILE|NET|SLIDE|APP|MIGRATION)_", code) or code in ("MIGRATION_FAILED",):
            bad.append(f"{f}: error code {code} not in the catalogue")
    for code in set(re.findall(r"`([a-z]+(?:_[a-z]+)+)`", t)):
        if code in {x for x in codes}: continue
check("UPPER_CASE error codes named in prose exist", sorted(bad))

# 6. acceptance scenarios
at = docs["ACCEPTANCE_TESTS.md"]
detailed = set(re.findall(r"^#### (AT-[A-Z]+-\d{3})", at, re.M))
scheduled = set(re.findall(r"^\|\s*(AT-[A-Z]+-\d{3})\s*\|", at, re.M))
all_at = detailed | scheduled
bad = []
for f, t in list(docs.items()) + list(refs.items()):
    for ident in set(re.findall(r"\b(AT-[A-Z]+-\d{3})\b", t)):
        if ident not in all_at: bad.append(f"{f}: {ident} has no scenario")
    for ident in set(re.findall(r"\bAT-[A-Z]+-\d{3}\b", json.dumps(err) + json.dumps(rul))):
        if ident not in all_at: bad.append(f"schema: {ident} has no scenario")
check("every scenario ID referenced exists", sorted(set(bad)))
bad = []
for e in err:
    if not any(re.search(rf"\b{re.escape(e['code'])}\b", at) for _ in [0]): bad.append(f"error code {e['code']} appears in no scenario text")
    for a in e["acceptance"]:
        if a not in all_at: bad.append(f"{e['code']}: {a} missing")
for r in rul:
    if not any(re.search(rf"{re.escape(r['id'])}", at) for _ in [0]): bad.append(f"rule {r['id']} appears in no scenario text")
check("every error code and validation rule appears in scenario text (both ways)", sorted(set(bad)))
bad = []
for m in re.finditer(r"^#### (AT-[A-Z]+-\d{3}) ([^\n]+)\n(\*\*[^\n]+)", at, re.M):
    body = m.group(3)
    if not re.search(r"\*\*(Must|Should|Could) ·", body): bad.append(f"{m.group(1)}: no priority line")
    if body.count("**Given**") + body.count("**When**") + body.count("**Then**") < 3 and not ("**And when**" in body and "**Given**" in body): bad.append(f"{m.group(1)}: missing Given/When/Then")
check("every detailed scenario has a priority and Given, When and Then", bad)
dup = [i for i in re.findall(r"^#### (AT-[A-Z]+-\d{3})", at, re.M) if re.findall(r"^#### (AT-[A-Z]+-\d{3})", at, re.M).count(i) > 1]
check("scenario IDs are not repeated", sorted(set(dup)))
bad = [f"{i} is both written in full and scheduled" for i in detailed & scheduled]
check("no scenario is both written and scheduled", bad)

# 7. screen cards: every card has scenarios that exist; every inventory 'Written' ID has a card
ss = docs["SCREEN_SPEC.md"]
written = set(re.findall(r"^\|\s*((?:FW|FD|PJ|PP)-\d{2})\s*\|[^\n]*\|\s*Written\s*\|", ss, re.M))
cards = set(re.findall(r"^### ((?:FW|FD|PJ|PP)-\d{2}) ", ss, re.M))
bad = [f"{i}: marked Written but has no card" for i in written - cards] + [f"{i}: card exists but inventory does not say Written" for i in cards - written]
check("screen inventory and cards agree", sorted(bad))
bad = []
for m in re.finditer(r"^### ((?:FW|FD|PJ|PP)-\d{2}) .*?(?=^### |\Z)", ss, re.M | re.S):
    if not re.search(r"\*\*Scenarios:\*\* AT-[A-Z]+-\d{3}", m.group(0)): bad.append(f"{m.group(1)}: card lists no scenarios")
check("every screen card lists its scenarios", bad)

# 8. terms
bad = []
forbid = [(r"\bpresenter\b", "presenter"), (r"\bArgon2", "Argon2"), (r"AES-GCM", "AES-GCM"), (r"\bage crate\b", "age crate"), (r"\bSQLCipher\b", "SQLCipher"),
          (r"duplicates are refused", "duplicates refused"), (r"\bseven-stage\b", "seven-stage"), (r"Downgrading is not supported", "downgrading unsupported"),
          (r"owner-only permissions on Linux\)?\s*\(\*proposed", "old PR-009 text")]
for f, t in docs.items():
    if f in ("GLOSSARY.md", "DECISIONS.md", "READINESS_AUDIT.md", "AGENTS.md", "VERIFIED_VS_ASSUMED.md"): continue
    if f == "README.md": continue
    for pat, label in forbid:
        for m in re.finditer(pat, t, re.I): bad.append(f"{f}: '{label}'")
    for m in re.finditer(r"\bsessions?\b", t, re.I):
        ctx = t[max(0, m.start()-30):m.end()+30].replace("\n", " ")
        bad.append(f"{f}: 'session' in '{ctx}'")
check("no stale or forbidden terms ('session', 'presenter', superseded wording)", sorted(set(bad)))
bad = []
for f, t in docs.items():
    for m in re.finditer(r"(?<!\*)\*[Pp]roposed\.?\*(?!\*)|\(Proposed\.\)", t): bad.append(f"{f}: leftover proposed marker")
check("no leftover 'proposed' markers in documents", bad)
boast = re.compile(r"\b(robust|bulletproof|unbreakable|military-grade|best-in-class|seamless|uncompromising|world-class|absolute data)\b", re.I)
bad = [f"{f}: '{m.group(0)}'" for f, t in docs.items() if f != "DECISIONS.md" for m in boast.finditer(t)]
check("no boasting words", bad)

# 9. tables well formed
bad = []
for f, t in list(docs.items()) + list(refs.items()):
    lines = t.split("\n"); i = 0
    while i < len(lines):
        if lines[i].lstrip().startswith("|") and i+1 < len(lines) and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i+1]):
            def cols(s): return len(re.split(r"(?<!\\)\|", re.sub(r"`[^`]*`", lambda m: m.group(0).replace("|", "¦"), s.strip()))) - 2
            n = cols(lines[i]); j = i+2
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                if cols(lines[j]) != n: bad.append(f"{f}:{j+1}: {cols(lines[j])} columns, expected {n}")
                j += 1
            i = j
        else: i += 1
check("tables are well formed", bad)

# 10. generated reference is current, artefacts valid
r = subprocess.run([sys.executable, str(ROOT/"tools"/"gen_reference.py"), "--check"], capture_output=True, text=True)
check("reference/ is current", [] if r.returncode == 0 else [r.stdout.strip()])
r = subprocess.run([sys.executable, str(ROOT/"tools"/"validate_artefacts.py")], capture_output=True, text=True)
check("artefact checks pass (validate_artefacts.py)", [] if r.returncode == 0 else [r.stdout.splitlines()[-1] if r.stdout else r.stderr[-200:]])

# 11. sketches are well-formed SVG and referenced
import xml.dom.minidom
bad = []
for p in sorted((ROOT/"sketches").glob("*.svg")):
    try: xml.dom.minidom.parse(str(p))
    except Exception as ex: bad.append(f"{p.name}: {ex}")
    if p.name not in ss and p.name.split(".")[0] not in "".join(docs.values()): bad.append(f"{p.name}: not referenced")
check("sketches parse and are referenced", bad)

# 12. limits registry: 'explained_in' points at real sections
bad = []
for x in lim:
    m = re.match(r"^([A-Za-z_]+\.md) section (\d+)$", x["explained_in"])
    if not m: bad.append(f"{x['id']}: unparseable explained_in {x['explained_in']!r}"); continue
    if m.group(1) not in docs or m.group(2) not in heads[m.group(1)]: bad.append(f"{x['id']}: {x['explained_in']} does not exist")
    elif x["id"] not in docs[m.group(1)] and x["id"] not in docs.get("SCHEMA_GOVERNANCE.md", ""):
        pass
check("limits registry 'explained_in' sections exist", bad)

fails = [(n, p) for n, ok, p in results if not ok]
print(f"\n{len(results)-len(fails)} passed, {len(fails)} failed")
for n, p in fails:
    print(f"\n--- {n}")
    for x in p[:60]: print("   ", x)
    if len(p) > 60: print(f"    ... and {len(p)-60} more")
sys.exit(1 if fails else 0)
