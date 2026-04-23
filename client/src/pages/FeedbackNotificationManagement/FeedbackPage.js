import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { 
    MessageSquare, 
    Star, 
    Users, 
    Truck, 
    Banknote, 
    FileText, 
    Filter, 
    RefreshCcw, 
    Plus, 
    X, 
    CheckCircle2, 
    Trash2, 
    Clock, 
    User, 
    Lock, 
    Flag,
    Search,
    ShieldCheck,
    Send,
    AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';

const FeedbackPage = () => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [respondingId, setRespondingId] = useState('');
    const [responseDrafts, setResponseDrafts] = useState({});
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState('');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdminView = user.role === 'admin' || user.role === 'staff_system';

    const [formData, setFormData] = useState({
        rating: 5,
        comment: '',
        category: 'service',
        orderNumber: '',
    });

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        category: '',
        minRating: '',
        maxRating: '',
        startDate: '',
        endDate: '',
        resolved: ''
    });

    const buildQueryString = (filterObj) => {
        const params = new URLSearchParams();
        params.append('limit', '200');
        params.append('sort', '-createdAt');

        if (filterObj.search) params.append('search', filterObj.search);
        if (filterObj.status) params.append('status', filterObj.status);
        if (filterObj.category) params.append('category', filterObj.category);
        if (filterObj.minRating) params.append('minRating', filterObj.minRating);
        if (filterObj.maxRating) params.append('maxRating', filterObj.maxRating);
        if (filterObj.startDate) params.append('startDate', filterObj.startDate);
        if (filterObj.endDate) params.append('endDate', filterObj.endDate);
        if (filterObj.resolved) params.append('resolved', filterObj.resolved);

        return params.toString();
    };

    const fetchFeedback = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            let endpoint;
            if (isAdminView) {
                const queryString = buildQueryString(filters);
                endpoint = `${API_BASE_URL}/api/feedback?${queryString}`;
            } else {
                endpoint = `${API_BASE_URL}/api/feedback/my`;
            }
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const list = Array.isArray(response.data) ? response.data : [];
            setFeedback(list);
            setError('');
        } catch (err) {
            console.error('Failed to load feedback:', err);
            setError(isAdminView ? 'Unable to retrieve feedback repository.' : 'Unable to retrieve your feedback history.');
        } finally {
            setLoading(false);
        }
    }, [isAdminView, token, filters]);

    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.rating) {
            setError('A performance rating is required');
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(
                `${API_BASE_URL}/api/feedback`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFormData({ rating: 5, comment: '', category: 'service', orderNumber: '' });
            setShowForm(false);
            setError('');
            fetchFeedback();
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failure. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResponseDraft = (id, value) => {
        setResponseDrafts((prev) => ({ ...prev, [id]: value }));
    };

    const handleRespond = async (id) => {
        const response = (responseDrafts[id] || '').trim();
        if (!response) return;

        try {
            setRespondingId(id);
            const res = await axios.patch(
                `${API_BASE_URL}/api/feedback/${id}/respond`,
                { response },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updated = res.data?.feedback;
            if (updated) {
                setFeedback((prev) => prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item)));
            }
            setResponseDrafts((prev) => ({ ...prev, [id]: '' }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to dispatch response');
        } finally {
            setRespondingId('');
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (!window.confirm('Confirm permanent deletion of this feedback record?')) {
            return;
        }

        try {
            setDeletingId(id);
            await axios.delete(
                `${API_BASE_URL}/api/feedback/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setFeedback((prev) => prev.filter((item) => item._id !== id));
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Deletion failed');
        } finally {
            setDeletingId('');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            status: '',
            category: '',
            minRating: '',
            maxRating: '',
            startDate: '',
            endDate: '',
            resolved: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    const CategoryIcon = ({ category, size = 16, color }) => {
        switch (category) {
            case 'quality': return <Star size={size} color={color} />;
            case 'service': return <Users size={size} color={color} />;
            case 'delivery': return <Truck size={size} color={color} />;
            case 'pricing': return <Banknote size={size} color={color} />;
            case 'communication': return <MessageSquare size={size} color={color} />;
            default: return <FileText size={size} color={color} />;
        }
    };

    const statusColor = { submitted: '#64748b', read: '#111827', resolved: '#111827' };
    const statusBg = { submitted: '#f8fafc', read: '#f1f5f9', resolved: '#f1f5f9' };

    return (
        <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif", backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
            <style>{`
                @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .feedback-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; }
            `}</style>
            
            {/* Header */}
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <MessageSquare size={28} color="#ef4444" /> Feedback Portal
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', fontWeight: '500' }}>
                      {isAdminView ? 'Centralized customer sentiment and quality control center' : 'Your insights help us craft better experiences'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={fetchFeedback}
                        style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCcw size={16} /> Refresh
                    </button>
                    {!isAdminView && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: showForm ? '#1e293b' : '#ef4444', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                        >
                            {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'New Feedback'}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div style={{ padding: '16px 20px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '14px', marginBottom: '24px', border: '1px solid #fee2e2', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Admin Filters Area */}
            {isAdminView && (
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', marginBottom: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} color="#64748b" /> Filter Repository
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', marginBottom: '24px' }}>Search and isolate specific feedback records based on performance metrics.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Search</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Comment keywords..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                            <select name="category" value={filters.category} onChange={handleFilterChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', background: '#fff', cursor: 'pointer' }}>
                                <option value="">All Categories</option>
                                <option value="quality">Product Quality</option>
                                <option value="service">Service Delivery</option>
                                <option value="delivery">Logistics</option>
                                <option value="pricing">Value & Pricing</option>
                                <option value="communication">Communication</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Rating</label>
                            <select name="minRating" value={filters.minRating} onChange={handleFilterChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', background: '#fff' }}>
                                <option value="">Any</option>
                                {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}+ Stars</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resolution</label>
                            <select name="resolved" value={filters.resolved} onChange={handleFilterChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', background: '#fff' }}>
                                <option value="">All Statuses</option>
                                <option value="true">Responded</option>
                                <option value="false">Unanswered</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => fetchFeedback()} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#1e293b', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>Apply Filter</button>
                        {hasActiveFilters && (
                            <button onClick={() => { resetFilters(); }} style={{ padding: '10px 24px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Reset</button>
                        )}
                    </div>
                </div>
            )}

            {/* Client Feedback Form */}
            {!isAdminView && showForm && (
                <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', marginBottom: '40px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', animation: 'slideIn 0.4s ease-out' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '32px' }}>Submit Your Insights</h3>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '14px', fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>Overall Satisfaction</label>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
                                    >
                                        <Star size={36} fill={star <= formData.rating ? '#111827' : 'none'} color={star <= formData.rating ? '#111827' : '#e2e8f0'} strokeWidth={star <= formData.rating ? 2 : 1.5} style={{ transition: 'all 0.2s' }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '800', color: '#334155', fontSize: '13px' }}>Benefit Category</label>
                                <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontWeight: '600', color: '#0f172a', outline: 'none' }}>
                                    <option value="service">Service Quality</option>
                                    <option value="quality">Product Craftsmanship</option>
                                    <option value="delivery">Delivery Timeline</option>
                                    <option value="pricing">Value & Pricing</option>
                                    <option value="communication">Staff Communication</option>
                                    <option value="other">General Feedback</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '800', color: '#334155', fontSize: '13px' }}>Order Reference (Optional)</label>
                                <input type="text" name="orderNumber" value={formData.orderNumber} onChange={handleInputChange} placeholder="e.g., #ORD-2026-001" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '800', color: '#334155', fontSize: '13px' }}>Detailed Comments</label>
                            <textarea name="comment" value={formData.comment} onChange={handleInputChange} placeholder="Share as much detail as possible to help us improve..." style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1.5px solid #e2e8f0', fontSize: '15px', minHeight: '140px', resize: 'none', outline: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button type="submit" disabled={submitting} style={{ padding: '14px 32px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '900', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>
                                {submitting ? 'Dispatching...' : 'Dispatch Feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Content Switcher */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8', fontSize: '15px', fontWeight: '600' }}>Synchronizing with feedback vault...</div>
            ) : feedback.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 40px', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}><RefreshCcw size={48} color="#cbd5e1" /></div>
                    <div style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a' }}>Repository Empty</div>
                    <div style={{ fontWeight: '500', marginTop: '6px' }}>{isAdminView ? 'No customer feedback has been captured yet.' : 'Your sent feedback history will appear here.'}</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={20} color="#64748b" /> Recent Timeline
                    </h3>
                    {feedback.map((item, idx) => {
                        const sColor = statusColor[item.status] || '#64748b';
                        const sBg = statusBg[item.status] || '#f8fafc';
                        return (
                        <div
                            key={item._id}
                            className="feedback-card"
                            style={{
                                background: '#ffffff',
                                borderRadius: '24px',
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                animation: `slideIn 0.4s ease-out ${idx * 0.05}s forwards`,
                                opacity: 0
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CategoryIcon category={item.category} color="#ef4444" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                                                {item.orderNumber || 'Standard Referral'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                                                Captured {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                            {isAdminView && (
                                                <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '800', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <User size={12} /> {item.userId?.name || 'Authorized Client'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={15} fill={i < item.rating ? '#111827' : 'none'} color={i < item.rating ? '#111827' : '#e2e8f0'} />
                                            ))}
                                        </div>
                                        <span style={{ padding: '4px 12px', borderRadius: '8px', background: '#f1f5f9', fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                            {item.category}
                                        </span>
                                        <span style={{ padding: '4px 12px', borderRadius: '8px', background: sBg, fontSize: '11px', fontWeight: '900', color: sColor, textTransform: 'uppercase' }}>
                                            {item.status}
                                        </span>
                                    </div>

                                    {item.comment && (
                                        <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#334155', lineHeight: '1.7', fontWeight: '500', paddingLeft: '16px', borderLeft: '3px solid #f1f5f9' }}>
                                            "{item.comment}"
                                        </p>
                                    )}

                                    {item.response && (
                                        <div style={{ marginTop: '16px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ShieldCheck size={14} /> ShanArts Response
                                            </div>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#334155', fontWeight: '500', lineHeight: 1.5 }}>
                                                {item.response}
                                            </p>
                                        </div>
                                    )}

                                    {isAdminView && !item.response && (
                                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <input
                                                    type="text"
                                                    value={responseDrafts[item._id] || ''}
                                                    onChange={(e) => handleResponseDraft(item._id, e.target.value)}
                                                    placeholder="Enter your administrative response..."
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRespond(item._id)}
                                                disabled={!String(responseDrafts[item._id] || '').trim() || respondingId === item._id}
                                                style={{ padding: '0 24px', borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                {respondingId === item._id ? <RefreshCcw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                                                {respondingId === item._id ? 'Sending...' : 'Respond'}
                                            </button>
                                        </div>
                                    )}

                                    {isAdminView && (
                                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleDeleteFeedback(item._id)}
                                                disabled={deletingId === item._id}
                                                style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#fef2f2', color: '#ef4444', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Trash2 size={14} /> 
                                                {deletingId === item._id ? 'Deleting...' : 'Delete Record'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );})}
                </div>
            )}
        </div>
    );
};

export default FeedbackPage;
