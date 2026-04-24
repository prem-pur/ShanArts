import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { X, Copy, RefreshCw, Loader2, Send } from "lucide-react";
import { API_BASE_URL } from "../apiBase";

const SCENARIOS = [
    { value: "draft_for_approval", label: "Design preview (first review)" },
    { value: "revision", label: "Updated design (after revisions)" },
    { value: "final_confirmation", label: "Final confirmation" },
];

/**
 * Modal: AI-generated message for the customer, editable before "send design" completes.
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {(message: string) => void} onConfirm — runs after user confirms; parent performs submit-design
 * @param {() => Record<string, unknown>} getPayload — order/design fields for POST /api/ai/generate-design-message
 */
export default function SendDesignToCustomerModal({ isOpen, onClose, onConfirm, getPayload }) {
    const [scenario, setScenario] = useState("draft_for_approval");
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [copyHint, setCopyHint] = useState("");

    /** `scen` always passed explicitly to avoid stale state when the modal first opens. */
    const fetchMessage = useCallback(
        async (scen) => {
            setErr("");
            setCopyHint("");
            setLoading(true);
            try {
                const base = getPayload() || {};
                const token = localStorage.getItem("token");
                const { data } = await axios.post(
                    `${API_BASE_URL}/api/ai/generate-design-message`,
                    { ...base, scenario: scen },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (data?.message) {
                    setText(String(data.message));
                } else {
                    setText("");
                    setErr("No message was returned. Try again or edit manually.");
                }
            } catch (e) {
                const msg = e.response?.data?.message || e.message || "Failed to generate message";
                setErr(msg);
            } finally {
                setLoading(false);
            }
        },
        [getPayload]
    );

    // Open: sync default scenario from payload, then generate
    useEffect(() => {
        if (!isOpen) return;
        setText("");
        setErr("");
        setCopyHint("");
        const base = getPayload() || {};
        const sc =
            base.scenario && SCENARIOS.some((o) => o.value === base.scenario)
                ? base.scenario
                : "draft_for_approval";
        setScenario(sc);
        fetchMessage(sc);
    }, [isOpen, getPayload, fetchMessage]);

    const handleCopy = async () => {
        if (!text.trim()) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopyHint("Copied to clipboard");
            setTimeout(() => setCopyHint(""), 2500);
        } catch {
            setCopyHint("Could not copy");
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <style>{`@keyframes sendDesignSpin { to { transform: rotate(360deg); } }`}</style>
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="send-design-modal-title"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                background: "rgba(6, 8, 16, 0.78)",
                backdropFilter: "blur(8px)",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 520,
                    maxHeight: "90vh",
                    overflow: "auto",
                    borderRadius: 18,
                    border: "1px solid var(--card-border, rgba(255,255,255,0.08))",
                    background: "linear-gradient(165deg, var(--card-bg, #111520) 0%, #0a0c12 100%)",
                    boxShadow: "var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.45))",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.08))",
                    }}
                >
                    <h2
                        id="send-design-modal-title"
                        style={{
                            margin: 0,
                            fontSize: 17,
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-sans)",
                        }}
                    >
                        Send Design to Customer
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "var(--surface-muted)",
                            border: "1px solid var(--border-color)",
                            borderRadius: 10,
                            padding: 8,
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            display: "flex",
                        }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: "16px 20px 20px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: 11,
                            fontWeight: 800,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                        }}
                    >
                        Message type
                    </label>
                    <select
                        className="shan-input"
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        style={{ width: "100%", marginBottom: 14, padding: "10px 12px" }}
                    >
                        {SCENARIOS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    <p
                        style={{
                            margin: "0 0 10px",
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            lineHeight: 1.5,
                        }}
                    >
                        Review or edit the message below. The customer will see it in their notification when you confirm.
                    </p>

                    <textarea
                        className="shan-input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={12}
                        placeholder={loading ? "Generating…" : "Message to customer…"}
                        disabled={loading}
                        style={{
                            width: "100%",
                            resize: "vertical",
                            minHeight: 200,
                            fontSize: 13,
                            lineHeight: 1.55,
                            boxSizing: "border-box",
                        }}
                    />

                    {err && (
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 12,
                                color: "#f87171",
                                background: "rgba(248, 113, 113, 0.1)",
                                border: "1px solid rgba(248, 113, 113, 0.25)",
                                borderRadius: 8,
                                padding: "8px 10px",
                            }}
                        >
                            {err}
                        </div>
                    )}
                    {copyHint && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "var(--accent-color)" }}>{copyHint}</div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 16,
                            justifyContent: "flex-end",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => fetchMessage(scenario)}
                            disabled={loading}
                            style={secondaryBtn(loading)}
                        >
                            {loading ? (
                                <Loader2 size={16} style={{ animation: "sendDesignSpin 0.7s linear infinite" }} />
                            ) : (
                                <RefreshCw size={16} />
                            )}
                            <span style={{ marginLeft: 6 }}>Regenerate with AI</span>
                        </button>
                        <button type="button" onClick={handleCopy} disabled={!text.trim() || loading} style={secondaryBtn(!text.trim() || loading)}>
                            <Copy size={16} />
                            <span style={{ marginLeft: 6 }}>Copy Message</span>
                        </button>
                        <button type="button" onClick={onClose} style={secondaryBtn(false)}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => onConfirm(text.trim())}
                            disabled={loading || !text.trim()}
                            style={primaryBtn(loading || !text.trim())}
                        >
                            <Send size={16} />
                            <span style={{ marginLeft: 6 }}>Confirm and Send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

function secondaryBtn(disabled) {
    return {
        display: "inline-flex",
        alignItems: "center",
        background: "var(--surface-muted-2)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-color)",
        padding: "10px 14px",
        borderRadius: 10,
        fontWeight: 700,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "var(--font-sans)",
    };
}

function primaryBtn(disabled) {
    return {
        display: "inline-flex",
        alignItems: "center",
        background: "var(--accent-color)",
        color: "#fff",
        border: "none",
        padding: "10px 16px",
        borderRadius: 10,
        fontWeight: 800,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        boxShadow: "0 4px 20px var(--accent-glow)",
        fontFamily: "var(--font-sans)",
    };
}
