import React, { useRef, useState } from "react";
import axios from "axios";
import {
    X,
    Save,
    RefreshCw,
    Upload,
    Check,
    Image as ImageIcon,
    FileUp,
    FileText,
    AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "../../apiBase";

const DesignEditor = ({ order, onClose }) => {
    const fileInputRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(order.currentVersionId?.pngFilePath ? `${API_BASE_URL}${order.currentVersionId.pngFilePath}` : null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        processFile(file);
    };

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert("Please upload an image file (PNG, JPG, etc.)");
            return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!previewUrl || (!selectedFile && !order.currentVersionId)) {
            alert("Please upload a design first");
            return;
        }

        setIsSaving(true);
        try {
            // If it's a new file, we already have it in previewUrl as base64
            // If nothing changed, we don't strictly need to save, but let's assume update
            const base64Data = previewUrl.startsWith('data:') ? previewUrl : null;

            if (!base64Data && !selectedFile) {
                alert("No changes to save");
                setIsSaving(false);
                return;
            }

            await axios.post(`${API_BASE_URL}/api/orders/save-version`, {
                orderId: order._id,
                imageBase64: base64Data, // Existing backend expects base64
                designData: { type: 'uploaded_design', fileName: selectedFile?.name },
                nextStatus: 'Draft'
            });

            alert("Design Saved Successfully!");
            onClose(true);
        } catch (err) {
            console.error(err);
            alert("Failed to save design");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ background: "var(--bg-color)", padding: "24px 48px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minHeight: '100vh', animation: 'fadeIn 0.3s ease-out' }}>

            {/* Header */}
            <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Design Studio</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Order #{order?.orderId || order?._id?.slice(-8).toUpperCase()}</span>
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }} />
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{order?.customerName}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => onClose(false)} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={isSaving || !previewUrl} style={{ background: 'var(--accent-color)', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: (isSaving || !previewUrl) ? 'not-allowed' : 'pointer', opacity: (isSaving || !previewUrl) ? 0.6 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--accent-glow)' }}>
                        {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? "Saving..." : "Save Design"}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Upload Zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); }}
                    style={{
                        background: 'var(--card-bg)',
                        border: `2px dashed ${isDragging ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        borderRadius: '24px',
                        padding: '60px 40px',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        position: 'relative',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                    onClick={() => !previewUrl && fileInputRef.current?.click()}
                >
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />

                    {!previewUrl ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '14px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                <Upload size={32} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Upload Final Design</h3>
                                <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Drop files from Photoshop / Illustrator or click to browse</p>
                            </div>
                            <div style={{ background: '#edf2f7', padding: '8px 20px', borderRadius: '12px', fontSize: '12px', color: '#4a5568', fontWeight: '700', letterSpacing: '0.2px' }}>
                                PSD, AI, EPS, PNG or high-res JPG
                            </div>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <img src={previewUrl} alt="Design Preview" style={{ maxWidth: '100%', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', maxHeight: '500px', display: 'block', margin: '0 auto' }} />
                            <div style={{ position: 'absolute', top: '-12px', right: '-12px', display: 'flex', gap: '8px' }}>
                                <button onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setSelectedFile(null); }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <X size={22} />
                                </button>
                            </div>
                            {selectedFile && (
                                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#16a34a', fontSize: '14px', fontWeight: '700' }}>
                                    <Check size={18} strokeWidth={3} /> {selectedFile.name} ready for secure upload
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Design Specs */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
                        <FileText size={20} strokeWidth={2.5} />
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Design Specs</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Design Type:</span>
                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '800' }}>{order?.printSpecs?.designType || 'Poster'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Dimensions:</span>
                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '800' }}>
                                {order?.printSpecs?.size ?
                                    `${order.printSpecs.size.width}x${order.printSpecs.size.height || 0} ${order.printSpecs.size.unit || 'mm'}` :
                                    '297x420 mm'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Assets (If available) */}
                {order.uploadedFiles && order.uploadedFiles.length > 0 && (
                    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1e293b' }}>
                            <ImageIcon size={20} strokeWidth={2.5} />
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Reference Assets</h4>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {order.uploadedFiles.map((file, idx) => (
                                <div key={idx} style={{ minWidth: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9', background: '#f8fafc', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                                    <img src={`${API_BASE_URL}${file.filePath}`} alt="asset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                .animate-spin { animation: spin 1s linear infinite; } 
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default DesignEditor;
