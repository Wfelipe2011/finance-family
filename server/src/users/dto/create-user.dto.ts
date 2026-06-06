import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(1, 100)
  nome: string;

  @IsEmail()
  @Length(1, 100)
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
