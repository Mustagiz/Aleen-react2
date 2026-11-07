/**
 * Generates src/components/icons/ from Iconsax Linear stroke glyphs (iconsax-react)
 * rendered through MUI's SvgIcon base — existing sx styling, fontSize props and global
 * .MuiSvgIcon-root CSS keep working untouched.
 *
 * Stroke rendering uses an inline style on the SvgIcon root:
 * fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, round caps/joins.
 *
 * Run: node scripts/generate-iconsax.js
 */
const fs = require('fs');
const path = require('path');
const Iconsax = require('iconsax-react');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(SRC_DIR, 'components/icons');

// Comprehensive mapping from MUI icon name to Iconsax icon candidates
const ICONSAX_MAPPING = {
  AccessTime: ['Clock', 'Timer1', 'Timer'],
  AccessibilityNew: ['Man', 'UserSquare', 'Personalcard'],
  AccountBalance: ['Bank', 'Buildings', 'Courthouse'],
  AccountBalanceWallet: ['Wallet2', 'Wallet1', 'EmptyWallet', 'Wallet'],
  Add: ['Add', 'AddSquare', 'AddCircle'],
  Architecture: ['Ruler', 'Hierarchy', 'Shapes'],
  ArrowBack: ['ArrowLeft', 'ArrowLeft2'],
  ArrowDownward: ['ArrowDown', 'ArrowDown2'],
  ArrowForward: ['ArrowRight', 'ArrowRight2'],
  ArrowUpward: ['ArrowUp', 'ArrowUp2'],
  AspectRatio: ['Maximize4', 'Maximize3', 'Scan'],
  Assessment: ['Chart21', 'PresentionChart', 'Chart'],
  AttachMoney: ['Money2', 'Money', 'Coin1', 'DollarCircle'],
  AutoAwesome: ['MagicStar', 'Sparkles', 'Flash'],
  BarChart: ['Chart1', 'ChartSquare', 'Diagram'],
  Battery60: ['BatteryCharging', 'BatteryDisable', 'Flash'],
  Battery90: ['BatteryCharging', 'BatteryDisable', 'Flash'],
  BatteryChargingFull: ['BatteryCharging', 'Flash'],
  Block: ['Forbidden2', 'Forbidden', 'Slash'],
  Bluetooth: ['Bluetooth2', 'BluetoothCircle', 'Bluetooth'],
  BookmarkAdded: ['Bookmark2', 'Bookmark'],
  Brightness4: ['Moon', 'Sun1'],
  Brightness7: ['Sun1', 'Sun'],
  Brush: ['Brush2', 'Brush1', 'Brush'],
  Cake: ['Cake', 'Cup'],
  Calculate: ['Calculator', 'Math'],
  CalendarMonth: ['Calendar1', 'Calendar2', 'Calendar'],
  CalendarToday: ['Calendar', 'Calendar1'],
  Call: ['Call', 'CallCalling'],
  CameraAlt: ['Camera', 'CameraSlash'],
  Campaign: ['NotificationBing', 'Speaker', 'DirectNotification'],
  CardGiftcard: ['Gift', 'TicketDiscount'],
  CardMembership: ['Award', 'MedalStar', 'Medal'],
  Celebration: ['Lovely', 'MagicStar', 'Cup'],
  Chat: ['Messages1', 'MessageText1', 'Message'],
  Check: ['TickMark', 'Check'],
  CheckCircle: ['TickCircle'],
  CheckCircleOutline: ['TickCircle'],
  Checkroom: ['Shop', 'Bag2'],
  ChevronLeft: ['ArrowLeft2', 'ArrowLeft'],
  ChevronRight: ['ArrowRight2', 'ArrowRight'],
  Circle: ['RecordCircle', 'Record'],
  Clear: ['CloseCircle', 'Add'],
  Close: ['CloseCircle', 'Add'],
  CloudDone: ['CloudConnection', 'Cloud'],
  CloudUpload: ['CloudAdd', 'DocumentUpload', 'ExportCurve'],
  ColorLens: ['Colorfilter', 'ColorsSquare', 'Brush2'],
  ContentCopy: ['Copy', 'CopySuccess'],
  ContentCut: ['Scissor', 'Scissor1'],
  CreditCard: ['Card', 'Cards', 'CardPos'],
  CropFree: ['Scan', 'Crop'],
  CurrencyRupee: ['RupeeCustom', 'Money2', 'Coin'],
  Dashboard: ['Category2', 'Category', 'Element3', 'Grid2'],
  Delete: ['Trash', 'Trash1'],
  DeleteOutline: ['Trash', 'Trash1'],
  DescriptionOutlined: ['DocumentText', 'Document', 'Note1'],
  DesignServices: ['Designtools', 'Brush2', 'Ruler'],
  Devices: ['Devices', 'Monitor', 'Mobile'],
  Diamond: ['Gemini2', 'Crown1', 'Crown'],
  DoneAll: ['TickSquare', 'TickCircle'],
  Download: ['ImportCurve', 'DocumentDownload', 'ArrowDown'],
  Draw: ['Edit2', 'Edit'],
  DryCleaning: ['Shop', 'Bag2'],
  Edit: ['Edit2', 'Edit', 'PenAdd'],
  ElectricBolt: ['Flash', 'FlashCircle'],
  Email: ['Sms', 'DirectNormal', 'Direct'],
  EmojiEvents: ['Cup', 'Award', 'MedalStar'],
  ErrorOutline: ['InfoCircle', 'Danger'],
  ExpandMore: ['ArrowDown2', 'ArrowDown'],
  Face3: ['Smileys', 'ProfileCircle'],
  FactCheck: ['TaskSquare', 'ClipboardTick'],
  Favorite: ['Heart', 'HeartCircle'],
  FilterList: ['FilterSearch', 'Filter', 'FilterEdit'],
  FitScreen: ['Maximize3', 'Scan'],
  FlashOn: ['Flash', 'FlashCircle'],
  FlipCameraAndroid: ['Camera', 'RotateLeft'],
  FormatBold: ['TextBold', 'Text'],
  FormatItalic: ['TextItalic', 'Text'],
  FormatListBulleted: ['Task', 'MenuBoard'],
  Fullscreen: ['Maximize4', 'Maximize3'],
  FullscreenExit: ['Maximize2', 'Minimize'],
  GridView: ['Grid2', 'Grid4', 'Element3'],
  Group: ['People', 'Profile2User'],
  HelpOutline: ['InfoCircle', 'MessageQuestion'],
  History: ['Clock', 'Timer1', 'RotateLeft'],
  HourglassEmpty: ['Timer1', 'Clock'],
  ImageOutlined: ['Gallery', 'Image'],
  InfoOutlined: ['InfoCircle'],
  Insights: ['TrendUp', 'Activity', 'Diagram'],
  Inventory: ['Box1', 'ArchiveBox', 'Box'],
  Inventory2: ['Buildings2', 'House2', 'Box1'],
  Keyboard: ['Keyboard', 'KeyboardOpen'],
  KeyboardReturn: ['DirectLeft', 'ArrowLeft'],
  Language: ['Global', 'GlobalSearch'],
  Launch: ['ExportCurve', 'Export3', 'Send2'],
  Layers: ['Layer', 'Hierarchy'],
  Link: ['Link2', 'Link1', 'Link'],
  LinkOff: ['LinkCircle', 'Slash'],
  ListAlt: ['TaskSquare', 'MenuBoard', 'DocumentText'],
  LocalOffer: ['Tag2', 'Tag', 'DiscountShape'],
  LocalShipping: ['Truck', 'TruckFast', 'Car'],
  LocationOn: ['Location', 'Map1'],
  Lock: ['Lock1', 'Lock', 'LockCircle'],
  Logout: ['LogoutCurve', 'Logout'],
  Menu: ['HambergerMenu', 'Menu'],
  MonetizationOn: ['Coin1', 'Coin', 'Money2'],
  Money: ['Money2', 'MoneyRecive', 'EmptyWallet'],
  MoreVert: ['More', 'More2'],
  NavigateNext: ['ArrowRight2', 'ArrowRight'],
  Notes: ['NoteText', 'Note1', 'DocumentText'],
  Notifications: ['NotificationBing', 'Notification1', 'Notification'],
  NotificationsNone: ['Notification', 'NotificationBing'],
  OpenInNew: ['ExportCurve', 'Export3'],
  Palette: ['Colorfilter', 'Brush2'],
  PauseCircle: ['PauseCircle', 'Pause'],
  PauseCircleOutline: ['PauseCircle', 'Pause'],
  Payment: ['CardPos', 'Cards', 'Card'],
  Payments: ['EmptyWallet', 'Wallet2', 'Money2'],
  PaymentsOutlined: ['Money2', 'Card'],
  People: ['People', 'Profile2User'],
  Percent: ['PercentageSquare', 'PercentageCircle'],
  Person: ['User', 'ProfileCircle', 'Profile'],
  PersonAdd: ['UserAdd', 'ProfileAdd'],
  PersonOutline: ['User', 'ProfileCircle'],
  Phone: ['Call', 'CallCalling'],
  PhoneAndroid: ['Mobile', 'DeviceMessage'],
  PhoneIphone: ['Mobile', 'DeviceMessage'],
  PhotoCamera: ['Camera', 'CameraSlash'],
  PictureAsPdf: ['DocumentText', 'Document'],
  PlayArrow: ['Play', 'PlayCircle'],
  PlayCircle: ['PlayCircle', 'Play'],
  PointOfSale: ['CardPos', 'Receipt21', 'ReceiptSquare'],
  PriceChange: ['Tag2', 'DiscountShape'],
  Print: ['Printer', 'PrinterSlash'],
  PriorityHigh: ['Danger', 'InfoCircle'],
  QrCode: ['ScanBarcode', 'Scan', 'Barcode'],
  QrCode2: ['ScanBarcode', 'Scan'],
  QrCodeScanner: ['ScanBarcode', 'Scan'],
  RadioButtonUnchecked: ['RecordCircle', 'Circle'],
  Receipt: ['Receipt21', 'ReceiptSquare', 'ReceiptItem', 'Receipt2'],
  ReceiptLong: ['ReceiptItem', 'Receipt21', 'ReceiptSquare'],
  Redeem: ['TicketDiscount', 'Ticket2', 'Ticket'],
  Refresh: ['Refresh2', 'Refresh', 'RotateLeft'],
  RestartAlt: ['RotateLeft', 'Refresh2'],
  Save: ['Save2', 'SaveAdd', 'ArchiveTick'],
  Schedule: ['Clock', 'Timer1'],
  Search: ['SearchNormal1', 'SearchNormal'],
  Security: ['ShieldSecurity', 'SecuritySafe', 'ShieldCross'],
  Send: ['Send2', 'DirectSend'],
  Sensors: ['Radar2', 'Transmit', 'Wifi'],
  Settings: ['Setting2', 'Setting', 'Setting4'],
  Share: ['Share', 'Send2'],
  ShieldOutlined: ['ShieldSecurity', 'SecuritySafe', 'Shield'],
  ShoppingBag: ['Bag2', 'BagCross', 'ShoppingBag'],
  ShoppingBagOutlined: ['Bag2', 'BagCross'],
  ShoppingCart: ['ShoppingCart', 'ShopAdd', 'Bag2'],
  ShowChart: ['TrendUp', 'Chart21', 'Activity'],
  Sms: ['MessageText1', 'Messages1', 'Sms'],
  SortByAlpha: ['Sort', 'Filter'],
  Spa: ['MagicStar', 'Lovely'],
  Speed: ['Speedometer', 'Gauge', 'Activity'],
  Star: ['Star1', 'Star'],
  Stars: ['Star1', 'MagicStar'],
  StopCircle: ['StopCircle', 'Stop'],
  Store: ['Shop', 'Buildings2', 'House2'],
  Storefront: ['Shop', 'Buildings2'],
  Straighten: ['Ruler', 'RulerPen'],
  Summarize: ['DocumentText', 'TaskSquare'],
  TextFields: ['Text', 'Textitalic'],
  TimerOff: ['TimerPause', 'Clock'],
  TrendingDown: ['TrendDown', 'ChartFail'],
  TrendingUp: ['TrendUp', 'ChartSuccess'],
  Tune: ['SliderHorizontal', 'SliderVertical', 'Setting5'],
  Tv: ['Monitor', 'Screenmirroring'],
  Undo: ['RotateLeft', 'ArrowRotateLeft'],
  Upload: ['ExportCurve', 'DocumentUpload'],
  VerifiedUser: ['ShieldTick', 'SecuritySafe'],
  VideoLibrary: ['VideoPlay', 'VideoOctagon'],
  Videocam: ['Video', 'VideoPlay'],
  ViewHeadline: ['HambergerMenu', 'TextalignLeft'],
  ViewList: ['Task', 'MenuBoard'],
  Visibility: ['Eye', 'EyeSlash'],
  VisibilityOff: ['EyeSlash', 'Eye'],
  VolumeOff: ['VolumeSlash', 'VolumeCross'],
  VolumeUp: ['VolumeHigh', 'VolumeLow'],
  VpnKey: ['Key', 'KeySquare'],
  Warning: ['Danger', 'InfoCircle'],
  WarningAmber: ['Danger', 'InfoCircle'],
  WhatsApp: ['WhatsAppCustom', 'Messages1'],
  Wifi: ['Wifi', 'WifiSquare'],
  WifiOff: ['WifiSquare', 'Wifi'],
  WorkspacePremium: ['Crown1', 'Crown', 'Award'],
  ZoomIn: ['SearchZoomIn1', 'SearchNormal1'],
  ZoomOut: ['SearchZoomOut1', 'SearchNormal1']
};

// Custom clean linear stroke SVG elements matching Iconsax geometry
const CUSTOM_GLYPHS = {
  WhatsAppCustom: [
    { el: 'path', d: 'M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9' },
    { el: 'path', d: 'M9 10a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1' }
  ],
  RupeeCustom: [
    { el: 'path', d: 'M18 5h-11h3a4 4 0 0 1 0 8h-3l6 6' },
    { el: 'path', d: 'M7 9l11 0' }
  ]
};

function extractElements(iconName) {
  if (CUSTOM_GLYPHS[iconName]) return CUSTOM_GLYPHS[iconName];

  const comp = Iconsax[iconName];
  if (!comp) return null;
  const rendered = comp.render({ variant: 'Linear', color: 'currentColor' }, null);
  const linearFn = rendered.props.children;
  const elementsTree = typeof linearFn.type === 'function' ? linearFn.type({ color: 'currentColor' }) : linearFn;
  
  const results = [];
  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.props) {
      if (node.type && typeof node.type === 'string') {
        const item = { el: node.type };
        for (const [k, v] of Object.entries(node.props)) {
          if (k === 'children' || k === 'stroke' || k === 'strokeWidth' || k === 'xmlns' || k === 'fill') continue;
          item[k] = v;
        }
        results.push(item);
      }
      if (node.props.children) {
        walk(node.props.children);
      }
    }
  }
  walk(elementsTree);
  return results;
}

// 1. Collect used icon names
const usedNames = Object.keys(ICONSAX_MAPPING).sort();

const glyphCache = new Map();
const exportsList = [];

for (const name of usedNames) {
  const candidates = ICONSAX_MAPPING[name];
  let matchedGlyph = null;
  let elements = null;

  for (const c of candidates) {
    if (CUSTOM_GLYPHS[c]) {
      matchedGlyph = c;
      elements = CUSTOM_GLYPHS[c];
      break;
    }
    if (Iconsax[c]) {
      const el = extractElements(c);
      if (el && el.length > 0) {
        matchedGlyph = c;
        elements = el;
        break;
      }
    }
  }

  if (matchedGlyph && elements) {
    glyphCache.set(matchedGlyph, elements);
    exportsList.push({ name, glyph: matchedGlyph });
  } else {
    console.warn(`WARNING: No Iconsax glyph found for ${name}`);
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// 2. Generate iconsaxPaths.js
const uniqueGlyphs = [...glyphCache.keys()].sort();
const glyphEntries = uniqueGlyphs.map((glyph) => {
  const elements = glyphCache.get(glyph);
  const elStr = elements
    .map((el) => {
      const props = Object.entries(el)
        .filter(([k]) => k !== 'el')
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ');
      return `        { el: ${JSON.stringify(el.el)}${props ? ', ' + props : ''} }`;
    })
    .join(',\n');
  return `    ${JSON.stringify(glyph)}: [\n${elStr}\n    ]`;
});

fs.writeFileSync(
  path.join(OUT_DIR, 'iconsaxPaths.js'),
  `// AUTO-GENERATED by scripts/generate-iconsax.js — do not edit by hand.
// Iconsax Linear stroke glyphs (iconsax-react), viewBox 0 0 24 24.
// Stroke style: 1.5px clean linear luxury stroke with round linejoin/cap.

const I = {
${glyphEntries.join(',\n')}
};

export default I;
`
);

// 3. Generate index.js
const exportLines = exportsList
  .map(({ name, glyph }) => `export const ${name} = createIconsaxIcon('${name}', I[${JSON.stringify(glyph)}]);`)
  .join('\n');

fs.writeFileSync(
  path.join(OUT_DIR, 'index.js'),
  `// AUTO-GENERATED by scripts/generate-iconsax.js — do not edit by hand.
// Platform icon set: Iconsax Linear stroke glyphs rendered through MUI SvgIcon.
// Matches the Mandate design system aesthetic: 1.5px stroke, round caps/joins,
// with full MUI sx, fontSize and color styling compatibility.

import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';
import I from './iconsaxPaths';

export const ICON_SET_NAME = 'iconsax-linear';

const renderElement = (element, i) => {
  switch (element.el) {
    case 'circle':
      return <circle key={i} cx={element.cx} cy={element.cy} r={element.r} {...element} />;
    case 'rect':
      return <rect key={i} x={element.x} y={element.y} width={element.width} height={element.height} rx={element.rx} {...element} />;
    case 'line':
      return <line key={i} x1={element.x1} y1={element.y1} x2={element.x2} y2={element.y2} {...element} />;
    case 'polyline':
      return <polyline key={i} points={element.points} {...element} />;
    case 'polygon':
      return <polygon key={i} points={element.points} {...element} />;
    case 'ellipse':
      return <ellipse key={i} cx={element.cx} cy={element.cy} rx={element.rx} ry={element.ry} {...element} />;
    default:
      return (
        <path
          key={i}
          d={element.d}
          strokeLinecap={element.strokeLinecap || 'round'}
          strokeLinejoin={element.strokeLinejoin || 'round'}
          strokeMiterlimit={element.strokeMiterlimit || '10'}
        />
      );
  }
};

export const createIconsaxIcon = (displayName, elements) => {
  const Icon = (props) => {
    const { style, ...rest } = props;
    return (
      <SvgIcon
        {...rest}
        viewBox="0 0 24 24"
        style={{
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          ...style,
        }}
      >
        {(elements || []).map(renderElement)}
      </SvgIcon>
    );
  };
  Icon.displayName = displayName;
  return Icon;
};

${exportLines}
`
);

console.log(`Generated Iconsax Linear: ${exportsList.length} platform icons (${uniqueGlyphs.length} unique glyphs).`);
