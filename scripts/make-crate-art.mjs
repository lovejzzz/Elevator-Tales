// Writes the four big-box faces (public/assets/riders/crate-*.svg). Run: node scripts/make-crate-art.mjs
//
// A crate card spans two seats, so it is tall and its shape changes with the screen (about 1:2.4 to 1:4.3). The old art
// was a 512px square painting shown at up to five times its size. These are vector faces that fit any card:
// the root has no viewBox (it takes the card's size), and the drawing sits in two nested viewports 100 units wide —
// one pinned to the top (lid, bow, tag, pattern) and one pinned to the bottom (lower corners). Whatever the height,
// the box simply gets longer in the middle.
import { writeFileSync } from 'node:fs';

const TOP = 15, FRONT = 23, SIDE = 86, LONG = 1200; // lid back edge, lid front edge, where the side face starts
const out = (name, svg) => { writeFileSync(new URL(`../public/assets/riders/crate-${name}.svg`, import.meta.url), svg.replace(/\n\s*\n/g, '\n')); console.log('wrote crate-' + name + '.svg', svg.length, 'bytes'); };

const frame = ({ backdrop, defs, top, bottom, light = '' }) => `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
<defs>
<linearGradient id="fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2cf" stop-opacity=".16"/><stop offset=".3" stop-color="#fff2cf" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>
<linearGradient id="beam" x1="0" y1="0" x2="1" y2=".45"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="tagpaper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6ecd2"/><stop offset=".6" stop-color="#e6d6ad"/><stop offset="1" stop-color="#c9b684"/></linearGradient>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>
${defs}
</defs>
<rect width="100%" height="100%" fill="${backdrop}"/>
<svg width="100%" height="100%" viewBox="0 0 100 ${LONG}" preserveAspectRatio="xMidYMin slice">${top}</svg>
<svg width="100%" height="100%" viewBox="0 0 100 ${LONG}" preserveAspectRatio="xMidYMax slice">${bottom}</svg>
<rect width="100%" height="100%" fill="url(#fall)"/>
<rect width="100%" height="100%" fill="url(#beam)"/>
${light}
</svg>
`;

/** The three visible faces of the box. */
const faces = (front, side, lid, edge) => `
<path d="M0 ${FRONT} L${SIDE} ${FRONT} L100 ${TOP} L14 ${TOP} Z" fill="${lid}"/>
<path d="M${SIDE} ${FRONT} L100 ${TOP} L100 ${LONG} L${SIDE} ${LONG} Z" fill="${side}"/>
<rect x="0" y="${FRONT}" width="${SIDE}" height="${LONG}" fill="${front}"/>
<path d="M0 ${FRONT} L${SIDE} ${FRONT} L100 ${TOP}" fill="none" stroke="${edge}" stroke-width=".7" stroke-linejoin="round" opacity=".8"/>
<path d="M${SIDE} ${FRONT} L${SIDE} ${LONG}" stroke="#000" stroke-width=".8" opacity=".28"/>
<rect x="0" y="${FRONT}" width="3.5" height="${LONG}" fill="#000" opacity=".16"/>`;

/** Fine grain so flat faces read as paper, cloth or lacquer rather than a flat fill. */
const grain = (id, freq, rgb, gain, bias, seed = 7) => `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}"/><feColorMatrix type="matrix" values="0 0 0 0 ${rgb[0]}  0 0 0 0 ${rgb[1]}  0 0 0 0 ${rgb[2]}  ${gain} 0 0 0 ${bias}"/></filter>`;
const grained = (id, h = 520) => `<rect x="0" y="${TOP}" width="100" height="${h}" filter="url(#${id})"/>`;

/** A metal corner protector on the front face: (x, y) is the corner, dx / dy point into the face. */
const corner = (x, y, dx, dy, fill, s = 13) => `
<path d="M${x} ${y} L${x + dx * s} ${y} L${x} ${y + dy * s} Z" fill="${fill}" stroke="#000" stroke-opacity=".35" stroke-width=".4" stroke-linejoin="round"/>
<path d="M${x + dx * 1.2} ${y + dy * 1.2} L${x + dx * (s - 3.4)} ${y + dy * 1.2}" stroke="#fff" stroke-opacity=".55" stroke-width=".7" stroke-linecap="round"/>
<circle cx="${x + dx * 3.6}" cy="${y + dy * 3.6}" r="1" fill="#000" opacity=".35"/><circle cx="${x + dx * 3.4}" cy="${y + dy * 3.4}" r=".8" fill="#fff" opacity=".5"/>`;
const corners = (fill, y) => corner(0, y, 1, y === FRONT ? 1 : -1, fill) + corner(SIDE, y, -1, y === FRONT ? 1 : -1, fill);

/** A luggage tag hanging from (x, y), turned by `turn` degrees; `seal` adds a wax seal. */
const tag = (x, y, turn, { seal = '', ring = '#b8892f', paper = 'url(#tagpaper)' } = {}) => `
<g transform="translate(${x} ${y}) rotate(${turn})">
<path d="M-4.5 -4 L4.5 -4 L9.5 2.5 L9.5 38 L-9.5 38 L-9.5 2.5 Z" transform="translate(1.6 2.2)" fill="#000" opacity=".34" filter="url(#soft)"/>
<path d="M-4.5 -4 L4.5 -4 L9.5 2.5 L9.5 38 L-9.5 38 L-9.5 2.5 Z" fill="${paper}" stroke="#8c7748" stroke-width=".5" stroke-linejoin="round"/>
<path d="M-7 12 H7 M-7 17 H7 M-7 22 H3" stroke="#8c7748" stroke-width=".45" opacity="${seal ? 0 : .5}"/>
<circle r="2.5" fill="none" stroke="${ring}" stroke-width="1.1"/><circle r="1.5" fill="#1a130a"/>
${seal}
</g>`;
const wax = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#wax)" stroke="#5e0a0d" stroke-width=".5"/><circle cx="${cx}" cy="${cy}" r="${r * .62}" fill="none" stroke="#5e0a0d" stroke-width=".5" opacity=".7"/><ellipse cx="${cx - r * .3}" cy="${cy - r * .38}" rx="${r * .42}" ry="${r * .22}" fill="#fff" opacity=".35"/>`;
const waxDef = `<radialGradient id="wax" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#e8483f"/><stop offset=".55" stop-color="#b3161c"/><stop offset="1" stop-color="#7a0b10"/></radialGradient>`;

/** Twisted cord along a path. */
const cord = (d, w = 2.2, c = ['#5f4420', '#b08a4f', '#ead4a3']) => `
<path d="${d}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="${w + 1}" stroke-linecap="round" transform="translate(.9 .6)"/>
<path d="${d}" fill="none" stroke="${c[0]}" stroke-width="${w}" stroke-linecap="round"/>
<path d="${d}" fill="none" stroke="${c[1]}" stroke-width="${w * .64}" stroke-linecap="round"/>
<path d="${d}" fill="none" stroke="${c[2]}" stroke-width="${w * .62}" stroke-dasharray="1.1 1.8" opacity=".85"/>`;

/** A ribbon bow tied at (x, y): two loops, two tails and the knot. `g` is the ribbon gradient id, `dark` its shadow colour. */
const bow = (x, y, g, dark, s = 1) => `
<g transform="translate(${x} ${y}) scale(${s})">
<path d="M-2 2 C-9 8 -15 12 -19 21 L-13 19 L-11 25 C-8 16 -4 9 1 4 Z" fill="url(#${g})" stroke="${dark}" stroke-width=".4"/>
<path d="M2 2 C8 8 12 14 14 23 L9 20 L6 26 C5 17 2 10 -1 4 Z" fill="url(#${g})" stroke="${dark}" stroke-width=".4"/>
<path d="M0 0 C-5 -15 -27 -17 -25 -5 C-24 3 -9 3 0 0 Z" fill="url(#${g})" stroke="${dark}" stroke-width=".5"/>
<path d="M0 0 C-6 -8 -17 -10 -19 -5 C-18 -1 -8 0 0 0 Z" fill="${dark}" opacity=".55"/>
<path d="M0 0 C5 -15 27 -17 25 -5 C24 3 9 3 0 0 Z" fill="url(#${g})" stroke="${dark}" stroke-width=".5"/>
<path d="M0 0 C6 -8 17 -10 19 -5 C18 -1 8 0 0 0 Z" fill="${dark}" opacity=".55"/>
<path d="M-23 -7 C-19 -13 -8 -11 -2 -3" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".8" stroke-linecap="round"/>
<path d="M23 -7 C19 -13 8 -11 2 -3" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".8" stroke-linecap="round"/>
<rect x="-4" y="-4.5" width="8" height="8.5" rx="2.4" fill="url(#${g})" stroke="${dark}" stroke-width=".5"/>
<path d="M-2 -3 V2.5" stroke="#fff" stroke-opacity=".45" stroke-width=".8" stroke-linecap="round"/>
</g>`;
/** A ribbon band down the front and over the lid. */
const band = (x, w, g, dark) => `
<path d="M${x} ${FRONT} L${x + w} ${FRONT} L${x + w + 8} ${TOP} L${x + 8} ${TOP} Z" fill="url(#${g})" opacity=".92"/>
<rect x="${x}" y="${FRONT}" width="${w}" height="${LONG}" fill="url(#${g})"/>
<path d="M${x} ${FRONT} V${LONG} M${x + w} ${FRONT} V${LONG}" stroke="${dark}" stroke-width=".45" opacity=".7"/>
<rect x="${x + w}" y="${FRONT}" width="2.2" height="${LONG}" fill="#000" opacity=".22"/>`;

// ---- Common: kraft paper, twine, a tag with a wax seal, brass corners -------------------------------------------
{
  const twine = `M40 ${LONG} L40 ${FRONT}`;
  out('common', frame({
    backdrop: '#0b2a22',
    defs: `${waxDef}
<linearGradient id="kraft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a97c43"/><stop offset=".22" stop-color="#cfa262"/><stop offset=".55" stop-color="#d8ae6f"/><stop offset="1" stop-color="#b98c4f"/></linearGradient>
<linearGradient id="kraftSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f6836"/><stop offset="1" stop-color="#6e4f27"/></linearGradient>
<linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc93"/><stop offset=".5" stop-color="#cfa040"/><stop offset="1" stop-color="#8f6a20"/></linearGradient>
${grain('fibre', '1.7 0.9', [.3, .19, .07], .75, -.33)}${grain('blotch', '0.03 0.018', [.25, .15, .05], .7, -.3, 3)}`,
    top: `${faces('url(#kraft)', 'url(#kraftSide)', '#e2bd82', '#f3d9a6')}
${grained('blotch')}${grained('fibre')}
<path d="M0 ${FRONT + 46} H${SIDE}" stroke="#7d5a2c" stroke-width=".5" opacity=".35"/>
${cord(twine, 2.6)}${cord(`M40 ${FRONT} L47.5 ${TOP}`, 2.3)}
${corners('url(#brass)', FRONT)}
${cord(`M40 ${FRONT + 1} C34 ${FRONT + 9} 30 ${FRONT + 13} 33 ${FRONT + 19} C36 ${FRONT + 23} 41 ${FRONT + 14} 40 ${FRONT + 2}`, 1.7)}
${cord(`M40 ${FRONT + 1} C46 ${FRONT + 5} 50 ${FRONT + 12} 53 ${FRONT + 22}`, 1.5)}
<ellipse cx="40" cy="${FRONT + 1.5}" rx="3.1" ry="2.5" fill="#b08a4f" stroke="#5f4420" stroke-width=".6"/>
${tag(55, FRONT + 26, 14, { seal: wax(0, 13, 6) })}`,
    bottom: corners('url(#brass)', LONG),
  }));
}

// ---- Rare: navy wrap, a champagne ribbon and bow, a plain tag, pale gold corners -------------------------------
{
  out('rare', frame({
    backdrop: '#0b2a22',
    defs: `
<linearGradient id="navy" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#142a61"/><stop offset=".3" stop-color="#21438d"/><stop offset=".6" stop-color="#1b387b"/><stop offset="1" stop-color="#12265a"/></linearGradient>
<linearGradient id="navySide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0f2152"/><stop offset="1" stop-color="#0a1739"/></linearGradient>
<linearGradient id="satin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9c8b58"/><stop offset=".28" stop-color="#e9ddb0"/><stop offset=".5" stop-color="#f7efd0"/><stop offset=".75" stop-color="#cdbd87"/><stop offset="1" stop-color="#8f7d4b"/></linearGradient>
<linearGradient id="pale" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ecc9"/><stop offset=".5" stop-color="#c9b77c"/><stop offset="1" stop-color="#857341"/></linearGradient>
${grain('weave', '1.1 1.1', [.02, .04, .14], 1.6, -.66)}${grain('brush', '2.2 0.02', [.3, .26, .12], 1.4, -.6, 5)}`,
    top: `${faces('url(#navy)', 'url(#navySide)', '#2c4f9d', '#6f8fd6')}
${grained('weave')}
${band(31, 13, 'satin', '#6f6033')}
<rect x="31" y="${FRONT}" width="13" height="520" filter="url(#brush)" opacity=".7"/>
${corners('url(#pale)', FRONT)}
${cord(`M39 ${FRONT - 1} C50 ${FRONT + 2} 56 ${FRONT + 8} 59 ${FRONT + 15}`, 1, ['#6f6033', '#cdbd87', '#f7efd0'])}
${tag(60, FRONT + 18, -16, { ring: '#c9b77c' })}
${bow(38.5, FRONT - 1, 'satin', '#6f6033')}`,
    bottom: corners('url(#pale)', LONG),
  }));
}

// ---- Legendary: black lacquer, a gold sunburst, a red ribbon and bow, a gold tag --------------------------------
{
  const cx = 35, cy = 205; // the sun
  const rays = [-78, -64, -50, -37, -24, -12, 0, 12, 24, 37, 50, 64, 78].map((a, i) => {
    const r = a * Math.PI / 180, w = (i % 2 ? 2.2 : 4.2) * Math.PI / 180, len = 260;
    const p = (ang, d) => `${(cx + Math.sin(ang) * d).toFixed(1)} ${(cy - Math.cos(ang) * d).toFixed(1)}`;
    return `<path d="M${p(r - w * .25, 20)} L${p(r - w, len)} L${p(r + w, len)} L${p(r + w * .25, 20)} Z"/>`;
  }).join('');
  const columns = [8, 14, 20, 50, 71, 77].map((x, i) => `<rect x="${x}" y="${cy + 26 + (i % 4) * 9}" width="${i % 2 ? 2.4 : 3.6}" height="${LONG}"/>`).join('');
  const spark = (x, y, s) => `<path d="M${x} ${y - s} L${x + s * .22} ${y - s * .22} L${x + s} ${y} L${x + s * .22} ${y + s * .22} L${x} ${y + s} L${x - s * .22} ${y + s * .22} L${x - s} ${y} L${x - s * .22} ${y - s * .22} Z" fill="#fff6d0"/>`;
  out('legendary', frame({
    backdrop: '#0b2a22',
    defs: `
<linearGradient id="lacquer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#17140e"/><stop offset=".4" stop-color="#26211a"/><stop offset="1" stop-color="#15120d"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe38e"/><stop offset=".45" stop-color="#e2b23c"/><stop offset="1" stop-color="#a87a1c"/></linearGradient>
<linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98a22"/><stop offset=".5" stop-color="#f6d977"/><stop offset="1" stop-color="#c9992b"/></linearGradient>
<linearGradient id="red" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d0f14"/><stop offset=".3" stop-color="#d4322f"/><stop offset=".55" stop-color="#e9544a"/><stop offset="1" stop-color="#8a1217"/></linearGradient>
<linearGradient id="goldtag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbeab0"/><stop offset=".6" stop-color="#e6c468"/><stop offset="1" stop-color="#b98f33"/></linearGradient>
<clipPath id="front"><rect x="4.5" y="${FRONT + 4.5}" width="${SIDE - 9}" height="${LONG}"/></clipPath>
${grain('foil', '1.6 0.5', [1, .93, .7], 1.1, -.72)}`,
    top: `${faces('url(#lacquer)', '#0f0d09', '#3a2f1c', '#f6d977')}
<g clip-path="url(#front)" fill="url(#goldV)">${rays}${columns}
<path d="M${cx - 21} ${cy} A21 21 0 0 1 ${cx + 21} ${cy} Z" fill="url(#gold)"/>
<path d="M4.5 ${cy} H${SIDE - 4.5}" stroke="url(#gold)" stroke-width="1.6"/>
<path d="M4.5 ${cy + 5} H${SIDE - 4.5} M4.5 ${cy + 9} H${SIDE - 4.5}" stroke="url(#gold)" stroke-width=".7" opacity=".8"/>
<path d="M${cx - 12} ${cy + 9} V${LONG} M${cx + 12} ${cy + 9} V${LONG}" stroke="url(#gold)" stroke-width="1.4"/>
</g>
<rect x="2.6" y="${FRONT + 2.6}" width="${SIDE - 5.2}" height="${LONG}" fill="none" stroke="url(#gold)" stroke-width="1.5"/>
<rect x="5.6" y="${FRONT + 5.6}" width="${SIDE - 11.2}" height="${LONG}" fill="none" stroke="#f6d977" stroke-width=".5" opacity=".8"/>
<path d="M${SIDE + 3} ${FRONT + 1} V${LONG} M${SIDE + 8.5} ${FRONT - 2.4} V${LONG}" stroke="#e2b23c" stroke-width=".9" opacity=".75"/>
<path d="M6 ${FRONT - 1.6} L${SIDE - 1} ${FRONT - 1.6} L97 ${TOP + 1.6} L17 ${TOP + 1.6} Z" fill="none" stroke="#f6d977" stroke-width=".6" opacity=".8"/>
<rect x="0" y="${FRONT}" width="${SIDE}" height="520" filter="url(#foil)" opacity=".5"/>
${band(57, 9, 'red', '#5e0a0d')}
${cord(`M61.5 ${FRONT - 1} C67 ${FRONT + 1} 71 ${FRONT + 5} 72.5 ${FRONT + 11}`, 1, ['#8f6a20', '#e2b23c', '#fbe38e'])}
${tag(73.5, FRONT + 14, -16, { paper: 'url(#goldtag)', ring: '#8f6a20' })}
${bow(61.5, FRONT - 1, 'red', '#5e0a0d', 1.05)}
${spark(9, FRONT + 9, 3.2)}${spark(SIDE - 6, FRONT + 60, 2.4)}${spark(14, cy - 44, 2)}${spark(97, TOP + 22, 2.2)}`,
    bottom: `<rect x="2.6" y="${LONG - 4}" width="${SIDE - 5.2}" height="1.5" fill="url(#gold)"/><rect x="5.6" y="${LONG - 7}" width="${SIDE - 11.2}" height=".5" fill="#f6d977" opacity=".8"/>${spark(8, LONG - 12, 2.6)}`,
  }));
}

// ---- Contraband: a black crate in chains, a red seal, light leaking from under the lid --------------------------
{
  const seam = FRONT + 34, cross = FRONT + 118;
  const scallop = (x, y, r, R, n = 12) => { const p = (a, d) => `${(x + Math.cos(a) * d).toFixed(1)} ${(y + Math.sin(a) * d).toFixed(1)}`; let d = `M${p(0, r)}`; for (let i = 0; i < n; i++) d += ` Q${p((i + .5) * 2 * Math.PI / n, R)} ${p((i + 1) * 2 * Math.PI / n, r)}`; return d + ' Z'; };
  out('contraband', frame({
    backdrop: '#0a0610',
    defs: `${waxDef}
<linearGradient id="coal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0b0f"/><stop offset=".35" stop-color="#201c22"/><stop offset="1" stop-color="#121014"/></linearGradient>
<linearGradient id="iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a8672"/><stop offset=".5" stop-color="#5b4c3e"/><stop offset="1" stop-color="#2c241d"/></linearGradient>
<pattern id="linksV" width="9" height="15" patternUnits="userSpaceOnUse"><ellipse cx="4.5" cy="4.6" rx="2.7" ry="4.3" fill="none" stroke="url(#iron)" stroke-width="1.7"/><ellipse cx="4.5" cy="4.6" rx="2.7" ry="4.3" fill="none" stroke="#d6c4ad" stroke-width=".4" stroke-dasharray="4 20" stroke-dashoffset="-13"/><rect x="3.6" y="7.6" width="1.8" height="8" rx=".9" fill="url(#iron)"/></pattern>
<pattern id="linksH" width="15" height="9" patternUnits="userSpaceOnUse"><ellipse cx="4.6" cy="4.5" rx="4.3" ry="2.7" fill="none" stroke="url(#iron)" stroke-width="1.7"/><ellipse cx="4.6" cy="4.5" rx="4.3" ry="2.7" fill="none" stroke="#d6c4ad" stroke-width=".4" stroke-dasharray="4 20" stroke-dashoffset="-2"/><rect x="7.6" y="3.6" width="8" height="1.8" rx=".9" fill="url(#iron)"/></pattern>
${grain('soot', '0.9 0.9', [.5, .45, .5], 1.2, -.7)}`,
    top: `${faces('url(#coal)', '#08070a', '#2a252c', '#6b5f6e')}
${grained('soot')}
<path d="M0 ${seam} H${SIDE} L100 ${seam - 8}" fill="none" stroke="#ff2a22" stroke-width="3.4" opacity=".55" filter="url(#glow)"/>
<path d="M0 ${seam} H${SIDE} L100 ${seam - 8}" fill="none" stroke="#ff5a44" stroke-width=".8"/>
<path d="M0 ${seam + 1.2} H${SIDE} L100 ${seam - 6.8}" fill="none" stroke="#000" stroke-width="1" opacity=".6"/>
<rect x="38.5" y="${FRONT}" width="9" height="${LONG}" fill="#000" opacity=".4" transform="translate(1.2 0)"/>
<rect x="38.5" y="${FRONT}" width="9" height="${LONG}" fill="url(#linksV)"/>
<g transform="translate(0 ${cross - 4.5})"><rect x="0" y="1" width="${SIDE}" height="9" fill="#000" opacity=".4"/><rect x="-3" y="0" width="${SIDE + 3}" height="9" fill="url(#linksH)"/></g>
<path d="${scallop(43, cross, 13, 16.4)}" fill="url(#wax)" stroke="#5e0a0d" stroke-width=".6"/>
<circle cx="43" cy="${cross}" r="9" fill="none" stroke="#5e0a0d" stroke-width=".7" opacity=".8"/>
<path d="M43 ${cross + 5} L39 ${cross - 5} M43 ${cross + 5} L43 ${cross - 6.5} M43 ${cross + 5} L47 ${cross - 5}" stroke="#5e0a0d" stroke-width="1.3" stroke-linecap="round"/>
<ellipse cx="38.5" cy="${cross - 6}" rx="4.6" ry="2.2" fill="#fff" opacity=".28"/>`,
    bottom: `<rect x="0" y="${LONG - 3}" width="100" height="3" fill="#ff2a22" opacity=".28" filter="url(#glow)"/>`,
    light: `<rect width="100%" height="100%" fill="none" stroke="#ff2a22" stroke-opacity=".22" stroke-width="5" filter="url(#glow)"/>`,
  }));
}
