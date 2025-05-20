import { IsEmail, IsString, MinLength } from 'class-validator';

export class UpdateFollowDto {
  @IsString()
  email: string;
}
