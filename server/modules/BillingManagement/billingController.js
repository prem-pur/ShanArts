const Invoice = require('./Invoice');
const Payment = require('./Payment');

// Get billing summary / revenue report
exports.getBillingSummary = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        const dateFilter = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) dateFilter.$lte = new Date(to);

        const invoiceFilter = {};
        if (from || to) invoiceFilter.createdAt = dateFilter;

        const invoices = await Invoice.find(invoiceFilter)
            .populate('customerId', 'name email')
            .populate('orderId', 'orderNumber jobType')
            .sort({ createdAt: -1 });

        const totalRevenue = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
        const totalCollected = invoices.reduce((s, i) => s + (i.amountPaid || 0), 0);
        const totalOutstanding = invoices.reduce((s, i) => s + (i.balanceDue || 0), 0);

        const countPaid = invoices.filter(i => i.paymentStatus === 'paid').length;
        const countPartial = invoices.filter(i => i.paymentStatus === 'partial').length;
        const countUnpaid = invoices.filter(i => i.paymentStatus === 'unpaid').length;
        const countPendingApproval = invoices.filter(i => i.paymentStatus === 'pending_approval').length;

        // Monthly breakdown
        const monthlyMap = {};
        invoices.forEach(inv => {
            const key = new Date(inv.createdAt).toISOString().slice(0, 7); // "YYYY-MM"
            if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, collected: 0 };
            monthlyMap[key].revenue += inv.totalAmount || 0;
            monthlyMap[key].collected += inv.amountPaid || 0;
        });
        const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalCollected: parseFloat(totalCollected.toFixed(2)),
                totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
                invoiceCount: invoices.length,
                statusBreakdown: { paid: countPaid, partial: countPartial, unpaid: countUnpaid, pendingApproval: countPendingApproval },
                monthly,
                recentInvoices: invoices.slice(0, 10),
            }
        });
    } catch (error) {
        next(error);
    }
};
