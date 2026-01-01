const amqp = require('amqplib');
const pino = require('pino');

const logger = pino();

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    // Create exchange for events
    await channel.assertExchange('nexus_events', 'topic', { durable: true });

    connection.on('error', (err) => {
      logger.error('RabbitMQ Connection Error:', err);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ Connection Closed');
    });

    logger.info('RabbitMQ connection established successfully');
    
    return { connection, channel };
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
};

const publishEvent = async (eventType, data) => {
  try {
    if (!channel) {
      logger.warn('RabbitMQ channel not available, skipping event publication');
      return;
    }

    const message = {
      eventType,
      data,
      timestamp: new Date().toISOString(),
      service: 'chat-service'
    };

    const routingKey = eventType;
    
    await channel.publish(
      'nexus_events',
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.info(`Event published: ${eventType}`, { data });
  } catch (error) {
    logger.error('Failed to publish event:', error);
  }
};

const subscribeToEvents = async (eventPattern, callback) => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const queueName = `chat_service_${eventPattern.replace(/\./g, '_')}`;
    
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, 'nexus_events', eventPattern);

    await channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await callback(message);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing event:', error);
          channel.nack(msg, false, false); // Don't requeue
        }
      }
    });

    logger.info(`Subscribed to events: ${eventPattern}`);
  } catch (error) {
    logger.error('Failed to subscribe to events:', error);
    throw error;
  }
};

const disconnectRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection:', error);
  }
};

module.exports = {
  connectRabbitMQ,
  publishEvent,
  subscribeToEvents,
  disconnectRabbitMQ
};