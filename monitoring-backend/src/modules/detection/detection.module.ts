import { Module } from '@nestjs/common';
import { DetectionService } from '@/modules/detection/services/detection.service';
@Module({ providers: [DetectionService], exports: [DetectionService] })
export class DetectionModule {}
