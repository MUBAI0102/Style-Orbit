# Third-Party Notices

STYLE / ORBIT is a personal, non-commercial visualization. It is not affiliated with or endorsed by the authors of the referenced repositories.

## Three.js

- Project: [Three.js](https://threejs.org/)
- Version bundled: `0.180.0`
- License: MIT
- Included code: core Three.js and the addons `OrbitControls`, `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass` and their shader dependencies, bundled into `app.bundle.js`.
- Copyright © 2010–2026 three.js authors.

The MIT license text is available at <https://github.com/mrdoob/three.js/blob/dev/LICENSE>.

## Electron / Chromium (desktop distribution)

- Project: [Electron](https://www.electronjs.org/) `45.0.0` for Windows x64.
- License: MIT for Electron; Chromium and its dependencies carry their own licenses.
- The portable desktop distribution includes Electron's `LICENSE` and `LICENSES.chromium.html` in its application folder. These files are redistributed unmodified with the runtime.
- The desktop application's own HTML/CSS/JavaScript and local-library logic are original work for this project.

## Wibi Style — Skill data and sample imagery

- Project: [Vieeeeeee/wibi-style](https://github.com/Vieeeeeee/wibi-style)
- Author: **@威比 Hunter Wei.** (same handle on Douyin & Xiaohongshu)
- Upstream copyright notice requested by the author for publicly shared results:
  `Visual Skill by @威比 Hunter Wei.`
- License: the repository uses component-specific licensing. **Original visual Skills, prompts and sample visual content are licensed for personal, non-commercial use only.** Commercial use, resale, paid redistribution or commercial SaaS integration requires prior written permission from the author. See the upstream [`LICENSE`](https://github.com/Vieeeeeee/wibi-style/blob/main/LICENSE).
- What this page uses: the 44 installable visual-style Skill names, invocation slugs, Chinese catalogue descriptions and the public `assets/thumbs/*.jpg` sample thumbnails. The thumbnails were re-encoded to WebP and inlined to make the gallery work offline. The Skill prompts themselves are not executed by this page.
- What this page does **not** do: it does not redistribute Wibi's Skill packages, prompts or installation files; it links to each official Skill directory instead.

If you plan to use this visualization or its sample images commercially, obtain permission from the upstream author. If you share images generated with Wibi Style publicly, credit the author as requested upstream.

## Douyin creators — 31 new Skills, prompts and sample imagery

The 31 additions were collected from eight public Douyin posts supplied by the site owner. The original post and creator are linked from every affected detail page.

- [@小麦果汁AI — 6个Skill，把旅行废片变成艺术海报](https://v.douyin.com/kJMooKTeG6A/) — six travel-photo Skill examples; the video was sampled for card artwork.
- [@Cooper说 — 20个最近很火的生图skill一次分享](https://v.douyin.com/rSfO3FIvUdc/) — a curated list of 20 named image Skills and their example images.
- [@拾光少年📸 — 实景拼贴海报提示词](https://v.douyin.com/bMOpW162ons/) — Gathered Scenes Zine v1.3 prompt and examples.
- [@Starryear年 — Starryear-Artifact-Collage丨年·文物五拼](https://v.douyin.com/X3DcteAGvx0/) — museum artifact collage examples.
- [@李大埜 — 照片变成手帐记忆小工具](https://v.douyin.com/VUtCWLyaZms/) and [参数化流光艺术作品](https://v.douyin.com/GY5ppQYBz0w/) — travel memory card Skill and the parametric light prompt.
- [@尘风里 — 豆包版设计感提示词](https://v.douyin.com/zm414MxDi14/) — ink diptych prompt and supplementary gathered-scenes/surreal prompts.
- [@兔七哥 SevenEvans — 针织艺术海报 Skill](https://v.douyin.com/Vg1U2MRGZ-A/) — knitted Zine poster examples.

The images, Skill names, prompts and sample artworks remain the property of their respective creators. No separate open-source license was supplied with these posts. They are included here for **personal, non-commercial study and visualization only**, with source links and creator credit. Commercial use, resale, paid redistribution, or inclusion in a commercial product requires permission from the relevant creator. If a creator requests removal or a correction, the site owner should remove the affected entry and its images.

## GitHub Skill packages linked from the new entries

The following repositories are linked from individual details or listed as references. No code from them is bundled into `app.bundle.js`; only names, links and independently written catalogue copy are used.

- [GZ-L/photo-to-poster-skills](https://github.com/GZ-L/photo-to-poster-skills)
- [koinu32/y2k-pop-poster](https://github.com/koinu32/y2k-pop-poster)
- [liuyutian198-stack/gathered-scenes-zine-skill](https://github.com/liuyutian198-stack/gathered-scenes-zine-skill)
- [2998980-hue/surreal-pop-collage](https://github.com/2998980-hue/surreal-pop-collage)
- [carolinaaafy/travel-memory-sticker-card](https://github.com/carolinaaafy/travel-memory-sticker-card)
- [carolinaaafy/travel-memory-card-duo](https://github.com/carolinaaafy/travel-memory-card-duo)

Skills without a confirmed standalone repository link to a GitHub search for the same name on their detail pages.

## Related projects linked in the catalogue

These projects are linked for further exploration. No source code, prompts or assets from them are bundled:

- [jyi06/image-style-transfer](https://github.com/jyi06/image-style-transfer) — MIT, prompt library for art styles.
- [241428871-cell/TC-photo-skills](https://github.com/241428871-cell/TC-photo-skills) — photo art Skill collection.
- [MinusZoneAI/ComfyUI-StylizePhoto-MZ](https://github.com/MinusZoneAI/ComfyUI-StylizePhoto-MZ) — ComfyUI style-transfer node.

## Fonts and UI icons

No online fonts or icon libraries are loaded. Display, sans-serif and monospace type use the local system font stack. Icons are hand-authored inline SVG paths. The noise texture is generated at runtime from an inline SVG `feTurbulence` filter. The favicon is an inline SVG data URI.

## Design and code

The page layout, 3D set, procedural geometry, shaders, interaction system and UI written for this project are original work for this demo. No 3D model files are used; third-party photo samples are credited above and linked to their original posts.

---

If an asset has been included by mistake or a rights holder wants a change, please open an issue on the upstream project or contact the maintainer of this local demo.
