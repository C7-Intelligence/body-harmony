"""Stamp each page's 'last updated' time when its content file changes.
Hashes peptide-guide-v2/js/data/<page>.js; if the hash differs from the saved one,
the page's timestamp becomes now (US Central). Writes js/updated.js and js/updated-state.json."""
import hashlib, json, os
from datetime import datetime
from zoneinfo import ZoneInfo
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'peptide-guide-v2', 'js')
state_path = os.path.join(ROOT, 'updated-state.json')
state = json.load(open(state_path))
now = datetime.now(ZoneInfo('America/Chicago'))
stamp = f"{now.month}/{now.day}/{now.year % 100} {now:%H:%M:%S}"
changed = []
for key, info in state.items():
    data = open(os.path.join(ROOT, 'data', key + '.js'), 'rb').read().replace(b'\r', b'')
    h = hashlib.sha256(data).hexdigest()
    if h != info['hash']:
        info['hash'], info['updated'] = h, stamp
        changed.append(key)
if changed:
    json.dump(state, open(state_path, 'w'), indent=1)
    out = {k: v['updated'] for k, v in state.items()}
    open(os.path.join(ROOT, 'updated.js'), 'w').write('window.UPDATED=' + json.dumps(out, indent=1) + ';\n')
print('Updated pages:', changed or 'none')
