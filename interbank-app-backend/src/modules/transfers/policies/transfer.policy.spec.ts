import { AccountStatus, Currency, Prisma } from '@prisma/client';
import { TransferPolicy } from '@/modules/transfers/policies/transfer.policy';

describe('TransferPolicy monetary boundaries', () => {
  const source = {
    id: 'source',
    userId: 'sender',
    displayName: 'Cuenta',
    accountNumber: '2003000000001',
    currency: Currency.PEN,
    status: AccountStatus.ACTIVE,
    balance: new Prisma.Decimal('25.50'),
    allowsDebits: true,
  };
  const destination = {
    ...source,
    id: 'destination',
    userId: 'recipient',
    balance: new Prisma.Decimal(0),
  };
  it('allows transferring the exact available balance without floating-point arithmetic', () => {
    expect(() =>
      TransferPolicy.validate('sender', source, destination, TransferPolicy.amount(25.5)),
    ).not.toThrow();
    expect(TransferPolicy.amount(0.01).toFixed(2)).toBe('0.01');
    expect(TransferPolicy.amount(999999999999.99).toFixed(2)).toBe('999999999999.99');
  });
  it('rejects a request one cent above the balance', () => {
    expect(() =>
      TransferPolicy.validate('sender', source, destination, new Prisma.Decimal('25.51')),
    ).toThrow('INSUFFICIENT_FUNDS');
  });
  it('protects the destination decimal capacity', () => {
    expect(() =>
      TransferPolicy.validate(
        'sender',
        source,
        { ...destination, balance: new Prisma.Decimal('999999999999.99') },
        new Prisma.Decimal('0.01'),
      ),
    ).toThrow('DESTINATION_LIMIT_EXCEEDED');
  });
  it('rejects restricted products and same-account requests', () => {
    expect(() =>
      TransferPolicy.validate(
        'sender',
        { ...source, allowsDebits: false },
        destination,
        new Prisma.Decimal(1),
      ),
    ).toThrow('ACCOUNT_UNAVAILABLE');
    expect(() => TransferPolicy.validate('sender', source, source, new Prisma.Decimal(1))).toThrow(
      'SAME_ACCOUNT',
    );
  });
  it('checks the requested currency against the source', () => {
    expect(() =>
      TransferPolicy.validate('sender', source, destination, new Prisma.Decimal(1), Currency.USD),
    ).toThrow('CURRENCY_MISMATCH');
  });
  it.each(['', ' short ', 'legacy:test', 'a'.repeat(81)])(
    'rejects malformed idempotency key %s',
    (key) => {
      expect(() => TransferPolicy.key(key)).toThrow('INVALID_IDEMPOTENCY_KEY');
    },
  );
  it('normalizes equivalent UUID and decimal representations for fingerprints', () => {
    const dto = {
      fromAccountId: 'abcdef01-abcd-4000-8000-abcdefabcdef',
      toAccountId: 'abcdef01-abcd-4000-8000-abcdefabcdea',
      amount: 1,
      description: ' hola ',
    };
    expect(TransferPolicy.fingerprint(dto, new Prisma.Decimal(1))).toBe(
      TransferPolicy.fingerprint(
        { ...dto, fromAccountId: dto.fromAccountId.toUpperCase(), description: 'hola' },
        new Prisma.Decimal('1.00'),
      ),
    );
  });
});
