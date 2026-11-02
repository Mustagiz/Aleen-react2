/**
 * Generates src/components/icons/ from Phosphor duotone glyphs
 * (@phosphor-icons/core SVG assets) so the app renders every icon through
 * MUI's SvgIcon base — existing sx styling, fontSize props and global
 * .MuiSvgIcon-root CSS keep working untouched.
 *
 * Run: node scripts/generate-phosphor-icons.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GLYPH_DIR = path.join(ROOT, 'node_modules/@phosphor-icons/core/assets/duotone');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(SRC_DIR, 'components/icons');

// MUI icon name -> Phosphor duotone glyph candidates (first hit wins).
const MAPPING = {
    AccessTime: ['clock'],
    AccessibilityNew: ['wheelchair'],
    AccountBalance: ['bank'],
    AccountBalanceWallet: ['wallet'],
    Add: ['plus'],
    Architecture: ['blueprint'],
    ArrowBack: ['arrow-left'],
    ArrowDownward: ['arrow-down'],
    ArrowForward: ['arrow-right'],
    ArrowUpward: ['arrow-up'],
    AspectRatio: ['frame-corners', 'corners-out'],
    Assessment: ['chart-bar'],
    AttachMoney: ['currency-inr'],
    AutoAwesome: ['sparkle'],
    BarChart: ['chart-bar'],
    Battery60: ['battery-medium'],
    Battery90: ['battery-high'],
    BatteryChargingFull: ['battery-charging-vertical', 'battery-charging'],
    Block: ['prohibit'],
    Bluetooth: ['bluetooth'],
    BookmarkAdded: ['bookmark-simple', 'bookmark'],
    Brightness4: ['moon'],
    Brightness7: ['sun'],
    Brush: ['paint-brush'],
    Cake: ['cake'],
    Calculate: ['calculator'],
    CalendarMonth: ['calendar'],
    CalendarToday: ['calendar-blank', 'calendar'],
    Call: ['phone-call'],
    CameraAlt: ['camera'],
    Campaign: ['megaphone'],
    CardGiftcard: ['gift'],
    CardMembership: ['identification-card', 'credit-card'],
    Celebration: ['confetti'],
    Chat: ['chat-circle-dots', 'chats'],
    Check: ['check'],
    CheckCircle: ['check-circle'],
    CheckCircleOutline: ['check-circle'],
    Checkroom: ['t-shirt', 'shirt-folded'],
    ChevronLeft: ['caret-left'],
    ChevronRight: ['caret-right'],
    Circle: ['circle'],
    Clear: ['x-circle', 'x'],
    Close: ['x'],
    CloudDone: ['cloud-check'],
    CloudUpload: ['cloud-arrow-up'],
    ColorLens: ['palette', 'paint-bucket'],
    ContentCopy: ['copy'],
    ContentCut: ['scissors'],
    CreditCard: ['credit-card'],
    CropFree: ['crop', 'corners-out'],
    CurrencyRupee: ['currency-inr'],
    Dashboard: ['squares-four'],
    Delete: ['trash'],
    DeleteOutline: ['trash'],
    DescriptionOutlined: ['file-text'],
    DesignServices: ['pencil-ruler', 'magic-wand'],
    Devices: ['devices'],
    Diamond: ['diamond'],
    DoneAll: ['checks', 'check'],
    Download: ['download-simple', 'download'],
    Draw: ['pencil-simple', 'pencil'],
    DryCleaning: ['shirt-folded', 't-shirt'],
    Edit: ['pencil-simple', 'pencil'],
    ElectricBolt: ['lightning'],
    Email: ['envelope'],
    EmailOutlined: ['envelope'],
    EmojiEvents: ['trophy'],
    ErrorOutline: ['warning-circle'],
    ExpandMore: ['caret-down'],
    Face3: ['smiley'],
    FactCheck: ['clipboard-text'],
    Favorite: ['heart'],
    FilterList: ['funnel'],
    FitScreen: ['arrows-out', 'frame-corners'],
    FlashOn: ['lightning'],
    FlipCameraAndroid: ['camera-rotate'],
    FormatBold: ['text-b'],
    FormatItalic: ['text-italic'],
    FormatListBulleted: ['list-bullets'],
    Fullscreen: ['corners-out', 'arrows-out'],
    FullscreenExit: ['corners-in', 'arrows-in'],
    GridView: ['squares-four', 'grid-four'],
    Group: ['users'],
    HelpOutline: ['question', 'seal-question'],
    History: ['clock-counter-clockwise'],
    HourglassEmpty: ['hourglass'],
    ImageOutlined: ['image'],
    Info: ['info'],
    InfoOutlined: ['info'],
    Insights: ['chart-line-up', 'chart-line'],
    Inventory: ['package'],
    Inventory2: ['warehouse'],
    Keyboard: ['keyboard'],
    KeyboardReturn: ['arrow-bend-down-left'],
    Language: ['globe'],
    Launch: ['arrow-square-out', 'arrow-up-right'],
    Layers: ['stack'],
    Link: ['link', 'link-simple'],
    LinkOff: ['link-break'],
    ListAlt: ['list-checks'],
    LocalOffer: ['tag'],
    LocalShipping: ['truck'],
    LocationOn: ['map-pin'],
    Lock: ['lock'],
    LockOutlined: ['lock'],
    Logout: ['sign-out'],
    Menu: ['list'],
    MonetizationOn: ['coin', 'money'],
    Money: ['money', 'coins'],
    MoreVert: ['dots-three-vertical'],
    NavigateNext: ['caret-right'],
    Notes: ['note', 'note-blank'],
    Notifications: ['bell'],
    NotificationsNone: ['bell'],
    OpenInNew: ['arrow-square-out', 'arrow-up-right'],
    Palette: ['palette'],
    PauseCircle: ['pause-circle'],
    PauseCircleOutline: ['pause-circle'],
    Payment: ['credit-card'],
    Payments: ['wallet', 'money'],
    PaymentsOutlined: ['money'],
    People: ['users'],
    Percent: ['percent'],
    Person: ['user'],
    PersonAdd: ['user-plus'],
    PersonOutline: ['user'],
    Phone: ['phone'],
    PhoneAndroid: ['device-mobile'],
    PhoneIphone: ['device-mobile'],
    PhotoCamera: ['camera'],
    PictureAsPdf: ['file-pdf'],
    PlayArrow: ['play'],
    PlayCircle: ['play-circle'],
    PointOfSale: ['cash-register'],
    PriceChange: ['tag-chevron', 'coins', 'tag'],
    Print: ['printer'],
    PriorityHigh: ['exclamation-mark', 'warning-circle', 'warning'],
    QrCode: ['qr-code'],
    QrCode2: ['qr-code'],
    QrCodeScanner: ['qr-code', 'scan'],
    RadioButtonUnchecked: ['circle'],
    Receipt: ['receipt'],
    ReceiptLong: ['receipt'],
    Redeem: ['ticket'],
    Refresh: ['arrows-clockwise'],
    RestartAlt: ['arrow-counter-clockwise'],
    Save: ['floppy-disk'],
    Schedule: ['clock'],
    Search: ['magnifying-glass'],
    Security: ['shield-check'],
    Send: ['paper-plane-tilt'],
    Sensors: ['broadcast'],
    Settings: ['gear-six', 'gear'],
    Share: ['share-network', 'share'],
    ShieldOutlined: ['shield'],
    ShoppingBag: ['shopping-bag'],
    ShoppingBagOutlined: ['shopping-bag'],
    ShoppingCart: ['shopping-cart'],
    ShowChart: ['chart-line-up', 'chart-line'],
    Sms: ['chat-text', 'chat-circle-text'],
    SortByAlpha: ['sort-ascending', 'arrows-vertical'],
    Spa: ['flower-lotus'],
    Speed: ['gauge'],
    Star: ['star'],
    Stars: ['sparkle', 'star'],
    StopCircle: ['stop-circle'],
    Store: ['storefront'],
    Storefront: ['storefront'],
    Straighten: ['ruler'],
    Summarize: ['file-text'],
    TextFields: ['text-aa'],
    TimerOff: ['timer'],
    TrendingDown: ['trend-down'],
    TrendingUp: ['trend-up'],
    Tune: ['sliders-horizontal', 'sliders'],
    Tv: ['monitor'],
    Undo: ['arrow-counter-clockwise', 'arrow-u-up-left'],
    Upload: ['upload-simple', 'upload'],
    VerifiedUser: ['seal-check'],
    VideoLibrary: ['video', 'film-strip'],
    Videocam: ['video-camera'],
    ViewHeadline: ['text-align-left', 'list'],
    ViewList: ['list-bullets', 'list'],
    Visibility: ['eye'],
    VisibilityOff: ['eye-slash', 'eye-closed'],
    VolumeOff: ['speaker-x', 'speaker-slash'],
    VolumeUp: ['speaker-high'],
    VpnKey: ['key', 'keyhole'],
    Warning: ['warning'],
    WarningAmber: ['warning'],
    WhatsApp: ['whatsapp-logo'],
    Wifi: ['wifi-high', 'wifi'],
    WifiOff: ['wifi-slash', 'wifi-none'],
    WorkspacePremium: ['medal'],
    ZoomIn: ['magnifying-glass-plus'],
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
        const code = fs.readFileSync(file, 'utf8');
        for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@mui\/icons-material['"]/g)) {
            for (const clause of m[1].split(',')) {
                const id = clause.trim().split(/\s+as\s+/)[0].trim();
                if (id) names.add(id);
            }
        }
        for (const m of code.matchAll(/import\s+(\w+)\s+from\s*['"]@mui\/icons-material\/(\w+)['"]/g)) {
            names.add(m[2]);
        }
    }
    return { names: [...names].sort(), files };
}

function parseGlyph(glyph) {
    const file = path.join(GLYPH_DIR, `${glyph}-duotone.svg`);
    if (!fs.existsSync(file)) return null;
    const svg = fs.readFileSync(file, 'utf8');
    const layers = [];
    for (const m of svg.matchAll(/<path\b[^>]*\/>/g)) {
        const tag = m[0];
        const d = tag.match(/\sd="([^"]+)"/);
        if (!d) continue;
        const op = tag.match(/\sopacity="([^"]+)"/);
        layers.push(op ? { d: d[1], o: parseFloat(op[1]) } : { d: d[1] });
    }
    return layers.length ? layers : null;
}

const { names } = collectUsedNames();
const glyphCache = new Map();
const phosphorExports = []; // { name, glyph }
const fallbackExports = []; // { name, reason }

for (const name of names) {
    const candidates = MAPPING[name];
    if (!candidates) {
        fallbackExports.push({ name, reason: 'no mapping entry' });
        continue;
    }
    let resolved = null;
    for (const glyph of candidates) {
        if (!glyphCache.has(glyph)) glyphCache.set(glyph, parseGlyph(glyph));
        if (glyphCache.get(glyph)) { resolved = glyph; break; }
    }
    if (resolved) phosphorExports.push({ name, glyph: resolved });
    else fallbackExports.push({ name, reason: `glyphs missing: ${candidates.join(', ')}` });
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- phosphorPaths.js ----
const usedGlyphs = [...new Set(phosphorExports.map(e => e.glyph))].sort();
const pathLines = usedGlyphs.map(glyph => {
    const layers = glyphCache.get(glyph);
    const layerText = layers
        .map(l => (l.o == null ? `        { d: ${JSON.stringify(l.d)} }` : `        { d: ${JSON.stringify(l.d)}, o: ${l.o} }`))
        .join(',\n');
    return `    ${JSON.stringify(glyph)}: [\n${layerText}\n    ]`;
});
fs.writeFileSync(path.join(OUT_DIR, 'phosphorPaths.js'), `// AUTO-GENERATED by scripts/generate-phosphor-icons.js — do not edit by hand.
// Phosphor duotone glyphs (@phosphor-icons/core), viewBox 0 0 256 256.
// "o" is the duotone back-layer opacity; layers render in order.

const P = {
${pathLines.join(',\n')},
};

export default P;
`);

// ---- index.js ----
const exportLines = phosphorExports
    .map(({ name, glyph }) => `export const ${name} = createPhosphorIcon('${name}', P[${JSON.stringify(glyph)}]);`)
    .join('\n');
const fallbackLines = fallbackExports.length
    ? `\n// No Phosphor equivalent — kept from @mui/icons-material:\n${fallbackExports.map(({ name }) => `export { default as ${name} } from '@mui/icons-material/${name}';`).join('\n')}\n`
    : '';
fs.writeFileSync(path.join(OUT_DIR, 'index.js'), `// AUTO-GENERATED by scripts/generate-phosphor-icons.js — do not edit by hand.
// Platform icon set: Phosphor duotone rendered through MUI SvgIcon, so every
// existing sx, fontSize prop and .MuiSvgIcon-root rule keeps working as-is.

import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';
import P from './phosphorPaths';

const createPhosphorIcon = (displayName, layers) => {
    const Icon = (props) => (
        <SvgIcon {...props} viewBox="0 0 256 256">
            {layers.map((layer, i) => (
                <path key={i} d={layer.d} fillOpacity={layer.o == null ? undefined : layer.o} />
            ))}
        </SvgIcon>
    );
    Icon.displayName = displayName;
    return Icon;
};

${exportLines}
${fallbackLines}`);

console.log(`Icons: ${names.length} used, ${phosphorExports.length} Phosphor (${usedGlyphs.length} unique glyphs), ${fallbackExports.length} MUI fallback`);
for (const f of fallbackExports) console.log(`  FALLBACK ${f.name}: ${f.reason}`);
