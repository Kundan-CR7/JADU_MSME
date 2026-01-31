const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
    async function (accessToken, refreshToken, profile, cb) {
        try {
            const email = profile.emails[0].value;
            const name = profile.displayName;
            const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

            let user = await prisma.staff.findUnique({ where: { email } });

            if (!user) {
                // Create new user if not exists
                // Default to ADMIN for new Google Sign-ups (assuming they are business owners)
                // Staff should be invited/created by Admin beforehand to be "STAFF"
                const role = "ADMIN";

                const randomPassword = Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(randomPassword, 10);

                user = await prisma.staff.create({
                    data: {
                        name,
                        email,
                        password: hashedPassword,
                        role,
                        avatar,
                        isAvailable: true
                    }
                });
            } else {
                // Optional: Update avatar on login if it changed or is missing
                if (avatar && user.avatar !== avatar) {
                    user = await prisma.staff.update({
                        where: { id: user.id },
                        data: { avatar }
                    });
                }
            }

            return cb(null, user);
        } catch (err) {
            return cb(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.staff.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
