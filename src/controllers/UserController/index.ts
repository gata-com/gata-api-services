// controllers/userController/index.ts
import { CrudUserController } from './crud';
import { ProfileUserController } from './profile';
import { AuthUserController } from './auth';

/**
 * Main UserController that combines all user-related functionality
 * This is the main export that should be used in your routes
 */
export class UserController 
  extends CrudUserController {
  
  private profileController: ProfileUserController;
  private authController: AuthUserController;

  constructor() {
    super();
    this.profileController = new ProfileUserController();
    this.authController = new AuthUserController();
    
    // Bind methods to maintain proper 'this' context
    this.getProfile = this.profileController.getProfile.bind(this.profileController);
    this.updateProfile = this.profileController.updateProfile.bind(this.profileController);
    this.forgotPassword = this.authController.forgotPassword.bind(this.authController);
    this.resetPassword = this.authController.resetPassword.bind(this.authController);
    this.verifyResetToken = this.authController.verifyResetToken.bind(this.authController);
  }

  // Profile methods
  getProfile: ProfileUserController['getProfile'];
  updateProfile: ProfileUserController['updateProfile'];

  // Auth methods
  forgotPassword: AuthUserController['forgotPassword'];
  resetPassword: AuthUserController['resetPassword'];
  verifyResetToken: AuthUserController['verifyResetToken'];
}

// Export individual controllers for specific use cases
export { CrudUserController } from './crud';
export { ProfileUserController } from './profile';
export { AuthUserController } from './auth';
export { BaseUserController } from './base';