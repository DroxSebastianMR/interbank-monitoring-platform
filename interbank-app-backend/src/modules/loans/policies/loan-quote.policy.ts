import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const LOAN_DISCLAIMER =
  'Simulación académica no vinculante. La TEA ilustrativa no es TCEA: no incluye seguro, comisiones ni evaluación crediticia. No se desembolsa dinero.';
export const DEMO_TEA = new Prisma.Decimal('24.0000');

export interface LoanQuote {
  principal: Prisma.Decimal;
  annualEffectiveRate: Prisma.Decimal;
  monthlyPayment: Prisma.Decimal;
  totalRepayment: Prisma.Decimal;
  months: number;
}

export class LoanQuotePolicy {
  static quote(principalInput: number, months: number): LoanQuote {
    if (
      !Number.isFinite(principalInput) ||
      principalInput < 1000 ||
      principalInput > 50000 ||
      ![6, 12, 24, 36].includes(months)
    )
      throw new BadRequestException('Monto o plazo no admitido');
    const principal = new Prisma.Decimal(principalInput.toString());
    if (principal.decimalPlaces() > 2) throw new BadRequestException('Máximo dos decimales');
    const monthlyRate = new Prisma.Decimal(Math.pow(1.24, 1 / 12) - 1);
    const factor = monthlyRate.plus(1).pow(months);
    const monthlyPayment = principal
      .mul(monthlyRate)
      .mul(factor)
      .div(factor.minus(1))
      .toDecimalPlaces(2);
    const quote = {
      principal,
      annualEffectiveRate: DEMO_TEA,
      monthlyPayment,
      totalRepayment: monthlyPayment.mul(months),
      months,
    };
    quote.totalRepayment = this.schedule(quote).reduce(
      (sum, installment) => sum.plus(installment.payment),
      new Prisma.Decimal(0),
    );
    return quote;
  }

  static schedule(quote: LoanQuote) {
    const monthlyRate = new Prisma.Decimal(Math.pow(1.24, 1 / 12) - 1);
    let balance = quote.principal;
    return Array.from({ length: quote.months }, (_, index) => {
      const interest = balance.mul(monthlyRate).toDecimalPlaces(2);
      const installment =
        index === quote.months - 1 ? balance.plus(interest) : quote.monthlyPayment;
      const amortization = installment.minus(interest);
      balance = balance.minus(amortization);
      return {
        number: index + 1,
        payment: installment.toFixed(2),
        interest: interest.toFixed(2),
        principal: amortization.toFixed(2),
        remainingBalance: balance.toFixed(2),
      };
    });
  }
}
