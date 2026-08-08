const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['voice', 'chat'], default: 'voice' },
    hostId: { type: String, required: true },
    hostName: { type: String, required: true },
    hostAvatar: { type: String },
    hostColor: { type: String },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Table', tableSchema);
