# Empório Agropecuário — website

One-page, scroll-driven website for **Empório Agropecuário**, a farm-supply store, veterinary pharmacy and pet shop in Itu-SP, Brazil, open since 2001.

As you scroll, a goat chews in time with the page. The page then tells the store's story in four chapters: livestock, veterinary pharmacy, pets, and garden & pool. It ends with the store's address, opening hours and a WhatsApp button.

> The site's copy is in Brazilian Portuguese. Code, comments and documentation are in English.

---

## Contents

- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Running locally](#running-locally)
- [Deploying](#deploying)
- [SEO](#seo)
- [Editing content](#editing-content)
- [Rebuilding media assets](#rebuilding-media-assets)
- [How the animation works](#how-the-animation-works)
- [Design inspiration](#design-inspiration)
- [Accessibility & performance](#accessibility--performance)
- [Credits](#credits)

---

## Highlights

- **Scroll-scrubbed hero.** 91 WebP frames of a goat are drawn on a `<canvas>`, so the goat chews in step with the scroll. Headlines swap on top of it, the view zooms into the goat's mouth, a green circle takes over the screen, the logo animals are drawn line by line, and the store seal is "stamped" at the end.
- **"Feed sack" visual identity.** Stitched zig-zag edges, livestock ear tags, a veterinary prescription pad, and the store details laid out like a Brazilian *Informação nutricional* label.
- **No framework, no build step.** Plain HTML, CSS and JavaScript, so any static host can serve it for free, and `index.html` even works when opened straight from disk.
- **SEO-ready.** Semantic HTML, local-business structured data, Open Graph tags, sitemap, robots file, icons and a 404 page (see [SEO](#seo)).

## Tech stack

| Layer      | Choice                                                                 |
|------------|------------------------------------------------------------------------|
| Markup     | Semantic HTML5 (`site/index.html`)                                     |
| Styles     | Plain CSS split by concern, with design tokens in custom properties    |
| Scripts    | Vanilla JavaScript: small `defer` scripts sharing a `window.Emporio` namespace, one `requestAnimationFrame` loop |
| Fonts      | Google Fonts: Big Shoulders Display, DM Serif Display, Hanken Grotesk, IBM Plex Mono, Reenie Beanie |
| Media      | WebP images; muted looping videos as WebM (VP9) with an MP4 (H.264) fallback |
| Tooling    | `ffmpeg` and Python (Pillow, NumPy, OpenCV), only to regenerate assets |

## Project structure

```
.
├── README.md
├── site/                     ← deployable website (point your host here)
│   ├── index.html            page markup, SEO meta tags and JSON-LD
│   ├── 404.html              "page not found"
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── site.webmanifest
│   ├── favicon.ico
│   ├── vercel.json           cache headers for Vercel
│   ├── _headers              cache headers for Cloudflare Pages / Netlify
│   ├── css/
│   │   ├── tokens.css        colours, fonts, spacing (edit the palette here)
│   │   ├── base.css          reset, typography utilities, reveal-on-scroll
│   │   ├── components.css    loader, header, buttons, stitches, photo frames
│   │   ├── hero.css          sticky goat stage and outro
│   │   ├── chapters.css      ticker, Campo, Farmácia, Pet, Jardim & piscina
│   │   └── contact.css       brands band, contact section, footer
│   ├── js/
│   │   ├── main.js           entry point (loaded last), boots everything, single animation loop
│   │   ├── config.js         frame count, timeline windows, tunable numbers
│   │   ├── utils.js          math and DOM helpers
│   │   ├── goat-sequence.js  frame preloading, loader, canvas renderer
│   │   ├── hero.js           hero scroll timeline
│   │   ├── scroll-effects.js ticker, ghost words, collage, parallax, brands
│   │   └── extras.js         greeting, reveal, goat cameo, pool waves, video autoplay, credit menu, header state
│   └── assets/
│       ├── frames/goat/      g001.webp … g091.webp (hero image sequence)
│       ├── video/            rooster and sparrow clips (.webm + .mp4) and their posters
│       └── img/
│           ├── photos/       chapter photos
│           ├── brands/       partner logos, background removed
│           ├── logo/         logo-seal.webp
│           ├── credit/       bruno-head.webp (footer author credit)
│           ├── icons/        favicons and app icons
│           └── og-image.jpg  social sharing preview (1200×630)
├── source/                   ← original, full-quality media (not deployed)
│   ├── videos/               goat.mp4, rooster.mp4, sparrow.mp4
│   ├── photos/               original photos
│   ├── brand-logos/          logos as received from each brand
│   ├── logo/                 official logo, transparent version, alternates
│   └── credit/               bruno-head.jpg (3D head used for the footer credit), bruno-figure.jpg
└── tools/
    ├── prepare_media.sh      regenerates frames, video clips and posters
    └── prepare_images.py     regenerates photos, brand logos, icons, og-image
```

## Running locally

Double-clicking `site/index.html` works for a quick look. To test it exactly as it will run online, serve the `site/` folder with any static server:

```bash
# Python (already installed on most machines)
cd site
python -m http.server 8080
# → http://localhost:8080

# or Node
npx serve site
```

The **Live Server** extension for VS Code also works: right-click `site/index.html` → *Open with Live Server*.

## Deploying

The site is fully static, so there is no build command. Only the `site/` folder is published.

### Vercel

1. Push the repository to GitHub.
2. In Vercel, go to **Add New → Project** and import the repository.
3. Set **Root Directory** to `site`, **Framework Preset** to *Other*, and leave the build command empty.
4. Deploy, then add the domain under **Settings → Domains**.

`site/vercel.json` sets the cache headers.

> ⚠️ Vercel's free **Hobby** plan is for personal, non-commercial use only. A store's website counts as commercial use, so it needs the **Pro** plan. The two options below have free tiers that allow commercial sites.

### Cloudflare Pages (free, commercial use allowed)

**Workers & Pages → Create → Pages → Connect to Git**. Leave the build command empty and set the build output directory to `site`. The `site/_headers` file is applied automatically.

### Netlify (free, commercial use allowed)

**Add new site → Import from Git**. Set the base directory to `site` and the publish directory to `site`, and leave the build command empty. `_headers` is applied automatically.

## SEO

### What's already in the code

| Item | Where |
|------|-------|
| Descriptive `<title>` (~60 chars) and meta description (~155 chars) | `site/index.html` `<head>` |
| Canonical URL, `lang="pt-BR"`, `robots` meta, `theme-color` | `site/index.html` |
| A real `<h1>` naming the business and its categories. It's visually hidden because the goat sequence is the visual opening | top of `<main>` |
| Logical heading hierarchy (h1 → h2 per chapter → h3) | whole page |
| All copy lives in the HTML, not injected by JavaScript, so crawlers read everything | whole page |
| Descriptive `alt` text on every photo and logo; decorative graphics use `aria-hidden` | whole page |
| **Structured data (JSON-LD)**: `Store` / `PetStore` / `GardenStore` with address, phone, e-mail, opening hours, cities served, founding date and social profiles. This is what feeds Google's local results and Maps | `<script type="application/ld+json">` in `<head>` |
| Open Graph + Twitter card with a 1200×630 image (storefront photo), for good-looking previews on WhatsApp, Facebook and LinkedIn | `<head>`, `assets/img/og-image.jpg` |
| `sitemap.xml` (with image entries) and `robots.txt` | `site/` |
| Favicons, Apple touch icon, web app manifest | `site/`, `assets/img/icons/` |
| Custom `404.html` marked `noindex` | `site/404.html` |
| Performance (a ranking factor): preloaded first frame, lazy-loaded images with explicit `width`/`height` (no layout shift), WebP everywhere, video posters, long cache headers for assets | throughout |
| Clickable `tel:`, `mailto:` and WhatsApp links | contact section |

### After launch (outside the code, but it makes the biggest difference)

1. **Google Business Profile.** Claim or update the store's profile with the same name, address and phone as the site (they must match exactly), add photos and link the website. For a local store this matters more than anything else.
2. **Google Search Console.** Verify the domain, submit `https://agroemporio.com/sitemap.xml`, and check *Enhancements* for the structured data.
3. **Test the structured data** at <https://search.google.com/test/rich-results>.
4. **Check the social profiles** listed in `sameAs` (Instagram and Facebook `@emporioagropecuarioitu`, taken from the storefront sign).
5. **Reviews.** Ask customers to review the store on Google.

### If the domain is not `agroemporio.com`

Search and replace `https://agroemporio.com` in `site/index.html`, `site/robots.txt` and `site/sitemap.xml`.

## Editing content

| I want to change… | Edit |
|-------------------|------|
| Any text on the page | `site/index.html`. Each section is marked with a comment banner. |
| Header "Disk entrega" button, phone numbers | `site/index.html` (search for `tel:`). |
| Opening hours, phone, address | The **store label** table in `index.html` **and** the JSON-LD block in `<head>`, so Google gets the same data. |
| Colours or fonts | `site/css/tokens.css` |
| Hero headlines or their timing | Text in `index.html` (`.hero__line--0` … `--4`); timing in `HERO_TIMELINE.lines` in `site/js/config.js`. |
| Animation speed, zoom amount, chew cycles | `site/js/config.js` |
| A photo | Replace the file in `source/photos/` (same name) and run `python tools/prepare_images.py`, or drop an optimised WebP directly into `site/assets/img/photos/`. |
| Add or remove a brand | Put the logo in `source/brand-logos/`, register it in `BRANDS` in `tools/prepare_images.py`, run the script, and add or remove the `<li class="brand-card">` in **both** halves of the row in `index.html` (the second half is the `aria-hidden` copy used for the infinite loop). |
| Sitemap date | `<lastmod>` in `site/sitemap.xml` after significant changes. |

**Pending:** the **Genco** logo. The brands band shows the name as text until a `source/brand-logos/genco.png` is added (download it from genco.com.br → Downloads → Logotipos).

## Rebuilding media assets

You only need this when the original media changes.

```bash
# Requirements: ffmpeg, Python 3.9+
pip install pillow numpy opencv-python pillow-avif-plugin

bash tools/prepare_media.sh      # goat frames, rooster & sparrow clips (WebM + MP4), posters
python tools/prepare_images.py   # photos, brand logos, icons, og-image
```

`prepare_images.py` prints the balanced `width`/`height` for each brand logo. Copy those values into the matching `<img>` tags in `index.html`.

## How the animation works

1. **Frames, not video.** `goat.mp4` has only two keyframes, so seeking a `<video>` while scrolling stutters. Instead, `tools/prepare_media.sh` extracts 91 WebP frames and `GoatRenderer` (`js/goat-sequence.js`) draws the right one on a canvas. On landscape screens the frame covers the stage; on phones it fills the top two-thirds and fades into green, leaving room for the text.
2. **Sticky stage.** `.hero` is 380vh tall (under 3 screens of scrolling) and its stage is `position: sticky`, so the stage stays on screen while the page scrolls past. `HeroTimeline` (`js/hero.js`) turns the section's scroll progress (0 → 1) into:
   - the frame index, ping-ponging through the sequence so the loop never jump-cuts;
   - headline fade and slide windows;
   - a zoom anchored on the goat's mouth;
   - the circular green wipe;
   - a stroke-dash drawing of the logo animals (inline SVG path);
   - the seal stamp and the closing line.

   Two small controls sit in the hero: **"assistir abertura"** plays the whole opening hands-free (the page scrolls itself for ~15 s, `INTRO_AUTOPLAY` in `config.js`; any manual scroll or touch takes over), and **"pular abertura ↓"** jumps straight to the final frame (logo + seal). On that final frame a "continue rolando" hint appears bottom-right.

   The progress is smoothed (`HERO_TIMELINE.smoothing`) so the motion stays soft even with a coarse mouse wheel.
3. **One loop.** The scripts are loaded with `defer`, in order (`config` → `utils` → `goat-sequence` → `hero` → `scroll-effects` → `extras` → `main`). Each one registers itself on `window.Emporio`. `main.js` runs a single `requestAnimationFrame` loop that updates the hero and every other scroll effect (`js/scroll-effects.js`). Keeping all layout reads and style writes in one place avoids layout thrashing.
4. **Loader.** While the frames download, the loader draws the logo animals. The drawing eases towards the download progress and always takes at least 1.6 s (`LOADER_MIN_DURATION`), so it is visible even when the frames come from the cache. The loader hides itself after the drawing completes, after 6 s in JavaScript, or after 8 s through a CSS fail-safe.
5. **Videos.** The rooster and sparrow clips autoplay muted. Because some browsers still refuse autoplay (iOS Low Power Mode, data saver), `initVideos()` in `extras.js` calls `play()` whenever a clip enters the screen, retries on the first touch or scroll, and pauses clips that are off screen.

## Design inspiration

The whole site is built to feel like a Brazilian farm-supply store (a *casa de ração*). Anyone who has walked into one will recognise the details:

- **Buttons are price tags.** The red, slightly crooked stamps are the hand-cut price tags stuck on shelves and feed bags.
- **Sections are sewn together.** The zig-zag edges and the dashed line imitate the stitched top of a feed sack, and the tall, tight condensed headlines are the lettering printed on those sacks.
- **Species are ear tags.** The animals the store serves are listed on livestock ear tags, the kind sold at the counter.
- **The pharmacy writes prescriptions.** The veterinary chapter is a prescription pad, with dosage notes in blue ballpoint.
- **The store info is a nutrition label.** Address, delivery and opening hours sit in a Brazilian *Informação nutricional* table: "Porção: 1 visita".
- **Photos hang on the counter's corkboard,** framed like prints, with handwritten notes ("o Caramelo aprovou", "Recado do balcão").
- **Brands roll by on a promo banner,** the tilted red strip you see across shop windows.
- **Colours come from the place itself.** The green is sampled from the pasture behind the goat, the red from the store's logo, and the cream from the paper of a feed sack.
- **The goat opens the story** because, in the end, that is what the store has done for 25 years: make sure every animal eats well.

The same text, in Portuguese and in Bruno's own voice, is in the footer behind the **"inspiração"** lamp.

## Accessibility & performance

- Respects `prefers-reduced-motion`: the hero shows a static frame and scroll animations are disabled.
- Content is readable without JavaScript. Reveal animations only hide elements once `html.js` is set, and the loader is removed in `<noscript>`.
- Visible keyboard focus, labelled navigation, `aria-label`s on canvases and videos, and decorative elements hidden from assistive technology.
- Off-screen canvases (goat cameo, pool waves) pause while not visible.
- Asset weight: about 5 MB of hero frames (preloaded behind the loader) and about 1 MB of video. Everything else lazy-loads.

## Credits

Design and development by **Bruno Villas Boas**. In the site footer, the head of his 3D figure opens a small menu with these links.

[LinkedIn](https://www.linkedin.com/in/bruno-villas-boas/) · [GitHub](https://github.com/brvboas)

Partner brand logos are trademarks of their respective owners and are shown to identify products sold at the store.
© Empório Agropecuário, Itu-SP. All rights reserved.
