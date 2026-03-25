import React from 'react';

const UpcomingJobs = ({ orders }) => {
    // Filter out completed orders and sort by scheduled start or deadline
    const upcoming = [...orders]
        .filter(o => ['scheduled', 'machine_maintenance'].includes(o.status))
        .sort((a, b) => {
            // Prioritize machine_maintenance orders
            if (a.status === 'machine_maintenance' && b.status !== 'machine_maintenance') return -1;
            if (a.status !== 'machine_maintenance' && b.status === 'machine_maintenance') return 1;

            const dateA = new Date(a.scheduledStart || a.deadline || 0);
            const dateB = new Date(b.scheduledStart || b.deadline || 0);
            return dateA - dateB;
        })
        .slice(0, 5); // Show top 5 jobs

    const getStatusStyles = (job) => {
        if (job.status === 'machine_maintenance') {
            return {
                label: 'MACHINE MAINTENANCE',
                color: '#ef4444',
                bg: '#fef2f2',
                barColor: '#ef4444',
                border: '#fee2e2'
            };
        }
        const isNotScheduled = job.status === 'scheduled';
        const isRescheduled = job.rescheduleReason && job.rescheduleReason.trim().length > 0;

        if (isNotScheduled) {
            return {
                label: 'Not Scheduled',
                color: '#ef4444',
                bg: '#fef2f2',
                barColor: '#ef4444',
                border: '#fee2e2'
            };
        }
        if (isRescheduled) {
            return {
                label: 'Rescheduled',
                color: '#E53935',
                bg: '#fef2f2',
                barColor: '#E53935',
                border: '#fecaca'
            };
        }
        return {
            label: 'Scheduled',
            color: '#475569',
            bg: '#f1f5f9',
            barColor: '#1A1A1A',
            border: '#e2e8f0'
        };
    };

    return (
        <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.03)',
            height: 'fit-content',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h2 style={{
                fontSize: '20px',
                fontWeight: '900',
                color: '#0f172a',
                marginBottom: '28px',
                letterSpacing: '-0.5px'
            }}>Upcoming Jobs</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {upcoming.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                        No upcoming jobs
                    </div>
                ) : (
                    upcoming.map(job => {
                        const styles = getStatusStyles(job);
                        const machineName = job.assignedMachineId?.name || 'Unassigned';
                        const jobType = job.jobType || 'Production';
                        const operatorName = job.assignedOperatorId?.name || 'Unassigned';
                        const dateStr = job.scheduledStart
                            ? new Date(job.scheduledStart).toLocaleDateString([], { month: 'short', day: 'numeric' })
                            : (job.deadline ? new Date(job.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No Date');

                        return (
                            <div key={job._id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '16px'
                            }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    {/* Left Status Bar */}
                                    <div style={{
                                        width: '4px',
                                        height: '42px',
                                        background: styles.barColor,
                                        borderRadius: '4px'
                                    }} />

                                    <div>
                                        <div style={{
                                            fontWeight: '800',
                                            fontSize: '15px',
                                            color: '#1e293b',
                                            marginBottom: '2px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {machineName} — {jobType}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#94a3b8',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {job.status === 'scheduled' ? (
                                                <>
                                                    Unassigned
                                                    {(job.priority?.toLowerCase() === 'urgent' || job.priority?.toLowerCase() === 'ugent' || job.priority?.toLowerCase() === 'high') ? (
                                                        <span style={{ background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>URGENT</span>
                                                    ) : (
                                                        `• Priority ${job.priority || 'Normal'}`
                                                    )}
                                                </>
                                            ) : (
                                                `${dateStr} • ${operatorName}`
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div style={{
                                    padding: '6px 14px',
                                    borderRadius: '99px',
                                    backgroundColor: styles.bg,
                                    color: styles.color,
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    border: `1px solid ${styles.border}`,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {styles.label}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default UpcomingJobs;
