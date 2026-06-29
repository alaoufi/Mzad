import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { AuctionsService } from './auctions.service';

/**
 * بوابة المزايدة اللحظية.
 * الأحداث:
 *  - join_auction { auctionId }            ← يدخل غرفة المزاد ويستلم الحالة
 *  - place_bid    { auctionId, amount }    ← يقدّم مزايدة (يتطلب توكن)
 *  - bid_update   (يُبثّ للجميع)            → أعلى عرض جديد + وقت النهاية
 *  - bid_error    (للمُزايِد فقط)           → سبب الرفض
 */
@WebSocketGateway({
  cors: { origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',') },
})
export class AuctionsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(AuctionsGateway.name);

  constructor(
    private readonly auctions: AuctionsService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(client: Socket) {
    // مصادقة اختيارية: المشاهدة مسموحة للجميع، المزايدة تتطلب توكناً
    const token =
      client.handshake.auth?.token ||
      (client.handshake.headers.authorization || '').replace('Bearer ', '');
    if (token) {
      try {
        const payload = this.jwt.verify(token);
        client.data.user = { id: payload.sub, name: payload.name, role: payload.role };
      } catch {
        // توكن غير صالح → يبقى مشاهداً فقط
      }
    }
  }

  @SubscribeMessage('join_auction')
  async onJoin(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `auction:${data.auctionId}`;
    await client.join(room);
    const state = await this.auctions.getState(data.auctionId);
    client.emit('auction_state', state);
    return state;
  }

  @SubscribeMessage('place_bid')
  async onBid(
    @MessageBody() data: { auctionId: string; amount: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('bid_error', { message: 'يجب تسجيل الدخول للمزايدة' });
      return;
    }
    try {
      const result = await this.auctions.placeBid(
        data.auctionId,
        user.id,
        Number(data.amount),
      );
      // بثّ للجميع في الغرفة
      this.server.to(`auction:${data.auctionId}`).emit('bid_update', result);
      return result;
    } catch (e: any) {
      client.emit('bid_error', { message: e?.message ?? 'تعذّرت المزايدة' });
    }
  }
}
