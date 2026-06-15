import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './database.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-task-manager-key-2026';

app.use(cors({
  origin: 'http://localhost:5173', // Vite frontend URL
  credentials: true
}));
app.use(express.json());

// WebSocket Connection Tracking
// Map of userId -> Set of WS connections
const userConnections = new Map();

// Helper to broadcast to all connections of a specific user except a specific client (optional)
function broadcastToUser(userId, data, excludeWs = null) {
  const connections = userConnections.get(userId);
  if (!connections) return;

  const payload = JSON.stringify(data);
  for (const client of connections) {
    if (client !== excludeWs && client.readyState === 1 /* OPEN */) {
      client.send(payload);
    }
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const existingUser = db.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.createUser(username, passwordHash);
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = db.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user.id, username: user.username } });
});

// Task Routes
app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const tasks = db.getTasks(req.user.id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    const task = db.createTask(req.user.id, { title, description, status, priority, dueDate });

    // Notify other active sockets for this user
    broadcastToUser(req.user.id, {
      type: 'TASK_CREATED',
      task,
      sender: req.user.username
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  try {
    const updatedTask = db.updateTask(req.user.id, req.params.id, { title, description, status, priority, dueDate });

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    // Notify other active sockets for this user
    broadcastToUser(req.user.id, {
      type: 'TASK_UPDATED',
      task: updatedTask,
      sender: req.user.username
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const success = db.deleteTask(req.user.id, req.params.id);

    if (!success) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    // Notify other active sockets for this user
    broadcastToUser(req.user.id, {
      type: 'TASK_DELETED',
      taskId: req.params.id,
      sender: req.user.username
    });

    res.json({ message: 'Task deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Upgrade HTTP Server to WebSockets
server.on('upgrade', (request, socket, head) => {
  // Parse authorization token from URL query params
  // ws://localhost:5000?token=XYZ
  const url = new URL(request.url, `http://${request.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    // Hand over connection to WebSocket Server
    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = decoded.id;
      ws.username = decoded.username;
      wss.emit('connection', ws, request);
    });
  });
});

// Handle WebSocket Connections
wss.on('connection', (ws) => {
  const userId = ws.userId;
  
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId).add(ws);

  // Send a heartbeat ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) {
      ws.ping();
    }
  }, 30000);

  ws.on('close', () => {
    clearInterval(pingInterval);
    const connections = userConnections.get(userId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        userConnections.delete(userId);
      }
    }
  });

  ws.on('error', (err) => {
    console.error(`WS Error for user ${userId}:`, err);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
