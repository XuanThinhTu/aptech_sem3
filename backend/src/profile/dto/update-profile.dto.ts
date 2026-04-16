import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  Gender,
  MaritalStatus,
  WorkStatus,
} from '../../database/enums/database.enums';

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => `${item}`.trim()).filter(Boolean);
    }
  } catch {
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function emptyToUndefined(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export class UpdateProfileDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  dob!: Date;

  @IsString()
  @MaxLength(255)
  address!: string;

  @IsEnum(MaritalStatus)
  maritalStatus!: MaritalStatus;

  @IsEmail()
  @MaxLength(120)
  emailAddress!: string;

  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  hobbies!: string[];

  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  likes!: string[];

  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  dislikes!: string[];

  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  cuisines!: string[];

  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  sports!: string[];

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(120)
  qualification?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(120)
  school?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(120)
  college?: string;

  @IsEnum(WorkStatus)
  workStatus!: WorkStatus;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(120)
  organization?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(120)
  designation?: string;
}
