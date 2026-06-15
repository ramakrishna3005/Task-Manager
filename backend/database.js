import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

// Ensure db.json exists and is valid
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], tasks: [] }, null, 2));
  } else {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      JSON.parse(data);
    } catch (e) {
      // Re-initialize if corrupted
      fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], tasks: [] }, null, 2));
    }
  }
}

initDb();

function readData() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { users: [], tasks: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// User Operations
export const db = {
  getUserByUsername: (username) => {
    const data = readData();
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  getUserById: (id) => {
    const data = readData();
    return data.users.find(u => u.id === id);
  },

  createUser: (username, passwordHash) => {
    const data = readData();
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeData(data);
    return { id: newUser.id, username: newUser.username };
  },

  // Task Operations
  getTasks: (userId) => {
    const data = readData();
    return data.tasks.filter(t => t.userId === userId);
  },

  getTaskById: (taskId) => {
    const data = readData();
    return data.tasks.find(t => t.id === taskId);
  },

  createTask: (userId, taskData) => {
    const data = readData();
    const newTask = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      userId,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'todo', // todo, in_progress, review, done
      priority: taskData.priority || 'medium', // low, medium, high
      dueDate: taskData.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.tasks.push(newTask);
    writeData(data);
    return newTask;
  },

  updateTask: (userId, taskId, taskData) => {
    const data = readData();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId && t.userId === userId);
    if (taskIndex === -1) return null;

    const currentTask = data.tasks[taskIndex];
    const updatedTask = {
      ...currentTask,
      title: taskData.title !== undefined ? taskData.title : currentTask.title,
      description: taskData.description !== undefined ? taskData.description : currentTask.description,
      status: taskData.status !== undefined ? taskData.status : currentTask.status,
      priority: taskData.priority !== undefined ? taskData.priority : currentTask.priority,
      dueDate: taskData.dueDate !== undefined ? taskData.dueDate : currentTask.dueDate,
      updatedAt: new Date().toISOString()
    };

    data.tasks[taskIndex] = updatedTask;
    writeData(data);
    return updatedTask;
  },

  deleteTask: (userId, taskId) => {
    const data = readData();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId && t.userId === userId);
    if (taskIndex === -1) return false;

    data.tasks.splice(taskIndex, 1);
    writeData(data);
    return true;
  }
};
