import UserItem from "../models/user.model.js";
import jwt from "jsonwebtoken";

import bcrypt from "bcryptjs/dist/bcrypt.js";

const jwtToken = process.env.jwtSecret || "";

export async function getUserId(authorizationToken) {
    try {
        const decoded = jwt.verify(authorizationToken, jwtToken);

        const userId = decoded.user.id;

        let user = await UserItem.findOne({ _id: userId });

        if (!user) {
            throw("Failed to get user.");
            // return res.status(400).json({ msg: "Failed to get user."});
        }

        return user;
    } catch (err) {
        console.log(err.message);
        throw("Server Error"); 
        // res.status(500).send('Server Error');
    }
}

export async function getUser(req, res) {
    const authorizationToken = req.headers['authorization'];
    console.log(authorizationToken);

    try {
        const decoded = jwt.verify(authorizationToken, jwtToken);
        console.log(decoded);
        const userId = decoded.user.id;
        console.log(userId);

        let user = await UserItem.findOne({ _id: userId });

        if (!user) {            
            return res.status(400).json({ msg: "Failed to get user."});
        }

        res.send(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

export async function registerUser(req, res) {
    const { name, email, password } = req.body;

    try {
        let user = await UserItem.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: "User already exists." });
        }

        user = new UserItem({ name, email, password });

        const salt = await bcrypt.genSaltSync(10);
        user.password = await bcrypt.hashSync(password, salt);

        await user.save();

        const payload = {
            user: { id: user.id }
        };

        jwt.sign(payload, jwtToken, { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

export async function loginUser(req, res) {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        let user = await UserItem.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        const accessToken = jwt.sign(payload, jwtToken, { expiresIn: '1h' });
        const refreshToken = jwt.sign(payload, jwtToken, { expiresIn: '1d' });

        res.cookie('refreshToken', refreshToken, { httpOnly: false, sameSite: 'Lax', secure: false })
            .header('Authorization', accessToken)
            .send(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

export async function refreshToken(req, res) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
        return res.status(401).send('Access Denied. No refresh token provided.');
    }

    try {
        const decoded = jwt.verify(refreshToken, jwtToken);
        console.log(decoded.user.id);
        const payload = {
            user: {
                id: decoded.user.id
            }
        };
        const accessToken = jwt.sign(payload, jwtToken, { expiresIn: '1h' });
        const refToken = jwt.sign(payload, jwtToken, { expiresIn: '1d' });
        

        console.log("test");
        console.log(accessToken);
        res.cookie('refreshToken', refToken, { httpOnly: false, sameSite: 'Lax', secure: false })
            .header('Authorization', accessToken)
            .send(decoded.user);
    } catch (err) {
        return res.status(400).send("Invalid refresh token.");
    }
}