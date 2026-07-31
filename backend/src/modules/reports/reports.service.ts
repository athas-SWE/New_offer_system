import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Offer } from '../offers/entities/offer.entity';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
  ) {}

  async getOffersReport(businessId?: string) {
    const qb = this.offerRepo
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.business', 'business')
      .leftJoinAndSelect('offer.category', 'category')
      .leftJoinAndSelect('offer.city', 'city')
      .where('offer.is_deleted = :deleted', { deleted: false });

    if (businessId) {
      qb.andWhere('offer.business_id = :businessId', { businessId });
    }

    const offers = await qb.orderBy('offer.createdDate', 'DESC').getMany();

    return {
      generatedAt: new Date().toISOString(),
      count: offers.length,
      totalViews: offers.reduce((sum, o) => sum + (o.views || 0), 0),
      totalLikes: offers.reduce((sum, o) => sum + (o.likes || 0), 0),
      offers: offers.map((o) => ({
        id: o.id,
        title: o.title,
        status: o.status,
        discountPercent: o.discountPercent,
        views: o.views,
        likes: o.likes,
        business: o.business?.name,
        category: o.category?.name,
        city: o.city?.name,
        startDate: o.startDate,
        endDate: o.endDate,
      })),
    };
  }

  async getSummaryReport() {
    const [users, businesses, offers, reviews] = await Promise.all([
      this.userRepo.count({ where: { isDeleted: false } }),
      this.businessRepo.count({ where: { isDeleted: false } }),
      this.offerRepo.count({ where: { isDeleted: false } }),
      this.reviewRepo.count({ where: { isDeleted: false } }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      users,
      businesses,
      offers,
      reviews,
    };
  }

  async exportOffersExcel(businessId?: string): Promise<Buffer> {
    const report = await this.getOffersReport(businessId);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Offers');

    sheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Discount %', key: 'discountPercent', width: 12 },
      { header: 'Views', key: 'views', width: 10 },
      { header: 'Likes', key: 'likes', width: 10 },
      { header: 'Business', key: 'business', width: 24 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'Start', key: 'startDate', width: 20 },
      { header: 'End', key: 'endDate', width: 20 },
    ];

    report.offers.forEach((row) => sheet.addRow(row));
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async exportSummaryPdf(): Promise<Buffer> {
    const summary = await this.getSummaryReport();
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('Offer Lanka — Summary Report', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${summary.generatedAt}`);
      doc.moveDown();
      doc.text(`Users: ${summary.users}`);
      doc.text(`Businesses: ${summary.businesses}`);
      doc.text(`Offers: ${summary.offers}`);
      doc.text(`Reviews: ${summary.reviews}`);
      doc.end();
    });
  }
}
