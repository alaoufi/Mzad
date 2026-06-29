import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class RequestOtpDto {
  @Matches(/^(05|9665|\+9665)\d{8}$/, {
    message: 'رقم جوال غير صحيح (مثال: 05XXXXXXXX)',
  })
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  phone: string;

  @Length(4, 6)
  code: string;

  @IsOptional()
  @IsString()
  name?: string;
}
