require("dotenv").config();

const constants = {
    jwtSecretKey: process.env.JWT_SECRET_KEY,
    mongoDbURL: process.env.DB_URL,
    months: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
};

module.exports = constants;
