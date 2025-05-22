import { User } from 'src/users/schemas/users.schema';

export interface UserFollowedEvent {
  followerId: User['_id'];
  followedId: User['_id'];
  timestamp: Date;
}

export const KAFKA_TOPICS = {
  USER_FOLLOWED: 'user.followed',
} as const;
