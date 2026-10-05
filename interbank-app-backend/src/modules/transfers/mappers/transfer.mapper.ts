import type { TransferAccount, TransferDetails } from '@/modules/transfers/types/transfer.types';
import type {
  TransferResponseDto,
  TransferAccountResponseDto,
  TransferSourceResponseDto,
} from '@/modules/transfers/dto/transfer-response.dto';
import type { Currency } from '@prisma/client';

export class TransferMapper {
  static transfer(
    transfer: TransferDetails,
    userId: string,
    replayed = false,
  ): TransferResponseDto {
    return {
      id: transfer.id,
      operationNumber: transfer.operationNumber,
      kind: transfer.kind,
      status: transfer.status,
      fromAccountId: transfer.sourceAccountId,
      toAccountId: transfer.destinationAccountId,
      amount: transfer.amount.toFixed(2),
      currency: transfer.currency,
      description: transfer.description,
      createdAt: transfer.createdAt.toISOString(),
      completedAt: transfer.completedAt?.toISOString() ?? null,
      source: this.account({
        ...transfer.sourceAccount,
        displayName:
          transfer.sourceAccount.userId === userId
            ? transfer.sourceAccount.displayName
            : 'Cuenta de origen',
      }),
      destination: this.account({
        ...transfer.destinationAccount,
        displayName:
          transfer.destinationAccount.userId === userId
            ? transfer.destinationAccount.displayName
            : 'Cuenta de destino',
      }),
      isSender: transfer.userId === userId,
      isRecipient: transfer.destinationAccount.userId === userId,
      replayed,
    };
  }
  static source(account: TransferAccount): TransferSourceResponseDto {
    return {
      ...this.account(account),
      availableBalance: account.balance.toFixed(2),
      accountTypeName: account.accountType.name,
    };
  }
  static account(account: {
    id: string;
    displayName: string;
    accountNumber: string;
    currency: Currency;
  }): TransferAccountResponseDto {
    return {
      id: account.id,
      displayName: account.displayName,
      maskedAccountNumber: `${'*'.repeat(Math.max(0, account.accountNumber.length - 4))}${account.accountNumber.slice(-4)}`,
      currency: account.currency,
    };
  }
}
