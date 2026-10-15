import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class AssistantRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(employeeId: string, title: string) {
    return this.prisma.assistantConversation.create({ data: { employeeId, title } });
  }

  list(employeeId: string, archived = false) {
    return this.prisma.assistantConversation.findMany({
      where: { employeeId, deletedAt: null, archivedAt: archived ? { not: null } : null },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { id: true, title: true, archivedAt: true, createdAt: true, updatedAt: true },
    });
  }

  async owned(id: string, employeeId: string) {
    const conversation = await this.prisma.assistantConversation.findFirst({
      where: { id, employeeId, deletedAt: null },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    return conversation;
  }

  async update(id: string, employeeId: string, data: { title?: string; archivedAt?: Date | null }) {
    await this.owned(id, employeeId);
    return this.prisma.assistantConversation.update({ where: { id }, data });
  }

  async delete(id: string, employeeId: string): Promise<void> {
    await this.owned(id, employeeId);
    await this.prisma.assistantConversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async messages(id: string, employeeId: string) {
    await this.owned(id, employeeId);
    return this.recentMessagesAfterOwnershipCheck(id);
  }

  // Call only after owned() has verified the same conversation in this request.
  async recentMessagesAfterOwnershipCheck(id: string) {
    const rows = await this.prisma.assistantMessage.findMany({
      where: { conversationId: id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 50,
      select: {
        id: true,
        role: true,
        content: true,
        provider: true,
        evidence: true,
        feedback: true,
        createdAt: true,
      },
    });
    return rows.reverse();
  }

  async append(
    id: string,
    role: 'user' | 'assistant',
    content: string,
    provider?: string,
    evidence?: Prisma.InputJsonValue,
  ) {
    return this.prisma.assistantMessage.create({
      data: { conversationId: id, role, content, provider, evidence },
    });
  }

  finishConversation(id: string, title?: string) {
    return this.prisma.assistantConversation.update({
      where: { id },
      data: { updatedAt: new Date(), ...(title ? { title } : {}) },
    });
  }

  createRun(data: {
    messageId: string;
    provider: string;
    model?: string;
    status: string;
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
  }) {
    return this.prisma.assistantRun.create({ data: { ...data, promptVersion: 'monitor-v3' } });
  }

  async run(id: string, employeeId: string) {
    const run = await this.prisma.assistantRun.findFirst({
      where: { id, message: { conversation: { employeeId, deletedAt: null } } },
      select: {
        id: true,
        provider: true,
        model: true,
        status: true,
        latencyMs: true,
        promptTokens: true,
        completionTokens: true,
        promptVersion: true,
        createdAt: true,
      },
    });
    if (!run) throw new NotFoundException('Ejecución no encontrada');
    return run;
  }

  async feedback(messageId: string, employeeId: string, value: 'HELPFUL' | 'NOT_HELPFUL') {
    const message = await this.prisma.assistantMessage.findFirst({
      where: { id: messageId, role: 'assistant', conversation: { employeeId, deletedAt: null } },
    });
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    return this.prisma.assistantMessage.update({
      where: { id: messageId },
      data: { feedback: value },
    });
  }
}
