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
const Table = require('./models/Table');

// In-Memory Database Fallback Store
const memoryDB = {
    users: [],
    posts: [],
    waitlist: [],
    tables: []
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
    const { username, email, password, languages, avatar, color } = req.body;
    try {
        if (mongoose.connection.readyState === 1) {
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) return res.status(400).json({ error: 'User already exists' });

            const user = new User({ 
                username, 
                email, 
                password, 
                avatar: avatar || undefined, 
                color: color || undefined, 
                languages: languages || undefined 
            });
            await user.save();

            const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({ 
                token, 
                user: { 
                    id: user._id, 
                    username: user.username, 
                    email: user.email, 
                    avatar: user.avatar, 
                    color: user.color,
                    bio: user.bio,
                    languages: user.languages,
                    hoursListened: user.hoursListened,
                    tablesJoined: user.tablesJoined
                } 
            });
        } else {
            const existingUser = memoryDB.users.find(u => u.email === email || u.username === username);
            if (existingUser) return res.status(400).json({ error: 'User already exists' });

            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const avatars = ['🦊', '🐰', '🦁', '🐢', '🕊️', '🌿', '🌙', '🌊', '🕯️', '🌸', '✨'];
            const colors = ['#39b59e', '#a685e2', '#f5a88c', '#85c1e2', '#f5d38c', '#85e2a6'];
            const randomAvatar = avatar || avatars[Math.floor(Math.random() * avatars.length)];
            const randomColor = color || colors[Math.floor(Math.random() * colors.length)];
            const finalLanguages = languages || 'KO, EN';

            const user = {
                _id: String(memoryDB.users.length + 1),
                username,
                email,
                password: hashedPassword,
                avatar: randomAvatar,
                color: randomColor,
                bio: 'Finding calm in the noise. Slowly building a digital sanctuary. Happy to just listen, rarely speaking unless asked.',
                languages: finalLanguages,
                hoursListened: 0,
                tablesJoined: 0,
                createdAt: new Date()
            };
            memoryDB.users.push(user);

            const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({ 
                token, 
                user: { 
                    id: user._id, 
                    username: user.username, 
                    email: user.email, 
                    avatar: user.avatar, 
                    color: user.color,
                    bio: user.bio,
                    languages: user.languages,
                    hoursListened: user.hoursListened,
                    tablesJoined: user.tablesJoined
                } 
            });
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
            res.json({ 
                token, 
                user: { 
                    id: user._id, 
                    username: user.username, 
                    email: user.email, 
                    avatar: user.avatar, 
                    color: user.color,
                    bio: user.bio,
                    languages: user.languages,
                    hoursListened: user.hoursListened,
                    tablesJoined: user.tablesJoined
                } 
            });
        } else {
            const user = memoryDB.users.find(u => u.email === email);
            if (!user) return res.status(400).json({ error: 'Invalid credentials' });

            const bcrypt = require('bcryptjs');
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ 
                token, 
                user: { 
                    id: user._id, 
                    username: user.username, 
                    email: user.email, 
                    avatar: user.avatar, 
                    color: user.color,
                    bio: user.bio,
                    languages: user.languages,
                    hoursListened: user.hoursListened,
                    tablesJoined: user.tablesJoined
                } 
            });
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
            io.emit('new-post', newPost);
            res.status(201).json(newPost);
        } else {
            let user = memoryDB.users.find(u => u._id === req.user.id);
            if (!user) {
                // Fallback user metadata from verified token
                const avatars = ['🦊', '🐰', '🦁', '🐢', '🕊️', '🌿', '🌙', '🌊', '🕯️', '🌸', '✨'];
                const colors = ['#39b59e', '#a685e2', '#f5a88c', '#85c1e2', '#f5d38c', '#85e2a6'];
                user = {
                    _id: req.user.id,
                    username: req.user.username,
                    avatar: avatars[Math.floor(Math.random() * avatars.length)],
                    color: colors[Math.floor(Math.random() * colors.length)]
                };
            }

            const newPost = {
                _id: String(memoryDB.posts.length + 1),
                name: user.username,
                avatar: user.avatar,
                color: user.color,
                text,
                media,
                mediaType,
                count: 0,
                supportedBy: [],
                createdAt: new Date()
            };
            memoryDB.posts.push(newPost);
            io.emit('new-post', newPost);
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
            const username = user ? user.username : req.user.username;

            const posts = memoryDB.posts.filter(p => p.name === username)
                .sort((a, b) => b.createdAt - a.createdAt);
            res.json(posts);
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

// --- MOMENTS (POSTS) SUPPORT API ---
app.post('/api/posts/:id/support', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username;
        if (mongoose.connection.readyState === 1) {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ error: 'Post not found' });

            if (!post.supportedBy) post.supportedBy = [];
            
            const index = post.supportedBy.indexOf(username);
            if (index > -1) {
                // Already supported, toggle to unsupport
                post.supportedBy.splice(index, 1);
                post.count = Math.max(0, post.count - 1);
            } else {
                // Support
                post.supportedBy.push(username);
                post.count = (post.count || 0) + 1;
            }

            await post.save();
            io.emit('post-supported', { postId: post._id, count: post.count, supportedBy: post.supportedBy });
            res.json(post);
        } else {
            const post = memoryDB.posts.find(p => p._id === req.params.id);
            if (!post) return res.status(404).json({ error: 'Post not found' });

            if (!post.supportedBy) post.supportedBy = [];
            
            const index = post.supportedBy.indexOf(username);
            if (index > -1) {
                // Already supported, toggle to unsupport
                post.supportedBy.splice(index, 1);
                post.count = Math.max(0, post.count - 1);
            } else {
                // Support
                post.supportedBy.push(username);
                post.count = (post.count || 0) + 1;
            }

            io.emit('post-supported', { postId: post._id, count: post.count, supportedBy: post.supportedBy });
            res.json(post);
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

// --- MOMENTS (POSTS) DELETE API ---
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ error: 'Post not found' });
            
            // Check authorization
            if (post.name !== req.user.username) {
                return res.status(403).json({ error: 'You can only delete your own posts' });
            }
            
            await Post.findByIdAndDelete(req.params.id);
            res.json({ message: 'Post deleted successfully' });
        } else {
            const postIndex = memoryDB.posts.findIndex(p => p._id === req.params.id);
            if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });
            
            if (memoryDB.posts[postIndex].name !== req.user.username) {
                return res.status(403).json({ error: 'You can only delete your own posts' });
            }
            
            memoryDB.posts.splice(postIndex, 1);
            res.json({ message: 'Post deleted successfully' });
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

// --- TABLES (ROOMS) API ---
app.get('/api/tables', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const tables = await Table.find({ status: 'active' }).sort({ createdAt: -1 });
            res.json(tables);
        } else {
            const activeTables = memoryDB.tables
                .filter(t => t.status === 'active')
                .sort((a, b) => b.createdAt - a.createdAt);
            res.json(activeTables);
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

app.post('/api/tables', authenticateToken, async (req, res) => {
    const { title, type } = req.body;
    if (!title) return res.status(400).json({ error: 'Room title is required' });

    try {
        if (mongoose.connection.readyState === 1) {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const newTable = new Table({
                title,
                type: type || 'voice',
                hostId: user._id.toString(),
                hostName: user.username,
                hostAvatar: user.avatar,
                hostColor: user.color,
                status: 'active'
            });
            await newTable.save();
            res.status(201).json(newTable);
        } else {
            let user = memoryDB.users.find(u => u._id === req.user.id);
            if (!user) {
                // Fallback user metadata from verified token
                const avatars = ['🦊', '🐰', '🦁', '🐢', '🕊️', '🌿', '🌙', '🌊', '🕯️', '🌸', '✨'];
                const colors = ['#39b59e', '#a685e2', '#f5a88c', '#85c1e2', '#f5d38c', '#85e2a6'];
                user = {
                    _id: req.user.id,
                    username: req.user.username,
                    avatar: avatars[Math.floor(Math.random() * avatars.length)],
                    color: colors[Math.floor(Math.random() * colors.length)]
                };
            }

            const newTable = {
                _id: String(memoryDB.tables.length + 1),
                title,
                type: type || 'voice',
                hostId: user._id,
                hostName: user.username,
                hostAvatar: user.avatar,
                hostColor: user.color,
                status: 'active',
                createdAt: new Date()
            };
            memoryDB.tables.push(newTable);
            console.log("Created table in memoryDB:", newTable);
            res.status(201).json(newTable);
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

app.get('/api/tables/:id', async (req, res) => {
    try {
        console.log("GET /api/tables/:id requested, ID:", req.params.id, "Mongoose readyState:", mongoose.connection.readyState);
        if (mongoose.connection.readyState === 1) {
            const table = await Table.findById(req.params.id);
            if (!table) {
                console.log("Table not found in MongoDB:", req.params.id);
                return res.status(404).json({ error: 'Room not found' });
            }
            res.json(table);
        } else {
            console.log("Searching in memoryDB tables:", memoryDB.tables);
            const table = memoryDB.tables.find(t => t._id === req.params.id);
            if (!table) {
                console.log("Table not found in memoryDB:", req.params.id);
                return res.status(404).json({ error: 'Room not found' });
            }
            res.json(table);
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

app.delete('/api/tables/:id', authenticateToken, async (req, res) => {
    try {
        let isHost = false;
        let tableData = null;

        if (mongoose.connection.readyState === 1) {
            const table = await Table.findById(req.params.id);
            if (!table) return res.status(404).json({ error: 'Room not found' });
            
            if (table.hostId === req.user.id) {
                isHost = true;
                tableData = table;
                // Delete or set to ended
                await Table.findByIdAndDelete(req.params.id);
            }
        } else {
            const tableIndex = memoryDB.tables.findIndex(t => t._id === req.params.id);
            if (tableIndex === -1) return res.status(404).json({ error: 'Room not found' });
            
            const table = memoryDB.tables[tableIndex];
            if (table.hostId === req.user.id) {
                isHost = true;
                tableData = table;
                memoryDB.tables.splice(tableIndex, 1);
            }
        }

        if (!isHost) {
            return res.status(403).json({ error: 'Only the host can end this room' });
        }

        // Notify socket clients in the room
        io.to(req.params.id).emit('room-ended');
        res.json({ message: 'Room ended successfully' });
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});


// Keep track of active room participants
const activeRooms = {};

async function endRoom(roomId) {
    try {
        console.log(`Automatically ending room ${roomId}`);
        if (mongoose.connection.readyState === 1) {
            await Table.findByIdAndDelete(roomId);
        } else {
            const tableIndex = memoryDB.tables.findIndex(t => t._id === roomId);
            if (tableIndex !== -1) {
                memoryDB.tables.splice(tableIndex, 1);
            }
        }
        
        // Notify all users in the room
        io.to(roomId).emit('room-ended');
        
        // Cleanup active room list
        if (activeRooms[roomId]) {
            delete activeRooms[roomId];
        }
    } catch (err) {
        console.error(`Error automatically ending room ${roomId}:`, err.message);
    }
}

// --- SOCKET.IO ---
app.put('/api/auth/me', authenticateToken, async (req, res) => {
    const { username, bio, languages, avatar, color } = req.body;
    try {
        if (mongoose.connection.readyState === 1) {
            const updateFields = {};
            if (username !== undefined) updateFields.username = username;
            if (bio !== undefined) updateFields.bio = bio;
            if (languages !== undefined) updateFields.languages = languages;
            if (avatar !== undefined) updateFields.avatar = avatar;
            if (color !== undefined) updateFields.color = color;

            if (username) {
                const existing = await User.findOne({ username, _id: { $ne: req.user.id } });
                if (existing) return res.status(400).json({ error: 'Username already taken' });
            }

            const user = await User.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true }).select('-password');
            res.json(user);
        } else {
            const user = memoryDB.users.find(u => u._id === req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            if (username) {
                const existing = memoryDB.users.find(u => u.username === username && u._id !== req.user.id);
                if (existing) return res.status(400).json({ error: 'Username already taken' });
            }

            if (username !== undefined) user.username = username;
            if (bio !== undefined) user.bio = bio;
            if (languages !== undefined) user.languages = languages;
            if (avatar !== undefined) user.avatar = avatar;
            if (color !== undefined) user.color = color;

            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        }
    } catch (err) {
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

const updateHoursListened = async (socket) => {
    if (socket.joinTime && socket.userId) {
        const elapsedMs = Date.now() - socket.joinTime;
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        socket.joinTime = null; // Prevent double calculation
        
        try {
            if (mongoose.connection.readyState === 1) {
                await User.findByIdAndUpdate(socket.userId, { $inc: { hoursListened: elapsedHours } });
            } else {
                const u = memoryDB.users.find(x => x._id === socket.userId);
                if (u) {
                    u.hoursListened = (u.hoursListened || 0) + elapsedHours;
                }
            }
        } catch (err) {
            console.error("Error updating hoursListened:", err);
        }
    }
};

// --- SOCKET.IO ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (data) => {
        // Support both old string format and new object format
        let roomId, user;
        if (typeof data === 'string') {
            roomId = data;
            user = { username: 'Someone_' + socket.id.substring(0, 4), avatar: '👤', color: '#ccc' };
        } else {
            roomId = data.roomId;
            user = data.user;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        if (!activeRooms[roomId]) {
            activeRooms[roomId] = [];
        }

        // Clean duplicates but preserve original join timestamp if they already have one
        const existingUser = activeRooms[roomId].find(u => u.username === user.username);
        const joinedAt = existingUser ? existingUser.joinedAt : Date.now();

        socket.user = {
            username: user.username,
            avatar: user.avatar,
            color: user.color,
            isSpeaker: user.isSpeaker || false,
            isAdmin: user.isAdmin || false,
            socketId: socket.id,
            joinedAt: joinedAt
        };

        // Clean duplicates
        activeRooms[roomId] = activeRooms[roomId].filter(u => u.username !== user.username);
        activeRooms[roomId].push(socket.user);

        console.log(`User ${user.username} joined room: ${roomId}`);

        if (user && user.id) {
            socket.userId = user.id;
            socket.joinTime = Date.now();
            
            // Increment tablesJoined
            if (mongoose.connection.readyState === 1) {
                User.findByIdAndUpdate(user.id, { $inc: { tablesJoined: 1 } }).catch(err => {
                    console.error("Error incrementing tablesJoined:", err);
                });
            } else {
                const u = memoryDB.users.find(x => x._id === user.id);
                if (u) {
                    u.tablesJoined = (u.tablesJoined || 0) + 1;
                }
            }
        }
        io.to(roomId).emit('update-participants', activeRooms[roomId]);
    });

    socket.on('send-message', (data) => {
        const { roomId, message, user } = data;
        io.to(roomId).emit('receive-message', { message, user, id: socket.id });
    });

    socket.on('audio-chunk', (data) => {
        const { roomId, username, chunk, sampleRate } = data;
        socket.to(roomId).emit('audio-chunk', { username, chunk, sampleRate });
    });

    socket.on('request-chair', ({ roomId, user }) => {
        console.log(`User ${user.username} requested a chair in room ${roomId}`);
        io.to(roomId).emit('chair-requested', { user });
    });

    socket.on('permit-chair', ({ roomId, username }) => {
        console.log(`Host permitted chair for ${username} in room ${roomId}`);
        if (activeRooms[roomId]) {
            const speakersCount = activeRooms[roomId].filter(u => u.isSpeaker || u.isAdmin).length;
            if (speakersCount >= 6) {
                socket.emit('error-msg', { message: 'Cannot permit chair: Speakers capacity (6) has been reached.' });
                return;
            }

            const participant = activeRooms[roomId].find(u => u.username === username);
            if (participant) {
                participant.isSpeaker = true;
            }
            io.to(roomId).emit('update-participants', activeRooms[roomId]);
        }
        io.to(roomId).emit('chair-permitted', { username });
    });

    socket.on('make-admin', ({ roomId, username }) => {
        console.log(`User ${username} promoted to admin in room ${roomId}`);
        if (activeRooms[roomId]) {
            const participant = activeRooms[roomId].find(u => u.username === username);
            if (participant) {
                participant.isAdmin = true;
                participant.isSpeaker = true; // admins are speakers
            }
            io.to(roomId).emit('update-participants', activeRooms[roomId]);
        }
        io.to(roomId).emit('user-promoted-to-admin', { username });
    });

    socket.on('invite-to-speak', ({ roomId, username }) => {
        console.log(`Host invited ${username} to speak in room ${roomId}`);
        io.to(roomId).emit('speak-invitation-received', { username });
    });

    socket.on('accept-speak-invitation', ({ roomId, username }) => {
        console.log(`${username} accepted speak invitation in room ${roomId}`);
        if (activeRooms[roomId]) {
            const speakersCount = activeRooms[roomId].filter(u => u.isSpeaker || u.isAdmin).length;
            if (speakersCount >= 6) {
                socket.emit('error-msg', { message: 'Cannot join stage: Speakers capacity (6) has been reached.' });
                return;
            }

            const participant = activeRooms[roomId].find(u => u.username === username);
            if (participant) {
                participant.isSpeaker = true;
            }
            io.to(roomId).emit('update-participants', activeRooms[roomId]);
        }
        io.to(roomId).emit('chair-permitted', { username });
    });

    socket.on('decline-speak-invitation', ({ roomId, username }) => {
        console.log(`${username} declined speak invitation in room ${roomId}`);
        io.to(roomId).emit('speak-invitation-declined', { username });
    });

    socket.on('demote-speaker', ({ roomId, username }) => {
        console.log(`Host demoted ${username} in room ${roomId}`);
        if (activeRooms[roomId]) {
            const participant = activeRooms[roomId].find(u => u.username === username);
            if (participant) {
                participant.isSpeaker = false;
                participant.isAdmin = false; // Strip admin/host status if they had it
            }
            io.to(roomId).emit('update-participants', activeRooms[roomId]);
        }
        io.to(roomId).emit('speaker-demoted', { username });
    });

    socket.on('leave-room', async ({ roomId }) => {
        const user = socket.user;
        if (roomId && user && activeRooms[roomId]) {
            console.log(`User ${user.username} explicitly left room: ${roomId}`);
            activeRooms[roomId] = activeRooms[roomId].filter(u => u.socketId !== socket.id);
            io.to(roomId).emit('update-participants', activeRooms[roomId]);
            
            await updateHoursListened(socket);

            const anyAdminLeft = activeRooms[roomId].some(u => u.isAdmin === true);
            if (!anyAdminLeft) {
                console.log(`Last host explicitly left. Ending room ${roomId} immediately.`);
                endRoom(roomId);
            }
        }
    });

    socket.on('disconnect', async () => {
        const { roomId, user } = socket;
        if (roomId && user && activeRooms[roomId]) {
            activeRooms[roomId] = activeRooms[roomId].filter(u => u.socketId !== socket.id);
            io.to(roomId).emit('update-participants', activeRooms[roomId]);
            console.log(`User ${user.username} left room: ${roomId} (disconnect)`);
            
            await updateHoursListened(socket);

            // If there are no admins left, end the room automatically after a grace period (handles page refreshes)
            const anyAdminLeft = activeRooms[roomId].some(u => u.isAdmin === true);
            if (!anyAdminLeft) {
                console.log(`No admins left in room ${roomId}. Starting 5-second grace period...`);
                setTimeout(async () => {
                    if (activeRooms[roomId]) {
                        const anyAdminActiveNow = activeRooms[roomId].some(u => u.isAdmin === true);
                        if (!anyAdminActiveNow) {
                            console.log(`Grace period expired. Ending room ${roomId} automatically.`);
                            await endRoom(roomId);
                        } else {
                            console.log(`Admin reconnected. Room ${roomId} will not be ended.`);
                        }
                    } else {
                        await endRoom(roomId);
                    }
                }, 5000);
            }
        } else {
            console.log('User disconnected:', socket.id);
        }
    });
});

const PORT = process.env.PORT || 6005;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

