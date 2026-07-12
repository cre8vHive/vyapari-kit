export class PasswordService {
  /**
   * Validates a password against enterprise requirements.
   * - 12 to 128 characters
   * - Uppercase, lowercase, number, special character
   * - No repeated characters (e.g. 'aaaa')
   * - Must not contain user's email or name
   * @returns array of error messages, empty if valid
   */
  static validate(password: string, user?: { email?: string; name?: string }): string[] {
    const errors: string[] = [];

    if (!password) {
      return ['Password is required'];
    }

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (/(.)\1{3,}/.test(password)) {
      errors.push('Password must not contain repeated characters (e.g., "aaaa")');
    }

    // Keyboard patterns (basic check for common ones)
    const patterns = ['qwerty', 'asdfgh', 'zxcvbn', '123456', 'password'];
    const lowerPass = password.toLowerCase();
    for (const pattern of patterns) {
      if (lowerPass.includes(pattern)) {
        errors.push(`Password must not contain common patterns like "${pattern}"`);
      }
    }

    if (user?.email) {
      const emailLocal = user.email.split('@')[0].toLowerCase();
      if (lowerPass.includes(emailLocal) || lowerPass.includes(user.email.toLowerCase())) {
        errors.push('Password must not contain your email address');
      }
    }

    if (user?.name) {
      const names = user.name.toLowerCase().split(/\s+/).filter(n => n.length > 2);
      for (const name of names) {
        if (lowerPass.includes(name)) {
          errors.push('Password must not contain your name');
          break;
        }
      }
    }

    return errors;
  }

  static getStrengthScore(password: string): number {
    let score = 0;
    if (!password) return score;
    
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Max score of 5 for UX purposes
    return Math.min(score, 5);
  }
}
