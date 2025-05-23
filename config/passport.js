const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                console.log("🔐 Incoming login attempt:");
                console.log("   Email:", email);
                console.log("   Password (raw):", password);

                // Convert email to lowercase for case-insensitive match
                const user = await User.findOne({ email: email.toLowerCase() });

                if (!user) {
                    console.log("❌ User not found with email:", email.toLowerCase());
                    return done(null, false, { message: 'That email is not registered' });
                }

                console.log("✅ User found:", user.email);

                // Compare the provided password with the hashed password in the DB
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    console.log("✅ Password match. Login successful.");
                    return done(null, user);
                } else {
                    console.log("❌ Password mismatch.");
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (err) {
                console.error("🔥 Error during authentication:", err);
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
