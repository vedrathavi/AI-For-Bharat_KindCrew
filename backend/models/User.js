/**
 * User Model
 * Defines the User schema and structure for DynamoDB
 * Follows MVC architecture for clean separation of concerns
 */

/**
 * User Schema Definition
 * @typedef {Object} User
 * @property {string} userId - Unique user identifier (UUID)
 * @property {string} email - User email address (unique, sortKey for EmailIndex GSI)
 * @property {string} name - Full name of the user
 * @property {string|null} givenName - First name
 * @property {string|null} familyName - Last name
 * @property {string|null} profileImage - URL to profile image
 * @property {boolean} emailVerified - Whether email is verified
 * @property {string|null} locale - User's locale/language preference
 * @property {Array<AuthProvider>} authProviders - Array of authentication methods linked to account
 * @property {string} role - User role ('user', 'admin') - default: 'user'
 * @property {string} status - Account status ('active', 'inactive', 'suspended') - default: 'active'
 * @property {Array<LoginHistory>} loginHistory - Array of login records
 * @property {string} createdAt - ISO 8601 timestamp of account creation
 * @property {string} lastLogin - ISO 8601 timestamp of last login
 * @property {string} updatedAt - ISO 8601 timestamp of last update
 */

/**
 * AuthProvider Schema
 * @typedef {Object} AuthProvider
 * @property {string} type - Provider type ('cognito', 'google', 'github', etc)
 * @property {string} providerId - Unique ID from the provider
 * @property {string} linkedAt - ISO 8601 timestamp of when provider was linked
 */

/**
 * LoginHistory Schema
 * @typedef {Object} LoginHistory
 * @property {string} timestamp - ISO 8601 timestamp of login
 * @property {string} loginMethod - Method used to login ('cognito', 'google', etc)
 */

class User {
  /**
   * Create a new User instance
   * @param {Object} data - User data
   */
  constructor(data) {
    this.userId = data.userId;
    this.email = data.email;
    this.name = data.name;
    this.givenName = data.givenName || null;
    this.familyName = data.familyName || null;
    this.profileImage = data.profileImage || null;
    this.emailVerified = data.emailVerified || false;
    this.locale = data.locale || null;
    this.authProviders = data.authProviders || [];
    this.role = data.role || "user";
    this.status = data.status || "active";
    this.loginHistory = data.loginHistory || [];
    this.createdAt = data.createdAt;
    this.lastLogin = data.lastLogin;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Create a new user object with default values
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {Array} authProviders - Initial auth providers
   * @param {Object} additionalData - Additional user data
   * @returns {Object} User object ready for database
   */
  static create(userId, email, name, authProviders, additionalData = {}) {
    const now = new Date().toISOString();

    return {
      userId,
      email,
      name,
      givenName: additionalData.givenName || null,
      familyName: additionalData.familyName || null,
      profileImage: additionalData.profileImage || null,
      emailVerified: additionalData.emailVerified || false,
      locale: additionalData.locale || null,
      authProviders,
      role: additionalData.role || "user",
      status: additionalData.status || "active",
      loginHistory: [
        {
          timestamp: now,
          loginMethod: authProviders[0]?.type || "unknown",
        },
      ],
      createdAt: now,
      lastLogin: now,
      updatedAt: now,
    };
  }

  /**
   * Validate user data
   * @param {Object} data - User data to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(data) {
    const errors = [];

    if (!data.email || typeof data.email !== "string") {
      errors.push("Email is required and must be a string");
    }

    if (!data.email.includes("@")) {
      errors.push("Email must be a valid email address");
    }

    if (!data.name || typeof data.name !== "string") {
      errors.push("Name is required and must be a string");
    }

    if (data.role && !["user", "admin"].includes(data.role)) {
      errors.push("Role must be 'user' or 'admin'");
    }

    if (
      data.status &&
      !["active", "inactive", "suspended"].includes(data.status)
    ) {
      errors.push("Status must be 'active', 'inactive', or 'suspended'");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Add authentication provider to user
   * @param {string} providerType - Type of provider
   * @param {string} providerId - ID from provider
   * @returns {Object} Updated auth provider
   */
  addAuthProvider(providerType, providerId) {
    const newProvider = {
      type: providerType,
      providerId,
      linkedAt: new Date().toISOString(),
    };

    // Check if provider already exists
    const exists = this.authProviders.some((p) => p.type === providerType);
    if (!exists) {
      this.authProviders.push(newProvider);
    }

    return newProvider;
  }

  /**
   * Record a login event
   * @param {string} loginMethod - Method used to login
   */
  recordLogin(loginMethod) {
    this.loginHistory.push({
      timestamp: new Date().toISOString(),
      loginMethod,
    });

    // Keep only last 50 logins to avoid exceeding DynamoDB item size
    if (this.loginHistory.length > 50) {
      this.loginHistory = this.loginHistory.slice(-50);
    }

    this.lastLogin = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get public user data (safe to send to client)
   * @returns {Object} Public user data
   */
  toPublic() {
    return {
      userId: this.userId,
      email: this.email,
      name: this.name,
      givenName: this.givenName,
      familyName: this.familyName,
      profileImage: this.profileImage,
      role: this.role,
      locale: this.locale,
    };
  }

  /**
   * Get user data for database storage
   * @returns {Object} Full user object
   */
  toDatabase() {
    return {
      userId: this.userId,
      email: this.email,
      name: this.name,
      givenName: this.givenName,
      familyName: this.familyName,
      profileImage: this.profileImage,
      emailVerified: this.emailVerified,
      locale: this.locale,
      authProviders: this.authProviders,
      role: this.role,
      status: this.status,
      loginHistory: this.loginHistory,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
      updatedAt: this.updatedAt,
    };
  }
}

export default User;
