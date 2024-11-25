const jsonwebtoken = require("jsonwebtoken");
const JWT_SECRET = require("../config");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authorization token missing or invalid",
        });
    }

    const token = authHeader.split(" ")[1]; // Extract the token after 'Bearer'

    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET); // Verify the token
        req.userId = decoded.userId; // Attach the decoded token payload to the request object
        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        console.error(err);
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

module.exports = authMiddleware;
