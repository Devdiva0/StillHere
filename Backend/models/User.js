const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: () => {
        const list = ['🦊', '🐰', '🦁', '🐢', '🕊️', '🌿', '🌙', '🌊', '🕯️', '🌸', '✨'];
        return list[Math.floor(Math.random() * list.length)];
    }},
    color: { type: String, default: () => {
        const list = ['#39b59e', '#a685e2', '#f5a88c', '#85c1e2', '#f5d38c', '#85e2a6'];
        return list[Math.floor(Math.random() * list.length)];
    }},
    bio: { type: String, default: 'Finding calm in the noise. Slowly building a digital sanctuary. Happy to just listen, rarely speaking unless asked.' },
    languages: { type: String, default: 'KO, EN' },
    hoursListened: { type: Number, default: 0 },
    tablesJoined: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

