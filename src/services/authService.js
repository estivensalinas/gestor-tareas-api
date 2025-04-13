const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const register = async ({ name, email, password }) => {
  const user = new User({ name, email, password });
  return user.save();
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Credenciales inválidas");
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  return token;
};

const me = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  return user;
};

module.exports = {
  register,
  login,
  me,
};
