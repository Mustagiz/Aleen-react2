import React from 'react';
import { Box, Typography } from '@mui/material';

/* ------------------------------------------------------------------ *
 * Settings gallery thumbnails — each one mirrors the document format
 * its template prints (frame, header, meta, ledger, totals, tear).
 * Purely schematic: no invoice data or computation involved.
 * ------------------------------------------------------------------ */

const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'monospace, sans-serif';
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const Bar = ({ w = '100%', h = 3, c = '#E2E8F0', r = 0.25, style }) => (
  <Box sx={{ height: h, width: w, borderRadius: r, bgcolor: c, flexShrink: 0 }} style={style} />
);

const Micro = ({ children, color, family = SANS, size = '0.42rem', weight = 800, spacing = '0.12em', align }) => (
  <Typography
    component="span"
    sx={{
      display: 'block',
      fontFamily: family,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: spacing,
      textTransform: 'uppercase',
      color,
      textAlign: align,
      lineHeight: 1.35,
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }}
  >
    {children}
  </Typography>
);

const LedgerLines = ({ count = 3, rows, color = '#E2E8F0', accent = '#CBD5E1', gap = 0.45 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap }}>
    {(rows || Array.from({ length: count }, () => ({ l: '72%', r: '24%' }))).slice(0, 4).map((row, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.75 }}>
        <Bar w={row.l || '72%'} c={color} h={row.strong ? 4 : 3} />
        <Bar w={row.r || '24%'} c={row.strong ? accent : color} h={row.strong ? 4 : 3} />
      </Box>
    ))}
  </Box>
);

const Tear = ({ rule, color, family = SANS, label, badge }) => (
  <Box sx={{ mt: 'auto', mb: 0.9 }}>
    <Box sx={{ position: 'relative', pt: 0.55, borderTop: rule, textAlign: 'center' }}>
      {badge && (
        <Box
          sx={{
            position: 'absolute',
            top: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 9,
            height: 9,
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.36rem',
            color: badge
          }}
        >
          ◆
        </Box>
      )}
      <Micro color={color} family={family} size="0.38rem" spacing="0.18em">
        {label}
      </Micro>
    </Box>
  </Box>
);

const paperBase = {
  width: '100%',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 300
};

/* 1 — Atelier Emerald: banner header · soft sheet · split privileges */
const ThumbBanner = ({ c }) => (
  <Box sx={{ ...paperBase, borderRadius: 1, bgcolor: '#FFFFFF', boxShadow: '0 1px 0 rgba(0,0,0,0.04) inset' }}>
    <Box sx={{ background: c.headerBg, px: 1.1, py: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0 }}>
        <Box sx={{ width: 13, height: 13, borderRadius: 0.5, bgcolor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '0.42rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>A</Typography>
        </Box>
        <Micro color="#FFFFFF" size="0.5rem">ALEEN CLOTHING</Micro>
      </Box>
      <Micro color="rgba(255,255,255,0.8)" size="0.4rem">TAX INVOICE</Micro>
    </Box>

    <Box sx={{ mx: 1, mt: 0.9, p: 0.7, border: '1px solid #EDF1F5', borderLeft: `3px solid ${c.primary}`, borderRadius: 0.75, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, flex: 1.2 }}>
        <Micro color={c.primary} size="0.34rem">Billed to</Micro>
        <Bar w="70%" h={4} c="#CBD5E1" />
        <Bar w="46%" />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, flex: 1, alignItems: 'flex-end' }}>
        <Bar w="62%" />
        <Bar w="44%" />
      </Box>
    </Box>

    <Box sx={{ mx: 1, mt: 0.9, px: 0.8, py: 0.4, borderRadius: 0.5, background: c.primary, display: 'flex', justifyContent: 'space-between' }}>
      {['ITEM', 'QTY', 'AMT'].map((h) => (
        <Micro key={h} color="#FFFFFF" size="0.36rem">{h}</Micro>
      ))}
    </Box>
    <Box sx={{ mx: 1, mt: 0.4, mb: 0.9, display: 'flex', flexDirection: 'column' }}>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ px: 0.8, py: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, bgcolor: i % 2 ? 'rgba(0,0,0,0.02)' : 'transparent', borderBottom: '1px solid #F1F5F9' }}>
          <Box sx={{ flex: 1 }}>
            <Bar w="78%" h={3.5} c="#E2E8F0" />
            <Box sx={{ height: 2 }} />
            <Bar w="40%" h={2.5} c="#F1F5F9" />
          </Box>
          <Bar w={12} c="#E2E8F0" />
          <Bar w={20} c="#CBD5E1" />
        </Box>
      ))}
    </Box>

    <Box sx={{ mx: 1, mb: 1, display: 'flex', gap: 0.8 }}>
      <Box sx={{ flex: 1, p: 0.65, borderRadius: 0.75, bgcolor: c.tint, border: `1px solid ${c.softBorder}` }}>
        <Micro color={c.primary} size="0.32rem">Atelier privileges</Micro>
        <Box sx={{ mt: 0.35, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
          <Bar w="88%" c="#DDE4EA" />
          <Bar w="72%" c="#DDE4EA" />
          <Box sx={{ mt: 0.2, height: 1, bgcolor: c.primary, opacity: 0.35 }} />
          <Bar w="80%" c="#DDE4EA" />
        </Box>
      </Box>
      <Box sx={{ flex: 1.1 }}>
        <LedgerLines color="#E2E8F0" rows={[{ l: '60%', r: '30%' }, { l: '60%', r: '30%' }]} />
        <Box sx={{ mt: 0.45, px: 0.7, py: 0.45, borderRadius: 0.5, bgcolor: c.primary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Micro color="#FFFFFF" size="0.34rem">Net</Micro>
          <Micro color="#FFFFFF" size="0.44rem" spacing="0">₹36,657</Micro>
        </Box>
      </Box>
    </Box>

    <Box sx={{ mx: 1, mb: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
      <Box sx={{ width: '46%', borderTop: `1px solid ${c.softBorder}`, pt: 0.3, textAlign: 'right' }}>
        <Micro color="#94A3B8" size="0.32rem">Authorised signatory</Micro>
      </Box>
    </Box>
    <Tear rule="2px dashed #CBD5E1" color="#94A3B8" label="✂ CLIENT COPY ✂" />
  </Box>
);

/* 2 — Champagne Gold: crest letterhead · double-rule certificate frame */
const ThumbCrest = ({ c }) => (
  <Box
    sx={{
      ...paperBase,
      borderRadius: 0.5,
      bgcolor: '#FFFFFF',
      border: `1px solid ${c.primary}`,
      boxShadow: `inset 0 0 0 2px #FFFFFF, inset 0 0 0 3px ${c.accent}`,
      p: 1.1
    }}
  >
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ width: 16, height: 16, mx: 'auto', borderRadius: '50%', bgcolor: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 1px #FFFFFF inset, 0 0 0 2px ${c.primary}` }}>
        <Typography sx={{ fontSize: '0.46rem', fontWeight: 800, color: c.dark, lineHeight: 1, fontFamily: SERIF }}>A</Typography>
      </Box>
      <Typography sx={{ mt: 0.4, fontFamily: SERIF, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.2em', color: c.dark, textTransform: 'uppercase' }}>
        Aleen Clothing
      </Typography>
      <Box sx={{ mt: 0.5, borderBottom: `3px double ${c.primary}` }} />
      <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between' }}>
        <Micro color={c.primary} family={SERIF} size="0.34rem">Regal Boutique</Micro>
        <Micro color={c.dark} family={SERIF} size="0.4rem">Tax Invoice</Micro>
        <Micro color={c.primary} family={MONO} size="0.34rem">#AL-0042</Micro>
      </Box>
    </Box>

    <Box sx={{ mt: 0.9, py: 0.55, textAlign: 'center', borderTop: `1px solid ${c.softBorder}`, borderBottom: `1px solid ${c.softBorder}` }}>
      <Micro color={c.primary} family={SERIF} size="0.32rem">Billed to</Micro>
      <Box sx={{ mt: 0.3, mx: 'auto', width: '48%' }}>
        <Bar w="100%" h={4} c="#DCC48B" />
        <Box sx={{ height: 2 }} />
        <Bar w="62%" c="#E2E8F0" />
      </Box>
    </Box>

    <Box sx={{ mt: 0.9 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.4, pb: 0.35, borderBottom: `3px double ${c.accent}`, bgcolor: c.primary }}>
        {['GARMENT', 'QTY', 'AMOUNT'].map((h) => (
          <Micro key={h} color="#FFFFFF" family={SERIF} size="0.34rem" spacing="0.16em">{h}</Micro>
        ))}
      </Box>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, px: 0.4, py: 0.42, borderBottom: `1px solid ${c.softBorder}` }}>
          <Bar w="44%" h={3.5} c="#DCC48B" />
          <Box sx={{ flex: 1, borderBottom: `1px dotted ${c.softBorder}`, height: 1 }} />
          <Bar w={10} c="#E2E8F0" />
          <Bar w={22} h={3.5} c="#CBD5E1" />
        </Box>
      ))}
    </Box>

    <Box sx={{ mt: 0.9, mx: 'auto', width: '74%' }}>
      <LedgerLines
        color="#E2E8F0"
        rows={[{ l: '58%', r: '28%' }, { l: '58%', r: '28%' }, { l: '58%', r: '28%' }]}
      />
      <Box sx={{ mt: 0.4, py: 0.35, borderTop: `3px double ${c.primary}`, borderBottom: `3px double ${c.primary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Micro color={c.dark} family={SERIF} size="0.38rem">Total payable</Micro>
        <Micro color={c.primary} family={SERIF} size="0.48rem" spacing="0">₹36,657</Micro>
      </Box>
    </Box>

    <Box sx={{ mt: 0.9, textAlign: 'center' }}>
      <Box sx={{ width: 15, height: 15, mx: 'auto', borderRadius: '50%', border: `1px solid ${c.primary}`, color: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.3rem', fontWeight: 800, letterSpacing: '0.04em' }}>
        SEALED
      </Box>
      <Box sx={{ mt: 0.35, mx: 'auto', width: '40%', borderTop: `1px solid ${c.softBorder}`, pt: 0.25 }}>
        <Micro color="#94A3B8" family={SERIF} size="0.3rem">Authorised signatory</Micro>
      </Box>
    </Box>
    <Tear rule={`3px double ${c.primary}`} color={c.primary} family={SERIF} label="ORIGINAL • CLIENT COPY" />
  </Box>
);

/* 3 — Royal Sapphire: identity rail · spine sheet · dark totals rail */
const ThumbRail = ({ c }) => (
  <Box
    sx={{
      ...paperBase,
      borderRadius: 0.5,
      bgcolor: '#FFFFFF',
      border: `1px solid ${c.softBorder}`,
      borderLeft: `5px solid ${c.primary}`,
      p: 1
    }}
  >
    <Box sx={{ display: 'flex', gap: 0.7, alignItems: 'stretch' }}>
      <Box sx={{ flex: 1.35, background: c.headerBg, borderRadius: 0.5, p: 0.7, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 3, height: 9, bgcolor: c.accent }} />
          <Micro color="rgba(255,255,255,0.7)" size="0.3rem">Prestige</Micro>
        </Box>
        <Micro color="#FFFFFF" size="0.5rem">ALEEN CLOTHING</Micro>
        <Box sx={{ display: 'flex', gap: 0.35 }}>
          <Bar w="40%" h={2.5} c="rgba(255,255,255,0.3)" />
          <Bar w="30%" h={2.5} c="rgba(255,255,255,0.3)" />
        </Box>
      </Box>
      <Box sx={{ flex: 1, bgcolor: c.tint, border: `1px solid ${c.softBorder}`, borderRadius: 0.5, p: 0.7, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.35, alignItems: 'flex-end' }}>
        <Micro color={c.dark} size="0.46rem">TAX INVOICE</Micro>
        <Box sx={{ px: 0.5, py: 0.2, borderRadius: 0.5, bgcolor: 'rgba(255,255,255,0.75)', border: `1px solid ${c.softBorder}` }}>
          <Micro color={c.primary} family={MONO} size="0.34rem">#AL-0042</Micro>
        </Box>
      </Box>
    </Box>

    <Box sx={{ mt: 0.9, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', bgcolor: c.softBorder, border: `1px solid ${c.softBorder}` }}>
      {['CLIENT', 'CONTACT', 'DOCUMENT', 'PAYMENT'].map((label) => (
        <Box key={label} sx={{ bgcolor: '#FFFFFF', p: 0.55 }}>
          <Micro color={c.primary} size="0.3rem">{label}</Micro>
          <Box sx={{ mt: 0.25 }}>
            <Bar w="74%" h={3} c="#DCE6EE" />
          </Box>
        </Box>
      ))}
    </Box>

    <Box sx={{ mt: 0.9 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.6, py: 0.3, bgcolor: c.primary, borderBottom: `2px solid ${c.accent}` }}>
        {['GARMENT', 'QTY', 'RATE', 'AMOUNT'].map((h) => (
          <Micro key={h} color="#FFFFFF" size="0.32rem">{h}</Micro>
        ))}
      </Box>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            px: 0.6,
            py: 0.4,
            bgcolor: i % 2 ? c.tint : 'transparent',
            borderRight: `1px solid ${c.softBorder}`,
            borderLeft: `1px solid ${c.softBorder}`,
            borderBottom: `1px solid ${c.softBorder}`
          }}
        >
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Bar w="72%" h={3.5} c="#D6E3EC" />
            <Box sx={{ alignSelf: 'flex-start', px: 0.35, border: `1px solid ${c.primary}55`, borderRadius: 0.25 }}>
              <Micro color={c.primary} size="0.28rem">CATEGORY</Micro>
            </Box>
          </Box>
          <Bar w={10} c="#E2E8F0" />
          <Bar w={18} c="#E2E8F0" />
          <Bar w={24} h={3.5} c="#CBD5E1" />
        </Box>
      ))}
    </Box>

    <Box sx={{ mt: 0.9, background: c.headerBg, borderRadius: 0.5, p: 0.8, position: 'relative' }}>
      <Micro color="rgba(255,255,255,0.55)" size="0.3rem">Settlement</Micro>
      <Box sx={{ mt: 0.4, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Bar w="34%" h={3} c="rgba(255,255,255,0.28)" />
          <Bar w="22%" h={3} c="rgba(255,255,255,0.4)" />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Bar w="34%" h={3} c="rgba(255,255,255,0.28)" />
          <Bar w="22%" h={3} c="rgba(255,255,255,0.4)" />
        </Box>
        <Box sx={{ mt: 0.15, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid rgba(255,255,255,0.3)`, pt: 0.35 }}>
          <Micro color="#FFFFFF" size="0.36rem">Net payable</Micro>
          <Micro color={c.accent} size="0.5rem" spacing="0">₹36,657</Micro>
        </Box>
      </Box>
      <Box sx={{ position: 'absolute', right: 8, bottom: 8, width: 17, height: 17, borderRadius: '50%', border: `1px solid ${c.accent}`, color: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.28rem', fontWeight: 800 }}>
        SEAL
      </Box>
    </Box>
    <Tear rule="2px dashed #CBD5E1" color="#94A3B8" label="✂ CLIENT COPY ✂" />
  </Box>
);

/* 4 — Rose Plum: editorial masthead · dotted garment list */
const ThumbMasthead = ({ c }) => (
  <Box
    sx={{
      ...paperBase,
      borderRadius: 0.5,
      bgcolor: '#FFFFFF',
      border: `1px solid ${c.softBorder}`,
      boxShadow: `inset 0 0 0 3px #FFFFFF, inset 0 0 0 4px ${c.softBorder}`,
      p: 1.25
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', pb: 0.4, borderBottom: `1px solid ${c.primary}` }}>
      <Micro color={c.dark} family={SERIF} size="0.46rem" spacing="0.24em">Aleen</Micro>
      <Micro color={c.primary} size="0.3rem" spacing="0.2em">Bridal Trousseau</Micro>
    </Box>
    <Box sx={{ mt: 0.7, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
      <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.82rem', color: c.dark, lineHeight: 1 }}>
        Tax Invoice
      </Typography>
      <Micro color={c.primary} family={MONO} size="0.36rem">NO. AL-0042</Micro>
    </Box>

    <Box sx={{ mt: 0.8, pt: 0.5, borderTop: `1px solid ${c.softBorder}`, display: 'flex', justifyContent: 'space-between', gap: 0.75 }}>
      {[
        { k: 'CLIENT', w: '74%' },
        { k: 'CONTACT', w: '58%' },
        { k: 'PAYMENT', w: '52%' },
        { k: 'DATE', w: '46%' }
      ].map((col) => (
        <Box key={col.k} sx={{ flex: 1 }}>
          <Micro color={c.primary} family={SERIF} size="0.28rem">{col.k}</Micro>
          <Box sx={{ mt: 0.2 }}>
            <Bar w={col.w} h={3} c="#EBDCE8" />
          </Box>
        </Box>
      ))}
    </Box>

    <Box sx={{ mt: 0.9, pb: 0.3, borderBottom: `1px solid ${c.primary}`, display: 'flex', justifyContent: 'space-between' }}>
      <Micro color={c.primary} family={SERIF} size="0.32rem" spacing="0.2em">Garment ledger</Micro>
      <Micro color={c.primary} family={SERIF} size="0.32rem" spacing="0.2em">Amount</Micro>
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6, py: 0.5, borderBottom: `1px dotted ${c.softBorder}` }}>
          <Typography sx={{ fontFamily: SERIF, fontSize: '0.4rem', color: c.dark, whiteSpace: 'nowrap' }}>Lehenga · Bridal</Typography>
          <Box sx={{ flex: 1, borderBottom: `1px dotted ${c.accent}`, height: 1, opacity: 0.7 }} />
          <Micro color="#94A3B8" family={SERIF} size="0.3rem">×2</Micro>
          <Bar w={26} h={3.5} c={c.softBorder} />
        </Box>
      ))}
    </Box>

    <Box sx={{ mt: 0.9, p: 0.8, borderRadius: 0.75, bgcolor: c.tint, border: `1px solid ${c.softBorder}` }}>
      <LedgerLines color="#E7D6E2" rows={[{ l: '52%', r: '26%' }, { l: '52%', r: '26%' }, { l: '52%', r: '26%' }]} />
      <Box sx={{ mt: 0.4, pt: 0.4, borderTop: `1px solid ${c.primary}55`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Micro color={c.dark} family={SERIF} size="0.38rem">Total</Micro>
        <Micro color={c.primary} family={SERIF} size="0.5rem" spacing="0">₹36,657</Micro>
      </Box>
    </Box>

    <Box sx={{ mt: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Box sx={{ width: 8, height: 8, border: `1px solid ${c.accent}`, transform: 'rotate(45deg)', flexShrink: 0 }} />
      <Box sx={{ flex: 1 }}>
        <Bar w="54%" h={3} c="#EBDCE8" />
        <Box sx={{ height: 2 }} />
        <Bar w="78%" h={2.5} c="#F1E7EF" />
      </Box>
      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: c.primary, opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: '0.4rem', fontFamily: SERIF, color: '#FFFFFF', lineHeight: 1 }}>A</Typography>
      </Box>
    </Box>
    <Tear rule={`1px solid ${c.accent}`} color={c.primary} family={SERIF} label="TROUSSEAU CLIENT COPY" />
  </Box>
);

/* 5 — Heritage Crimson: ornamental frame · provenance grid · brass seal */
const ThumbFramed = ({ c }) => (
  <Box
    sx={{
      ...paperBase,
      borderRadius: 0.5,
      bgcolor: '#FFFFFF',
      border: `3px double ${c.primary}`,
      p: 1.1,
      position: 'relative'
    }}
  >
    {[
      { top: 4, left: 4, borderTop: `2px solid ${c.accent}`, borderLeft: `2px solid ${c.accent}` },
      { top: 4, right: 4, borderTop: `2px solid ${c.accent}`, borderRight: `2px solid ${c.accent}` },
      { bottom: 4, left: 4, borderBottom: `2px solid ${c.accent}`, borderLeft: `2px solid ${c.accent}` },
      { bottom: 4, right: 4, borderBottom: `2px solid ${c.accent}`, borderRight: `2px solid ${c.accent}` }
    ].map((corner, i) => (
      <Box key={i} sx={{ position: 'absolute', width: 8, height: 8, pointerEvents: 'none', ...corner }} />
    ))}

    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ width: 10, height: 10, mx: 'auto', bgcolor: c.accent, transform: 'rotate(45deg)', mb: 0.5 }} />
      <Typography sx={{ fontFamily: SERIF, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', color: c.dark, textTransform: 'uppercase' }}>
        Aleen Clothing
      </Typography>
      <Box sx={{ mt: 0.4, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ flex: 1, height: 1, bgcolor: c.accent }} />
        <Box sx={{ width: 5, height: 5, bgcolor: c.accent, transform: 'rotate(45deg)' }} />
        <Box sx={{ flex: 1, height: 1, bgcolor: c.accent }} />
      </Box>
      <Box sx={{ mt: 0.5, mx: 'auto', display: 'inline-block', px: 0.8, py: 0.3, border: `1px solid ${c.accent}`, bgcolor: `${c.accent}1A` }}>
        <Micro color={c.dark} family={SERIF} size="0.4rem" spacing="0.22em">Tax Invoice</Micro>
      </Box>
    </Box>

    <Box sx={{ mt: 0.7, py: 0.45, textAlign: 'center', borderTop: `1px solid ${c.softBorder}`, borderBottom: `1px solid ${c.softBorder}` }}>
      <Box sx={{ mx: 'auto', width: '44%', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Bar w="100%" h={3.5} c={c.softBorder} />
        <Bar w="66%" c="#EDE3DA" />
      </Box>
    </Box>

    <Box sx={{ mt: 0.7 }}>
      <Box sx={{ display: 'flex', bgcolor: c.primary, borderBottom: `3px double ${c.accent}` }}>
        {['#', 'GARMENT', 'PROVENANCE', 'QTY', 'AMOUNT'].map((h, i) => (
          <Box key={h} sx={{ px: 0.4, py: 0.3, flex: i === 0 ? '0 0 8%' : i === 1 ? 1 : 0.7, borderRight: i < 4 ? `1px solid ${c.dark}` : 'none' }}>
            <Micro color="#FFFFFF" family={SERIF} size="0.3rem" spacing="0.1em">{h}</Micro>
          </Box>
        ))}
      </Box>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ display: 'flex' }}>
          {['0 0 8%', 'flex:1', 'flex:0.7', 'flex:0.4', 'flex:0.7'].map((rule, j) => (
            <Box
              key={j}
              sx={{
                px: 0.4,
                py: 0.4,
                ...(j === 0 ? { flexBasis: '8%' } : { flexGrow: 1, flexShrink: 1 }),
                flexBasis: j === 0 ? '8%' : j === 1 ? '40%' : j === 2 ? '22%' : j === 3 ? '10%' : '20%',
                borderRight: j < 4 ? `1px solid ${c.softBorder}` : 'none',
                borderBottom: `1px solid ${c.softBorder}`,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {j === 0 ? (
                <Micro color={c.dark} family={MONO} size="0.3rem">0{i + 1}</Micro>
              ) : (
                <Bar w="86%" h={3} c={j === 4 ? c.softBorder : '#EDE3DA'} />
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Box>

    <Box sx={{ mt: 0.8, p: 0.7, border: `3px double ${c.accent}`, borderRadius: 0.25 }}>
      <LedgerLines color="#EDE3DA" accent={c.softBorder} rows={[{ l: '56%', r: '26%' }, { l: '56%', r: '26%' }]} />
      <Box sx={{ mt: 0.35, pt: 0.35, borderTop: `1px solid ${c.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Micro color={c.dark} family={SERIF} size="0.36rem">Net payable</Micro>
        <Micro color={c.primary} family={SERIF} size="0.48rem" spacing="0">₹36,657</Micro>
      </Box>
    </Box>

    <Box sx={{ mt: 0.7, borderTop: `2px solid ${c.accent}`, pt: 0.5, textAlign: 'center' }}>
      <Box sx={{ width: 17, height: 17, mx: 'auto', borderRadius: '50%', bgcolor: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 2px #FFFFFF, 0 0 0 3px ${c.accent}` }}>
        <Typography sx={{ fontSize: '0.36rem', fontFamily: SERIF, color: '#FFF', lineHeight: 1 }}>A</Typography>
      </Box>
      <Box sx={{ mt: 0.3, mx: 'auto', width: '38%', borderTop: `1px solid ${c.softBorder}`, pt: 0.2 }}>
        <Micro color="#94A3B8" family={SERIF} size="0.28rem">Signatory</Micro>
      </Box>
    </Box>
    <Tear rule={`3px double ${c.accent}`} color={c.dark} family={SERIF} label="ATELIER HERITAGE CLIENT COPY" badge={c.accent} />
  </Box>
);

/* 6 — Executive Slate: data strip · dense grid · KPI tiles */
const ThumbDataStrip = ({ c }) => (
  <Box sx={{ ...paperBase, borderRadius: 0, bgcolor: '#FFFFFF', border: `1px solid ${c.primary}` }}>
    <Box sx={{ bgcolor: c.dark, px: 0.9, py: 0.6, borderBottom: `2px solid ${c.accent}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {['DOC AL-0042', '04 NOV 2026', 'GSTIN 09ABCDE1234F', '+91 98765 43210'].map((field, i) => (
          <Box key={field} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, pr: i < 3 ? 0.6 : 0, borderRight: i < 3 ? `1px solid rgba(255,255,255,0.18)` : 'none' }}>
            <Micro color={i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} family={MONO} size="0.32rem" spacing="0.06em">{field}</Micro>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 0.4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Micro color="#FFFFFF" size="0.48rem">ALEEN CLOTHING</Micro>
        <Micro color={c.accent} size="0.34rem">TAX INVOICE</Micro>
      </Box>
    </Box>

    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid #E2E8F0` }}>
      {['CLIENT', 'CONTACT', 'PAYMENT', 'STATUS'].map((label, i) => (
        <Box key={label} sx={{ p: 0.55, border: '1px solid #E2E8F0', borderLeft: i % 2 ? '1px solid #E2E8F0' : 'none', borderTop: i > 1 ? 'none' : '1px solid #E2E8F0' }}>
          <Micro color="#64748B" family={MONO} size="0.28rem" spacing="0.08em">{label}</Micro>
          <Box sx={{ mt: 0.2 }}>
            <Bar w="70%" h={3} c="#D5D1C8" />
          </Box>
        </Box>
      ))}
    </Box>

    <Box sx={{ mx: 0.55, my: 0.6 }}>
      <Box sx={{ display: 'flex', bgcolor: c.primary }}>
        {['#', 'ITEM', 'CATEGORY', 'QTY', 'RATE', 'AMOUNT'].map((h) => (
          <Box key={h} sx={{ flexBasis: h === '#' ? '7%' : h === 'QTY' ? '10%' : '18%', flexGrow: 1, px: 0.35, py: 0.25, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
            <Micro color="#FFFFFF" family={MONO} size="0.28rem" spacing="0.06em">{h}</Micro>
          </Box>
        ))}
      </Box>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ display: 'flex', bgcolor: i % 2 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
          {['7%', '26%', '18%', '10%', '18%', '21%'].map((basis, j) => (
            <Box key={j} sx={{ flexBasis: basis, px: 0.35, py: 0.35, borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: j > 2 ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
              {j === 0 ? <Micro color="#64748B" family={MONO} size="0.28rem">0{i + 1}</Micro> : <Bar w={j === 1 ? '88%' : j === 2 ? '70%' : '56%'} h={2.5} c="#D5D1C8" />}
            </Box>
          ))}
        </Box>
      ))}
    </Box>

    <Box sx={{ mx: 0.55, mb: 0.7, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
      {[
        { k: 'SUBTOTAL', v: '₹31,065' },
        { k: 'GST 18%', v: '₹5,592' },
        { k: 'NET DUE', v: '₹36,657', strong: true }
      ].map((tile) => (
        <Box key={tile.k} sx={{ p: 0.55, border: `1px solid ${tile.strong ? c.dark : '#D5D1C8'}`, bgcolor: tile.strong ? c.dark : 'transparent' }}>
          <Micro color={tile.strong ? 'rgba(255,255,255,0.6)' : '#64748B'} family={MONO} size="0.28rem" spacing="0.08em">{tile.k}</Micro>
          <Box sx={{ mt: 0.2 }}>
            <Micro color={tile.strong ? '#FFFFFF' : c.dark} family={MONO} size="0.46rem" spacing="0">{tile.v}</Micro>
          </Box>
        </Box>
      ))}
    </Box>

    <Box sx={{ mx: 0.55, mb: 0.6, display: 'grid', gridTemplateColumns: '1fr 108px', gap: 0.7 }}>
      <Box sx={{ pr: 0.6, borderRight: '1px solid #E2E8F0' }}>
        <Micro color="#64748B" family={MONO} size="0.28rem" spacing="0.08em">Terms</Micro>
        <Box sx={{ mt: 0.3, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Bar w="94%" h={2.5} c="#D5D1C8" />
          <Bar w="86%" h={2.5} c="#D5D1C8" />
          <Bar w="72%" h={2.5} c="#D5D1C8" />
        </Box>
      </Box>
      <Box sx={{ border: '1px solid #D5D1C8', p: 0.5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Micro color="#94A3B8" family={MONO} size="0.26rem">Signatory</Micro>
        <Box sx={{ height: 14, border: `1px solid ${c.accent}`, opacity: 0.8 }} />
      </Box>
    </Box>
    <Box sx={{ bgcolor: c.dark, py: 0.45, textAlign: 'center', mt: 'auto' }}>
      <Micro color="#FFFFFF" family={MONO} size="0.32rem" spacing="0.16em">Official record • client copy</Micro>
    </Box>
  </Box>
);

/* 7 — Minimal Haute: wordmark · airy hairline rows · single-line total */
const ThumbWordmark = ({ c }) => (
  <Box sx={{ ...paperBase, borderRadius: 0, bgcolor: '#FFFFFF', p: 1.6 }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.55 }}>
        <Box sx={{ width: 9, height: 9, bgcolor: c.accent }} />
        <Micro color={c.dark} size="0.44rem" spacing="0.3em">Aleen</Micro>
      </Box>
      <Typography sx={{ fontSize: '1.15rem', fontWeight: 300, color: `${c.primary}55`, lineHeight: 1, letterSpacing: '-0.02em' }}>
        0042
      </Typography>
    </Box>
    <Box sx={{ mt: 0.6, height: 1, bgcolor: `${c.primary}2E` }} />

    <Box sx={{ mt: 0.7, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
      {[
        { k: 'Client', w: '68%' },
        { k: 'Date', w: '54%' },
        { k: 'Payment', w: '60%' }
      ].map((col) => (
        <Box key={col.k} sx={{ flex: 1 }}>
          <Micro color="#94A3B8" size="0.28rem" spacing="0.22em">{col.k}</Micro>
          <Box sx={{ mt: 0.25 }}>
            <Bar w={col.w} h={2.5} c="#E2E8F0" />
          </Box>
        </Box>
      ))}
    </Box>

    <Box sx={{ mt: 1 }}>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ py: 0.65, borderBottom: `1px solid ${c.primary}1F`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6, minWidth: 0 }}>
            <Micro color={c.dark} size="0.34rem" spacing="0.2em" weight={600}>Kurta Set</Micro>
            <Micro color="#94A3B8" size="0.28rem" spacing="0.1em">×2</Micro>
          </Box>
          <Typography sx={{ fontSize: '0.4rem', fontWeight: 400, color: `${c.dark}CC`, letterSpacing: '0.04em' }}>₹12,400</Typography>
        </Box>
      ))}
    </Box>

    <Box sx={{ mt: 1.1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
        <Micro color="#94A3B8" size="0.3rem" spacing="0.16em">Subtotal</Micro>
        <Typography sx={{ fontSize: '0.36rem', color: `${c.dark}AA` }}>₹31,065</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Micro color="#94A3B8" size="0.3rem" spacing="0.16em">GST</Micro>
        <Typography sx={{ fontSize: '0.36rem', color: `${c.dark}AA` }}>₹5,592</Typography>
      </Box>
      <Box sx={{ pt: 0.5, borderTop: `1px solid ${c.primary}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Micro color={c.dark} size="0.36rem" spacing="0.26em">Total</Micro>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: c.dark, letterSpacing: '-0.01em' }}>₹36,657</Typography>
      </Box>
    </Box>

    <Box sx={{ mt: 1.1, pt: 0.5, borderTop: `1px solid ${c.primary}1F`, display: 'flex', justifyContent: 'space-between' }}>
      <Micro color="#94A3B8" size="0.28rem" spacing="0.18em">Terms on file</Micro>
      <Micro color={c.accent} size="0.28rem" spacing="0.18em">Signed digitally</Micro>
    </Box>
    <Tear rule="1px solid rgba(34,28,58,0.14)" color="rgba(34,28,58,0.5)" label="CLIENT COPY" />
  </Box>
);

/* 8 — Boutique Slip: monospace counter slip with dashed separators */
const BARCODE_PATTERN = {
  backgroundImage:
    'repeating-linear-gradient(90deg, #0F172A 0 2px, transparent 2px 4px, #0F172A 4px 5px, transparent 5px 8px, #0F172A 8px 9px, transparent 9px 12px)'
};

const ThumbReceipt = ({ c }) => (
  <Box sx={{ ...paperBase, bgcolor: '#FFFFFF', p: 1, borderRadius: 0.5 }}>
    <Box sx={{ mx: 'auto', width: '72%', fontFamily: MONO, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Micro color={c.dark} family={MONO} size="0.5rem" weight={800} spacing="0.14em" align="center">ALEEN</Micro>
        <Micro color="#64748B" family={MONO} size="0.28rem" spacing="0.06em" align="center">Boutique &amp; Bespoke Atelier</Micro>
        <Box sx={{ mt: 0.35, mx: 'auto', display: 'inline-block', px: 0.5, py: 0.2, bgcolor: '#F1F5F9', borderRadius: 0.25 }}>
          <Micro color={c.dark} family={MONO} size="0.32rem" spacing="0.04em">RETAIL SLIP #AL-0042</Micro>
        </Box>
      </Box>
      <Box sx={{ my: 0.5, borderTop: `1px dashed ${c.accent}` }} />
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ mb: 0.4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Micro color={c.dark} family={MONO} size="0.32rem" spacing="0.02em">Kurta Set</Micro>
            <Micro color={c.dark} family={MONO} size="0.32rem" spacing="0.02em">₹12,400</Micro>
          </Box>
          <Micro color="#94A3B8" family={MONO} size="0.28rem" spacing="0.02em">2 x ₹6,200.00</Micro>
        </Box>
      ))}
      <Box sx={{ my: 0.5, borderTop: `1px dashed ${c.accent}` }} />
      {[
        { k: 'SUBTOTAL', v: '31,065.00' },
        { k: 'GST 18%', v: '5,592.00' },
        { k: 'CASH', v: '-6,000.00' }
      ].map((row) => (
        <Box key={row.k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Micro color="#64748B" family={MONO} size="0.3rem" spacing="0.02em">{row.k}</Micro>
          <Micro color={c.dark} family={MONO} size="0.3rem" spacing="0.02em">{row.v}</Micro>
        </Box>
      ))}
      <Box sx={{ mt: 0.4, px: 0.5, py: 0.4, bgcolor: c.dark, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Micro color="#FFFFFF" family={MONO} size="0.36rem" spacing="0.06em">TOTAL</Micro>
        <Micro color="#FFFFFF" family={MONO} size="0.42rem" spacing="0.02em">₹36,657</Micro>
      </Box>
      <Box
        sx={{
          mt: 0.5,
          mx: 'auto',
          width: '62%',
          height: 16,
          border: `1px solid ${c.softBorder}`,
          borderRadius: 0.25,
          ...BARCODE_PATTERN
        }}
      />
      <Box sx={{ mt: 0.5, textAlign: 'center' }}>
        <Micro color="#64748B" family={MONO} size="0.3rem" spacing="0.08em" align="center">Thank you!</Micro>
      </Box>
      <Tear rule="2px dashed #CBD5E1" color="#94A3B8" family={MONO} label="✂ ┈┈ CLIENT COPY ┈┈ ✂" />
    </Box>
  </Box>
);

const HEADER_THUMBS = {
  banner: ThumbBanner,
  crest: ThumbCrest,
  rail: ThumbRail,
  masthead: ThumbMasthead,
  'framed-crest': ThumbFramed,
  'data-strip': ThumbDataStrip,
  wordmark: ThumbWordmark,
  receipt: ThumbReceipt
};

const paletteOf = (tmpl) => ({
  primary: tmpl.primaryColor,
  accent: tmpl.secondaryColor,
  dark: tmpl.darkColor,
  headerBg: tmpl.headerBg,
  tint: `${tmpl.primaryColor}14`,
  softBorder: `${tmpl.primaryColor}3D`
});

const TemplateThumb = ({ tmpl }) => {
  const Thumb = HEADER_THUMBS[tmpl?.format?.header] || ThumbBanner;
  return <Thumb c={paletteOf(tmpl)} />;
};

export default TemplateThumb;
