const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    name: { type: String, default: 'Anonymous' },
    avatar: { type: String, default: '👤' },
    color: { type: String, default: '#ccc' },
    text: { type: String, required: true },
    media: { type: String },
    mediaType: { type: String },
    count: { type: Number, default: 0 },
    supportedBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
