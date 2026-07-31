import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OffersService } from './offers.service';
import { Offer } from './entities/offer.entity';
import { OfferImage } from './entities/offer-image.entity';
import { Business } from '../businesses/entities/business.entity';
import { Analytics } from '../analytics/entities/analytics.entity';
import { UserRole } from '../../common/enums/role.enum';
import { OfferStatus } from '../../common/enums/offer-status.enum';

describe('OffersService', () => {
  let service: OffersService;

  const offerRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const offerImageRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(),
  };

  const businessRepo = {
    findOne: jest.fn(),
  };

  const analyticsRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: getRepositoryToken(Offer), useValue: offerRepo },
        { provide: getRepositoryToken(OfferImage), useValue: offerImageRepo },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Analytics), useValue: analyticsRepo },
      ],
    }).compile();

    service = module.get(OffersService);
  });

  it('creates an offer for business owner', async () => {
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1', ownerId: 'owner-1' });
    offerRepo.save.mockImplementation(async (o) => ({ ...o, id: 'offer-1' }));
    offerRepo.findOne.mockResolvedValue({
      id: 'offer-1',
      title: '50% Off Pizza',
      businessId: 'biz-1',
      status: OfferStatus.DRAFT,
    });

    const result = await service.create(
      {
        title: '50% Off Pizza',
        discountPercent: 50,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T00:00:00.000Z',
      },
      'owner-1',
      UserRole.BUSINESS_OWNER,
    );

    expect(result.id).toBe('offer-1');
    expect(offerRepo.save).toHaveBeenCalled();
  });

  it('requires businessId for admin create', async () => {
    await expect(
      service.create(
        {
          title: 'Offer',
          discountPercent: 10,
          startDate: '2026-08-01T00:00:00.000Z',
          endDate: '2026-08-31T00:00:00.000Z',
        },
        'admin-1',
        UserRole.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when offer not found', async () => {
    offerRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('increments views and logs analytics', async () => {
    offerRepo.findOne.mockResolvedValue({
      id: 'offer-1',
      views: 2,
      businessId: 'biz-1',
      isDeleted: false,
    });
    offerRepo.save.mockImplementation(async (o) => o);
    analyticsRepo.save.mockResolvedValue({});

    const result = await service.incrementView('offer-1', 'user-1');
    expect(result.views).toBe(3);
    expect(analyticsRepo.save).toHaveBeenCalled();
  });
});
