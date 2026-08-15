import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { FirebaseService } from '../../common/firebase/firebase.service';
import { User } from '../users/entities/user.entity';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async createForUser(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
    referenceId?: string,
  ) {
    const notification = await this.notificationRepo.save(
      this.notificationRepo.create({
        userId,
        title,
        message,
        type,
        referenceId: referenceId || null,
        isRead: false,
        createdBy: userId,
        isDeleted: false,
      }),
    );

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user?.fcmToken) {
      await this.firebaseService.sendPushNotification(
        user.fcmToken,
        title,
        message,
        { type, referenceId: referenceId || '' },
      );
    }

    return notification;
  }

  async findMine(userId: string, query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await this.notificationRepo.findAndCount({
      where: { userId, isDeleted: false },
      order: { createdDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async markRead(id: string, userId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId, isDeleted: false },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    notification.updatedBy = userId;
    return this.notificationRepo.save(notification);
  }

  async markAllRead(userId: string) {
    await this.notificationRepo.update(
      { userId, isRead: false, isDeleted: false },
      { isRead: true, updatedBy: userId },
    );
    return { success: true };
  }
}
