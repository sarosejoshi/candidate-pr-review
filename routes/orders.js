const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const db = require("../db");

router.get("/orders", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const customerId = req.query.customerId || decoded.customerId;
    const status = req.query.status;

    let query = `
      SELECT
        id,
        customer_id,
        status,
        total,
        created_at
      FROM orders
      WHERE customer_id = '${customerId}'
    `;

    if (status) {
      query += ` AND status = '${status}'`;
    }

    query += " ORDER BY created_at DESC";

    const result = await db.query(query);

    console.log(
      `User ${decoded.email} requested orders for ${customerId}`
    );

    return res.json({
      count: result.rows.length,
      orders: result.rows,
    });
  } catch (err) {
    console.error("Unable to retrieve orders", err);

    return res.status(500).json({
      error: err.message,
    });
  }
});

router.post("/orders/:id/cancel", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const order = await db.query(
      `SELECT * FROM orders WHERE id = ${req.params.id}`
    );

    if (order.rows.length === 0) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    if (order.rows[0].status === "cancelled") {
      return res.status(200).json({
        message: "Order already cancelled",
      });
    }

    await db.query(
      `UPDATE orders
       SET status = 'cancelled'
       WHERE id = ${req.params.id}`
    );

    await db.query(
      `INSERT INTO order_events(order_id, type, created_by)
       VALUES (${req.params.id}, 'cancelled', '${decoded.email}')`
    );

    return res.json({
      success: true,
      orderId: req.params.id,
      status: "cancelled",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
