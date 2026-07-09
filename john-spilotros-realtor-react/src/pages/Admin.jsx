import { useEffect, useRef, useState } from 'react';
import { isConfigured, getClient } from '../data/supabase.js';

const EMPTY = {
  id: null, address: '', city: '', price: '', status: 'For Sale',
  beds: '', baths: '', sqft: '', lot: '', year_built: '', mls: '',
  description: '', featured: false, photos: [],
};

const STATUSES = ['Coming Soon', 'For Sale', 'Pending', 'Sold'];

const CITIES = ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Caldwell', 'Kuna', 'Star', 'Garden City', 'Middleton', 'Emmett', 'Mountain Home'];

/* Pull listing fields out of text copy-pasted from a Paragon report (or
   Zillow, a flyer, anywhere). Tolerant of many label formats; anything it
   misses can be typed in by hand. */
function parseListing(text) {
  const t = String(text || '');
  const out = {};

  let m = t.match(/list(?:ing)?\s*price\s*[:#]?\s*\$?\s*([\d,]{4,})/i) || t.match(/\$\s*([\d,]{6,})/);
  if (m) out.price = '$' + m[1].replace(/[^\d,]/g, '');

  m = t.match(/(?:bedrooms?|beds?)\s*[:#]?\s*(\d{1,2})\b/i) || t.match(/\b(\d{1,2})\s*(?:bedrooms?|beds?|bd|br)\b/i);
  if (m) out.beds = m[1];

  m = t.match(/(?:bathrooms?|baths?)\s*[:#]?\s*(\d{1,2}(?:\.\d)?)\b/i) || t.match(/\b(\d{1,2}(?:\.\d)?)\s*(?:bathrooms?|baths?|ba)\b/i);
  if (m) out.baths = m[1];

  m = t.match(/(?:apx|approx\.?|total)?\s*(?:sq\.?\s*(?:ft|feet)|sqft|square\s*feet)\s*[:#]?\s*([\d,]{3,})/i) || t.match(/([\d,]{3,})\s*(?:sq\.?\s*(?:ft|feet)|sqft|square\s*feet)/i);
  if (m) out.sqft = m[1].replace(/,/g, '');

  m = t.match(/(?:year\s*built|built)\s*[:#]?\s*((?:19|20)\d{2})/i);
  if (m) out.year_built = m[1];

  m = t.match(/([\d.]+)\s*acres?/i);
  if (m) out.lot = m[1] + ' acres';

  m = t.match(/mls\s*#?\s*[:]?\s*(\d{6,10})/i);
  if (m) out.mls = m[1];

  m = t.match(/(\d{1,6}\s+[NSEW]?\.?\s?[A-Za-z0-9.'-]+(?:\s[A-Za-z0-9.'-]+){0,4}?\s(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Way|Blvd|Boulevard|Pl|Place|Cir|Circle|Loop|Trail|Pkwy|Parkway)\b\.?)/i);
  if (m) out.address = m[1].replace(/\s+/g, ' ').trim();

  const cityRe = new RegExp('\\b(' + CITIES.join('|') + ')\\b[,\\s]*(?:ID|Idaho)?\\s*(\\d{5})?', 'i');
  m = t.match(cityRe);
  if (m) out.city = m[1] + ', ID' + (m[2] ? ' ' + m[2] : '');

  return out;
}

/* Shrink photos before upload so the site stays fast (max 1600px, JPEG). */
function downscale(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob || file); }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function SetupHelp() {
  return (
    <section className="section">
      <div className="wrap admin-wrap">
        <p className="kicker">Admin</p>
        <h1>One-time setup needed</h1>
        <p>The listings database isn't connected yet. Three steps (about 5 minutes):</p>
        <ol className="admin-steps">
          <li>Create a free account at <strong>supabase.com</strong> and make a new project.</li>
          <li>In the project, open <strong>Project Settings &rarr; API</strong> and copy the <strong>URL</strong> and <strong>anon public key</strong>.</li>
          <li>Send both values to Claude &mdash; the database tables, photo storage, and your login get wired up from there.</li>
        </ol>
      </div>
    </section>
  );
}

export default function Admin() {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isConfigured()) return;
    let unsub = null;
    getClient().then((c) => {
      setClient(c);
      c.auth.getSession().then(({ data }) => setSession(data.session));
      const { data } = c.auth.onAuthStateChange((_e, s) => setSession(s));
      unsub = data.subscription;
    });
    return () => unsub?.unsubscribe();
  }, []);

  useEffect(() => {
    if (client && session) loadListings();
  }, [client, session]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadListings() {
    const { data, error } = await client.from('listings').select('*').order('created_at', { ascending: false });
    if (!error) setItems(data || []);
  }

  async function signIn(e) {
    e.preventDefault();
    setAuthErr('');
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) setAuthErr(error.message);
  }

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function autofill() {
    const found = parseListing(paste);
    if (!Object.keys(found).length) { setNote('Could not find listing details in that text - fill the fields in by hand.'); return; }
    setForm((f) => ({ ...f, ...found }));
    setNote('Filled in: ' + Object.keys(found).join(', ') + '. Check the fields, add photos, then save.');
  }

  async function addPhotos(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setBusy(true);
    setNote('Uploading ' + files.length + ' photo' + (files.length > 1 ? 's' : '') + '...');
    try {
      const urls = [];
      for (const f of files) {
        const blob = await downscale(f);
        const path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
        const { error } = await client.storage.from('listing-photos').upload(path, blob, { contentType: 'image/jpeg' });
        if (error) throw error;
        const { data } = client.storage.from('listing-photos').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setForm((f) => ({ ...f, photos: [...f.photos, ...urls] }));
      setNote('Photos uploaded.');
    } catch (err) {
      setNote('Photo upload failed: ' + err.message);
    }
    setBusy(false);
  }

  function removePhoto(url) {
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p !== url) }));
  }

  async function save(e) {
    e.preventDefault();
    if (!form.address && !form.price) { setNote('Give the listing at least an address or a price.'); return; }
    setBusy(true);
    const row = { ...form };
    delete row.id;
    const q = form.id
      ? client.from('listings').update(row).eq('id', form.id)
      : client.from('listings').insert(row);
    const { error } = await q;
    setBusy(false);
    if (error) { setNote('Save failed: ' + error.message); return; }
    setForm(EMPTY);
    setPaste('');
    setNote(form.id ? 'Listing updated - live on the site now.' : 'Listing published - live on the site now.');
    loadListings();
  }

  async function remove(item) {
    if (!window.confirm('Delete ' + (item.address || 'this listing') + '? This cannot be undone.')) return;
    const { error } = await client.from('listings').delete().eq('id', item.id);
    if (!error) { setNote('Deleted.'); loadListings(); }
  }

  function edit(item) {
    setForm({ ...EMPTY, ...item, photos: item.photos || [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!isConfigured()) return <SetupHelp />;
  if (!client) return <section className="section"><div className="wrap admin-wrap"><p>Loading&hellip;</p></div></section>;

  if (!session) {
    return (
      <section className="section">
        <div className="wrap admin-wrap admin-login">
          <p className="kicker">Admin</p>
          <h1>Sign in</h1>
          <form onSubmit={signIn}>
            <label className="flabel">Email
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </label>
            <label className="flabel">Password
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </label>
            {authErr && <p className="admin-err" role="alert">{authErr}</p>}
            <button className="btn btn-gold" type="submit">Sign in</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="wrap admin-wrap">
        <div className="admin-top">
          <div>
            <p className="kicker">Admin</p>
            <h1>{form.id ? 'Edit listing' : 'Add a listing'}</h1>
          </div>
          <button className="btn btn-line" type="button" onClick={() => client.auth.signOut()}>Sign out</button>
        </div>

        <div className="admin-paste">
          <label className="flabel" htmlFor="paste-box"><strong>Fast fill:</strong> in Paragon open the listing, select everything (Ctrl+A), copy (Ctrl+C), paste below, then hit the button.</label>
          <textarea className="textarea" id="paste-box" rows={4} placeholder="Paste the listing text here..." value={paste} onChange={(e) => setPaste(e.target.value)} />
          <button className="btn btn-line" type="button" onClick={autofill} disabled={!paste.trim()}>Auto-fill from pasted text</button>
        </div>

        <form className="admin-form" onSubmit={save}>
          <div className="admin-grid">
            <label className="flabel span2">Address
              <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="1234 W Example St" />
            </label>
            <label className="flabel">City
              <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Boise, ID 83702" />
            </label>
            <label className="flabel">Price
              <input className="input" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="$450,000" />
            </label>
            <label className="flabel">Status
              <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label className="flabel">Beds
              <input className="input" value={form.beds} onChange={(e) => set('beds', e.target.value)} inputMode="numeric" />
            </label>
            <label className="flabel">Baths
              <input className="input" value={form.baths} onChange={(e) => set('baths', e.target.value)} inputMode="decimal" />
            </label>
            <label className="flabel">Sq Ft
              <input className="input" value={form.sqft} onChange={(e) => set('sqft', e.target.value)} inputMode="numeric" />
            </label>
            <label className="flabel">Lot
              <input className="input" value={form.lot} onChange={(e) => set('lot', e.target.value)} placeholder="0.25 acres" />
            </label>
            <label className="flabel">Year built
              <input className="input" value={form.year_built} onChange={(e) => set('year_built', e.target.value)} inputMode="numeric" />
            </label>
            <label className="flabel">MLS #
              <input className="input" value={form.mls} onChange={(e) => set('mls', e.target.value)} inputMode="numeric" />
            </label>
            <label className="flabel span2 admin-check">
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured (shows first)
            </label>
            <label className="flabel span3">Description
              <textarea className="textarea" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Public remarks / your own description" />
            </label>
          </div>

          <div
            className="admin-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files); }}
          >
            <p>Drag photos here, or</p>
            <button className="btn btn-line" type="button" onClick={() => fileRef.current?.click()}>Choose photos</button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
            {form.photos.length > 0 && (
              <div className="admin-thumbs">
                {form.photos.map((p) => (
                  <div key={p} className="admin-thumb">
                    <img src={p} alt="" />
                    <button type="button" aria-label="Remove photo" onClick={() => removePhoto(p)}>&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {note && <p className="admin-note" role="status">{note}</p>}

          <div className="admin-actions">
            <button className="btn btn-gold" type="submit" disabled={busy}>{form.id ? 'Save changes' : 'Publish listing'}</button>
            {form.id && <button className="btn btn-line" type="button" onClick={() => { setForm(EMPTY); setNote(''); }}>Cancel edit</button>}
          </div>
        </form>

        <h2 className="admin-h2">Your listings ({items.length})</h2>
        <div className="admin-list">
          {items.map((it) => (
            <div key={it.id} className="admin-row">
              {(it.photos && it.photos[0]) ? <img src={it.photos[0]} alt="" /> : <div className="admin-row-noimg" />}
              <div className="admin-row-body">
                <strong>{it.address || '(no address)'}</strong>
                <span>{[it.price, it.status, it.city].filter(Boolean).join(' · ')}</span>
              </div>
              <div className="admin-row-actions">
                <button className="btn btn-line" type="button" onClick={() => edit(it)}>Edit</button>
                <button className="btn btn-line admin-danger" type="button" onClick={() => remove(it)}>Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p>No listings yet - publish your first one above.</p>}
        </div>
      </div>
    </section>
  );
}
