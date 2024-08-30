const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false, // Set to false to use migrations
    logging: false,
    entities: [__dirname + '/src/entity/*.js'], // Adjust path if necessary
    migrations: [__dirname + '/src/migration/*.js'],
    subscribers: [__dirname + '/src/subscriber/*.js'],
});

module.exports = { AppDataSource };