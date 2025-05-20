import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/schemas/users.schema';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({ email: dto.email, password: hash });
    await user.save();
    return { message: 'User registered successfully' };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user._id, email: user.email };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }

  async me(userPayload: any) {
    // userPayload will have the decoded JWT payload, e.g. { sub, email }
    if (!userPayload) throw new UnauthorizedException('Invalid token payload');
    const user = await this.userModel.findOne({ email: userPayload?.email });
    if (!user) throw new UnauthorizedException('User not found');
    return { currentUser: user };
  }
}
