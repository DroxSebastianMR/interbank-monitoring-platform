import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { LoanApplication } from '@prisma/client';
import type { ApplyLoanDto, LoanQuoteDto } from '@/modules/loans/dto/loan.dto';
import { LOAN_DISCLAIMER, LoanQuotePolicy } from '@/modules/loans/policies/loan-quote.policy';
import { LoansRepository } from '@/modules/loans/repositories/loans.repository';

@Injectable()
export class LoansService {
  constructor(private readonly repository: LoansRepository) {}

  offers() {
    return [
      {
        code: 'DEMO_PERSONAL',
        currency: 'PEN',
        minPrincipal: '1000.00',
        maxPrincipal: '50000.00',
        months: [6, 12, 24, 36],
        annualEffectiveRate: '24.0000',
        disclaimer: LOAN_DISCLAIMER,
      },
    ];
  }

  quote(dto: LoanQuoteDto) {
    const quote = LoanQuotePolicy.quote(dto.principal, dto.months);
    return {
      principal: quote.principal.toFixed(2),
      annualEffectiveRate: quote.annualEffectiveRate.toFixed(4),
      months: quote.months,
      monthlyPayment: quote.monthlyPayment.toFixed(2),
      totalRepayment: quote.totalRepayment.toFixed(2),
      disclaimer: LOAN_DISCLAIMER,
      schedule: LoanQuotePolicy.schedule(quote),
    };
  }

  async apply(userId: string, dto: ApplyLoanDto, key?: string) {
    if (!key || !/^[A-Za-z0-9_-]{8,80}$/.test(key))
      throw new BadRequestException('Idempotency-Key inválida');
    const quote = LoanQuotePolicy.quote(dto.principal, dto.months);
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          account: dto.destinationAccountId.toLowerCase(),
          amount: quote.principal.toFixed(2),
          months: dto.months,
        }),
      )
      .digest('hex');
    const existing = await this.repository.findByKey(userId, key);
    if (existing) return this.replay(existing, fingerprint);
    if (!(await this.repository.eligibleAccount(userId, dto.destinationAccountId)))
      throw new BadRequestException('Selecciona una cuenta propia activa en soles');
    try {
      const application = await this.repository.create(
        userId,
        dto.destinationAccountId.toLowerCase(),
        key,
        fingerprint,
        quote,
      );
      return this.map(application, false);
    } catch (error) {
      if (this.repository.isUniqueConflict(error)) {
        const repeated = await this.repository.findByKey(userId, key);
        if (repeated) return this.replay(repeated, fingerprint);
      }
      throw error;
    }
  }

  async list(userId: string) {
    return (await this.repository.list(userId)).map((item) => this.map(item));
  }

  async detail(userId: string, id: string) {
    const item = await this.repository.detail(userId, id);
    if (!item) throw new NotFoundException('Solicitud no encontrada');
    return this.map(item);
  }

  async schedule(userId: string, id: string) {
    const item = await this.repository.detail(userId, id);
    if (!item) throw new NotFoundException('Solicitud no encontrada');
    return {
      applicationId: id,
      illustrative: true,
      installments: LoanQuotePolicy.schedule({
        principal: item.principal,
        annualEffectiveRate: item.annualEffectiveRate,
        monthlyPayment: item.monthlyPayment,
        totalRepayment: item.totalRepayment,
        months: item.months,
      }),
    };
  }

  async cancel(userId: string, id: string) {
    const result = await this.repository.cancel(userId, id);
    if (result.count === 0) {
      const existing = await this.repository.detail(userId, id);
      if (!existing) throw new NotFoundException('Solicitud no encontrada');
      throw new ConflictException('Solo una solicitud pendiente puede cancelarse');
    }
    return this.detail(userId, id);
  }

  private replay(item: LoanApplication, fingerprint: string) {
    if (item.requestFingerprint !== fingerprint)
      throw new ConflictException('La clave ya se usó con otros datos');
    return this.map(item, true);
  }

  private map(item: LoanApplication, replayed = false) {
    return {
      id: item.id,
      destinationAccountId: item.destinationAccountId,
      principal: item.principal.toFixed(2),
      annualEffectiveRate: item.annualEffectiveRate.toFixed(4),
      monthlyPayment: item.monthlyPayment.toFixed(2),
      totalRepayment: item.totalRepayment.toFixed(2),
      months: item.months,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      disclaimer: LOAN_DISCLAIMER,
      replayed,
    };
  }
}
