import { RabbitMQListener } from './services/rabbitMqListener';

const listener = new RabbitMQListener();

listener.listen((message) => {
    console.log("Processing message:", message);
    // Add your message processing logic here

});