# ISO Lead Alerts — Catch People Already Asking for Your Services

Goal: when someone in the Treasure Valley posts "anyone know a junk hauler?" you find out
**automatically** instead of scrolling. Set these up once. Three are no-code (this file);
the fourth is the Python program (`iso_finder.py`) for Reddit + Craigslist.

Your keywords (used everywhere below):
```
junk removal, junk hauling, haul away, dump run, cleanout, furniture removal,
appliance removal, mattress removal, debris removal,
power washing, pressure washing, driveway cleaning, house washing,
dryer vent cleaning, dryer not drying,
landscaper, landscaping, yard cleanup, yard work, lawn care, mowing, mulch,
weeding, brush removal, sod
```

---

## 1. F5Bot — free Reddit keyword alerts (5 min, emails you)

The single best no-code tool. It emails you the moment your keywords appear on Reddit.

1. Go to **f5bot.com** → sign up with your email (johnspilotros@gmail.com).
2. Under **Keywords**, paste these (one per line — keep them specific so you're not buried):
   ```
   junk removal boise
   junk hauling
   haul away
   garage cleanout
   power washing boise
   pressure washing
   dryer vent
   landscaper boise
   yard cleanup
   need someone to haul
   ```
3. Save. Done. You'll get an email whenever any of these show up on Reddit.

> Tip: F5Bot matches anywhere on Reddit, so a few generic ones ("garage cleanout") catch
> Treasure Valley posts even without the city name.

---

## 2. Google Alerts — free, monitors the whole web (5 min, emails you)

1. Go to **google.com/alerts** (signed in as johnspilotros@gmail.com).
2. Create one alert per line below (paste into the box, set **How often = As-it-happens**,
   **Region = United States**):
   ```
   "junk removal" Boise
   "power washing" Boise OR Meridian OR Nampa
   "dryer vent cleaning" "Treasure Valley"
   landscaper Boise recommendation
   "looking for" hauling Boise
   ```
3. Click **Create Alert** for each.

---

## 3. Craigslist RSS — free, no login

People post one-off hire requests in Craigslist **gigs**. These feed URLs update automatically —
paste each into any free RSS reader (Feedly, Inoreader) or your browser's feed view:

```
https://boise.craigslist.org/search/lbg?format=rss
https://boise.craigslist.org/search/ggg?query=junk&format=rss
https://boise.craigslist.org/search/ggg?query=haul&format=rss
https://boise.craigslist.org/search/ggg?query=yard&format=rss
https://boise.craigslist.org/search/ggg?query=landscaping&format=rss
https://boise.craigslist.org/search/ggg?query=pressure+washing&format=rss
```
(`lbg` = labor gigs, `ggg` = all gigs. The Python program in this folder reads these for you too.)

---

## 4. Facebook & Nextdoor — can't be automated, but make it 10 seconds/day

These two have the **most** ISO posts but block all automation. Set up notifications so you
don't have to scroll:

**Facebook groups:**
1. Join 5–10 local groups: search `Boise community`, `Treasure Valley buy sell trade`,
   `Meridian Idaho`, `Nampa community`, `[your town] recommendations`.
2. On each group's page, tap the **bell / Notifications** → choose **All posts** (or
   **Highlights** if a group is very busy).
3. Each morning, glance at notifications. See an ISO post → open `LISTINGS.md` or paste it to
   me and I'll write the reply.

**Nextdoor:**
1. In Settings → **Notifications**, turn on notifications for your neighborhood + nearby.
2. Use the search bar for `junk`, `hauling`, `power wash`, `landscaper` weekly to catch older asks.

---

## When an ISO post comes in

Paste it to me and I write the reply in seconds, or grab a reply from the bank in
`PLAYBOOK.md`. Then log the lead in `customers.xlsx`. That's the whole loop.
