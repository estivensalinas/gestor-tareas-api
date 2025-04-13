const taskService = require("../services/taskService");

const createTask = async ({ body, userId }, res) => {
  const task = await taskService.createTask(body, userId);
  if (!task) {
    return res.status(400).json({ message: "Error al crear tarea" });
  }
  res.status(201).json({ message: "Tarea creada exitosamente", task });
};

const getTasks = async ({ query, userId }, res) => {
  const tasks = await taskService.getTasks(query, userId);
  if (!tasks) {
    return res.status(400).json({ message: "Error al obtener tareas" });
  }
  res.json(tasks);
};

const getTaskById = async ({ params, userId }, res) => {
  const task = await taskService.getTaskById(params.id, userId);
  if (!task) {
    return res.status(404).json({ message: "Tarea no encontrada" });
  }
  res.json(task);
};

const updateTask = async ({ body, params, userId }, res) => {
  try {
    const task = await taskService.updateTask(body, params.id, userId);
    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    await task.save();
    res.json({ message: "Tarea actualizada", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async ({ params, userId }, res) => {
  try {
    const task = await taskService.deleteTask(params.id, userId);
    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    res.json({ message: "Tarea eliminada" });
  } catch (error) {
    return res.status(500).json({ message: "Error al eliminar tarea" });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
