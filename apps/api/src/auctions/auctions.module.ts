import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { AuctionsGateway } from './auctions.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    }),
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionsGateway],
})
export class AuctionsModule {}
