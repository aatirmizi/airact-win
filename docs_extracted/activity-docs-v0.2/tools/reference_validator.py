#!/usr/bin/env python3
"""Reference validator (PROTOTYPE) for the Stage 1 file-validation rules.

Purpose: to show that the rules in schema/validation-rules.json are implementable and testable.
It is NOT the product's validator. The product implements the same rules in Rust.
"""
import hashlib, json, os, re, sqlite3, tempfile, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "schema"
APPLICATION_ID = 1094931542
SUPPORTED_FORMAT_VERSION = 1
SUPPORTED_DATA_SCHEMA_VERSION = 1

def load(name):
    return json.loads((SCHEMA / name).read_text(encoding="utf-8"))

def limits():
    return {x["id"]: x["value"] for x in load("limits.json")["limits"]}

NAME_RE = re.compile(r"^(manifest\.json|theme\.json|settings\.json|roster\.json|data\.db|slides/[a-z0-9]{12}\.json|media/[a-z0-9]{16}\.(png|jpg|webp|gif))$")
EXPECTED_TABLES = {"meta"}

def magic_type(b):
    if b.startswith(b"\x89PNG\r\n\x1a\n"): return "image/png"
    if b.startswith(b"\xff\xd8\xff"): return "image/jpeg"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP": return "image/webp"
    if b[:6] in (b"GIF87a", b"GIF89a"): return "image/gif"
    return None

def find_media_refs(node, out):
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "media_id" and isinstance(v, str): out.add(v)
            else: find_media_refs(v, out)
    elif isinstance(node, list):
        for v in node: find_media_refs(v, out)

def validate(path, known_types=None, lim=None, check_schema=True):
    """Return (violations, read_only). violations: list of (rule_id, severity, message)."""
    from jsonschema import Draft202012Validator
    lim = lim or limits()
    known_types = known_types if known_types is not None else {}
    V = []
    def bad(rule, msg, sev="error"): V.append((rule, sev, msg))
    path = Path(path)
    if path.stat().st_size > lim["LIM-FILE-MAX-BYTES"]:
        bad("VAL-C-005", "file too large"); return V, False
    try:
        z = zipfile.ZipFile(path)
    except Exception as ex:
        bad("VAL-C-001", f"not a readable zip: {ex}"); return V, False
    infos = z.infolist()
    if len(infos) > lim["LIM-FILE-MAX-ENTRIES"]:
        bad("VAL-C-006", "too many entries"); return V, False
    names = [i.filename for i in infos]
    seen = {}
    for n in names:
        low = n.lower()
        if low in seen: bad("VAL-C-004", f"duplicate entry (case-insensitive): {n}")
        seen[low] = n
        unsafe = (n.startswith("/") or ".." in n.split("/") or "\\" in n or re.match(r"^[A-Za-z]:", n) or "\x00" in n)
        if unsafe: bad("VAL-C-003", f"unsafe entry name: {n!r}")
        elif not NAME_RE.match(n): bad("VAL-C-002", f"entry name not allowed: {n}")
    for i in infos:
        if (i.external_attr >> 16) & 0o170000 == 0o120000: bad("VAL-C-003", f"symbolic link entry: {i.filename}")
    if any(r for r, s, m in V if r in ("VAL-C-002", "VAL-C-003", "VAL-C-004")): return V, False
    total = 0
    data = {}
    for i in infos:
        n = i.filename
        cap = lim["LIM-FILE-MAX-MEDIA-BYTES"] if n.startswith("media/") else lim["LIM-SLIDE-MAX-BYTES"] if n.startswith("slides/") else lim["LIM-FILE-MAX-JSON-BYTES"] if n.endswith(".json") else lim["LIM-FILE-MAX-UNCOMPRESSED-BYTES"]
        if i.file_size / max(i.compress_size, 1) > lim["LIM-FILE-MAX-COMPRESSION-RATIO"] and i.file_size > 1024:
            bad("VAL-C-008", f"compression ratio too high: {n}"); continue
        buf = bytearray(); too_big = False
        with z.open(i) as f:                       # count while reading, not from declared size
            while True:
                chunk = f.read(65536)
                if not chunk: break
                buf += chunk
                if len(buf) > cap or total + len(buf) > lim["LIM-FILE-MAX-UNCOMPRESSED-BYTES"]:
                    bad("VAL-C-007", f"entry too large while reading: {n}"); too_big = True; break
        if not too_big:
            data[n] = bytes(buf); total += len(buf)
    if any(r in ("VAL-C-007", "VAL-C-008") for r, s, m in V): return V, False
    for req in ("manifest.json", "theme.json", "settings.json", "data.db"):
        if req not in data: bad("VAL-C-009", f"missing required entry {req}")
    if any(r == "VAL-C-009" for r, s, m in V): return V, False
    try:
        manifest = json.loads(data["manifest.json"].decode("utf-8"))
    except Exception as ex:
        bad("VAL-M-001", f"manifest is not UTF-8 JSON: {ex}"); return V, False
    fv = manifest.get("format_version") if isinstance(manifest, dict) else None
    if isinstance(fv, int) and fv > SUPPORTED_FORMAT_VERSION:
        bad("VAL-M-002", f"format_version {fv} is newer than supported {SUPPORTED_FORMAT_VERSION}"); return V, False
    mv = Draft202012Validator(load("manifest.schema.json"))
    errs = sorted(mv.iter_errors(manifest), key=lambda e: list(e.path))
    for e in errs: bad("VAL-M-001", f"manifest: {'/'.join(map(str, e.path))}: {e.message[:80]}")
    if errs: return V, False
    slide_ids = manifest["slides"]
    if len(slide_ids) != len(set(slide_ids)): bad("VAL-M-003", "duplicate slide IDs")
    mids = [m["id"] for m in manifest["media"]]
    if len(mids) != len(set(mids)): bad("VAL-M-004", "duplicate media IDs")
    slide_files = {n[len("slides/"):-len(".json")]: n for n in data if n.startswith("slides/")}
    for sid in set(slide_ids):
        if sid not in slide_files: bad("VAL-X-001", f"slide {sid} has no file")
    for sid in slide_files:
        if sid not in slide_ids: bad("VAL-X-002", f"orphan slide file {sid}")
    if ("roster.json" in data) != bool(manifest["has_roster"]): bad("VAL-X-004", "roster.json presence does not match has_roster")
    media_files = {n[len("media/"):].split(".")[0]: n for n in data if n.startswith("media/")}
    for m in manifest["media"]:
        n = media_files.get(m["id"])
        if n is None: bad("VAL-X-005", f"media {m['id']} missing"); continue
        b = data[n]
        if len(b) != m["bytes"] or hashlib.sha256(b).hexdigest() != m["sha256"]: bad("VAL-X-005", f"media {m['id']} size or hash mismatch")
        elif magic_type(b) != m["media_type"]: bad("VAL-X-006", f"media {m['id']} content is {magic_type(b)}, declared {m['media_type']}")
    for mid in media_files:
        if mid not in mids: bad("VAL-X-005", f"media file {mid} not in index")
    for nm, sch in (("theme.json", "theme.schema.json"), ("settings.json", "settings.schema.json")):
        try: obj = json.loads(data[nm].decode("utf-8"))
        except Exception: bad("VAL-X-008", f"{nm} is not UTF-8 JSON"); continue
        for e in Draft202012Validator(load(sch)).iter_errors(obj): bad("VAL-X-008", f"{nm}: {e.message[:80]}")
    sv = Draft202012Validator(load("slide.schema.json"))
    used, read_only = set(), False
    for sid, n in slide_files.items():
        try: s = json.loads(data[n].decode("utf-8"))
        except Exception: bad("VAL-X-009", f"slide {sid} is not UTF-8 JSON"); continue
        es = list(sv.iter_errors(s))
        for e in es: bad("VAL-X-009", f"slide {sid}: {e.message[:80]}")
        if es: continue
        if s["id"] != sid: bad("VAL-X-003", f"slide file {sid} contains id {s['id']}")
        used.add((s["type_id"], s["type_version"]))
        refs = set(); find_media_refs(s["content"], refs)
        for ref in refs:
            if ref not in mids: bad("VAL-X-007", f"slide {sid} references unknown media {ref}")
    declared = {(r["type_id"], r["type_version"]) for r in manifest["requires"]}
    if used != declared and not any(r == "VAL-X-009" for r, s_, m in V): bad("VAL-M-006", f"requires {sorted(declared)} != used {sorted(used)}")
    for t in declared:
        if t[1] not in known_types.get(t[0], set()):
            bad("VAL-M-005", f"unknown slide type/version {t}", "warning"); read_only = True
    # database
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "data.db"; p.write_bytes(data["data.db"])
        try:
            con = sqlite3.connect(f"file:{p}?mode=ro", uri=True)
            con.execute("PRAGMA trusted_schema=OFF")
            con.execute("SELECT count(*) FROM sqlite_master").fetchone()
        except Exception as ex:
            bad("VAL-D-001", f"database cannot be opened defensively: {ex}"); return V, read_only
        try:
            aid = con.execute("PRAGMA application_id").fetchone()[0]
            uv = con.execute("PRAGMA user_version").fetchone()[0]
            if aid != APPLICATION_ID: bad("VAL-D-002", f"application_id {aid}")
            if uv > SUPPORTED_DATA_SCHEMA_VERSION: bad("VAL-D-003", f"user_version {uv} newer than supported")
            elif uv != manifest["data_schema_version"]: bad("VAL-D-003", f"user_version {uv} != data_schema_version {manifest['data_schema_version']}")
            objs = con.execute("SELECT type,name FROM sqlite_master").fetchall()
            tables = {n for t, n in objs if t == "table"}
            other = [(t, n) for t, n in objs if t not in ("table", "index")]
            if other or tables != EXPECTED_TABLES: bad("VAL-D-004", f"unexpected schema objects: tables={sorted(tables)} other={other}")
            else:
                strict = {r[1]: r[5] for r in con.execute("PRAGMA table_list")}
                if not all(strict.get(t) == 1 for t in tables): bad("VAL-D-004", "table is not STRICT")
            ic = con.execute("PRAGMA integrity_check").fetchall()
            if ic != [("ok",)] or con.execute("PRAGMA foreign_key_check").fetchall(): bad("VAL-D-005", "integrity or foreign key check failed")
            row = con.execute("SELECT value FROM meta WHERE key='activity_id'").fetchone() if "meta" in tables else None
            if not row or row[0] != manifest["meta"]["activity_id"]: bad("VAL-D-006", "activity_id differs between manifest and database")
        except sqlite3.DatabaseError as ex:
            bad("VAL-D-005", f"database error: {ex}")
        finally:
            con.close()
    return V, read_only
