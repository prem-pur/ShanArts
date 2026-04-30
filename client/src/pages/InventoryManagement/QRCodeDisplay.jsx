import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const BRAND = {
    companyName: 'Shan Art Advertising',
    logoUrl: '/logo.png',
};

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}

export async function generateMaterialQrCardPng({ qrDataUrl, material }) {
    // "Warehouse label" style (intentionally different from staff QR card)
    const width = 980;
    const height = 520;
    const scale = Math.min(2, Math.max(1, Math.floor(window.devicePixelRatio || 1)));

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.scale(scale, scale);

    // Background (light / print-friendly)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Outer label card
    const cardX = 40;
    const cardY = 36;
    const cardW = width - 80;
    const cardH = height - 72;
    const r = 22;

    ctx.save();
    ctx.shadowColor = 'rgba(2, 6, 23, 0.12)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, cardY, cardW, cardH, r);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(2, 6, 23, 0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardY, cardW, cardH, r);
    ctx.stroke();

    // Header strip (blue/teal - distinct from staff red)
    const headerH = 88;
    const headerGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + headerH);
    headerGrad.addColorStop(0, '#0ea5e9');
    headerGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = headerGrad;
    roundRect(ctx, cardX, cardY, cardW, headerH, r);
    ctx.fill();
    ctx.fillRect(cardX, cardY + headerH - r, cardW, r);

    // Logo (contain)
    const logoBox = 62;
    const logoX = cardX + cardW - 26 - logoBox;
    const logoY = cardY + 14;
    let logoDrawn = false;
    try {
        const logoImg = await loadImage(BRAND.logoUrl);
        const pad = 10;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        roundRect(ctx, logoX, logoY, logoBox, logoBox, 18);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const targetW = logoBox - pad * 2;
        const targetH = logoBox - pad * 2;
        const s = Math.min(targetW / logoImg.width, targetH / logoImg.height);
        const drawW = Math.max(1, Math.floor(logoImg.width * s));
        const drawH = Math.max(1, Math.floor(logoImg.height * s));
        const dx = logoX + Math.floor((logoBox - drawW) / 2);
        const dy = logoY + Math.floor((logoBox - drawH) / 2);
        ctx.drawImage(logoImg, dx, dy, drawW, drawH);
        ctx.restore();
        logoDrawn = true;
    } catch {
        // fallback below
    }

    if (!logoDrawn) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(logoX + logoBox / 2, logoY + logoBox / 2, logoBox / 2 + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111827';
        ctx.font = '800 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SA', logoX + logoBox / 2, logoY + logoBox / 2);
        ctx.restore();
    }

    // Header text
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textBaseline = 'top';
    ctx.fillText('Material QR Label', cardX + 26, cardY + 18);
    ctx.globalAlpha = 0.94;
    ctx.font = '700 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(BRAND.companyName, cardX + 26, cardY + 48);
    ctx.restore();

    // Content
    const contentX = cardX + 26;
    const contentY = cardY + headerH + 22;

    // Left: QR panel
    const qrPanelX = contentX;
    const qrPanelY = contentY;
    const qrPanelW = 360;
    const qrPanelH = cardH - headerH - 44;

    ctx.save();
    ctx.fillStyle = '#f1f5f9';
    roundRect(ctx, qrPanelX, qrPanelY, qrPanelW, qrPanelH, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, qrPanelX, qrPanelY, qrPanelW, qrPanelH, 18);
    ctx.stroke();
    ctx.restore();

    const qrImg = await loadImage(qrDataUrl);
    const qrSize = 260;
    const qrX = qrPanelX + Math.floor((qrPanelW - qrSize) / 2);
    const qrY = qrPanelY + 40;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.10)';
    ctx.lineWidth = 2;
    roundRect(ctx, qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 20);
    ctx.stroke();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.font = '800 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('SCAN', qrPanelX + qrPanelW / 2, qrPanelY + qrPanelH - 18);
    ctx.restore();

    // Right: material details panel
    const detailsX = qrPanelX + qrPanelW + 22;
    const detailsY = contentY;
    const detailsW = cardX + cardW - 26 - detailsX;
    const detailsH = qrPanelH;

    // Title + meta
    const safeName = String(material?.name || '').trim() || 'Material';
    const nameText = safeName.length > 28 ? `${safeName.slice(0, 27)}…` : safeName;
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.font = '900 40px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textBaseline = 'top';
    ctx.fillText(nameText, detailsX + 18, detailsY + 16);

    // Chips
    const chipY = detailsY + 74;
    const chips = [
        material?.category ? { label: 'Category', value: String(material.category) } : null,
        material?.unit ? { label: 'Unit', value: String(material.unit) } : null,
    ].filter(Boolean);

    let chipX = detailsX + 18;
    ctx.font = '800 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    chips.forEach((c) => {
        const text = `${c.label}: ${c.value}`;
        const w = Math.ceil(ctx.measureText(text).width) + 22;
        ctx.fillStyle = '#ecfeff';
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 2;
        roundRect(ctx, chipX, chipY, w, 32, 999);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f766e';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, chipX + 11, chipY + 16);
        chipX += w + 10;
    });

    // Main info row (keep layout compact; category/unit already shown as chips)
    const idText = String(material?._id || '').trim() || '—';
    const rowY = detailsY + 130;
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, detailsX + 18, rowY, detailsW - 36, 66, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.06)';
    ctx.lineWidth = 2;
    roundRect(ctx, detailsX + 18, rowY, detailsW - 36, 66, 16);
    ctx.stroke();

    ctx.fillStyle = 'rgba(2, 6, 23, 0.62)';
    ctx.font = '800 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textBaseline = 'top';
    ctx.fillText('MATERIAL ID', detailsX + 32, rowY + 14);

    ctx.fillStyle = '#020617';
    ctx.font = '800 15px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    ctx.fillText(idText, detailsX + 32, rowY + 34);

    // Footer (fixed to card bottom so it never overlaps content)
    ctx.fillStyle = 'rgba(2, 6, 23, 0.60)';
    ctx.font = '700 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Printing System · Material Label', detailsX + 18, cardY + cardH - 18);
    ctx.restore();

    return canvas.toDataURL('image/png');
}

const QRCodeDisplay = ({ material, onClose }) => {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQR = async () => {
            try {
                // Use existing qrCode on material if available
                if (material.qrCode) {
                    setQrData({ qrCode: material.qrCode, name: material.name });
                    setLoading(false);
                    return;
                }
                // Otherwise fetch/regenerate from server
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/inventory/qr/${material._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQrData(response.data.data);
            } catch (err) {
                setError('Failed to load QR code');
            } finally {
                setLoading(false);
            }
        };
        fetchQR();
    }, [material]);

    const downloadQR = async () => {
        if (!qrData?.qrCode) return;
        try {
            const png = await generateMaterialQrCardPng({ qrDataUrl: qrData.qrCode, material });
            const link = document.createElement('a');
            link.href = png;
            link.download = `material_qr_${String(material?.name || 'material').replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error('Failed to generate material QR card', e);
            // Fallback: raw QR
            const link = document.createElement('a');
            link.href = qrData.qrCode;
            link.download = `qr-${material.name.replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const printQRCard = async () => {
        if (!qrData?.qrCode) return;
        try {
            const png = await generateMaterialQrCardPng({ qrDataUrl: qrData.qrCode, material });
            // Use a Blob URL (more reliable than document.write in some browsers)
            const safeTitle = `Material QR - ${String(material?.name || 'Material')}`.replace(/</g, '&lt;');
            const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      @page { margin: 12mm; }
      html, body { height: 100%; }
      body {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8fafc;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      }
      .wrap { padding: 20px; }
      img {
        max-width: 980px;
        width: 100%;
        height: auto;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 18px 40px rgba(2,6,23,0.18);
      }
      @media print {
        body { background: #fff; }
        .wrap { padding: 0; }
        img { box-shadow: none; border-radius: 0; max-width: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <img id="card" src="${png}" alt="Material QR Card" />
    </div>
    <script>
      const img = document.getElementById('card');
      img.onload = () => { setTimeout(() => { window.print(); }, 150); };
    </script>
  </body>
</html>`;

            const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
            const w = window.open(blobUrl, '_blank', 'width=1100,height=700');
            if (!w) {
                // If popup blocked, fall back to normal print
                window.print();
                return;
            }
            // Cleanup blob url after the window had time to load.
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
            w.focus();
        } catch (e) {
            console.error('Failed to print QR card', e);
            window.print();
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '36px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                textAlign: 'center',
                position: 'relative',
            }}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'none', border: 'none',
                        fontSize: '22px', cursor: 'pointer', color: '#9ca3af',
                    }}
                >×</button>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                    QR Code
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    {material.name} · {material.category} · {material.unit}
                </p>

                {loading && (
                    <div style={{ padding: '40px', color: '#9ca3af' }}>Generating QR code…</div>
                )}

                {error && (
                    <div style={{ color: '#dc2626', padding: '20px' }}>{error}</div>
                )}

                {qrData?.qrCode && !loading && (
                    <>
                        <div style={{
                            display: 'inline-block',
                            padding: '16px',
                            background: '#f9fafb',
                            borderRadius: '16px',
                            border: '1.5px solid #e5e7eb',
                            marginBottom: '20px',
                        }}>
                            <img
                                src={qrData.qrCode}
                                alt={`QR for ${material.name}`}
                                style={{ width: '200px', height: '200px', display: 'block' }}
                            />
                        </div>

                        <div style={{
                            background: '#f3f4f6',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            fontSize: '11px',
                            color: '#6b7280',
                            marginBottom: '20px',
                            wordBreak: 'break-all',
                            textAlign: 'left',
                        }}>
                            <strong>Material ID:</strong> {material._id}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={downloadQR}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#111827',
                                    color: '#fff',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                ⬇️ Download QR Card
                            </button>
                            <button
                                onClick={printQRCard}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e5e7eb',
                                    background: '#fff',
                                    color: '#374151',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                🖨️ Print
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QRCodeDisplay;
