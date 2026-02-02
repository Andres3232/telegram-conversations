import { KafkaMessageProducer } from '@src/infrastructure/kafka/kafka-message.producer';

describe('KafkaMessageProducer', () => {
  it('send: lazily creates producer, connects once, and sends serialized envelope', async () => {
    // Arrange
    const producer = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const kafkaClient = {
      producer: jest.fn().mockReturnValue(producer),
    };
    const kafkaFactory = {
      createClient: jest.fn().mockReturnValue(kafkaClient),
    };

    const event = {
      getTopic: () => 'telegram',
      getKey: () => 'conv-1',
      getEventName: () => 'message.received',
      dataAsPayload: () => ({ hello: 'world' }),
    };

    const svc = new KafkaMessageProducer(kafkaFactory as any);

    // Act
    await svc.send(event as any);
    await svc.send(event as any);

    // Assert
    expect(kafkaFactory.createClient).toHaveBeenCalledTimes(1);
    expect(kafkaFactory.createClient).toHaveBeenCalledWith('producer');
    expect(kafkaClient.producer).toHaveBeenCalledTimes(1);
    expect(producer.connect).toHaveBeenCalledTimes(1);
    expect(producer.send).toHaveBeenCalledTimes(2);
    expect(producer.send).toHaveBeenCalledWith({
      topic: 'telegram',
      messages: [
        {
          key: 'conv-1',
          value: JSON.stringify({
            eventName: 'message.received',
            payload: { hello: 'world' },
          }),
        },
      ],
    });
  });

  it('onModuleDestroy: disconnects only if producer was created', async () => {
    // Arrange
    const producer = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const kafkaClient = {
      producer: jest.fn().mockReturnValue(producer),
    };
    const kafkaFactory = {
      createClient: jest.fn().mockReturnValue(kafkaClient),
    };

    const svc = new KafkaMessageProducer(kafkaFactory as any);

    // Act (no send called)
    await svc.onModuleDestroy();
    // then create producer
    await svc.send({
      getTopic: () => 'telegram',
      getKey: () => 'k',
      getEventName: () => 'e',
      dataAsPayload: () => ({}),
    } as any);
    await svc.onModuleDestroy();

    // Assert
    expect(producer.disconnect).toHaveBeenCalledTimes(1);
  });
});
