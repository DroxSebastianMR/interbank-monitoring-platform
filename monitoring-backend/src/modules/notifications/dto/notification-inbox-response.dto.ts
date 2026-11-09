import { ApiProperty } from '@nestjs/swagger';
import { IncidentAttentionState } from '@prisma/client';

export class UnreadNotificationsCountDto {
  @ApiProperty({ minimum: 0, description: 'Todas las notificaciones no leídas del empleado autenticado.' })
  unreadCount!: number;
}

export class NotificationIncidentSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() serviceKey!: string;
  @ApiProperty() title!: string;
  @ApiProperty() status!: string;
  @ApiProperty() severity!: string;
  @ApiProperty({ enum: IncidentAttentionState }) attentionState!: IncidentAttentionState;
}

export class NotificationInboxItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) incidentId!: string;
  @ApiProperty() eventType!: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) readAt!: Date | null;
  @ApiProperty({ type: NotificationIncidentSummaryDto, nullable: true,
    description: 'Resumen actual del incidente; null si su referencia ya no está disponible.' })
  incident!: NotificationIncidentSummaryDto | null;
}

export class NotificationInboxPageDto {
  @ApiProperty({ type: [NotificationInboxItemDto] }) items!: NotificationInboxItemDto[];
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) nextCursor!: string | null;
}
