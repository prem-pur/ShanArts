import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../apiBase";

const RequestList = ({ onSelectRequest }) => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/requests/pending`)
            .then(res => setRequests(res.data))
            .catch(err => console.error(err));
    }, []);

    const createOrder = async (requestId) => {
        try {
            await axios.post(`${API_BASE_URL}/api/orders/create-from-request`, {
                requestId
            });
            // Refresh or notify
            alert("Order Created! Go to Workspace.");
            window.location.reload(); // Simple reload to refresh state for now
        } catch (err) {
            console.error(err);
            alert("Error creating order");
        }
    };

    return (
        <div className="section">
            <h2>Pending Customer Requests</h2>
            <div className="list">
                {requests.length === 0 && <p>No pending requests.</p>}
                {requests.map(req => (
                    <div key={req._id} className="card request-card">
                        <h3>{req.productType} ({req.size})</h3>
                        <p><strong>Text:</strong> {req.textContent}</p>
                        <p><strong>Color:</strong> {req.colorPreferences} | <strong>Status:</strong> {req.status}</p>
                        <button onClick={() => createOrder(req._id)} className="btn primary">Accept & Create Order</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RequestList;
