import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { CATEGORIA_VALUES, type CategoriaValue } from '../categoria.values';

export class CreateLancamentoDto {
  @IsString()
  @Length(1, 255)
  descricao: string;

  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsIn(CATEGORIA_VALUES)
  categoria: CategoriaValue;

  @IsOptional()
  @IsDateString()
  data?: string;
}
