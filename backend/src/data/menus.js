const menus = [
    {
        name: 'Breakfast',
        isActive: true,
        items: [
            {
                name: 'Eggs Benedict',
                description: 'Classic breakfast with hollandaise sauce',
                price: 12.5,
                category: 'Main',
            },
            {
                name: 'Pancakes',
                description: 'Fluffy pancakes with maple syrup',
                price: 9.0,
                category: 'Side',
            },
        ],
    },
    {
        name: 'Main Course',
        isActive: true,
        items: [
            {
                name: 'Grilled Salmon',
                description: 'Fresh salmon with asparagus',
                price: 24.0,
                category: 'Main',
            },
            {
                name: 'Ribeye Steak',
                description: 'Prime ribeye with garlic butter',
                price: 32.0,
                category: 'Main',
            },
        ],
    },
    {
        name: 'Drinks',
        isActive: true,
        items: [
            {
                name: 'Fresh Orange Juice',
                description: 'Freshly squeezed',
                price: 5.5,
                category: 'Beverage',
            },
            {
                name: 'Cappuccino',
                description: 'Rich espresso with foamy milk',
                price: 4.5,
                category: 'Beverage',
            },
        ],
    },
];

export default menus;
