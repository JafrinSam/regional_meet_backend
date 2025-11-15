const Host = require("../../models/hostModel");

const getAllHosts = async (req, res) => {
  try {
    const hosts = await Host.find({});
    res.json(hosts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching hosts", error: error.message });
  }
};

module.exports = {
  getAllHosts,
};
