import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
    tableNumber: {
        type: String,
        required: true,
        unique: true,
    },
    qrToken: {
        type: String,
        unique: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const Table = mongoose.model('Table', tableSchema);

export default Table;
