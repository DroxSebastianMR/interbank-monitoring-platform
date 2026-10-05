import {
  AccountStatus,
  AccountType,
  CardFormat,
  CardKind,
  CardNetwork,
  CardStatus,
  Currency,
  Prisma,
} from '@prisma/client';
import { AccountsMapper } from '@/modules/accounts/mappers/accounts.mapper';
import type { AccountSnapshot, CardSnapshot } from '@/modules/accounts/types/accounts.types';

describe('AccountsMapper', () => {
  const account: AccountSnapshot = {
    id: 'account',
    displayName: 'Cuenta',
    accountNumber: '2003000000001',
    cci: '00300000000000000001',
    balance: new Prisma.Decimal('123.45'),
    currency: Currency.PEN,
    type: AccountType.SAVINGS,
    status: AccountStatus.ACTIVE,
    createdAt: new Date('2026-10-05'),
    closedAt: null,
    accountType: {
      id: 'product',
      code: 'SIMPLE',
      name: 'Simple',
      description: 'Ahorro',
      type: AccountType.SAVINGS,
      supportedCurrencies: [Currency.PEN, Currency.USD],
      allowsDebits: true,
      isActive: true,
    },
  };
  const card: CardSnapshot = {
    id: 'card',
    displayName: 'Visa',
    lastFour: '1234',
    kind: CardKind.CREDIT,
    status: CardStatus.ACTIVE,
    format: CardFormat.DIGITAL,
    expiresAt: new Date('2026-10-05'),
    cardType: {
      id: 'type',
      code: 'VISA_CREDIT_CLASSIC',
      name: 'Visa',
      description: 'Crédito',
      kind: CardKind.CREDIT,
      network: CardNetwork.VISA,
    },
    creditBalances: [
      {
        currency: Currency.PEN,
        creditLimit: new Prisma.Decimal('1000'),
        outstandingBalance: new Prisma.Decimal('1000.01'),
      },
    ],
  };
  it('does not expose full account identifiers on summary responses', () => {
    const result = AccountsMapper.account(account);
    expect(result.accountNumber).toBe('*********0001');
    expect(result.balance).toBe('123.45');
    expect(result).not.toHaveProperty('cci');
  });
  it.each([AccountStatus.BLOCKED, AccountStatus.CLOSED])(
    'prevents debits for %s accounts',
    (status) => {
      expect(AccountsMapper.account({ ...account, status }).canDebit).toBe(false);
    },
  );
  it('prevents generic debits for restricted products', () => {
    expect(
      AccountsMapper.account({
        ...account,
        accountType: { ...account.accountType, allowsDebits: false },
      }).canDebit,
    ).toBe(false);
  });
  it('does not return negative available credit for an over-limit card', () => {
    expect(AccountsMapper.card(card).creditBalances[0].availableCredit).toBe('0.00');
  });
  it('allows use through the expiration date and disables expired or blocked cards', () => {
    expect(AccountsMapper.card(card, new Date('2026-10-05T23:59:59Z')).isUsable).toBe(true);
    expect(AccountsMapper.card(card, new Date('2026-10-06T00:00:00Z')).isUsable).toBe(false);
    expect(
      AccountsMapper.card({ ...card, status: CardStatus.BLOCKED }, new Date('2026-10-05')).isUsable,
    ).toBe(false);
  });
});
