import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/users.schema';
import { Model } from 'mongoose';
import { KafkaService } from 'src/kafka/kafka.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly kafkaService: KafkaService,
  ) {}

  async findOne(email: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ email: email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async follow(currentUserEmail: string, email: string) {
    const currentUser = await this.userModel.findOne({
      email: currentUserEmail,
    });
    const followedUser = await this.userModel.findOne({ email: email });
    if (!currentUser || !followedUser) {
      throw new NotFoundException('User not found');
    }
    if (
      currentUser.following
        .map((id) => id.toString())
        .includes(String(followedUser._id))
    ) {
      throw new ConflictException('Already following this user');
    }
    const session = await this.userModel.db.startSession();
    session.startTransaction();
    try {
      await this.userModel.findOneAndUpdate(
        { _id: currentUser._id },
        { $addToSet: { following: followedUser._id } },
        { new: true, session },
      );
      await this.userModel.findOneAndUpdate(
        { _id: followedUser._id },
        { $addToSet: { followers: currentUser._id } },
        { new: true, session },
      );
      await session.commitTransaction();
      await this.kafkaService.onUserFollowed({
        followerId: currentUser._id,
        followedId: followedUser._id,
        timestamp: new Date(),
      });
      return { message: 'Followed successfully' };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async unfollow(currentUserEmail: string, email: string) {
    const currentUser = await this.userModel.findOne({
      email: currentUserEmail,
    });

    const followedUser = await this.userModel.findOne({ email: email });
    if (!currentUser || !followedUser) {
      throw new NotFoundException('User not found');
    }
    if (
      !currentUser.following
        .map((id) => id.toString())
        .includes(String(followedUser._id))
    ) {
      throw new ConflictException('Not relevant to unfollow');
    }
    const session = await this.userModel.db.startSession();
    session.startTransaction();
    try {
      await this.userModel.findOneAndUpdate(
        { _id: currentUser._id },
        { $pull: { following: followedUser._id } },
        { new: true, session },
      );
      await this.userModel.findOneAndUpdate(
        { _id: followedUser._id },
        { $pull: { followers: currentUser._id } },
        { new: true, session },
      );
      await session.commitTransaction();
      return { message: 'Unfollowed successfully' };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}
