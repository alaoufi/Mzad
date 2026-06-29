import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RequestOtpDto, VerifyOtpDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private normalizePhone(phone: string): string {
    // توحيد الصيغة إلى 9665XXXXXXXX
    let p = phone.replace(/\s|-/g, '');
    if (p.startsWith('+')) p = p.slice(1);
    if (p.startsWith('05')) p = '966' + p.slice(1);
    if (p.startsWith('5')) p = '966' + p;
    return p;
  }

  async requestOtp(dto: RequestOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const code = String(Math.floor(1000 + Math.random() * 9000)); // 4 أرقام
    const expiresAt = new Date(Date.now() + 5 * 60_000);

    await this.prisma.otpCode.create({ data: { phone, code, expiresAt } });

    const devMode = process.env.OTP_DEV_MODE !== 'false';
    if (devMode) {
      this.logger.warn(`🔐 رمز OTP لـ ${phone} هو: ${code}`);
    } else {
      // TODO: ربط مزوّد SMS (Unifonic / Taqnyat ...)
    }

    return {
      sent: true,
      // في وضع التطوير فقط نُعيد الرمز لتسهيل الاختبار
      ...(devMode ? { devCode: code } : {}),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, code: dto.code, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) {
      throw new BadRequestException('رمز التحقق غير صحيح أو منتهي');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          name: dto.name?.trim() || 'مستخدم جديد',
          isPhoneVerified: true,
        },
      });
    } else if (!user.isPhoneVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      name: user.name,
    });

    return { token, user };
  }
}
