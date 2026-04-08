import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
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

    // Admin filter state
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
            setError(isAdminView ? 'Failed to load feedback records.' : 'Failed to load your feedback.');
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
            setError('Please select a rating');
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
            setError(err.response?.data?.message || 'Failed to submit feedback');
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
            setError(err.response?.data?.message || 'Failed to submit response');
        } finally {
            setRespondingId('');
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
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
            setError(err.response?.data?.message || 'Failed to delete feedback');
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

    const getCategoryEmoji = (category) => {
        const emojis = {
            quality: '⭐',
            service: '👥',
            delivery: '🚚',
            pricing: '💰',
            communication: '💬',
            other: '📝',
        };
        return emojis[category] || '📝';
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1000px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '12px' }}>Feedback</h1>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>
                    {isAdminView ? 'Review customer feedback and respond' : 'Share your experience with us'}
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '99px',
                        fontSize: '14px',
                        fontWeight: '700'
                    }}>
                        {feedback.length} {isAdminView ? 'Received' : 'Submitted'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={fetchFeedback}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            color: '#374151',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Refresh
                    </button>
                    {!isAdminView && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#d32f2f',
                                color: '#ffffff',
                                fontWeight: '700',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {showForm ? '✕ Cancel' : '+ New Feedback'}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '16px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    border: '1px solid #fee2e2'
                }}>
                    {error}
                </div>
            )}

            {isAdminView && (
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '32px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', margin: '0 0 16px 0' }}>🔍 Filter & Search Feedback</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        {/* Search Input */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                                Search (Comment, Response, Order #)
                            </label>
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search feedback..."
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '13px',
                                    color: '#374151'
                                }}
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                                Status
                            </label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '13px',
                                    color: '#374151',
                                    background: '#ffffff'
                                }}
                            >
                                <option value="">All Statuses</option>
                                <option value="submitted">Submitted</option>
                                <option value="read">Read</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>

                        {/* Resolved Filter */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                                Resolution Status
                            </label>
                            <select
                                name="resolved"
                                value={filters.resolved}
                                onChange={handleFilterChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '13px',
                                    color: '#374151',
                                    background: '#ffffff'
                                }}
                            >
                                <option value="">All</option>
                                <option value="true">Resolved Only</option>
                                <option value="false">Unresolved Only</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                                Category
                            </label>
                            <select
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '13px',
                                    color: '#374151',
                                    background: '#ffffff'
                                }}
                            >
                                <option value="">All Categories</option>
                                <option value="quality">Quality</option>
                                <option value="service">Service</option>
                                <option value="delivery">Delivery</option>
                                <option value="pricing">Pricing</option>
                                <option value="communication">Communication</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Min Rating */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                                Min Rating
                            </label>
                            <select
                                name="minRating"
                                value={filters.minRating}
                                onChange={handleFilterChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '13px',
                                    color: '#374151',
                                    background: '#ffffff'
                                }}
                            >
                                <option value="">Any</option>
                                <option value="1">1+ Stars</option>
                                <option value="2">2+ Stars</option>
                                <option value="3">3+ Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="5">5 Stars Only</option>
                            </select>
                        </div>

                        {/* Max Rating */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                                Max Rating
                            </label>
                            <select
                                name="maxRating"
                                value={filters.maxRating}
                                onChange={handleFilterChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '13px',
                                    color: '#374151',
                                    background: '#ffffff'
                                }}
                            >
                                <option value="">Any</option>
                                <option value="1">1 Star Only</option>
                                <option value="2">Up to 2 Stars</option>
                                <option value="3">Up to 3 Stars</option>
                                <option value="4">Up to 4 Stars</option>
                                <option value="5">5 Stars</option>
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '13px',
                                    color: '#374151'
                                }}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                                End Date
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '13px',
                                    color: '#374151'
                                }}
                            />
                        </div>
                    </div>

                    {/* Filter Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => fetchFeedback()}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#111827',
                                color: '#ffffff',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            🔍 Apply Filters
                        </button>
                        {hasActiveFilters && (
                            <button
                                onClick={() => {
                                    resetFilters();
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
                                }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    background: '#ffffff',
                                    color: '#6b7280',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                ✕ Reset Filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!isAdminView && showForm && (
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '32px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Share Your Feedback</h3>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Rating */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', color: '#374151' }}>
                                How would you rate us? *
                            </label>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '32px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            opacity: star <= formData.rating ? 1 : 0.3,
                                            transform: star <= formData.rating ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>
                            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                                {formData.rating === 5 && 'Excellent! 😊'}
                                {formData.rating === 4 && 'Great! 👍'}
                                {formData.rating === 3 && 'Good 👌'}
                                {formData.rating === 2 && 'Could be better 😟'}
                                {formData.rating === 1 && 'Poor 😞'}
                            </p>
                        </div>

                        {/* Category */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#374151' }}>
                                Feedback Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '14px',
                                    background: '#ffffff',
                                    color: '#374151'
                                }}
                            >
                                <option value="service">👥 Service Quality</option>
                                <option value="quality">⭐ Product Quality</option>
                                <option value="delivery">🚚 Delivery</option>
                                <option value="pricing">💰 Pricing</option>
                                <option value="communication">💬 Communication</option>
                                <option value="other">📝 Other</option>
                            </select>
                        </div>

                        {/* Order Number */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#374151' }}>
                                Order Number (Optional)
                            </label>
                            <input
                                type="text"
                                name="orderNumber"
                                value={formData.orderNumber}
                                onChange={handleInputChange}
                                placeholder="e.g., #ORD-2026-001"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '14px',
                                    color: '#374151'
                                }}
                            />
                        </div>

                        {/* Comment */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#374151' }}>
                                Your Feedback
                            </label>
                            <textarea
                                name="comment"
                                value={formData.comment}
                                onChange={handleInputChange}
                                placeholder="Tell us what you think... (optional)"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '14px',
                                    minHeight: '120px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    color: '#374151'
                                }}
                            />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    background: '#ffffff',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#d32f2f',
                                    color: '#ffffff',
                                    fontWeight: '700',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    opacity: submitting ? 0.6 : 1
                                }}
                            >
                                {submitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#9ca3af',
                    fontSize: '16px'
                }}>
                    Loading your feedback...
                </div>
            )}

            {!loading && feedback.length === 0 && (!showForm || isAdminView) && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#9ca3af',
                    fontSize: '16px'
                }}>
                    {isAdminView ? 'No customer feedback yet.' : 'No feedback submitted yet. Share your experience!'}
                </div>
            )}

            {!loading && feedback.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Your Feedback History</h3>
                    {feedback.map((item) => (
                        <div
                            key={item._id}
                            style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                padding: '20px',
                                border: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>{getCategoryEmoji(item.category)}</span>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                                            {item.orderNumber || 'General Feedback'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </div>
                                        {isAdminView && (
                                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                By: {item.userId?.name || 'Customer'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    fontSize: '16px',
                                                    color: i < item.rating ? '#fbbf24' : '#d1d5db'
                                                }}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <span
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            background: '#f3f4f6',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#6b7280',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {item.category}
                                    </span>
                                    <span
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            background: item.status === 'resolved' ? '#dcfce7' : '#fef3c7',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: item.status === 'resolved' ? '#059669' : '#d97706',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {item.status}
                                    </span>
                                </div>

                                {item.comment && (
                                    <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                                        "{item.comment}"
                                    </p>
                                )}

                                {item.response && (
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        background: '#f0fdf4',
                                        borderLeft: '3px solid #10b981',
                                        borderRadius: '4px'
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#059669', marginBottom: '4px' }}>
                                            Our Response:
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>
                                            {item.response}
                                        </p>
                                    </div>
                                )}

                                {isAdminView && !item.response && (
                                    <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={responseDrafts[item._id] || ''}
                                            onChange={(e) => handleResponseDraft(item._id, e.target.value)}
                                            placeholder="Write a response to this feedback..."
                                            style={{
                                                flex: 1,
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '13px'
                                            }}
                                        />
                                        <button
                                            onClick={() => handleRespond(item._id)}
                                            disabled={!String(responseDrafts[item._id] || '').trim() || respondingId === item._id}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: '#111827',
                                                color: '#fff',
                                                fontWeight: '700',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                opacity: !String(responseDrafts[item._id] || '').trim() || respondingId === item._id ? 0.6 : 1
                                            }}
                                        >
                                            {respondingId === item._id ? 'Sending...' : 'Respond'}
                                        </button>
                                    </div>
                                )}

                                {isAdminView && (
                                    <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleDeleteFeedback(item._id)}
                                            disabled={deletingId === item._id}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #fecaca',
                                                background: '#fef2f2',
                                                color: '#dc2626',
                                                fontWeight: '600',
                                                fontSize: '12px',
                                                cursor: deletingId === item._id ? 'not-allowed' : 'pointer',
                                                opacity: deletingId === item._id ? 0.6 : 1
                                            }}
                                        >
                                            {deletingId === item._id ? 'Deleting...' : '🗑️ Delete'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeedbackPage;

