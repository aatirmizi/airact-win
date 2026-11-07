#!/usr/bin/env python3
"""Checks the canonical artefacts in schema/ and exercises the prototype validator.

Run:  python3 tools/validate_artefacts.py [--write-golden]
Exit status 0 only if everything passes. Prints one line per check.
"""
import base64, hashlib, io, json, re, sqlite3, sys, tempfile, zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import reference_validator as rv
from jsonschema import Draft202012Validator

ROOT = rv.ROOT; SCHEMA = rv.SCHEMA
results = []
def check(name, ok, detail=""):
    results.append((name, ok, detail)); print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail and not ok else ""))

def jl(p): return json.loads(Path(p).read_text(encoding="utf-8"))

# 1. every schema is a valid Draft 2020-12 schema
schemas = sorted(SCHEMA.glob("*.schema.json"))
for p in schemas:
    try: Draft202012Validator.check_schema(jl(p)); check(f"schema is valid: {p.name}", True)
    except Exception as ex: check(f"schema is valid: {p.name}", False, str(ex)[:100])

# 2. registries validate against their meta-schemas and have unique IDs
lim = jl(SCHEMA/"limits.json"); err = jl(SCHEMA/"error-codes.json"); val = jl(SCHEMA/"validation-rules.json")
for data, sch, nm in ((lim, "limits.schema.json", "limits.json"), (err, "error-codes.schema.json", "error-codes.json"), (val, "validation-rules.schema.json", "validation-rules.json")):
    es = list(Draft202012Validator(jl(SCHEMA/sch)).iter_errors(data))
    check(f"registry validates: {nm}", not es, es[0].message[:100] if es else "")
check("limit IDs are unique", len({x['id'] for x in lim['limits']}) == len(lim['limits']))
check("error codes are unique", len({x['code'] for x in err['errors']}) == len(err['errors']))
check("validation rule IDs are unique", len({x['id'] for x in val['rules']}) == len(val['rules']))
limits = {x["id"]: x["value"] for x in lim["limits"]}
codes = {x["code"] for x in err["errors"]}
check("every rule's error_code exists in the catalogue", all(r["error_code"] in codes for r in val["rules"]), str([r["id"] for r in val["rules"] if r["error_code"] not in codes]))
mentioned = {m for r in val["rules"] for m in re.findall(r"LIM-[A-Z0-9-]+", r["rule"])}
check("every LIM-ID named in a rule exists", mentioned <= set(limits), str(mentioned - set(limits)))
check("error-code message keys follow the naming rule", all(e["message_key"] == (("msg." if e["family"] == "protocol" else "err.") + e["code"]) for e in err["errors"]))
check("protocol codes are lower_snake_case and others UPPER", all((e["code"] == e["code"].lower()) == (e["family"] == "protocol") for e in err["errors"]))

# 3. x-limit annotations agree with the registry
def walk(node, path, out):
    if isinstance(node, dict):
        if "x-limit" in node: out.append((path, node))
        for k, v in node.items(): walk(v, f"{path}/{k}", out)
    elif isinstance(node, list):
        for i, v in enumerate(node): walk(v, f"{path}/{i}", out)
bad = []
for p in schemas:
    found = []; walk(jl(p), p.name, found)
    for path, node in found:
        lid = node["x-limit"]
        if lid not in limits: bad.append(f"{path}: unknown {lid}"); continue
        keys = [k for k in ("maxLength", "maxItems", "maximum") if k in node]
        if not keys or node[keys[0]] != limits[lid]: bad.append(f"{path}: {lid}={limits[lid]} but schema has {[node.get(k) for k in keys]}")
check("x-limit annotations match the limits registry", not bad, "; ".join(bad))

# 4. examples
ex_bad = []
for kind, want in (("valid", True), ("invalid", False)):
    for p in sorted((SCHEMA/"examples"/kind).glob("*.json")):
        sch = jl(SCHEMA / (p.name.split(".")[0] + ".schema.json"))
        ok = not list(Draft202012Validator(sch).iter_errors(jl(p)))
        if ok != want: ex_bad.append(f"{kind}/{p.name}")
check("example documents behave as labelled", not ex_bad, ", ".join(ex_bad))

# 5. migration 0001
sql = (SCHEMA/"migrations"/"0001_initial.sql").read_text(encoding="utf-8")
con = sqlite3.connect(":memory:"); con.executescript(sql)
check("migration 0001 applies", True)
check("migration sets application_id and user_version", con.execute("PRAGMA application_id").fetchone()[0] == rv.APPLICATION_ID and con.execute("PRAGMA user_version").fetchone()[0] == 1)
objs = con.execute("SELECT type,name FROM sqlite_master").fetchall()
check("migration creates only the meta table (no triggers or views)", [o for o in objs if o[0] != "index"] == [("table", "meta")], str(objs))
check("meta table is STRICT", [r[5] for r in con.execute("PRAGMA table_list") if r[1] == "meta"] == [1])
try: con.execute("INSERT INTO meta VALUES ('k', 5)"); ok = con.execute("SELECT typeof(value) FROM meta").fetchone()[0] == "text"
except sqlite3.Error: ok = True
check("STRICT typing is enforced", ok)
con.close()

# 6. build the golden file and prove each rule can fire
PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
AID, SID, MID = "kq3m7a2xwvbd5ntf", "s1a2b3c4d5e6", "m1a2b3c4d5e6f7g8"
def make_db(extra_sql="", app_id=None, user_version=None, aid=AID):
    with tempfile.TemporaryDirectory() as td:
        p = Path(td)/"d.db"; c = sqlite3.connect(p); c.executescript(sql)
        c.execute("INSERT INTO meta VALUES ('activity_id', ?)", (aid,)); c.execute("INSERT INTO meta VALUES ('created_at','2026-10-30T00:00:00Z')"); c.commit()
        if extra_sql: c.executescript(extra_sql)
        if app_id is not None: c.execute(f"PRAGMA application_id={app_id}")
        if user_version is not None: c.execute(f"PRAGMA user_version={user_version}")
        c.commit(); c.close(); return p.read_bytes()
def dumps(o): return (json.dumps(o, indent=2, sort_keys=True) + "\n").encode("utf-8")
def base():
    manifest = {"format": "actvty", "format_version": 1, "data_schema_version": 1,
      "meta": {"activity_id": AID, "name": "Golden minimal", "created_at": "2026-10-30T00:00:00Z", "modified_at": "2026-10-30T00:00:00Z", "app_version_created": "0.0.1", "app_version_saved": "0.0.1"},
      "slides": [SID], "has_roster": False, "requires": [{"type_id": "test.placeholder", "type_version": 1}],
      "media": [{"id": MID, "ext": "png", "media_type": "image/png", "bytes": len(PNG), "sha256": hashlib.sha256(PNG).hexdigest()}]}
    theme = {"name": "Plain", "palette": {"background": "#FFFFFF", "surface": "#F2F2F2", "text": "#111111", "accent": "#1F4E9C", "positive": "#1B7F3B", "negative": "#B3261E"}, "fonts": {"heading": "system-sans", "body": "system-sans"}}
    slide = {"id": SID, "type_id": "test.placeholder", "type_version": 1, "content": {"title": "Hello", "media_id": MID}, "settings": {}, "notes": ""}
    return {"manifest.json": dumps(manifest), "theme.json": dumps(theme), "settings.json": dumps({"content_language": "en"}),
            f"slides/{SID}.json": dumps(slide), f"media/{MID}.png": PNG, "data.db": make_db()}
def write_zip(path, entries, symlink=()):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for name, b in entries:
            zi = zipfile.ZipInfo(name, date_time=(2026, 10, 30, 0, 0, 0)); zi.compress_type = zipfile.ZIP_DEFLATED
            if name in symlink: zi.external_attr = (0o120777 << 16)
            z.writestr(zi, b)
known = {"test.placeholder": {1}}
gold = ROOT/"fixtures"/"golden"/"v1-minimal.actvty"
gold.parent.mkdir(parents=True, exist_ok=True)
write_zip(gold, list(base().items()))
v, ro = rv.validate(gold, known)
check("golden v1-minimal.actvty passes every rule", v == [] and not ro, str(v))
v, ro = rv.validate(gold, {})
check("an unknown slide type opens read-only with a warning, no error", ro and all(s == "warning" for r, s, m in v) and any(r == "VAL-M-005" for r, s, m in v), str(v))

def mod(fn):
    def run():
        e = base(); fn(e); return list(e.items())
    return run
def jmod(name, f):
    def fn(e): o = json.loads(e[name]); f(o); e[name] = dumps(o)
    return mod(fn)
cases = {
 "VAL-C-002": mod(lambda e: e.update({"extra.txt": b"x"})),
 "VAL-C-003": mod(lambda e: e.update({"../evil.json": b"{}"})),
 "VAL-C-004": lambda: list(base().items()) + [("Manifest.json", b"{}")],
 "VAL-C-009": mod(lambda e: e.pop("theme.json")),
 "VAL-C-008": mod(lambda e: e.update({"media/aaaaaaaaaaaaaaaa.png": b"\0" * 5_000_000})),
 "VAL-M-001": jmod("manifest.json", lambda o: o.update({"surprise": 1})),
 "VAL-M-002": jmod("manifest.json", lambda o: o.update({"format_version": 2})),
 "VAL-M-003": jmod("manifest.json", lambda o: o.update({"slides": [SID, SID]})),
 "VAL-M-004": jmod("manifest.json", lambda o: o["media"].append(dict(o["media"][0]))),
 "VAL-M-006": jmod("manifest.json", lambda o: o.update({"requires": []})),
 "VAL-X-001": mod(lambda e: e.pop(f"slides/{SID}.json")),
 "VAL-X-002": mod(lambda e: e.update({"slides/zzzzzzzzzzzz.json": e[f"slides/{SID}.json"]})),
 "VAL-X-003": jmod(f"slides/{SID}.json", lambda o: o.update({"id": "zzzzzzzzzzzz"})),
 "VAL-X-004": jmod("manifest.json", lambda o: o.update({"has_roster": True})),
 "VAL-X-005": jmod("manifest.json", lambda o: o["media"][0].update({"sha256": "0" * 64})),
 "VAL-X-006": mod(lambda e: e.update({f"media/{MID}.png": b"\xff\xd8\xff" + PNG[3:]}) or e.update({"manifest.json": dumps({**json.loads(e["manifest.json"]), "media": [{**json.loads(e["manifest.json"])["media"][0], "sha256": hashlib.sha256(b"\xff\xd8\xff" + PNG[3:]).hexdigest(), "bytes": len(PNG)}]})})),
 "VAL-X-007": jmod(f"slides/{SID}.json", lambda o: o["content"].update({"media_id": "unknownunknown00"})),
 "VAL-X-008": jmod("theme.json", lambda o: o["palette"].update({"accent": "blue"})),
 "VAL-X-009": jmod(f"slides/{SID}.json", lambda o: o.update({"colour": "red"})),
 "VAL-D-001": mod(lambda e: e.update({"data.db": e["data.db"][:100]})),
 "VAL-D-002": mod(lambda e: e.update({"data.db": make_db(app_id=1)})),
 "VAL-D-003": mod(lambda e: e.update({"data.db": make_db(user_version=2)})),
 "VAL-D-004": mod(lambda e: e.update({"data.db": make_db(extra_sql="CREATE TRIGGER t AFTER INSERT ON meta BEGIN SELECT 1; END;")})),
 "VAL-D-006": mod(lambda e: e.update({"data.db": make_db(aid="aaaaaaaaaaaaaaaa")})),
}
for rule, build in cases.items():
    tmp = Path(tempfile.mkdtemp())/"m.actvty"; write_zip(tmp, build())
    v, _ = rv.validate(tmp, known)
    check(f"{rule} fires on a crafted bad file", any(r == rule for r, s, m in v), str(v)[:120])
# cases needing special writers or limits
tmp = Path(tempfile.mkdtemp())/"n.actvty"; tmp.write_bytes(b"this is not a zip file at all")
v, _ = rv.validate(tmp, known); check("VAL-C-001 fires on a file that is not a zip", any(r == "VAL-C-001" for r, s, m in v))
tmp = Path(tempfile.mkdtemp())/"s.actvty"; write_zip(tmp, list(base().items()) + [("media/bbbbbbbbbbbbbbbb.png", b"x")], symlink={"media/bbbbbbbbbbbbbbbb.png"})
v, _ = rv.validate(tmp, known); check("VAL-C-003 fires on a symbolic-link entry", any(r == "VAL-C-003" for r, s, m in v))
small = dict(limits); small["LIM-FILE-MAX-BYTES"] = 100
v, _ = rv.validate(gold, known, small); check("VAL-C-005 fires when the file exceeds the size limit", any(r == "VAL-C-005" for r, s, m in v))
small = dict(limits); small["LIM-FILE-MAX-ENTRIES"] = 3
v, _ = rv.validate(gold, known, small); check("VAL-C-006 fires when there are too many entries", any(r == "VAL-C-006" for r, s, m in v))
small = dict(limits); small["LIM-FILE-MAX-JSON-BYTES"] = 50
v, _ = rv.validate(gold, known, small); check("VAL-C-007 fires when an entry is too large while reading", any(r == "VAL-C-007" for r, s, m in v))
# rules not exercised by the prototype are listed explicitly
exercised = set(cases) | {"VAL-C-001", "VAL-C-003", "VAL-C-005", "VAL-C-006", "VAL-C-007", "VAL-M-005"}
not_exercised = sorted(r["id"] for r in val["rules"] if r["id"] not in exercised and r["id"] not in ("VAL-D-005", "VAL-S-001", "VAL-P-001"))
check("every stage 1 file rule is exercised except D-005, S-001 and P-001", not not_exercised, str(not_exercised))
print("NOT EXERCISED BY THE PROTOTYPE (need the real implementation): VAL-D-005 (integrity failure on a database that still opens), VAL-S-001 (save-time re-validation), VAL-P-001 (stage 7)")
failed = [n for n, ok, d in results if not ok]
print(f"\n{len(results)-len(failed)} passed, {len(failed)} failed")
sys.exit(1 if failed else 0)
