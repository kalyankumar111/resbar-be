import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import roles from './data/roles.js';
import users from './data/users.js';
import tables from './data/tables.js';
import menus from './data/menus.js';
import User from './models/User.js';
import Role from './models/Role.js';
import Table from './models/Table.js';
import Menu from './models/Menu.js';
import Order from './models/Order.js';
import Payment from './models/Payment.js';
import AuditLog from './models/AuditLog.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await Role.deleteMany();
        await User.deleteMany();
        await Table.deleteMany();
        await Menu.deleteMany();
        await Order.deleteMany();
        await Payment.deleteMany();
        await AuditLog.deleteMany();

        // 1. Import Roles
        const createdRoles = await Role.insertMany(roles);
        console.log('Roles Imported!');

        // 2. Import Tables (with random QR tokens)
        const tablesWithTokens = tables.map(table => ({
            ...table,
            qrToken: crypto.randomBytes(16).toString('hex'),
        }));
        await Table.insertMany(tablesWithTokens);
        console.log('Tables Imported!');

        // 3. Import Menus
        await Menu.insertMany(menus);
        console.log('Menus Imported!');

        // 4. Import Users (associated with roles)
        const usersWithRoles = users.map(user => {
            const role = createdRoles.find(r => r.name === user.roleName);
            return {
                ...user,
                roleId: role._id,
            };
        });

        // We use User.create instead of insertMany so the 'pre save' password hashing hook runs
        for (const user of usersWithRoles) {
            await User.create(user);
        }
        console.log('Users Imported!');

        console.log('Data Imported successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error with data import: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Role.deleteMany();
        await User.deleteMany();
        await Table.deleteMany();
        await Menu.deleteMany();
        await Order.deleteMany();
        await Payment.deleteMany();
        await AuditLog.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`Error with data destruction: ${error.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
