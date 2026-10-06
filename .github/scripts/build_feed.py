"""Pull regulatory news from RSS/Atom feeds and the Federal Register API into body-harmony/js/feed.js.
Runs on a schedule in GitHub Actions (see update-feed.yml). Standard library only.
Each source is optional: a failing source is recorded in the status list and its older items are kept."""
import json, os, re, html, sys, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'body-harmony')
CFG_NAME = sys.argv[1] if len(sys.argv) > 1 else 'feed-sources.json'
OUT_NAME = sys.argv[2] if len(sys.argv) > 2 else 'feed.js'
VAR = sys.argv[3] if len(sys.argv) > 3 else 'FEED'
CFG = json.load(open(os.path.join(ROOT, CFG_NAME)))
OUT = os.path.join(ROOT, 'js', OUT_NAME)
UA = {'User-Agent': 'BodyHarmonyFeed/1.0 (+https://github.com/C7-Intelligence/body-harmony)'}
KW = [k.lower() for k in CFG['keywords']]
NOW = datetime.now(timezone.utc)

def get(url, timeout=25):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def clean(s, n=280):
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))
    s = re.sub(r'\s+', ' ', s).strip()
    return s if len(s) <= n else s[:n].rsplit(' ', 1)[0] + '…'

def parse_date(s):
    if not s: return None
    s = s.strip()
    try: d = parsedate_to_datetime(s)
    except Exception:
        try: d = datetime.fromisoformat(s.replace('Z', '+00:00'))
        except Exception: return None
    if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)

def tag(e): return e.tag.split('}')[-1]

def parse_feed(data):
    root = ET.fromstring(data)
    items = []
    for it in root.iter():
        if tag(it) not in ('item', 'entry'): continue
        f = {}
        for c in it:
            t = tag(c)
            if t == 'link':
                f['link'] = c.get('href') or (c.text or '').strip()
            elif t in ('title', 'description', 'summary', 'pubDate', 'published', 'updated', 'date', 'content'):
                if (c.text or '').strip(): f.setdefault(t, c.text.strip())
        d = parse_date(f.get('pubDate') or f.get('published') or f.get('updated') or f.get('date'))
        items.append({'t': clean(f.get('title'), 200), 'l': f.get('link', ''), 'd': d,
                      'x': clean(f.get('description') or f.get('summary') or f.get('content'))})
    return items

def relevant(it, kws=None):
    blob = (it['t'] + ' ' + it['x']).lower()
    return any(k in blob for k in (kws or KW))

def fetch_rss(src):
    urls = src.get('urls') or [src['url']]
    out = []
    for u in urls:
        out += parse_feed(get(u))
    if src.get('filter', True):
        out = [i for i in out if relevant(i)]
    return out

def fetch_epmc(src):
    out = []
    for q in src['queries']:
        params = {'query': q, 'format': 'json', 'sort': 'P_PDATE_D desc', 'pageSize': str(src.get('pageSize', 10)), 'resultType': 'lite'}
        data = json.loads(get('https://www.ebi.ac.uk/europepmc/webservices/rest/search?' + urllib.parse.urlencode(params)))
        for r in data.get('resultList', {}).get('result', []):
            link = ('https://doi.org/' + r['doi']) if r.get('doi') else 'https://europepmc.org/article/%s/%s' % (r.get('source', 'MED'), r.get('id', ''))
            out.append({'t': clean(r.get('title'), 200), 'l': link, 'd': parse_date(r.get('firstPublicationDate') or r.get('pubYear')),
                        'x': clean((r.get('journalTitle') or '') + (' · ' + r.get('authorString', '') if r.get('authorString') else ''))})
    return out

def fetch_fr(src):
    out = []
    for q in src['queries']:
        params = [('conditions[term]', q), ('order', 'newest'), ('per_page', '10')]
        for a in src.get('agencies', []): params.append(('conditions[agencies][]', a))
        data = json.loads(get('https://www.federalregister.gov/api/v1/documents.json?' + urllib.parse.urlencode(params)))
        for r in data.get('results', []):
            out.append({'t': clean(r.get('title'), 200), 'l': r.get('html_url', ''), 'd': parse_date(r.get('publication_date')),
                        'x': clean(r.get('abstract') or (r.get('type', '') + ' · ' + ', '.join(a.get('name', '') for a in r.get('agencies', []))))})
    if src.get('require'):
        out = [i for i in out if relevant(i, [k.lower() for k in src['require']])]
    return out

# load previous
old = {'items': [], 'sources': []}
if os.path.exists(OUT):
    txt = open(OUT, encoding='utf-8').read()
    try: old = json.loads(txt[txt.index('=') + 1:].strip().rstrip(';'))
    except Exception: pass
items = {i['l']: i for i in old['items'] if i.get('l')}
# re-apply current filters to items kept from earlier runs
_src = {x['id']: x for x in CFG['sources']}
def _keep(i):
    x = _src.get(i.get('s'))
    if not i.get('t'): return False
    if not x: return True
    it = {'t': i['t'], 'x': i.get('x', '')}
    if x.get('require') and not relevant(it, [k.lower() for k in x['require']]): return False
    if x['type'] == 'rss' and x.get('filter', True) and not relevant(it): return False
    if x['type'] == 'manual': return True
    return True
items = {k: v for k, v in items.items() if _keep(v)}
status = []
for src in CFG['sources']:
    st = {'id': src['id'], 'name': src['name'], 'home': src.get('home', ''), 'type': src['type'], 'checked': NOW.strftime('%Y-%m-%dT%H:%MZ')}
    try:
        got = fetch_fr(src) if src['type'] == 'fr_api' else fetch_epmc(src) if src['type'] == 'epmc' else fetch_rss(src)
        n = 0
        for g in got:
            if not g['l']: continue
            rec = {'t': g['t'], 'l': g['l'], 'd': (g['d'] or NOW).strftime('%Y-%m-%d'), 's': src['id'], 'x': g['x']}
            if g['l'] not in items: n += 1
            if g['l'] in items and items[g['l']].get('p'): rec['p'] = items[g['l']]['p']
            items[g['l']] = rec
        st.update(ok=True, new=n, seen=len(got))
    except Exception as e:
        prev = next((s for s in old.get('sources', []) if s['id'] == src['id']), {})
        st.update(ok=False, error=str(e)[:120], new=0, seen=0)
        if prev.get('lastOk'): st['lastOk'] = prev['lastOk']
    if st['ok']: st['lastOk'] = st['checked']
    status.append(st)
cut = (NOW - timedelta(days=CFG.get('keepDays', 365))).strftime('%Y-%m-%d')
caps = {x['id']: x.get('maxItems', CFG.get('perSource', 30)) for x in CFG['sources']}
count = {}
final = []
for i in sorted((i for i in items.values() if i['d'] >= cut), key=lambda i: i['d'], reverse=True):
    if count.get(i['s'], 0) >= caps.get(i['s'], 30): continue
    count[i['s']] = count.get(i['s'], 0) + 1
    final.append(i)
final = final[:CFG.get('maxItems', 150)]
out = {'generated': NOW.strftime('%Y-%m-%dT%H:%MZ'), 'sources': status, 'items': final}
open(OUT, 'w', encoding='utf-8').write('window.' + VAR + '=' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print('sources ok:', [s['id'] for s in status if s['ok']], 'failed:', [s['id'] for s in status if not s['ok']], 'items:', len(final))
