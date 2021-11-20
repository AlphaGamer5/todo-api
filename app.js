const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const PORT = process.env.PORT || 3000;

//Middleware
app.use(express.json());

//Starting server and connecting to db
const serverAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

serverAndDb();

const statusAndPriority = (params) => {
  return params.status !== undefined && params.priority !== undefined;
};

const hasStatus = (params) => {
  return params.status !== undefined;
};

const hasPriority = (params) => {
  return params.priority !== undefined;
};

// API-1: GET list of todos based on query
app.get("/todos/", async (req, res) => {
  const { status, priority, search_q = "" } = req.query;
  let query = "";
  switch (true) {
    case statusAndPriority(req.query):
      query = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE "%${search_q}%"
                    AND status = "${status}"
                    AND priority = "${priority}"
            ;`;
      break;
    case hasStatus(req.query):
      query = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE "%${search_q}%"
                    AND status = "${status}"
            ;`;
      break;
    case hasPriority(req.query):
      query = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE "%${search_q}%"
                    AND priority = "${priority}"
            ;`;
      break;

    default:
      query = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE "%${search_q}%"
            ;`;
      break;
  }

  const todos = await db.all(query);
  res.send(todos);
});

//API-2: GET a todo based on id
app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const query = `
        SELECT *
        FROM todo
        WHERE id = ${todoId}
    ;`;

  const todo = await db.get(query);
  res.send(todo);
});

//API-3: CREATE a todo
app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status } = req.body;
  const query = `
        INSERT INTO todo (id, todo, priority, status)
        VALUES (${id}, "${todo}", "${priority}", "${status}")
    ;`;

  const newTodo = db.run(query);
  res.send("Todo Successfully Added");
});

//API-4: UPDATE a todo
app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const reqBody = req.body;
  let updatedKey = "";
  switch (true) {
    case reqBody.status !== undefined:
      updatedKey = "Status";
      break;
    case reqBody.priority !== undefined:
      updatedKey = "Priority";
      break;
    case reqBody.todo !== undefined:
      updatedKey = "Todo";
      break;
  }

  const query1 = `
        SELECT *
        FROM todo
        WHERE id = ${todoId}
    ;`;

  const prevData = await db.get(query1);
  const {
    todo = prevData.todo,
    priority = prevData.priority,
    status = prevData.status,
  } = reqBody;
  let query = `
    UPDATE todo
    SET todo = "${todo}",
        priority = "${priority}",
        status = "${status}"
    WHERE id = ${todoId}
    ;`;

  const updatedTodo = await db.run(query);
  res.send(`${updatedKey} Updated`);
});

//API-5: DELETE a todo
app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const query = `
        DELETE FROM todo
        WHERE id = ${todoId}
    ;`;

  const todo = await db.run(query);
  res.send("Todo Deleted");
});

module.exports = app;
