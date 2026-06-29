import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { AuctionsService } from './auctions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

class PlaceBidDto {
  @IsNumber() amount: number;
}

@ApiTags('المزادات')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctions: AuctionsService) {}

  @Get(':id')
  state(@Param('id') id: string) {
    return this.auctions.getState(id);
  }

  // مزايدة عبر REST (بديل لـ WebSocket — نفس الحماية تماماً)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/bids')
  bid(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: PlaceBidDto,
  ) {
    return this.auctions.placeBid(id, user.id, dto.amount);
  }
}
