import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auto.guard';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('/follow/:email')
  async follow(@Request() req, @Param('email') email: string) {
    return this.usersService.follow(req.user.email, email);
  }
  @Delete('/unfollow/:email')
  async unfollow(@Request() req, @Param('email') email: string) {
    return this.usersService.unfollow(req.user.email, email);
  }
}
