import Role from '../models/Role.js';

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
export const getRoles = async (req, res) => {
    const roles = await Role.find({});
    res.json(roles);
};

// @desc    Create a role
// @route   POST /api/roles
// @access  Private/Admin
export const createRole = async (req, res) => {
    const { name, permissions } = req.body;

    const roleExists = await Role.findOne({ name });

    if (roleExists) {
        res.status(400).json({ message: 'Role already exists' });
    } else {
        const role = await Role.create({ name, permissions });
        res.status(201).json(role);
    }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private/Admin
export const updateRole = async (req, res) => {
    const role = await Role.findById(req.params.id);

    if (role) {
        role.name = req.body.name || role.name;
        role.permissions = req.body.permissions || role.permissions;

        const updatedRole = await role.save();
        res.json(updatedRole);
    } else {
        res.status(404).json({ message: 'Role not found' });
    }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
export const deleteRole = async (req, res) => {
    const role = await Role.findById(req.params.id);

    if (role) {
        await role.deleteOne();
        res.json({ message: 'Role removed' });
    } else {
        res.status(404).json({ message: 'Role not found' });
    }
};
