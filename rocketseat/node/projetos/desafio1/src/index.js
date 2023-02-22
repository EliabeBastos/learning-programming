const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Configurations

const PORT = 3333;
const app = express();

const database = {
  users: [],
  todos: []
};

// user middlewares

function checkIfTheUserIsLoggedIn(req, res, next) {
  const { userToken } = req.headers;
  const user = database.users.find((user) => user.user_token === userToken);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  req.user = user;

  return next();
}

function checkIfTheTodoBelongsToTheUser(req, res, next) {
  const { params: { todoToken }, user } = req;

  const todo = database.todos.find((todo) => todo.token === todoToken);

  if (user.user_token !== todo.user_token) {
    return res.status(403).json({ error: 'Todo not belongs to this user' });
  }

  req.todo = todo;

  return next();
}

// user routes

app.post('/users', (req, res) => {
  const body = req.body;

  const dbUser = database.users.find((user) => user.username === body.username);
  
  if (dbUser) {
    return res.status(404).json({ error: 'User already exists' });
  }

  const user = {
    token: uuidv4(),
    name: body.name,
    username: body.username,
    created_at: new Date(),
    updated_at: null
  }

  database.users.push(user);

  return res.status(201).send();
});

app.get('/users/:userToken', (req, res) => {
  const { params } = req;

  const user = database.users.find((user) => user.user_token === params.userToken);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).send(user);
});

app.get('/users', (req, res) => {
  return res.status(200).send(database.users);
});

// todos routes

app.post('/todos', checkIfTheUserIsLoggedIn, (req, res) => {
  const { body, user } = req;


  const todo = {
    token: uuidv4(),
    user_token: user.userToken,
    title: body.title,
    deadline: new Date(body.deadline),
    done: false,
    created_at: new Date(),
    updated_at: null
  }

  database.todos.push(todo);

  return res.status(201).send();
});

app.get('/todos/:todoToken', checkIfTheUserIsLoggedIn, checkIfTheTodoBelongsToTheUser, (req, res) => {
  const { todo } = req;

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.status(200).send(todo);
});

app.get('/todos', checkIfTheUserIsLoggedIn, (req, res) => {
  const { user } = req;

  const todos = database.todos.filter((todo) => todo.user_token === user.user_token);

  if (todos.length === 0) {
    return res.status(404).json({ error: 'Todos not found' });
  }

  res.status(200).send(todos);
});

app.put('/todos/:todoToken', checkIfTheUserIsLoggedIn, checkIfTheTodoBelongsToTheUser, (req, res) => {
  const { todo, body } = req;

  todo.title = body.title ?? undefined;
  todo.deadline = new Date(body.deadline).toISOString() ?? undefined;

  res.status(200).send();
});

app.patch('/todos/:todoToken', checkIfTheUserIsLoggedIn, checkIfTheTodoBelongsToTheUser, (req, res) => {
  const { todo } = req;
  
  todo.done = false;

  res.status(200).send();
});

app.delete('todos/:todoToken', checkIfTheUserIsLoggedIn, checkIfTheTodoBelongsToTheUser, (req, res) => {
  const { todo } = req;

  database.users.splice(todo, 1);

  res.status(200).send();
})

// app listen

app.listen(PORT, () => console.log(`The server is listening in ${PORT} port.`));