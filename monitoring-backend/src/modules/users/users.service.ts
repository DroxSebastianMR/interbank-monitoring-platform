import { Injectable } from '@nestjs/common';
@Injectable()
export class UsersService {
  findAll() {
    return [{ id: 'demo-operator', name: 'Demo Operator', role: 'OPERATOR' }];
  }
}
