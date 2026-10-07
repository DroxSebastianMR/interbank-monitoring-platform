import { Module } from '@nestjs/common';
import { DetectionService } from '@/modules/detection/detection.service';
@Module({ providers: [DetectionService], exports: [DetectionService] })
export class DetectionModule {}
