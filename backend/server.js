const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware - CORS 允许所有请求
app.use(cors());
app.use(express.json());

// Database file paths
const usersFile = path.join(DATA_DIR, 'users.json');
const postsFile = path.join(DATA_DIR, 'posts.json');
const commentsFile = path.join(DATA_DIR, 'comments.json');

// Initialize data files
function initializeDataFiles() {
  if (!fs.existsSync(usersFile)) {
    const defaultUsers = [
      {
        id: uuidv4(),
        username: 'ABDI',
        passwordHash: bcrypt.hashSync('code1024', 10),
        isAdmin: true,
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
  }

  if (!fs.existsSync(postsFile)) {
    fs.writeFileSync(postsFile, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(commentsFile)) {
    fs.writeFileSync(commentsFile, JSON.stringify([], null, 2));
  }
}

// Utility functions
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Middleware: Verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Routes

// 1. Register User
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const users = readJSON(usersFile);
  
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const newUser = {
    id: uuidv4(),
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    isAdmin: false,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJSON(usersFile, users);

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: newUser.id, username: newUser.username, isAdmin: false } });
});

// 2. Login User
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const users = readJSON(usersFile);
  const user = users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
});

// 3. Get all posts
app.get('/api/posts', (req, res) => {
  const posts = readJSON(postsFile);
  const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sortedPosts);
});

// 4. Get single post
app.get('/api/posts/:id', (req, res) => {
  const posts = readJSON(postsFile);
  const post = posts.find(p => p.id === req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  res.json(post);
});

// 5. Create post (authenticated users only)
app.post('/api/posts', verifyToken, (req, res) => {
  const { title, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  const posts = readJSON(postsFile);
  const newPost = {
    id: uuidv4(),
    title,
    content,
    tags: tags || [],
    author: req.username,
    authorId: req.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0
  };

  posts.push(newPost);
  writeJSON(postsFile, posts);

  res.status(201).json(newPost);
});

// 6. Update post (only author can update)
app.put('/api/posts/:id', verifyToken, (req, res) => {
  const { title, content, tags } = req.body;
  const posts = readJSON(postsFile);
  const postIndex = posts.findIndex(p => p.id === req.params.id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (posts[postIndex].authorId !== req.userId) {
    return res.status(403).json({ error: 'Only author can update post' });
  }

  posts[postIndex] = {
    ...posts[postIndex],
    title: title || posts[postIndex].title,
    content: content || posts[postIndex].content,
    tags: tags || posts[postIndex].tags,
    updatedAt: new Date().toISOString()
  };

  writeJSON(postsFile, posts);
  res.json(posts[postIndex]);
});

// 7. Delete post (only author can delete)
app.delete('/api/posts/:id', verifyToken, (req, res) => {
  const posts = readJSON(postsFile);
  const postIndex = posts.findIndex(p => p.id === req.params.id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (posts[postIndex].authorId !== req.userId) {
    return res.status(403).json({ error: 'Only author can delete post' });
  }

  posts.splice(postIndex, 1);
  writeJSON(postsFile, posts);

  res.json({ message: 'Post deleted' });
});

// 8. Get comments for post
app.get('/api/posts/:postId/comments', (req, res) => {
  const comments = readJSON(commentsFile);
  const postComments = comments
    .filter(c => c.postId === req.params.postId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json(postComments);
});

// 9. Create comment (authenticated users only)
app.post('/api/posts/:postId/comments', verifyToken, (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Comment content required' });
  }

  const posts = readJSON(postsFile);
  if (!posts.find(p => p.id === req.params.postId)) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const comments = readJSON(commentsFile);
  const newComment = {
    id: uuidv4(),
    postId: req.params.postId,
    author: req.username,
    authorId: req.userId,
    content,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  writeJSON(commentsFile, comments);

  res.status(201).json(newComment);
});

// 10. Delete comment (only author can delete)
app.delete('/api/comments/:id', verifyToken, (req, res) => {
  const comments = readJSON(commentsFile);
  const commentIndex = comments.findIndex(c => c.id === req.params.id);

  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (comments[commentIndex].authorId !== req.userId) {
    return res.status(403).json({ error: 'Only author can delete comment' });
  }

  comments.splice(commentIndex, 1);
  writeJSON(commentsFile, comments);

  res.json({ message: 'Comment deleted' });
});

// Initialize and start server
initializeDataFiles();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`⚠️  CORS 已启用所有请求 - 适用于开发和测试`);
});
