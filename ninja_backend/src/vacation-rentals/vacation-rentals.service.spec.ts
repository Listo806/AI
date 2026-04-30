/// <reference types="jest" />
import { VacationRentalsService } from './vacation-rentals.service';
import { BadRequestException } from '@nestjs/common';

describe('VacationRentalsService', () => {
  let service: VacationRentalsService;
  let queryMock: jest.Mock;

  beforeEach(() => {
    queryMock = jest.fn();
    service = new VacationRentalsService({ query: queryMock } as any);
  });

  it('search SQL always includes listing_type = vacation in count and list queries', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ c: 2 }] });
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'a',
          title: 'V',
          description: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          price: 100,
          type: 'rent',
          status: 'published',
          listingType: 'vacation',
          bedrooms: null,
          bathrooms: null,
          squareFeet: null,
          lotSize: null,
          yearBuilt: null,
          thumbnailUrl: 'https://example.com/t.jpg',
          latitude: null,
          longitude: null,
          propertyType: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: new Date(),
        },
      ],
    });

    await service.search({});

    expect(queryMock).toHaveBeenCalledTimes(2);
    const [countSql] = queryMock.mock.calls[0];
    const [listSql] = queryMock.mock.calls[1];
    expect(countSql).toMatch(/listing_type\s*=\s*'vacation'/);
    expect(listSql).toMatch(/listing_type\s*=\s*'vacation'/);
  });

  it('search adds overlap exclusion when checkIn and checkOut are valid', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ c: 0 }] });
    queryMock.mockResolvedValueOnce({ rows: [] });

    await service.search({
      checkIn: '2026-06-01',
      checkOut: '2026-06-10',
    });

    const [listSql, listParams] = queryMock.mock.calls[1];
    expect(listSql).toMatch(/NOT EXISTS/);
    expect(listSql).toMatch(/vacation_bookings/);
    expect(listSql).toMatch(/booking_start/);
    expect(listSql).toMatch(/booking_end/);
    expect(listParams).toEqual(expect.arrayContaining(['2026-06-01', '2026-06-10']));
  });

  it('search rejects checkOut before checkIn', async () => {
    await expect(
      service.search({
        checkIn: '2026-06-10',
        checkOut: '2026-06-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('search applies minPrice, maxPrice, bedrooms, and price sort in SQL', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ c: 0 }] });
    queryMock.mockResolvedValueOnce({ rows: [] });

    await service.search({
      minPrice: 50,
      maxPrice: 300,
      bedroomsMin: 2,
      sort: 'price_asc',
    });

    const [listSql, listParams] = queryMock.mock.calls[1];
    expect(listSql).toMatch(/p\.price IS NOT NULL AND p\.price >=/);
    expect(listSql).toMatch(/p\.price IS NOT NULL AND p\.price <=/);
    expect(listSql).toMatch(/p\.bedrooms IS NOT NULL AND p\.bedrooms >=/);
    expect(listSql).toMatch(/ORDER BY p\.price ASC/);
    expect(listParams).toEqual(expect.arrayContaining([50, 300, 2]));
  });

  it('maps items to listingType vacation and pricePerNight', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ c: 1 }] });
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'b',
          title: 'Beach',
          description: 'Nice place',
          address: '1 Ocean',
          city: 'Miami',
          state: 'FL',
          zipCode: null,
          price: 250,
          type: 'rent',
          status: 'published',
          listingType: 'vacation',
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: null,
          lotSize: null,
          yearBuilt: null,
          thumbnailUrl: 'https://x.example/img.jpg',
          latitude: 25.76,
          longitude: -80.19,
          propertyType: 'villa',
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: new Date(),
        },
      ],
    });
    const res = await service.search({
      checkIn: '2026-07-01',
      checkOut: '2026-07-05',
    });

    expect(res.items).toHaveLength(1);
    expect(res.items[0].listingType).toBe('vacation');
    expect(res.items[0].pricePerNight).toBe(250);
    expect(res.items[0].primaryImage).toBe('https://x.example/img.jpg');
    expect(res.items[0].availabilityStatus).toBe('available');
  });
});
