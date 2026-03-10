const jwt = require("jsonwebtoken");

exports.protect = async (req, res, next) => {
  try {

    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token Missing",
      });
    }

    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decode;

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token Invalid",
      });
    }

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Auth Middleware Error",
    });
  }
};