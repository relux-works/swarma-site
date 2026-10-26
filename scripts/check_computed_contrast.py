"""Apply the source design-system contrast contract to Chromium-resolved tokens."""
import json
import sys
from check_contrast import check, validate

try:
    palettes = json.load(sys.stdin)
    validate(palettes)
    results = check(palettes)
    failures = [result for result in results if not result[4]]
    for name, label, value, target, _ in failures:
        print(f"FAIL {name} {label} {value:.2f} (target {target})")
    print(f"pairs: {len(results)}, failures: {len(failures)}")
    sys.exit(1 if failures else 0)
except (ValueError, KeyError) as error:
    print(f"contrast-css: {error}")
    sys.exit(1)
