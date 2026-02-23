const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

const readData = (file) => {
    if (!fs.existsSync(file)) return [];
    try {
        return JSON.parse(fs.readFileSync(file));
    } catch (e) {
        return [];
    }
};

const writeData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust this in production
        methods: ['GET', 'POST'],
    },
});

app.get('/', (req, res) => {
    res.send('StillHere Backend is running...');
});

// Waitlist API
app.post('/api/waitlist', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const waitlist = readData(WAITLIST_FILE);
    if (waitlist.includes(email)) {
        return res.status(400).json({ error: 'Email already in list' });
    }

    waitlist.push(email);
    writeData(WAITLIST_FILE, waitlist);
    res.status(201).json({ message: 'Added to waitlist' });
});

// Moments (Posts) API
app.get('/api/posts', (req, res) => {
    const posts = readData(POSTS_FILE);
    res.json(posts);
});

app.post('/api/posts', (req, res) => {
    const post = req.body;
    const posts = readData(POSTS_FILE);
    posts.unshift({
        ...post,
        id: Date.now(),
        time: 'Just now',
        count: 0
    });
    writeData(POSTS_FILE, posts);
    res.status(201).json(posts[0]);
});

// Basic Socket.io logic
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
