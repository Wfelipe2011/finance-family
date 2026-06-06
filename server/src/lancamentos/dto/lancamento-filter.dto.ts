import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional } from 'class-validator';
import {
  CATEGORIA_VALUES,
  normalizeCategoria,
  type CategoriaValue,
} from '../categoria.values';

export class LancamentoFilterDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeCategoria(value) : value,
  )
  @IsIn(CATEGORIA_VALUES)
  categoria?: CategoriaValue;
}
