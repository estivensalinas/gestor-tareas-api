const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ["pendiente", "en progreso", "completada"],
    default: "pendiente",
  },
  dueDate: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Task", taskSchema);
