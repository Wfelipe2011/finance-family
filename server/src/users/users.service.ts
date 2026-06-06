import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { CreateUserDto } from './dto/create-user.dto';

export interface SafeUser {
  id: number;
  nome: string;
  email: string;
  created_at: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usersRepository: Repository<Usuario>,
  ) {}

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        nome: dto.nome,
        email: dto.email,
        password_hash: passwordHash,
      }),
    );

    return this.toSafeUser(user);
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }

  toSafeUser(user: Usuario): SafeUser {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      created_at: user.created_at.toISOString(),
    };
  }
}
