import React from 'react';
import { Box } from '@mui/material';

/**
 * AtelierDoodles
 * Bespoke hand-drawn couture & tailoring vector doodles
 * Set on a clean, complete white background (#FFFFFF)
 */
export default function AtelierDoodles() {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 540,
        mx: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <svg
        viewBox="0 0 560 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Soft decorative background circles (ultra-subtle warm tones) */}
        <circle cx="280" cy="250" r="190" fill="#FAFAF9" />
        <circle cx="390" cy="140" r="70" fill="#FDFBF7" />

        {/* -------------------------------------------------------------
            1. COUTURE DRESS FORM / MANNEQUIN (Center-Left Anchor)
            ------------------------------------------------------------- */}
        <g id="dress-form" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Finial / Neck topper */}
          <path d="M 230 75 Q 230 65 240 65 Q 250 65 250 75 Z" fill="#D4AF37" stroke="#9A7B1C" strokeWidth="1.5" />
          <line x1="235" y1="75" x2="245" y2="75" stroke="#9A7B1C" strokeWidth="1.5" />

          {/* Neck base */}
          <ellipse cx="240" cy="88" rx="14" ry="4" fill="#FFFFFF" />

          {/* Torso contour */}
          <path
            d="M 226 89 
               C 210 94, 192 110, 192 135
               C 192 165, 218 185, 218 215
               C 218 245, 194 275, 190 320
               C 210 326, 270 326, 290 320
               C 286 275, 262 245, 262 215
               C 262 185, 288 165, 288 135
               C 288 110, 270 94, 254 89
               Z"
            fill="#FFFFFF"
          />

          {/* Princess seams (couture tailor dashed lines) */}
          <path
            d="M 215 125 C 224 165, 222 235, 212 323"
            stroke="#64748B"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M 265 125 C 256 165, 258 235, 268 323"
            stroke="#64748B"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Center chest line */}
          <line x1="240" y1="92" x2="240" y2="324" stroke="#D4AF37" strokeWidth="1.75" />

          {/* Bust reference curve */}
          <path d="M 210 145 Q 240 160 270 145" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Stand Pole */}
          <line x1="240" y1="324" x2="240" y2="445" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="240" cy="350" r="5" fill="#D4AF37" stroke="#0F172A" strokeWidth="2" />

          {/* Wooden Tripod Base */}
          <path
            d="M 240 440 C 230 465, 205 488, 185 495
               M 240 440 C 250 465, 275 488, 295 495
               M 240 440 L 240 498"
            stroke="#0F172A"
            strokeWidth="3.2"
          />
          <circle cx="185" cy="495" r="3.5" fill="#0F172A" />
          <circle cx="295" cy="495" r="3.5" fill="#0F172A" />
          <circle cx="240" cy="498" r="3.5" fill="#0F172A" />
        </g>

        {/* -------------------------------------------------------------
            2. VINTAGE TAILOR SCISSORS (Top-Right Angle)
            ------------------------------------------------------------- */}
        <g id="tailor-shears" transform="translate(370, 75) rotate(22)" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Blade 1 */}
          <path d="M 20 50 L 115 15 C 118 14, 122 18, 118 22 L 20 60 Z" fill="#F8FAFC" />
          {/* Blade 2 */}
          <path d="M 20 60 L 120 70 C 124 72, 122 77, 117 76 L 20 50 Z" fill="#F1F5F9" />
          {/* Pivot Screw */}
          <circle cx="22" cy="55" r="5" fill="#D4AF37" stroke="#0F172A" strokeWidth="2" />
          {/* Handle Loop 1 */}
          <path
            d="M 20 50 C 10 40, -10 30, -25 45 C -40 60, -25 80, -10 75 C 5 70, 15 62, 20 60"
            fill="#FFFFFF"
            strokeWidth="2.5"
          />
          {/* Handle Loop 2 (Oblong) */}
          <path
            d="M 20 60 C 10 75, -5 95, -20 90 C -35 85, -40 105, -25 115 C -5 125, 10 95, 20 70"
            fill="#FFFFFF"
            strokeWidth="2.5"
          />
        </g>

        {/* Cutting Path (Dashed trail from scissors) */}
        <path
          d="M 470 145 C 505 170, 520 210, 485 240 C 450 270, 435 295, 460 330"
          stroke="#94A3B8"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          strokeLinecap="round"
        />

        {/* -------------------------------------------------------------
            3. LUXURY ATELIER HANGER (Top-Left)
            ------------------------------------------------------------- */}
        <g id="hanger" transform="translate(65, 110) rotate(-12)" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Brass hook */}
          <path
            d="M 60 40 C 60 25, 75 10, 85 22 C 95 35, 75 48, 75 60"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2.2"
          />
          {/* Triangular wooden body */}
          <path
            d="M 75 60 L 5 95 C 1 97, 3 103, 8 102 L 75 88 L 142 102 C 147 103, 149 97, 145 95 Z"
            fill="#FFFFFF"
          />
          {/* Horizontal crossbar */}
          <line x1="15" y1="100" x2="135" y2="100" stroke="#0F172A" strokeWidth="1.8" />
        </g>

        {/* -------------------------------------------------------------
            4. MEASURING TAPE (Curving through lower center-right)
            ------------------------------------------------------------- */}
        <g id="measuring-tape" stroke="#0F172A" strokeLinecap="round" strokeLinejoin="round">
          {/* Yellow/Cream Tape Body */}
          <path
            d="M 330 395 
               C 365 375, 420 380, 445 415 
               C 470 450, 430 485, 395 480 
               C 360 475, 345 440, 375 425 
               C 405 410, 435 435, 475 425"
            fill="none"
            stroke="#FEF08A"
            strokeWidth="18"
          />
          <path
            d="M 330 395 
               C 365 375, 420 380, 445 415 
               C 470 450, 430 485, 395 480 
               C 360 475, 345 440, 375 425 
               C 405 410, 435 435, 475 425"
            fill="none"
            stroke="#0F172A"
            strokeWidth="2"
          />
          {/* Tick marks on tape */}
          {[
            { x1: 345, y1: 382, x2: 348, y2: 392 },
            { x1: 360, y1: 377, x2: 363, y2: 387 },
            { x1: 375, y1: 376, x2: 377, y2: 386 },
            { x1: 395, y1: 379, x2: 395, y2: 390 },
            { x1: 415, y1: 388, x2: 412, y2: 399 },
            { x1: 432, y1: 402, x2: 426, y2: 411 },
            { x1: 445, y1: 422, x2: 436, y2: 428 },
            { x1: 440, y1: 445, x2: 430, y2: 447 },
            { x1: 420, y1: 466, x2: 415, y2: 457 },
            { x1: 395, y1: 474, x2: 396, y2: 463 }
          ].map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#0F172A"
              strokeWidth={i % 2 === 0 ? "1.8" : "1"}
            />
          ))}
          {/* Metal tape end bracket */}
          <rect x="324" y="385" width="8" height="18" rx="2" fill="#D4AF37" stroke="#0F172A" strokeWidth="1.5" transform="rotate(-25 328 394)" />
        </g>

        {/* -------------------------------------------------------------
            5. SPOOL OF SILK THREAD & SEWING NEEDLE (Bottom Left)
            ------------------------------------------------------------- */}
        <g id="thread-spool" transform="translate(70, 335)" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Top wooden rim */}
          <ellipse cx="40" cy="25" rx="22" ry="7" fill="#F8FAFC" />
          {/* Thread body with golden thread winding */}
          <path d="M 22 25 L 25 70 C 25 73, 55 73, 55 70 L 58 25 Z" fill="#FEF3C7" stroke="#0F172A" strokeWidth="1.8" />
          {/* Thread winding lines */}
          <line x1="23" y1="36" x2="57" y2="36" stroke="#D4AF37" strokeWidth="1.5" />
          <line x1="24" y1="46" x2="56" y2="46" stroke="#D4AF37" strokeWidth="1.5" />
          <line x1="24" y1="56" x2="56" y2="56" stroke="#D4AF37" strokeWidth="1.5" />
          {/* Bottom wooden rim */}
          <ellipse cx="40" cy="72" rx="22" ry="7" fill="#F8FAFC" />
          {/* Center hole */}
          <ellipse cx="40" cy="25" rx="6" ry="2.5" fill="#0F172A" />

          {/* Golden Thread Unwinding towards needle */}
          <path
            d="M 58 45 C 80 40, 95 65, 85 90 C 75 110, 110 120, 135 105"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="1.8"
          />
        </g>

        {/* Sewing needle */}
        <g id="needle" transform="translate(195, 415) rotate(52)" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round">
          <path d="M 0 0 L 60 0 C 65 0, 72 2, 75 2.5 L 60 5 C 0 5, 0 0, 0 0 Z" fill="#E2E8F0" />
          {/* Eye of the needle */}
          <ellipse cx="8" cy="2.5" rx="4" ry="1" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
        </g>

        {/* -------------------------------------------------------------
            6. COUTURE BUTTONS & SAFETY PIN ACCENTS
            ------------------------------------------------------------- */}
        {/* Large 4-Hole Tailor Button (Upper Right) */}
        <g id="button-1" transform="translate(425, 270)" stroke="#0F172A" strokeLinecap="round">
          <circle cx="20" cy="20" r="18" fill="#FFFFFF" strokeWidth="2" />
          <circle cx="20" cy="20" r="13" fill="#F8FAFC" strokeWidth="1.2" strokeDasharray="2 2" />
          <circle cx="15" cy="15" r="2" fill="#0F172A" />
          <circle cx="25" cy="15" r="2" fill="#0F172A" />
          <circle cx="15" cy="25" r="2" fill="#0F172A" />
          <circle cx="25" cy="25" r="2" fill="#0F172A" />
          {/* Cross stitch thread */}
          <line x1="15" y1="15" x2="25" y2="25" stroke="#D4AF37" strokeWidth="1.5" />
          <line x1="25" y1="15" x2="15" y2="25" stroke="#D4AF37" strokeWidth="1.5" />
        </g>

        {/* Small Button (Lower Left) */}
        <g id="button-2" transform="translate(150, 260) rotate(15)" stroke="#0F172A" strokeLinecap="round">
          <circle cx="12" cy="12" r="11" fill="#FFFFFF" strokeWidth="1.8" />
          <circle cx="9" cy="12" r="1.5" fill="#0F172A" />
          <circle cx="15" cy="12" r="1.5" fill="#0F172A" />
          <line x1="9" y1="12" x2="15" y2="12" stroke="#0F172A" strokeWidth="1.5" />
        </g>

        {/* Tailor Safety Pin (Left) */}
        <g id="safety-pin" transform="translate(60, 240) rotate(-40)" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round">
          {/* Head cap */}
          <rect x="35" y="0" width="16" height="9" rx="3" fill="#D4AF37" stroke="#0F172A" strokeWidth="1.5" />
          {/* Upper shaft */}
          <line x1="0" y1="3" x2="35" y2="3" />
          {/* Lower pointed shaft */}
          <line x1="0" y1="12" x2="40" y2="5" />
          {/* Spring loop */}
          <circle cx="0" cy="7.5" r="4.5" fill="#FFFFFF" />
        </g>

        {/* -------------------------------------------------------------
            7. WHIMSICAL ATELIER SKETCH MARKS & SPARKLES
            ------------------------------------------------------------- */}
        {/* Tailor Cross Marking (chalk marks) */}
        <g stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round">
          <line x1="170" y1="75" x2="182" y2="87" />
          <line x1="182" y1="75" x2="170" y2="87" />

          <line x1="330" y1="120" x2="340" y2="130" />
          <line x1="340" y1="120" x2="330" y2="130" />

          <line x1="480" y1="360" x2="490" y2="370" />
          <line x1="490" y1="360" x2="480" y2="370" />
        </g>

        {/* Elegant Sparkles / Stars ✦ (Gold accents) */}
        <g fill="#D4AF37">
          {/* Star 1 */}
          <path d="M 320 50 Q 320 62 332 62 Q 320 62 320 74 Q 320 62 308 62 Q 320 62 320 50 Z" />
          {/* Star 2 */}
          <path d="M 480 80 Q 480 88 488 88 Q 480 88 480 96 Q 480 88 472 88 Q 480 88 480 80 Z" />
          {/* Star 3 */}
          <path d="M 120 200 Q 120 208 128 208 Q 120 208 120 216 Q 120 208 112 208 Q 120 208 120 200 Z" />
          {/* Star 4 */}
          <path d="M 495 295 Q 495 302 502 302 Q 495 302 495 309 Q 495 302 488 302 Q 495 302 495 295 Z" />
        </g>

        {/* Delicate floating fabric drape line */}
        <path
          d="M 50 170 C 80 155, 120 180, 160 165"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <path
          d="M 330 460 C 350 490, 310 505, 335 515"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
    </Box>
  );
}

