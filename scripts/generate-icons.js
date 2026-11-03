/**
 * Generates src/components/icons/ from Tabler outline stroke glyphs
 * (@tabler/icons SVG assets) so the app renders every icon through
 * MUI's SvgIcon base — existing sx styling, fontSize props and global
 * .MuiSvgIcon-root CSS keep working untouched.
 *
 * Stroke rendering uses an inline style on the SvgIcon root
 * (fill:none, stroke:currentColor, width 2, round caps/joins) because
 * MUI's class CSS sets fill:currentColor, which would otherwise fill
 * stroke-only paths. Inline styles beat class rules.
 *
 * Run: node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GLYPH_DIR = path.join(ROOT, 'node_modules/@tabler/icons/icons/outline');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(SRC_DIR, 'components/icons');

// MUI icon name -> Tabler outline glyph candidates (first hit wins).
const MAPPING = {
    AccessTime: ['clock'],
    AccessibilityNew: ['accessible'],
    AccountBalance: ['building-bank'],
    AccountBalanceWallet: ['wallet'],
    Add: ['plus'],
    Architecture: ['compass'],
    ArrowBack: ['arrow-left'],
    ArrowDownward: ['arrow-down'],
    ArrowForward: ['arrow-right'],
    ArrowUpward: ['arrow-up'],
    AspectRatio: ['aspect-ratio', 'arrows-maximize'],
    Assessment: ['chart-bar'],
    AttachMoney: ['currency-rupee'],
    AutoAwesome: ['sparkles'],
    BarChart: ['chart-bar'],
    Battery60: ['battery-2'],
    Battery90: ['battery-3'],
    BatteryChargingFull: ['battery-charging'],
    Block: ['ban'],
    Bluetooth: ['bluetooth'],
    BookmarkAdded: ['bookmark-plus', 'bookmark'],
    Brightness4: ['moon'],
    Brightness7: ['sun'],
    Brush: ['brush'],
    Cake: ['cake'],
    Calculate: ['calculator'],
    CalendarMonth: ['calendar-month'],
    CalendarToday: ['calendar'],
    Call: ['phone-call'],
    CameraAlt: ['camera'],
    Campaign: ['speakerphone'],
    CardGiftcard: ['gift'],
    CardMembership: ['id', 'id-badge'],
    Celebration: ['confetti'],
    Chat: ['message-circle', 'messages'],
    Check: ['check'],
    CheckCircle: ['circle-check'],
    CheckCircleOutline: ['circle-check'],
    Checkroom: ['hanger', 'shirt'],
    ChevronLeft: ['chevron-left'],
    ChevronRight: ['chevron-right'],
    Circle: ['circle'],
    Clear: ['circle-x', 'x'],
    Close: ['x'],
    CloudDone: ['cloud-check'],
    CloudUpload: ['cloud-upload'],
    ColorLens: ['palette'],
    ContentCopy: ['copy'],
    ContentCut: ['scissors'],
    CreditCard: ['credit-card'],
    CropFree: ['crop'],
    CurrencyRupee: ['currency-rupee'],
    Dashboard: ['layout-dashboard'],
    Delete: ['trash'],
    DeleteOutline: ['trash'],
    DescriptionOutlined: ['file-description'],
    DesignServices: ['pencil-ruler', 'tools', 'wand'],
    Devices: ['devices'],
    Diamond: ['diamond'],
    DoneAll: ['checks'],
    Download: ['download'],
    Draw: ['pencil'],
    DryCleaning: ['shirt', 'hanger'],
    Edit: ['edit', 'pencil'],
    ElectricBolt: ['bolt'],
    Email: ['mail'],
    EmailOutlined: ['mail'],
    EmojiEvents: ['trophy'],
    ErrorOutline: ['alert-circle'],
    ExpandMore: ['chevron-down'],
    Face3: ['mood-smile'],
    FactCheck: ['clipboard-check'],
    Favorite: ['heart'],
    FilterList: ['filter'],
    FitScreen: ['maximize', 'arrows-maximize'],
    FlashOn: ['bolt'],
    FlipCameraAndroid: ['camera-rotate', 'rotate'],
    FormatBold: ['bold'],
    FormatItalic: ['italic'],
    FormatListBulleted: ['list'],
    Fullscreen: ['maximize', 'arrows-maximize'],
    FullscreenExit: ['minimize'],
    GridView: ['layout-grid'],
    Group: ['users'],
    HelpOutline: ['help-circle', 'help'],
    History: ['history'],
    HourglassEmpty: ['hourglass'],
    ImageOutlined: ['photo'],
    Info: ['info-circle'],
    InfoOutlined: ['info-circle'],
    Insights: ['chart-line'],
    Inventory: ['package'],
    Inventory2: ['building-warehouse'],
    Keyboard: ['keyboard'],
    KeyboardReturn: ['corner-down-left'],
    Language: ['world'],
    Launch: ['external-link'],
    Layers: ['stack-2', 'stack'],
    Link: ['link'],
    LinkOff: ['link-off'],
    ListAlt: ['list-check'],
    LocalOffer: ['tag'],
    LocalShipping: ['truck'],
    LocationOn: ['map-pin'],
    Lock: ['lock'],
    LockOutlined: ['lock'],
    Logout: ['logout'],
    Menu: ['menu-2', 'menu'],
    MonetizationOn: ['coin'],
    Money: ['cash'],
    MoreVert: ['dots-vertical'],
    NavigateNext: ['chevron-right'],
    Notes: ['notes'],
    Notifications: ['bell'],
    NotificationsNone: ['bell'],
    OpenInNew: ['external-link'],
    Palette: ['palette'],
    PauseCircle: ['player-pause'],
    PauseCircleOutline: ['player-pause'],
    Payment: ['credit-card'],
    Payments: ['wallet'],
    PaymentsOutlined: ['cash'],
    People: ['users'],
    Percent: ['percentage'],
    Person: ['user'],
    PersonAdd: ['user-plus'],
    PersonOutline: ['user'],
    Phone: ['phone'],
    PhoneAndroid: ['device-mobile'],
    PhoneIphone: ['device-mobile'],
    PhotoCamera: ['camera'],
    PictureAsPdf: ['file-type-pdf'],
    PlayArrow: ['player-play'],
    PlayCircle: ['circle-play', 'player-play'],
    PointOfSale: ['cash-register'],
    PriceChange: ['tags', 'tag'],
    Print: ['printer'],
    PriorityHigh: ['alert-triangle', 'exclamation-mark'],
    QrCode: ['qrcode'],
    QrCode2: ['qrcode'],
    QrCodeScanner: ['scan'],
    RadioButtonUnchecked: ['circle'],
    Receipt: ['receipt'],
    ReceiptLong: ['receipt'],
    Redeem: ['ticket'],
    Refresh: ['refresh'],
    RestartAlt: ['rotate-clockwise'],
    Save: ['device-floppy'],
    Schedule: ['clock'],
    Search: ['search'],
    Security: ['shield-lock', 'shield-check'],
    Send: ['send'],
    Sensors: ['broadcast'],
    Settings: ['settings'],
    Share: ['share'],
    ShieldOutlined: ['shield'],
    ShoppingBag: ['shopping-bag'],
    ShoppingBagOutlined: ['shopping-bag'],
    ShoppingCart: ['shopping-cart'],
    ShowChart: ['chart-line'],
    Sms: ['message', 'message-circle'],
    SortByAlpha: ['sort-ascending-letters'],
    Spa: ['flower'],
    Speed: ['gauge'],
    Star: ['star'],
    Stars: ['stars'],
    StopCircle: ['player-stop'],
    Store: ['building-store'],
    Storefront: ['building-store'],
    Straighten: ['ruler'],
    Summarize: ['report', 'file-description'],
    TextFields: ['typography'],
    TimerOff: ['clock-off'],
    TrendingDown: ['trending-down'],
    TrendingUp: ['trending-up'],
    Tune: ['adjustments'],
    Tv: ['device-tv', 'tv'],
    Undo: ['arrow-back-up', 'rotate'],
    Upload: ['upload'],
    VerifiedUser: ['shield-check'],
    VideoLibrary: ['video'],
    Videocam: ['video'],
    ViewHeadline: ['align-left'],
    ViewList: ['list'],
    Visibility: ['eye'],
    VisibilityOff: ['eye-off'],
    VolumeOff: ['volume-3', 'volume-off'],
    VolumeUp: ['volume'],
    VpnKey: ['key'],
    Warning: ['alert-triangle'],
    WarningAmber: ['alert-triangle'],
    WhatsApp: ['brand-whatsapp'],
    Wifi: ['wifi'],
    WifiOff: ['wifi-off'],
    WorkspacePremium: ['medal'],
    ZoomIn: ['zoom-in'],
    ZoomOut: ['zoom-out'],
};

function collectUsedNames() {
    const names = new Set();
    const files = [];
    (function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.(js|jsx)$/.test(entry.name)) files.push(full);
        }
    })(SRC_DIR);
    for (const file of files) {
        if (file.startsWith(OUT_DIR)) continue;
        const code = fs.readFileSync(file, 'utf8');
        for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*\/icons['"]/g)) {
            for (const clause of m[1].split(',')) {
                const id = clause.trim().split(/\s+as\s+/)[0].trim();
                if (id) names.add(id);
            }
        }
        for (const m of code.matchAll(/import\s+(\w+)\s+from\s*['"][^'"]*\/icons\/(\w+)['"]/g)) {
            names.add(m[2]);
        }
    }
    return [...names].sort();
}

const ELEMENT_PATTERNS = {
    path: ['d'],
    circle: ['cx', 'cy', 'r'],
    rect: ['x', 'y', 'width', 'height', 'rx'],
    line: ['x1', 'y1', 'x2', 'y2'],
    polyline: ['points'],
    polygon: ['points'],
    ellipse: ['cx', 'cy', 'rx', 'ry'],
};

function parseGlyph(glyph) {
    const file = path.join(GLYPH_DIR, `${glyph}.svg`);
    if (!fs.existsSync(file)) return null;
    const svg = fs.readFileSync(file, 'utf8');
    const elements = [];
    for (const m of svg.matchAll(/<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*)\/?>/g)) {
        const tag = m[0];
        if (/\bstroke="none"/.test(tag)) continue; // Tabler's transparent 24x24 bounding path
        const el = { el: m[1] };
        let ok = false;
        for (const attr of ELEMENT_PATTERNS[m[1]] || []) {
            const am = tag.match(new RegExp(`\\b${attr}="([^"]+)"`));
            if (am) { el[attr] = am[1]; ok = true; }
        }
        if (ok) elements.push(el);
    }
    return elements.length ? elements : null;
}

const names = collectUsedNames();
const glyphCache = new Map();
const tablerExports = []; // { name, glyph, choice }
const fallbackExports = []; // { name, reason }

for (const name of names) {
    const candidates = MAPPING[name];
    if (!candidates) {
        fallbackExports.push({ name, reason: 'no mapping entry' });
        continue;
    }
    let resolved = null;
    let choice = 0;
    for (const glyph of candidates) {
        if (!glyphCache.has(glyph)) glyphCache.set(glyph, parseGlyph(glyph));
        if (glyphCache.get(glyph)) { resolved = glyph; break; }
        choice += 1;
    }
    if (resolved) tablerExports.push({ name, glyph: resolved, choice });
    else fallbackExports.push({ name, reason: `glyphs missing: ${candidates.join(', ')}` });
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- tablerPaths.js ----
const usedGlyphs = [...new Set(tablerExports.map(e => e.glyph))].sort();
const glyphLines = usedGlyphs.map(glyph => {
    const elements = glyphCache.get(glyph);
    const elText = elements
        .map(el => {
            const props = Object.entries(el)
                .filter(([k]) => k !== 'el')
                .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                .join(', ');
            return `        { el: ${JSON.stringify(el.el)}${props ? ', ' + props : ''} }`;
        })
        .join(',\n');
    return `    ${JSON.stringify(glyph)}: [\n${elText}\n    ]`;
});
fs.writeFileSync(path.join(OUT_DIR, 'tablerPaths.js'), `// AUTO-GENERATED by scripts/generate-icons.js — do not edit by hand.
// Tabler outline stroke glyphs (@tabler/icons), viewBox 0 0 24 24.
// Elements render in order; strokes inherit from the SvgIcon root style.

const T = {
${glyphLines.join(',\n')},
};

export default T;
`);

// ---- index.js ----
const exportLines = tablerExports
    .map(({ name, glyph }) => `export const ${name} = createTablerIcon('${name}', T[${JSON.stringify(glyph)}]);`)
    .join('\n');
const fallbackLines = fallbackExports.length
    ? `\n// No Tabler equivalent — kept from @mui/icons-material:\n${fallbackExports.map(({ name }) => `export { default as ${name} } from '@mui/icons-material/${name}';`).join('\n')}\n`
    : '';
fs.writeFileSync(path.join(OUT_DIR, 'index.js'), `// AUTO-GENERATED by scripts/generate-icons.js — do not edit by hand.
// Platform icon set: Tabler outline strokes rendered through MUI SvgIcon, so
// every existing sx, fontSize prop and .MuiSvgIcon-root rule keeps working.
// The inline style on the root beats MUI's fill:currentColor class rule —
// stroke glyphs must not get filled.

import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';
import T from './tablerPaths';

const renderElement = (element, i) => {
    switch (element.el) {
        case 'circle':
            return <circle key={i} cx={element.cx} cy={element.cy} r={element.r} />;
        case 'rect':
            return <rect key={i} x={element.x} y={element.y} width={element.width} height={element.height} rx={element.rx} />;
        case 'line':
            return <line key={i} x1={element.x1} y1={element.y1} x2={element.x2} y2={element.y2} />;
        case 'polyline':
            return <polyline key={i} points={element.points} />;
        case 'polygon':
            return <polygon key={i} points={element.points} />;
        case 'ellipse':
            return <ellipse key={i} cx={element.cx} cy={element.cy} rx={element.rx} ry={element.ry} />;
        default:
            return <path key={i} d={element.d} />;
    }
};

const createTablerIcon = (displayName, elements) => {
    const Icon = (props) => {
        const { style, ...rest } = props;
        return (
            <SvgIcon
                {...rest}
                viewBox="0 0 24 24"
                style={{
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    ...style,
                }}
            >
                {elements.map(renderElement)}
            </SvgIcon>
        );
    };
    Icon.displayName = displayName;
    return Icon;
};

${exportLines}
${fallbackLines}`);

console.log(`Icons: ${names.length} used, ${tablerExports.length} Tabler (${usedGlyphs.length} unique glyphs), ${fallbackExports.length} MUI fallback`);
const secondChoice = tablerExports.filter(e => e.choice > 0);
for (const e of secondChoice) console.log(`  SECOND-CHOICE ${e.name}: ${MAPPING[e.name].slice(0, e.choice + 1).join(' -> ')}`);
for (const f of fallbackExports) console.log(`  FALLBACK ${f.name}: ${f.reason}`);
