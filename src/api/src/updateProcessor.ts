import { RabbitMQListener } from './services/rabbitMqListener';
import dotenv from 'dotenv';

// Load environment variables from a .env file into process.env
dotenv.config();

const listener = new RabbitMQListener();

listener.listen((message) => {
    console.log("Processing message:", message);
    // Add your message processing logic here

});