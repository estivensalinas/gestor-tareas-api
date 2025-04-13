const Task = require("../models/Task");

const createTask = async (body, userId) => {
  return Task.create({ ...body, userId });
};

const getTasks = async (query, userId) => {


  const { status, search } = query;
  const filter = { userId };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
    ];
  }

  return Task.find(filter);
};

const getTaskById = async (id, userId) => {
  return Task.findOne({ _id: id, userId });
};

const updateTask = async (body, id, userId) => {
  const task = await Task.findOne({ _id: id, userId });

  if (!task) {
    throw new Error("No se encontró la tarea");
  }

  const status = task.status;
  const currentStatus = body.status;

  if (status === "completada") {
    throw new Error("No se puede editar una tarea completada");
  }

  if (currentStatus === "pendiente" && status === "en progreso") {
    throw new Error(
      "No se puede cambiar el estado de una tarea en progreso a pendiente"
    );
  }

  const setStatus = (status, currentStatus) => {
    switch (currentStatus) {
      case "pendiente":
        return status === "en progreso" ? "en progreso" : currentStatus;
      case "en progreso":
        return status === "completada" ? "completada" : currentStatus;
      default:
        return currentStatus;
    }
  };

  task.title = body.title ?? task.title;
  task.description = body.description ?? task.description;
  task.dueDate = body.dueDate ?? task.dueDate;
  task.status = setStatus(body.status, task.status);
  return task;
};

const deleteTask = async (id, userId) => {
  const task = await Task.findOne({ _id: id, userId });

  if (task.status !== "completada") {
    throw new Error("Solo se puede eliminar tareas completadas");
  }

  return task.deleteOne();
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
