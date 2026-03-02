import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import docClient, { usersTable } from "../config/dynamodb.js";
import dotenv from "dotenv";

dotenv.config();

async function listUsers() {
  try {
    console.log(`🔍 Scanning table "${usersTable}" for all users...`);
    console.log(`📍 Region: ${process.env.AWS_REGION}`);
    console.log("");

    const result = await docClient.send(
      new ScanCommand({
        TableName: usersTable,
      }),
    );

    if (!result.Items || result.Items.length === 0) {
      console.log("❌ No users found in the table");
      console.log("");
      console.log("💡 This could mean:");
      console.log("   1. No one has logged in yet");
      console.log("   2. The table is empty");
      console.log("   3. AWS credentials are pointing to wrong account/region");
      console.log("");
      console.log("🧪 Try logging in at: http://localhost:3000/login");
      return;
    }

    console.log(`✅ Found ${result.Items.length} user(s):\n`);

    result.Items.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   userId: ${user.userId}`);
      console.log(`   email: ${user.email}`);
      console.log(`   name: ${user.name || "N/A"}`);
      console.log(`   givenName: ${user.givenName || "N/A"}`);
      console.log(`   familyName: ${user.familyName || "N/A"}`);
      console.log(`   role: ${user.role || "N/A"}`);
      console.log(`   status: ${user.status || "N/A"}`);
      console.log(`   emailVerified: ${user.emailVerified || false}`);
      console.log(`   createdAt: ${user.createdAt || "N/A"}`);
      console.log(`   lastLogin: ${user.lastLogin || "N/A"}`);
      console.log(
        `   loginHistory: ${user.loginHistory?.length || 0} login(s)`,
      );
      console.log("");
    });

    console.log(`📊 Total users: ${result.Items.length}`);
  } catch (error) {
    console.error("❌ Error reading from DynamoDB:");
    console.error(error.message);
    console.error("");
    console.error("Please check:");
    console.error("1. AWS credentials are correct in .env");
    console.error("2. IAM user has DynamoDB read permissions");
    console.error("3. Table name is correct:", usersTable);
    console.error("4. Region is correct:", process.env.AWS_REGION);
  }
}

listUsers();
