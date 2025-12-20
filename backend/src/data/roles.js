const roles = [
    {
        name: 'admin',
        permissions: ['all'],
    },
    {
        name: 'superadmin',
        permissions: ['all'],
    },
    {
        name: 'chef',
        permissions: ['kitchen_view', 'order_update'],
    },
    {
        name: 'waiter',
        permissions: ['order_create', 'order_view', 'table_view'],
    },
];

export default roles;
