import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { CATEGORIA_VALUES, type CategoriaValue } from '../categoria.values';

export class LancamentoFilterDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsIn(CATEGORIA_VALUES)
  categoria?: CategoriaValue;
}
