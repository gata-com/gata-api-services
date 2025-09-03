// controllers/userController/base.ts
import { UserService } from '../../services/userService';

export abstract class BaseUserController {
  protected userService: UserService;

  constructor() {
    this.userService = new UserService();
  }
}