import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_DATABASE || 'scribe.ai',
    synchronize: false,
    logging: false,
    entities: [__dirname + './entity/*.ts'],
    migrations: [__dirname + './migration/*.ts'],
    subscribers: [__dirname + './subscriber/*.ts'],
});
