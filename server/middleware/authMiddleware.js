import jwt from "jsonwebtoken";

const jwtToken = process.env.jwtSecret || "";

function verifyToken(req, res, next) {
    const accessToken = req.headers['Authorization'];
    const refreshToken = req.cookies['refreshToken'];

    if (!accessToken && !refreshToken) {
        return res.status(401).send('Access Denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(accessToken, jwtToken);
        req.user = decoded.user;
        next();
    } catch (err) {
        if (!refreshToken) {
            return res.status(401).send('Access Denied. No refresh token provided.');
        }

        try {
            const decoded = jwt.verify(refreshToken, jwtToken);
            const accessToken = jwt.sign({ user: decoded.user }, jwtToken, { expiresIn: '1h' });

            res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
                .header('Authorization', accessToken)
                .send(decoded.user);
        } catch (err) {
            return res.status(400).send('Invalid Token.');
        }
    }
}