const express = require("express");
const zod = require("zod");
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const JWT_SECRET = require("../config"); // Ensure this points to the correct secret
const User = require("../models/User"); // Import the User model
const authMiddleware = require("../middleware");

const router = express.Router();

// Sign-up Schema
const signUpSchema = zod.object({
    username: zod.string().email({ message: "Invalid email address" }),
    password: zod.string().min(6, { message: "Password must be at least 6 characters long" }),
    firstName: zod.string().nonempty({ message: "First name cannot be empty" }),
    lastName: zod.string().nonempty({ message: "Last name cannot be empty" })
});

// Sign-in Schema
const signInSchema = zod.object({
    username: zod.string().email({ message: "Invalid email address" }),
    password: zod.string().min(6, { message: "Password must be at least 6 characters long" })
});


//Update user

const updateBody=zod.object({
    password:zod.string().optional(),
    firstName:zod.string().optional(),
    lastName:zod.string().optional()
})


// Sign-up Route
router.post("/signup", async (req, res) => {
    try {
        const { success, error, data } = signUpSchema.safeParse(req.body);

        if (!success) {
            return res.status(400).json({
                message: "Validation failed",
                error: error?.issues,
            });
        }

        const { username, password, firstName, lastName } = data;

        // Check if user already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already taken",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in the database
        const dbUser = await User.create({ username, password: hashedPassword, firstName, lastName });

        // Generate JWT token
        const token = jsonwebtoken.sign(
            { userId: dbUser._id },
            JWT_SECRET,
            { expiresIn: "1h" } // Set token expiration
        );

        res.status(201).json({
            message: "User created successfully",
            token: token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal server error",
        });
    }
});

// Sign-in Route
router.post("/signin", async (req, res) => {
    try {
        const { success, error, data } = signInSchema.safeParse(req.body);

        if (!success) {
            return res.status(400).json({
                message: "Validation failed",
                error: error?.issues,
            });
        }

        const { username, password } = data;

        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }

        // Compare password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }

        // Generate JWT token
        const token = jsonwebtoken.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "User signed in successfully",
            token: token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal server error",
        });
    }
});


router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }

		await User.updateOne({ _id: req.userId }, req.body);
	
    res.json({
        message: "Updated successfully"
    })
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})






module.exports = router;
