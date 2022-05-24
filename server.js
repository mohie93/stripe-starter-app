'use-strict';

require('dotenv').config({});

const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const publishKey = process.env.PK;
const stripe = process.env.SK;
const port = process.env.PORT || 5000;

// dump list to store customers on fly
const customersList = [];

// routes
app.post("/api/v1/customers", async (req, res) => {
  try {
    const { email, name } = req.body;
    const customer = await stripe.customers.create({
      email,
      name,
    });
    customersList.push(customer.id);
    res.status(201).json({ customer: { id: customer.id } });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

app.get("/api/v1/customers/:customerId/retrieve", async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) return res.status(404).json({ error: "customer id param is missing" });
    const customer = await stripe.customers.retrieve(customerId);
    return res.status(200).json({ customer });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

app.patch("/api/v1/customers/:customerId/update", async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) return res.status(404).json({ error: "customer id param is missing" });
    const customer = await stripe.customers.retrieve(customerId);
    if (customer) {
      const updatedCustomer = await stripe.customers.update(customerId, {
        metadata: {
          updated_customer: true,
        },
      });
      return res.status(200).json({ customer: updatedCustomer });
    } else return res.status(404).json({ error: "No customer found" });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

app.delete("/api/v1/customers/:customerId/remove", async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) return res.status(404).json({ error: "customer id param is missing" });
    else {
      const deletedCustomer = await stripe.customers.del(customerId);
      return res.status(200).json({ customer: deletedCustomer });
    }
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

app.post("/api/v1/customers/:customerId/cards/:cardToken", async (req, res) => {
  try {
    const { customerId, cardToken } = req.params;
    const card = await stripe.customers.createSource(customerId, {
      source: cardToken,
    });
    res.status(201).json({ card });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

app.get("/api/v1/customers/:customerId/cards", async (req, res) => {
  try {
    const { customerId } = req.params;
    const card = await stripe.customers.listSources(customerId);
    res.status(200).json({ card });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

app.post("/api/v1/customers/:customerId/charge", async (req, res) => {
  try {
    const { customerId } = req.params;
    const charge = await stripe.charges.create({
      amount: 300,
      currency: "USD",
      description: "Dummy Charge!",
      customer: customerId,
    });
    res.status(201).json({ charge });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// Run server
app.listen(port, () => console.log(`Dummy stripe service runs on port ${port}`));
