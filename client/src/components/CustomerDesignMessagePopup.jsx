import React from "react";
import { X, MessageCircle, Image as ImageIcon } from "lucide-react";

/**
 * Shows the same text staff sent (AI or default) when sharing a design for review.
 */
export default function CustomerDesignMessagePopup({
    isOpen,
    orderNumber,
    jobType,
    message,
    onAcknowledge,
    onReviewDesign,
}) {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-design-msg-title"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100001,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                background: "rgba(6, 8, 16, 0.85)",
                backdropFilter: "blur(10px)",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 500,
                    borderRadius: 20,
                    border: "1px solid var(--border-color)",
                    background: "var(--card-bg)",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.2), 0 0 40px rgba(99, 102, 241, 0.08)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        padding: "18px 20px 0",
                        gap: 12,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: "rgba(99, 102, 241, 0.15)",
                                border: "1px solid rgba(99, 102, 241, 0.35)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--accent-color)",
                            }}
                        >
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <h2
                                id="customer-design-msg-title"
                                style={{
                                    margin: 0,
                                    fontSize: 17,
                                    fontWeight: 800,
                                    color: "var(--text-primary)",
                                    fontFamily: "var(--font-sans)",
                                }}
                            >
                                Message from the studio
                            </h2>
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                                {orderNumber}
                                {jobType ? ` · ${String(jobType).replace(/_/g, " ")}` : ""}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onAcknowledge()}
                        style={{
                            background: "var(--surface-muted)",
                            border: "1px solid var(--border-color)",
                            borderRadius: 10,
                            padding: 8,
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            display: "flex",
                            flexShrink: 0,
                        }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: "16px 20px 20px" }}>
                    <div
                        style={{
                            fontSize: 14,
                            lineHeight: 1.65,
                            color: "var(--text-primary)",
                            whiteSpace: "pre-wrap",
                            background: "var(--input-bg, rgba(0,0,0,0.2))",
                            border: "1px solid var(--border-color)",
                            borderRadius: 12,
                            padding: "14px 16px",
                            maxHeight: 280,
                            overflow: "auto",
                        }}
                    >
                        {message}
                    </div>
                    <p
                        style={{
                            margin: "12px 0 0",
                            fontSize: 12,
                            color: "var(--text-muted)",
                            lineHeight: 1.45,
                        }}
                    >
                        You can open the design review anytime from <strong>Recent projects</strong> or{" "}
                        <strong>My orders</strong> while this order is waiting for your approval.
                    </p>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 10,
                            marginTop: 18,
                            justifyContent: "flex-end",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => onAcknowledge()}
                            style={btnSecondary(false)}
                        >
                            Got it
                        </button>
                        {typeof onReviewDesign === "function" && (
                            <button
                                type="button"
                                onClick={() => onReviewDesign()}
                                style={btnPrimary(false)}
                            >
                                <ImageIcon size={16} style={{ marginRight: 6 }} />
                                Review design
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function btnSecondary(disabled) {
    return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-muted-2)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-color)",
        padding: "10px 16px",
        borderRadius: 10,
        fontWeight: 700,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontFamily: "var(--font-sans)",
    };
}

function btnPrimary(disabled) {
    return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--accent-color)",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: 10,
        fontWeight: 800,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        boxShadow: "0 4px 20px var(--accent-glow)",
        fontFamily: "var(--font-sans)",
    };
}
