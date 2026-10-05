import { Module } from '@nestjs/common';
import { DetectionService } from './detection.service';
@Module({ providers: [DetectionService], exports: [DetectionService] })
export class DetectionModule {}
