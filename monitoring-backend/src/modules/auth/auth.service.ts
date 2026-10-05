import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}
  login() {
    return { accessToken: this.jwt.sign({ sub: 'demo-operator', role: 'OPERATOR' }) };
  }
}
