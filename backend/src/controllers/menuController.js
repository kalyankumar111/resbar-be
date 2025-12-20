import Menu from '../models/Menu.js';

// --- Categories (Embedded in Menu or separate? The model has 'items' inside Menu) ---
// Note: Based on the requested routes, categories seem to be top-level or part of menu.
// The model 'Menu' currently has 'name' and 'items'. We can treat Menu as a category.

// @desc    Get all categories (Menus)
// @route   GET /api/menu/categories
export const getCategories = async (req, res) => {
    const categories = await Menu.find({}).select('name isActive');
    res.json(categories);
};

// @desc    Create a category (Menu)
// @route   POST /api/menu/categories
export const createCategory = async (req, res) => {
    const { name } = req.body;
    const category = await Menu.create({ name });
    res.status(201).json(category);
};

// @desc    Update a category
// @route   PUT /api/menu/categories/:id
export const updateCategory = async (req, res) => {
    const category = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (category) res.json(category);
    else res.status(404).json({ message: 'Category not found' });
};

// @desc    Delete a category
// @route   DELETE /api/menu/categories/:id
export const deleteCategory = async (req, res) => {
    const category = await Menu.findByIdAndDelete(req.params.id);
    if (category) res.json({ message: 'Category removed' });
    else res.status(404).json({ message: 'Category not found' });
};

// --- Items (Inside Menus) ---

// @desc    Get all menu items
// @route   GET /api/menu/items
export const getItems = async (req, res) => {
    const menus = await Menu.find({});
    const items = menus.flatMap(menu => menu.items);
    res.json(items);
};

// @desc    Create a menu item
// @route   POST /api/menu/items
export const createItem = async (req, res) => {
    const { categoryId, name, description, price, category, image } = req.body;
    const menu = await Menu.findById(categoryId);
    if (menu) {
        menu.items.push({ name, description, price, category, image });
        await menu.save();
        res.status(201).json(menu.items[menu.items.length - 1]);
    } else {
        res.status(404).json({ message: 'Menu/Category not found' });
    }
};

// @desc    Update a menu item
// @route   PUT /api/menu/items/:id
export const updateItem = async (req, res) => {
    const { name, description, price, category, image, isAvailable } = req.body;
    const menu = await Menu.findOne({ 'items._id': req.params.id });
    if (menu) {
        const item = menu.items.id(req.params.id);
        item.name = name || item.name;
        item.description = description || item.description;
        item.price = price !== undefined ? price : item.price;
        item.category = category || item.category;
        item.image = image || item.image;
        item.isAvailable = isAvailable !== undefined ? isAvailable : item.isAvailable;
        await menu.save();
        res.json(item);
    } else {
        res.status(404).json({ message: 'Item not found' });
    }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/items/:id
export const deleteItem = async (req, res) => {
    const menu = await Menu.findOne({ 'items._id': req.params.id });
    if (menu) {
        menu.items.pull(req.params.id);
        await menu.save();
        res.json({ message: 'Item removed' });
    } else {
        res.status(404).json({ message: 'Item not found' });
    }
};

// @desc    Toggle item availability
// @route   PUT /api/menu/items/:id/availability
export const toggleAvailability = async (req, res) => {
    const menu = await Menu.findOne({ 'items._id': req.params.id });
    if (menu) {
        const item = menu.items.id(req.params.id);
        item.isAvailable = !item.isAvailable;
        await menu.save();
        res.json(item);
    } else {
        res.status(404).json({ message: 'Item not found' });
    }
};
