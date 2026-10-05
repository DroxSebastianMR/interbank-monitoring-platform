import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get() all() {
    return this.service.findAll();
  }
}
