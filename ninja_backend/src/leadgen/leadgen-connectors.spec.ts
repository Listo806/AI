import {
  normalizeBusiness,
  scoreLead,
  dedupeKey,
  domainFromUrl,
} from './leadgen-connectors';

describe('leadgen connectors — pure pipeline helpers', () => {
  describe('domainFromUrl', () => {
    it('extracts and normalizes the host', () => {
      expect(domainFromUrl('https://www.Example.com/path')).toBe('example.com');
      expect(domainFromUrl('example.org')).toBe('example.org');
    });
    it('returns null for junk', () => {
      expect(domainFromUrl('')).toBeNull();
      expect(domainFromUrl(null)).toBeNull();
      expect(domainFromUrl(123)).toBeNull();
    });
  });

  describe('normalizeBusiness', () => {
    it('maps a DataForSEO maps item to a lead', () => {
      const lead = normalizeBusiness(
        {
          title: 'Clinica Dental Andina',
          phone: '+593 2 222 3344',
          url: 'https://www.andina.com.ec',
          address: 'Av. Amazonas 123',
          address_info: { city: 'Quito', region: 'Pichincha' },
        },
        'EC',
      );
      expect(lead).not.toBeNull();
      expect(lead!.businessName).toBe('Clinica Dental Andina');
      expect(lead!.phone).toBe('+593 2 222 3344');
      expect(lead!.domain).toBe('andina.com.ec');
      expect(lead!.city).toBe('Quito');
      expect(lead!.country).toBe('EC');
      expect(lead!.sourceProvider).toBe('dataforseo');
      // Never invents contact data the source did not provide.
      expect(lead!.email).toBeNull();
      expect(lead!.contactName).toBeNull();
    });
    it('drops items with no business name', () => {
      expect(normalizeBusiness({ phone: '123' }, 'US')).toBeNull();
      expect(normalizeBusiness(null, 'US')).toBeNull();
    });
  });

  describe('scoreLead — documented, signal-based', () => {
    it('scores a rich verified lead as Hot', () => {
      const r = scoreLead({
        businessName: 'Acme',
        email: 'a@acme.com',
        emailVerified: true,
        phone: '123',
        website: 'https://acme.com',
        city: 'Quito',
      });
      // 40 (verified email) + 20 (phone) + 15 (website) + 10 (city) + 5 (name) = 90
      expect(r.score).toBe(90);
      expect(r.band).toBe('hot');
    });
    it('scores a bare name-only lead as Cold', () => {
      const r = scoreLead({ businessName: 'Acme' });
      expect(r.score).toBe(5);
      expect(r.band).toBe('cold');
    });
    it('puts an unverified-email lead in the Warm band', () => {
      const r = scoreLead({ businessName: 'Acme', email: 'a@acme.com', phone: '123' });
      // 20 (email) + 20 (phone) + 5 (name) = 45
      expect(r.score).toBe(45);
      expect(r.band).toBe('warm');
    });
  });

  describe('dedupeKey', () => {
    it('prefers email, then domain, then name+city', () => {
      expect(dedupeKey({ email: 'A@B.com' })).toBe('e:a@b.com');
      expect(dedupeKey({ domain: 'Acme.com' })).toBe('d:acme.com');
      expect(dedupeKey({ businessName: 'Acme Inc.', city: 'Quito' })).toBe('n:acmeinc|quito');
    });
    it('collapses two records for the same email', () => {
      expect(dedupeKey({ email: 'x@y.com', businessName: 'A' })).toBe(
        dedupeKey({ email: 'X@Y.com', businessName: 'B' }),
      );
    });
  });
});
