"""Apply the upstream contrast contract to colors resolved by Chromium."""
import json
import sys
from contrast_contract import check, forced_roles, pairs, to_rgba, validate

try:
    if sys.argv[1:] == ["--contract"]:
        print(json.dumps({"roles": forced_roles(), "pairs": [{"fg": fg, "bg": bg} for _, fg, bg, _ in pairs()]}))
        sys.exit(0)
    measured = json.load(sys.stdin)
    palettes, systems = measured["palettes"], measured["systems"]
    if len(palettes) != 16 or len(systems) != 8:
        raise ValueError("incomplete appearance matrix")
    validate(palettes)
    results = check(palettes, measured["pairs"])
    failures = [result for result in results if not result[4]]
    for name, label, value, target, _ in failures:
        print(f"FAIL {name} {label} {value:.2f} (target {target})")
    role_failures = []
    for name, system in systems.items():
        if any(to_rgba(palettes[name][token]) != to_rgba(system[role]) for token, role in forced_roles().items()):
            role_failures.append(name)
            print(f"FAIL {name} forced-color-role")
    print(f"pairs: {len(results)}, failures: {len(failures)}, forced-color failures: {len(role_failures)}")
    sys.exit(1 if failures or role_failures else 0)
except (ValueError, KeyError, TypeError):
    print("contrast-browser: invalid or incomplete computed colors")
    sys.exit(1)
