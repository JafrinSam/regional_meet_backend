const Host = require('../../models/hostModel');

// Get all hosts
const getAllHosts = async (req, res) => {
  try {
    const hosts = await Host.find({});
    res.json(hosts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hosts', error: error.message });
  }
};

// Get a single host by ID
const getHostById = async (req, res) => {
  try {
    const host = await Host.findById(req.params.id);
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }
    res.json(host);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching host', error: error.message });
  }
};

// Create a new host
const createHost = async (req, res) => {
  try {
    const { name, email, phone, organization } = req.body;

    const hostExists = await Host.findOne({ email });
    if (hostExists) {
      return res.status(400).json({ message: 'Host already exists' });
    }

    const host = new Host({
      name,
      email,
      phone,
      organization,
    });

    await host.save();
    res.status(201).json(host);
  } catch (error) {
    res.status(500).json({ message: 'Error creating host', error: error.message });
  }
};

// Update a host
const updateHost = async (req, res) => {
  try {
    const { name, email, phone, organization } = req.body;
    const host = await Host.findById(req.params.id);

    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    host.name = name || host.name;
    host.email = email || host.email;
    host.phone = phone || host.phone;
    host.organization = organization || host.organization;

    const updatedHost = await host.save();
    res.json(updatedHost);
  } catch (error) {
    res.status(500).json({ message: 'Error updating host', error: error.message });
  }
};

// Delete a host
const deleteHost = async (req, res) => {
  try {
    const host = await Host.findById(req.params.id);

    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    await host.deleteOne();
    res.json({ message: 'Host removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting host', error: error.message });
  }
};

module.exports = {
  getAllHosts,
  getHostById,
  createHost,
  updateHost,
  deleteHost,
};