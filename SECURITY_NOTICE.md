# ⚠️ IMPORTANT SECURITY NOTICE

## Your AWS Credentials Are Exposed in .env Files

**Current Status:**

- ✅ `.env` files are in `.gitignore` (not committed to Git)
- ✅ GitHub Secrets configured for CI/CD (credentials are safely stored)
- ⚠️ AWS credentials are in plaintext in your local `.env` files

---

## 🔒 Recommendations:

### 1. **Keep .env Files Local Only**

Never commit `.env` or `.env.local` to version control:

```bash
# Verify these are in .gitignore:
backend/.env
frontend/.env.local
frontend/.env.production
```

### 2. **Use IAM Roles in Production** (Better Security)

Instead of hardcoding credentials, use IAM roles for Elastic Beanstalk:

```bash
# Remove these variables from EB environment:
eb setenv AWS_ACCESS_KEY_ID="" AWS_SECRET_ACCESS_KEY=""

# Attach IAM role to EB instance instead
```

**Steps:**

1. Go to: https://console.aws.amazon.com/iam/home?region=ap-south-1#/roles
2. Create role for "Elastic Beanstalk" or "EC2"
3. Attach policies:
   - `AmazonDynamoDBFullAccess`
   - `AmazonCognitoPowerUser`
   - `AmazonBedrockFullAccess`
4. In EB Console → Configuration → Security → Instance profile → Select your role

### 3. **Rotate Your Access Keys Periodically**

If you suspect credentials were exposed:

```bash
# Go to IAM Console
# Users → Security credentials → Access keys
# Create new key → Update GitHub Secrets → Delete old key
```

### 4. **Use AWS Secrets Manager** (Production Best Practice)

Instead of environment variables, store secrets in AWS Secrets Manager:

```javascript
// backend/config/secrets.js
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "ap-south-1" });

export async function getSecret(secretName) {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );
  return JSON.parse(response.SecretString);
}
```

**Cost:** $0.40/month per secret + $0.05 per 10,000 API calls

### 5. **Enable MFA on Your AWS Root Account**

Protect your AWS account with Multi-Factor Authentication:

- Go to: https://console.aws.amazon.com/iam/home#/security_credentials
- Enable MFA for root account
- Enable MFA for IAM users

---

## 📋 Current Security Checklist

- [ ] `.env` files are in `.gitignore` ✅ (already done)
- [ ] GitHub Secrets configured ✅ (already done)
- [ ] AWS MFA enabled
- [ ] Consider IAM roles instead of access keys
- [ ] Rotate credentials every 90 days
- [ ] Review CloudTrail logs for suspicious activity

---

## 🚨 If Credentials Are Compromised:

1. **Immediately deactivate the key:**
   - https://console.aws.amazon.com/iam/home#/security_credentials
   - Find the key: `YOUR_AWS_ACCESS_KEY_ID`
   - Click "Make inactive"

2. **Check for unauthorized usage:**
   - https://console.aws.amazon.com/cloudtrail
   - Look for unexpected API calls

3. **Create new credentials:**
   - Generate new access key
   - Update GitHub Secrets
   - Update local `.env` files
   - Update EB environment variables

4. **Delete old key**

---

## 💡 Best Practices Summary

**For Development:**

- Use `.env` files (already doing this ✅)
- Never commit to Git (already protected ✅)

**For Production:**

- Use IAM roles (recommended)
- Or use AWS Secrets Manager
- Enable CloudTrail logging
- Rotate keys every 90 days

**For CI/CD:**

- Use GitHub Secrets (already doing this ✅)
- Limit permissions to minimum required
- Use separate credentials for CI/CD if possible

---

## 📖 Resources

- [AWS Security Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [IAM Roles for EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**You're currently safe for testing/development. Consider upgrading to IAM roles before launching in production!**
