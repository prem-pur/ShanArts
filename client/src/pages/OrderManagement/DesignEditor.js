import React, { useEffect, useRef, useState } from "react";
import { Canvas, Textbox, FabricImage } from "fabric";
import axios from "axios";
import { API_BASE_URL } from "../../apiBase";

const DesignEditor = ({ template, order, onClose }) => {
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedObject, setSelectedObject] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Toolbar State
    const [bgColor, setBgColor] = useState("#ffffff");
    const [textColor, setTextColor] = useState("#000000");
    const [fontSize, setFontSize] = useState(30);
    const [fontFamily, setFontFamily] = useState("Inter");

    const FONTS = ["Inter", "Roboto", "Outfit", "Arial", "Georgia", "Monospace"];

    useEffect(() => {
        if (!canvasRef.current || !template) return;

        let isMounted = true;
        let canvasInstance = null;

        const initCanvas = async () => {
            const canvas = new Canvas(canvasRef.current, {
                width: template.layoutJson.width || 800,
                height: template.layoutJson.height || 600,
                backgroundColor: "#ffffff"
            });

            canvasInstance = canvas;
            setFabricCanvas(canvas);

            // 1. Load Existing Design
            if (order.currentVersionId && order.currentVersionId.designData) {
                let designData = typeof order.currentVersionId.designData === 'string'
                    ? JSON.parse(order.currentVersionId.designData)
                    : order.currentVersionId.designData;

                if (designData.objects) {
                    designData.objects.forEach(obj => {
                        if (obj.type === 'image' || obj.src) obj.crossOrigin = 'anonymous';
                    });
                }

                try {
                    await canvas.loadFromJSON(designData);
                    if (canvas.backgroundColor) setBgColor(canvas.backgroundColor);
                    canvas.renderAll();
                    setTimeout(() => { if (isMounted) canvas.renderAll(); }, 500);
                } catch (e) {
                    console.error("Error loading design:", e);
                }
                return;
            }

            // 2. Load Template
            const requestData = order.requestId || {};
            const initialBg = requestData.colorPreferences || (template.defaultColors && template.defaultColors[0]) || "#ffffff";
            canvas.backgroundColor = initialBg;
            setBgColor(initialBg);

            if (template.layoutJson.elements) {
                template.layoutJson.elements.forEach(el => {
                    if (el.type === 'text') {
                        const textObj = new Textbox(el.text || "Text", {
                            left: el.x || 100,
                            top: el.y || 100,
                            fontSize: el.fontSize || 30,
                            fill: el.color || "#000000",
                            width: 300,
                            fontFamily: "Inter"
                        });
                        canvas.add(textObj);
                    }
                });
            }
            canvas.renderAll();
        };

        initCanvas();

        return () => {
            isMounted = false;
            if (canvasInstance) {
                canvasInstance.dispose().catch(console.error);
                setFabricCanvas(null);
            }
        };
    }, [template, order]);

    useEffect(() => {
        if (!fabricCanvas) return;
        const updateUI = () => {
            const active = fabricCanvas.getActiveObject();
            setSelectedObject(active);
            if (active && active.type === 'textbox') {
                setTextColor(active.fill);
                setFontSize(active.fontSize);
                setFontFamily(active.fontFamily);
            }
            setRefreshKey(prev => prev + 1);
        };
        fabricCanvas.on('selection:created', updateUI);
        fabricCanvas.on('selection:updated', updateUI);
        fabricCanvas.on('selection:cleared', updateUI);
        fabricCanvas.on('object:modified', updateUI);
        return () => {
            fabricCanvas.off('selection:created', updateUI);
            fabricCanvas.off('selection:updated', updateUI);
            fabricCanvas.off('selection:cleared', updateUI);
            fabricCanvas.off('object:modified', updateUI);
        };
    }, [fabricCanvas]);

    const handleSave = async () => {
        if (!fabricCanvas) return;
        setIsSaving(true);
        try {
            const dataURL = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
            const designData = fabricCanvas.toJSON();
            await axios.post(`${API_BASE_URL}/api/orders/save-version`, {
                orderId: order._id,
                imageBase64: dataURL,
                designData: designData,
                nextStatus: order.status
            });
            alert("Design Saved!");
            onClose(true);
        } catch (err) {
            console.error(err);
            alert("Save Failed");
        } finally {
            setIsSaving(false);
        }
    };

    const addAssetToCanvas = async (fileUrl) => {
        if (!fabricCanvas) return;
        try {
            const img = await FabricImage.fromURL(fileUrl, { crossOrigin: 'anonymous' });
            img.scaleToWidth(200);
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();
        } catch (err) {
            console.error("Error adding asset to canvas:", err);
            alert("Failed to add image to canvas");
        }
    };

    const addText = () => {
        if (!fabricCanvas) return;
        const text = new Textbox("New Text", {
            left: 50,
            top: 50,
            fontSize: 30,
            width: 250,
            fontFamily: "Inter",
            fill: "#000000"
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        fabricCanvas.renderAll();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !fabricCanvas) return;
        const reader = new FileReader();
        reader.onload = async (f) => {
            const data = f.target.result;
            const img = await FabricImage.fromURL(data);
            img.scaleToWidth(200);
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();
        };
        reader.readAsDataURL(file);
    };

    const updateCanvasBg = (color) => {
        setBgColor(color);
        if (fabricCanvas) {
            fabricCanvas.backgroundColor = color;
            fabricCanvas.renderAll();
        }
    };

    const updateTextProp = (prop, value) => {
        if (!fabricCanvas || !selectedObject) return;
        selectedObject.set(prop, value);
        fabricCanvas.renderAll();
        if (prop === 'fill') setTextColor(value);
        if (prop === 'fontSize') setFontSize(value);
        if (prop === 'fontFamily') setFontFamily(value);
    };

    return (
        <div className="monochrome-theme" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#f3f4f6", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1000, overflowY: "auto" }}>
            {/* Action Bar */}
            <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ color: 'var(--text-color)' }}>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>Design Editor — {order?.customerName}</h2>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        {order?.printSpecs?.designType} ({
                            order?.printSpecs?.size ?
                                `${order.printSpecs.size.width || 0}x${order.printSpecs.size.height || 0}${order.printSpecs.size.unit || 'mm'}` :
                                'Custom size'
                        })
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => onClose(false)} style={{ background: '#ffffff', border: '1px solid #e5e7eb', color: '#374151', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} style={{ background: '#1a1a1a', color: '#ffffff', border: 'none', padding: '8px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {isSaving ? "Saving..." : "Save Design"}
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ width: '100%', maxWidth: '1200px', background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', padding: '12px', marginBottom: '10px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Tools */}
                <div style={{ display: 'flex', gap: '8px', borderRight: '1px solid rgba(0,0,0,0.1)', paddingRight: '20px' }}>
                    <button onClick={addText} style={{ background: '#e5e7eb', border: 'none', color: 'var(--text-color)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>+ Add Text</button>
                    <button onClick={() => fileInputRef.current.click()} style={{ background: '#e5e7eb', border: 'none', color: 'var(--text-color)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>+ Upload Image</button>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                </div>

                {/* Canvas BG */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ color: '#94a3b8', fontSize: '12px' }}>Background:</label>
                    <input type="color" value={bgColor} onChange={(e) => updateCanvasBg(e.target.value)} style={{ width: '30px', height: '30px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                </div>

                {/* Object Specific Controls */}
                {selectedObject && selectedObject.type === 'textbox' && (
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Font:</label>
                            <select value={fontFamily} onChange={(e) => updateTextProp('fontFamily', e.target.value)} style={{ background: '#e5e7eb', color: 'var(--text-color)', border: 'none', borderRadius: '4px', padding: '4px 8px' }}>
                                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Size:</label>
                            <input type="number" value={fontSize} onChange={(e) => updateTextProp('fontSize', parseInt(e.target.value))} style={{ width: '50px', background: '#e5e7eb', color: 'var(--text-color)', border: 'none', borderRadius: '4px', padding: '4px' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Color:</label>
                            <input type="color" value={textColor} onChange={(e) => updateTextProp('fill', e.target.value)} style={{ width: '30px', height: '30px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Asset Library */}
            {order.uploadedFiles && order.uploadedFiles.length > 0 && (
                <div style={{ width: '100%', maxWidth: '1200px', background: 'rgba(0, 0, 0, 0.05)', borderRadius: '12px', padding: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Assets (Click to add to canvas)</label>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'thin' }}>
                        {order.uploadedFiles.map((file, idx) => (
                            <div
                                key={idx}
                                onClick={() => addAssetToCanvas(`${API_BASE_URL}${file.filePath}`)}
                                style={{
                                    minWidth: '60px',
                                    height: '60px',
                                    background: '#e5e7eb',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                                title={file.fileName}
                            >
                                <img src={`${API_BASE_URL}${file.filePath}`} alt={file.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Canvas Area */}
            <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", flexShrink: 0 }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

export default DesignEditor;
