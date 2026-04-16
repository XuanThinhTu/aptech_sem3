import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class CreateSubscriptionCheckoutDto {
  @IsMongoId()
  userId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  serviceIds!: string[];
}
