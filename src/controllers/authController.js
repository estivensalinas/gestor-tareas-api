const authService = require("../services/authService");

const register = async ({ body }, res) => {
  await authService.register(body);
  res.status(201).json({ message: "Usuario creado" });
};

const login = async ({ body }, res) => {
  try {
    const token = await authService.login(body);
    res.json({ message: "Login exitoso", token });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await authService.me(req.userId);
    res.json(user);
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

module.exports = { register, login, me };
