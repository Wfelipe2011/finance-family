import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  CATEGORIA_VALUES,
  normalizeCategoria,
  type CategoriaValue,
} from '../categoria.values';

export class CreateLancamentoDto {
  @IsString()
  @Length(1, 255)
  descricao: string;

  @IsNumber()
  @Min(0.01)
  valor: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeCategoria(value) : value,
  )
  @IsIn(CATEGORIA_VALUES)
  categoria: CategoriaValue;

  @IsOptional()
  @IsDateString()
  data?: string;
}
