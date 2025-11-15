const Host = require('../../models/hostModel');
const User = require('../../models/userModel'); // Needed for member management

// @desc    Get all hosts
// @route   GET /api/admin/hosts
// @access  Superadmin
const getAllHosts = async (req, res) => {
    try {
        const hosts = await Host.find({})
            .populate('locationId', 'name address') // Populate location details
            .populate('members', 'fullname email role'); // Populate member details
        res.status(200).json(hosts);
    } catch (error) {
        console.error("Error getting all hosts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get host by ID
// @route   GET /api/admin/hosts/:id
// @access  Superadmin
const getHostById = async (req, res) => {
    try {
        const host = await Host.findById(req.params.id)
            .populate('locationId', 'name address')
            .populate('members', 'fullname email role');
        if (!host) {
            return res.status(404).json({ message: "Host not found" });
        }
        res.status(200).json(host);
    } catch (error) {
        console.error("Error getting host by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Create a new host
// @route   POST /api/admin/hosts
// @access  Superadmin
const createHost = async (req, res) => {
    try {
        const { name, legalName, type, locationId, contact, registrationNumber, taxId, members } = req.body;

        if (!name || !locationId) {
            return res.status(400).json({ message: "Please enter all required fields: name, locationId" });
        }

        const hostExists = await Host.findOne({ name });
        if (hostExists) {
            return res.status(400).json({ message: "Host with that name already exists" });
        }

        const host = await Host.create({
            name,
            legalName,
            type,
            locationId,
            contact,
            registrationNumber,
            taxId,
            members: members || []
        });

        // If members are provided, update their host field and role
        if (members && members.length > 0) {
            for (const memberId of members) {
                await Host.forceAddMember(host._id, memberId, 'host'); // Default role for new members
            }
        }

        if (host) {
            res.status(201).json(host);
        } else {
            res.status(400).json({ message: "Invalid host data" });
        }

    } catch (error) {
        console.error("Error creating host:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Update a host
// @route   PUT /api/admin/hosts/:id
// @access  Superadmin
const updateHost = async (req, res) => {
    try {
        const { name, legalName, type, locationId, contact, registrationNumber, taxId, members } = req.body;

        const host = await Host.findById(req.params.id);

        if (!host) {
            return res.status(404).json({ message: "Host not found" });
        }

        // Update basic host details
        host.name = name || host.name;
        host.legalName = legalName || host.legalName;
        host.type = type || host.type;
        host.locationId = locationId || host.locationId;
        host.contact = contact || host.contact;
        host.registrationNumber = registrationNumber || host.registrationNumber;
        host.taxId = taxId || host.taxId;

        // Handle members: This is a more complex operation.
        // For simplicity, this example assumes 'members' in the request body
        // completely replaces the existing members. In a real app, you might
        // want to add/remove members incrementally.
        if (members) {
            // Remove users no longer in the members list from this host
            for (const oldMemberId of host.members) {
                if (!members.includes(oldMemberId.toString())) {
                    await Host.removeMember(host._id, oldMemberId);
                }
            }
            // Add new members to this host
            for (const newMemberId of members) {
                if (!host.members.includes(newMemberId)) {
                    await Host.forceAddMember(host._id, newMemberId, 'host');
                }
            }
            host.members = members; // Update the host's members array
        }


        const updatedHost = await host.save();

        res.status(200).json(updatedHost);

    } catch (error) {
        console.error("Error updating host:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Delete a host
// @route   DELETE /api/admin/hosts/:id
// @access  Superadmin
const deleteHost = async (req, res) => {
    try {
        const host = await Host.findById(req.params.id);

        if (!host) {
            return res.status(404).json({ message: "Host not found" });
        }

        // Before deleting the host, disassociate all its members
        for (const memberId of host.members) {
            const user = await User.findById(memberId);
            if (user) {
                user.host = null;
                user.role = 'user'; // Reset role to default
                await user.save();
            }
        }

        await host.deleteOne();
        res.status(200).json({ message: "Host removed" });

    } catch (error) {
        console.error("Error deleting host:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getAllHosts,
    getHostById,
    createHost,
    updateHost,
    deleteHost
};
