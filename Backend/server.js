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

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err.message));

// Disable operation buffering so that operations fail immediately if not connected
mongoose.set('bufferCommands', false);

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: { username: user.username, email: user.email, avatar: user.avatar, color: user.color } });
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { username: user.username, email: user.email, avatar: user.avatar, color: user.color } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- WAITLIST API ---
app.post('/api/waitlist', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const existing = await Waitlist.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already in list' });
        }

        const newEntry = new Waitlist({ email });
        await newEntry.save();
        res.status(201).json({ message: 'Added to waitlist' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- MOMENTS (POSTS) API ---
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
    const { text, media, mediaType } = req.body;

    try {
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
    } catch (err) {
        console.error('Create Post Error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

app.get('/api/posts/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const posts = await Post.find({ name: user.username }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
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

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
