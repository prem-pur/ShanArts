/**
 * Backfill ProductionOrder fields from linked CustomerRequest.
 *
 * What it fixes:
 * - customerId (manual orders already have it; request-based often missing in old data)
 * - printSpecs.designType from request.productType
 * - printSpecs.size from request.size
 * - printSpecs.quantity default 1 if missing
 *
 * Usage:
 *   cd order-management-backend
 *   node scripts/backfill_production_orders.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const ProductionOrder = require("../models/ProductionOrder");

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const orders = await ProductionOrder.find().populate("requestId");
  let updated = 0;

  for (const order of orders) {
    const req = order.requestId;
    let changed = false;

    if (!order.customerId && req && req.customerId) {
      order.customerId = req.customerId;
      changed = true;
    }

    if (!order.printSpecs) order.printSpecs = {};

    if (!order.printSpecs.designType && req && req.productType) {
      order.printSpecs.designType = req.productType;
      changed = true;
    }

    if (!order.printSpecs.size && req && req.size) {
      order.printSpecs.size = req.size;
      changed = true;
    }

    if (order.printSpecs.quantity == null) {
      order.printSpecs.quantity = 1;
      changed = true;
    }

    if (changed) {
      await order.save();
      updated += 1;
    }
  }

  console.log(`Backfill complete. Updated ${updated} orders.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

