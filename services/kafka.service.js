const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'api-radar',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'api-group' });

await producer.connect();
await consumer.connect();

const sendToKafka = async (message) => {
    await producer.send({
        topic: 'api-hits',
        messages: [{ value: JSON.stringify(message) }]
    });
};

const consumeFromKafka = async () => {
    await consumer.subscribe({ topic: 'api-hits', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const apiData = JSON.parse(message.value.toString());
            // Process and batch update DB logic here
        },
    });
};

// Start consuming messages
consumeFromKafka();

module.exports = { sendToKafka };
