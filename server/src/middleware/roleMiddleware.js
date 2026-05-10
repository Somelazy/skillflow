const roleMiddleware = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.Role;
  const roleId = req.user?.Id_role;

  if (!allowedRoles.includes(role) && !allowedRoles.includes(roleId)) {
    return res.status(403).json({ success: false, message: "Недостаточно прав" });
  }

  next();
};

module.exports = roleMiddleware;

