const express = require('express');
const router = express.Router();
const Unit = require('../models/Unit');

// GET all units
router.get('/', async (req, res) => {
  try {
    const units = await Unit.find();
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new unit
router.post('/', async (req, res) => {
  const unit = new Unit({
    name: req.body.name,
    address: req.body.address,
    contractNumber: req.body.contractNumber,
    cnpj: req.body.cnpj
  });

  try {
    const newUnit = await unit.save();
    res.status(201).json(newUnit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
