const { response, request } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccountByCPF(request, response, next) {
  const { cpf } = request.headers;
  
  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found' })
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((accumulator, operation) => {
    if (operation.type === 'credit') {
      return accumulator + operation.amount;
    }
    if (operation.type === 'debit') {
      return accumulator - operation.amount;
    }
  }, 0);

  return balance;
}

app.post('/accounts', (request, response) => {
  const { cpf, name } = request.body;

  const customersAlreadyExists = customers.some((customers) => customers.cpf === cpf);

  if (customersAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists' });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return response.status(201).send();
});

app.get('/statements', verifyIfExistsAccountByCPF, (request, response) => {
  return response.status(200).json(request.customer.statement)
});

app.post('/deposits', verifyIfExistsAccountByCPF, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const statementOperation = {
    description, amount, created_at: new Date, type: 'credit'
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post('/withdraws', verifyIfExistsAccountByCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;
  const balance = getBalance(customer.statement);

  if (balance  < amount) {
    return response.status(400).json({ error: 'Insufficient founds' });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }
  customer.statement.push(statementOperation);
    
  return response.status(201).send()
});

app.get('/statements/data', verifyIfExistsAccountByCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.headers;

  const dateFormat = new Date(date + ' 00:00');
  const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

  return response.json(statement);
});

app.put('/accounts', verifyIfExistsAccountByCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
})

app.get('/accounts', verifyIfExistsAccountByCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer);
});

app.delete('/accounts', verifyIfExistsAccountByCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(204).send();
});

app.get('/balances', verifyIfExistsAccountByCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(3333);