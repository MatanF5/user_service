import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientKafka, Transport } from '@nestjs/microservices';
import { KAFKA_TOPICS, UserFollowedEvent } from './kafka.types';

@Injectable()
export class KafkaService implements OnModuleInit {
  @Client({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'post-service',
        brokers: [process.env.KAFKA_BROKERS || 'kafka:29092'],
      },
      producer: {
        allowAutoTopicCreation: true,
      },
    },
  })
  private client: ClientKafka;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.client.connect();
  }

  async onUserFollowed(data: UserFollowedEvent) {
    return this.client.emit(KAFKA_TOPICS.USER_FOLLOWED, data);
  }
}
