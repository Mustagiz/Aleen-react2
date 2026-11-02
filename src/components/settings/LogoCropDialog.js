import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Slider,
  Tooltip,
  Typography
} from '@mui/material';
import { Check, Circle, Close, CropFree, RestartAlt, ZoomIn } from '../icons';

const FRAME = 300;
const OUTPUT = 512;
const PREVIEW = 96;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Cover-fit scale: the image always fills the square frame, so the crop never
// shows empty corners regardless of the source aspect ratio.
const coverScale = (imgEl, frame) => Math.max(frame / imgEl.naturalWidth, frame / imgEl.naturalHeight);
const drawWidth = (imgEl, frame, zoomLevel) => imgEl.naturalWidth * coverScale(imgEl, frame) * zoomLevel;
const drawHeight = (imgEl, frame, zoomLevel) => imgEl.naturalHeight * coverScale(imgEl, frame) * zoomLevel;

const maxPan = (imgEl, frame, zoomLevel) => ({
  x: Math.max(0, (drawWidth(imgEl, frame, zoomLevel) - frame) / 2),
  y: Math.max(0, (drawHeight(imgEl, frame, zoomLevel) - frame) / 2)
});

const clampPan = (imgEl, frame, zoomLevel, pan) => {
  const limit = maxPan(imgEl, frame, zoomLevel);
  return { x: clamp(pan.x, -limit.x, limit.x), y: clamp(pan.y, -limit.y, limit.y) };
};

const geometry = (imgEl, frame, zoomLevel, pan) => {
  const w = drawWidth(imgEl, frame, zoomLevel);
  const h = drawHeight(imgEl, frame, zoomLevel);
  return { w, h, x: (frame - w) / 2 + pan.x, y: (frame - h) / 2 + pan.y };
};

export default function LogoCropDialog({ open, image, onClose, onApply }) {
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [shape, setShape] = useState('square');
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef(null);
  const previewRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!open || !image) {
      setImg(null);
      return undefined;
    }
    let cancelled = false;
    const loader = new Image();
    loader.onload = () => {
      if (cancelled) return;
      setImg(loader);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    loader.onerror = () => {
      if (!cancelled) setImg(null);
    };
    loader.src = image;
    return () => {
      cancelled = true;
    };
  }, [open, image]);

  useEffect(() => {
    if (!img) return;
    setPan((prev) => {
      const next = clampPan(img, FRAME, zoom, prev);
      return next.x === prev.x && next.y === prev.y ? prev : next;
    });
  }, [img, zoom]);

  // The dialog body is portalled in after this component's effects run, so the
  // wheel listener is bound through a callback ref instead of an [open] effect.
  const wheelCleanupRef = useRef(null);
  const attachFrame = useCallback((el) => {
    if (wheelCleanupRef.current) wheelCleanupRef.current();
    frameRef.current = el;
    if (!el) return;
    const handleWheel = (event) => {
      event.preventDefault();
      setZoom((z) => clamp(Number((z * (event.deltaY < 0 ? 1.08 : 0.93)).toFixed(3)), MIN_ZOOM, MAX_ZOOM));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    wheelCleanupRef.current = () => el.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => () => {
    if (wheelCleanupRef.current) wheelCleanupRef.current();
  }, []);

  useEffect(() => {
    const canvas = frameRef.current;
    if (!open || !img || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = FRAME * dpr;
    canvas.height = FRAME * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, FRAME, FRAME);
    ctx.imageSmoothingQuality = 'high';
    const g = geometry(img, FRAME, zoom, pan);
    ctx.drawImage(img, g.x, g.y, g.w, g.h);

    if (shape === 'circle') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, FRAME, FRAME);
      ctx.arc(FRAME / 2, FRAME / 2, FRAME / 2, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.fill('evenodd');
      ctx.restore();
      ctx.beginPath();
      ctx.arc(FRAME / 2, FRAME / 2, FRAME / 2 - 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      [1, 2].forEach((i) => {
        const p = (FRAME / 3) * i;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, FRAME);
        ctx.moveTo(0, p);
        ctx.lineTo(FRAME, p);
        ctx.stroke();
      });
    }

    const preview = previewRef.current;
    if (preview) {
      const ratio = PREVIEW / FRAME;
      preview.width = PREVIEW * dpr;
      preview.height = PREVIEW * dpr;
      const pctx = preview.getContext('2d');
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pctx.fillStyle = '#FFFFFF';
      pctx.fillRect(0, 0, PREVIEW, PREVIEW);
      pctx.save();
      if (shape === 'circle') {
        pctx.beginPath();
        pctx.arc(PREVIEW / 2, PREVIEW / 2, PREVIEW / 2, 0, Math.PI * 2);
        pctx.clip();
      }
      const pg = geometry(img, PREVIEW, zoom, { x: pan.x * ratio, y: pan.y * ratio });
      pctx.drawImage(img, pg.x, pg.y, pg.w, pg.h);
      pctx.restore();
    }
  }, [open, img, zoom, pan, shape]);

  const handlePointerDown = (event) => {
    if (!img) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, origin: pan };
    setDragging(true);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || !img) return;
    setPan(clampPan(img, FRAME, zoom, {
      x: drag.origin.x + (event.clientX - drag.startX),
      y: drag.origin.y + (event.clientY - drag.startY)
    }));
  };

  const handlePointerUp = (event) => {
    if (dragRef.current && event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  };

  const exportDataUrl = useCallback(() => {
    if (!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    // A roundel keeps transparent corners so it sits on coloured invoice
    // headers without a white box behind it; the square crop stays opaque.
    if (shape === 'square') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    }
    ctx.save();
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    const scale = OUTPUT / FRAME;
    const g = geometry(img, OUTPUT, zoom, { x: pan.x * scale, y: pan.y * scale });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, g.x, g.y, g.w, g.h);
    ctx.restore();
    return canvas.toDataURL('image/png');
  }, [img, zoom, pan, shape]);

  const handleApply = () => {
    const dataUrl = exportDataUrl();
    if (dataUrl) onApply(dataUrl);
  };

  const ShapeOption = ({ value, label, icon }) => {
    const active = shape === value;
    return (
      <Box
        onClick={() => setShape(value)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShape(value)}
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          py: 0.85,
          borderRadius: '10px',
          cursor: 'pointer',
          border: '1.5px solid',
          borderColor: active ? '#D97706' : 'divider',
          bgcolor: active ? 'rgba(217, 119, 6, 0.12)' : 'transparent',
          color: active ? '#D97706' : 'text.secondary',
          fontWeight: 800,
          fontSize: '0.72rem',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          transition: 'all 0.2s ease',
          '&:hover': { borderColor: '#D97706' }
        }}
      >
        {icon}
        {label}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          border: '1px solid rgba(217, 119, 6, 0.35)',
          background: (t) => (t.palette.mode === 'dark'
            ? 'linear-gradient(160deg, #1B1B26 0%, #15151D 100%)'
            : 'linear-gradient(160deg, #FFFFFF 0%, #FDFBF7 100%)'),
          boxShadow: '0 32px 70px -20px rgba(15, 23, 42, 0.45)'
        }
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(217, 119, 6, 0.35)'
              }}
            >
              <CropFree fontSize="small" />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  fontFamily: '"Cinzel", "Playfair Display", Georgia, serif'
                }}
              >
                Crop &amp; Zoom Crest
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mt: 0.25 }}>
                Drag to reposition, scroll or slide to zoom — exports a crisp 512px square
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{
            color: 'text.secondary',
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
            '&:hover': { transform: 'rotate(90deg)' },
            transition: 'all 0.2s ease'
          }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: { xs: 'center', sm: 'flex-start' } }}>
          <Box
            sx={{
              width: FRAME,
              height: FRAME,
              borderRadius: '16px',
              overflow: 'hidden',
              border: '2px solid rgba(217, 119, 6, 0.5)',
              boxShadow: '0 16px 40px -12px rgba(15, 23, 42, 0.35)',
              flexShrink: 0
            }}
          >
            <canvas
              ref={attachFrame}
              width={FRAME}
              height={FRAME}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                width: FRAME,
                height: FRAME,
                display: 'block',
                cursor: dragging ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
            />
          </Box>

          <Box sx={{ flex: 1, width: { xs: '100%', sm: 'auto' }, minWidth: 0 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <ShapeOption value="square" label="Square" icon={<CropFree sx={{ fontSize: 16 }} />} />
              <ShapeOption value="circle" label="Roundel" icon={<Circle sx={{ fontSize: 16 }} />} />
            </Box>

            <Box sx={{ px: 0.5, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                  <ZoomIn sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Zoom
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706' }}>
                  {Math.round(zoom * 100)}%
                </Typography>
              </Box>
              <Slider
                size="small"
                value={zoom}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                marks={[{ value: 1, label: '100%' }, { value: 2.5, label: '250%' }, { value: 4, label: '400%' }]}
                onChange={(e, v) => setZoom(v)}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                sx={{ color: '#D97706', mt: 0.5 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Tooltip title="Reset crop">
                <IconButton size="small" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} sx={{
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { color: '#D97706', borderColor: '#D97706' }
                }}>
                  <RestartAlt sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {img ? `${img.naturalWidth} × ${img.naturalHeight} source` : 'Loading image…'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                component="canvas"
                ref={previewRef}
                width={PREVIEW}
                height={PREVIEW}
                sx={{
                  width: PREVIEW,
                  height: PREVIEW,
                  borderRadius: shape === 'circle' ? '50%' : '12px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#FFFFFF',
                  flexShrink: 0
                }}
              />
              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.5 }}>
                  How it will print
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.5 }}>
                  This exact crop is used on the invoice crest, the brand tile and the customer display.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!img}
          startIcon={<Check sx={{ fontSize: '16px !important' }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: '12px',
            px: 2.25,
            bgcolor: '#D97706',
            color: '#FFFFFF',
            boxShadow: '0 6px 18px rgba(217, 119, 6, 0.35)',
            '&:hover': { bgcolor: '#B45309' }
          }}
        >
          Crop &amp; Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
