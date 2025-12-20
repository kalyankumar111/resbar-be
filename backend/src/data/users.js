import bcrypt from 'bcryptjs';

const users = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123', // Will be hashed in seeder
        roleName: 'admin',
    },
    {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'password123',
        roleName: 'superadmin',
    },
    {
        name: 'Chef John',
        email: 'chef@example.com',
        password: 'password123',
        roleName: 'chef',
    },
    {
        name: 'Waiter Sarah',
        email: 'waiter@example.com',
        password: 'password123',
        roleName: 'waiter',
    },
];

export default users;
