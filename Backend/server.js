const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Post = require('./models/Post');
const Waitlist = require('./models/Waitlist');
const User = require('./models/User');

// In-Memory Database Fallback Store
const memoryDB = {
    users: [],
    posts: [
        {
            _id: "m1",
            name: "Leo",
            avatar: "🦁",
            color: "#f5a88c",
            text: "Found a quiet spot by the lake today. No noise, just the sound of water.",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
            _id: "m2",
            name: "Cyan",
            avatar: "🌊",
            color: "#85c1e2",
            text: "The internet feels heavy today. Glad this space exists to just... breathe.",
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        {
            _id: "m3",
            name: "Amber",
            avatar: "🕯️",
            color: "#f5d38c",
            text: "Midnight tea and a good book. Sometimes the simplest moments are the most profound.",
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
        }
    ],
    waitlist: []
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('Could not connect to MongoDB:', err.message));
} else {
    console.log('No MONGODB_URI found. Running in-memory database fallback.');
}

// Disable operation buffering so that operations fail immediately if not connected
mongoose.set('bufferCommands', false);

const JWT_SECRET = process.env.JWT_SECRET || 'stillhere_secret_key_123';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.get('/', (req, res) => {
    res.send('StillHere Backend is running...');
});

// --- AUTH API ---
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (mongoose.connection.readyState === 1) {
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) return res.status(400).json({ error: 'User already exists' });

            const user = new User({ username, email, password });
            await user.save();

            const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({ token, user: { username: user.username, email: user.email, avatar: user.avatar, color: user.color } });
        } else {
            const existingUser = memoryDB.users.find(u => u.email === email || u.username === username);
            if (existingUser) return res.status(400).json({ error: 'User already exists' });

            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const avatars = ['🦊', '🐰', '🦁', '🐢', '🕊️', '🌿', '🌙', '🌊', '🕯️', '🌸', '✨'];
            const colors = ['#39b59e', '#a685e2', '#f5a88c', '#85c1e2', '#f5d38c', '#85e2a6'];
            const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const user = {
                _id: String(memoryDB.users.length + 1),
                username,
                email,
                password: hashedPassword,
                avatar: randomAvatar,
                color: randomColor,
                createdAt: new Date()
            };
            memoryDB.users.push(user);

            const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({ token, user: { username: user.username, email: user.email, avatar: user.avatar, color: user.color } });
        }
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ email });
            if (!user) return res.status(400).json({ error: 'Invalid credentials' });

            const isMatch = await user.comparePassword(password);
            if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ token, user: { username: user.username, email: user.email, avatar: user.avatar, color: user.color } });
        } else {
            const user = memoryDB.users.find(u => u.email === email);
            if (!user) return res.status(400).json({ error: 'Invalid credentials' });

            const bcrypt = require('bcryptjs');
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ token, user: { username: user.username, email: user.email, avatar: user.avatar, color: user.color } });
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const user = await User.findById(req.user.id).select('-password');
            res.json(user);
        } else {
            const user = memoryDB.users.find(u => u._id === req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

// --- WAITLIST API ---
app.post('/api/waitlist', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        if (mongoose.connection.readyState === 1) {
            const existing = await Waitlist.findOne({ email });
            if (existing) {
                return res.status(400).json({ error: 'Email already in list' });
            }

            const newEntry = new Waitlist({ email });
            await newEntry.save();
            res.status(201).json({ message: 'Added to waitlist' });
        } else {
            const existing = memoryDB.waitlist.find(w => w.email === email);
            if (existing) {
                return res.status(400).json({ error: 'Email already in list' });
            }

            memoryDB.waitlist.push({ email, createdAt: new Date() });
            res.status(201).json({ message: 'Added to waitlist' });
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

// --- MOMENTS (POSTS) API ---
app.get('/api/posts', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const posts = await Post.find().sort({ createdAt: -1 });
            res.json(posts);
        } else {
            const sortedPosts = [...memoryDB.posts].sort((a, b) => b.createdAt - a.createdAt);
            res.json(sortedPosts);
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
    const { text, media, mediaType } = req.body;

    try {
        if (mongoose.connection.readyState === 1) {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const newPost = new Post({
                name: user.username,
                avatar: user.avatar,
                color: user.color,
                text,
                media,
                mediaType
            });
            await newPost.save();
            res.status(201).json(newPost);
        } else {
            const user = memoryDB.users.find(u => u._id === req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const newPost = {
                _id: String(memoryDB.posts.length + 1),
                name: user.username,
                avatar: user.avatar,
                color: user.color,
                text,
                media,
                mediaType,
                createdAt: new Date()
            };
            memoryDB.posts.push(newPost);
            res.status(201).json(newPost);
        }
    } catch (err) {
        console.error('Create Post Error:', err);
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

app.get('/api/posts/me', authenticateToken, async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const user = await User.findById(req.user.id);
            const posts = await Post.find({ name: user.username }).sort({ createdAt: -1 });
            res.json(posts);
        } else {
            const user = memoryDB.users.find(u => u._id === req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const posts = memoryDB.posts.filter(p => p.name === user.username)
                .sort((a, b) => b.createdAt - a.createdAt);
            res.json(posts);
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});


// --- SOCKET.IO ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on('send-message', (data) => {
        const { roomId, message, user } = data;
        io.to(roomId).emit('receive-message', { message, user, id: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 6005;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

