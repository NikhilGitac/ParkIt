import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Helper to load environment variables from .env.local or .env if not already loaded
function loadEnvFile(envPath: string) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

// Try loading from .env.local and .env in current directory and parent directories
const cwd = process.cwd();
loadEnvFile(path.join(cwd, ".env.local"));
loadEnvFile(path.join(cwd, ".env"));
loadEnvFile(path.join(cwd, "parkit", ".env.local"));
loadEnvFile(path.join(cwd, "parkit", ".env"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is not set.");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is required to seed demo users in Supabase Auth.\n" +
      "Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file or pass it as an environment variable:\n\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/seed-demo-users.ts\n"
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findOrCreateUser(
  email: string,
  password: string,
  fullName: string,
  role: "owner" | "driver",
  phone: string
) {
  console.log(`Checking user: ${email}...`);

  // 1. Check existing users
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existing = listData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId: string;

  if (existing) {
    console.log(`User ${email} already exists (id: ${existing.id}). Updating password & metadata...`);
    const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existing.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
          phone,
        },
      }
    );
    if (updateError) {
      throw new Error(`Failed to update ${email}: ${updateError.message}`);
    }
    userId = updated.user.id;
  } else {
    console.log(`User ${email} does not exist. Creating new user with confirmed email...`);
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        phone,
      },
    });
    if (createError) {
      throw new Error(`Failed to create ${email}: ${createError.message}`);
    }
    userId = created.user.id;
  }

  // 2. Upsert public profile
  console.log(`Upserting profile for ${email} (id: ${userId})...`);
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      role,
      phone,
      is_verified: true,
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.warn(`Warning updating profile: ${profileError.message}`);
  }

  return userId;
}

async function main() {
  console.log("=================================================");
  console.log("🚀 ParKit: Seeding Real Supabase Auth Demo Users");
  console.log("=================================================");

  // 1. Seed Host
  const hostId = await findOrCreateUser(
    "demo.host@parkit.test",
    "DemoHost123!",
    "Demo Host (Verified)",
    "owner",
    "+91 98100 12001"
  );

  // 2. Seed Driver
  const driverId = await findOrCreateUser(
    "demo.driver@parkit.test",
    "DemoDriver123!",
    "Demo Driver (Verified)",
    "driver",
    "+91 99100 34001"
  );

  // 3. Assign several seeded spaces to the demo host
  console.log("\nAssigning parking spaces to demo host...");
  const targetSpaceIds = [
    "b0000000-0000-0000-0000-000000000001",
    "b0000000-0000-0000-0000-000000000002",
    "b0000000-0000-0000-0000-000000000006",
    "b0000000-0000-0000-0000-000000000011",
  ];

  // Try updating those specific spaces
  const { data: updatedSpaces, error: spaceUpdateError } = await supabaseAdmin
    .from("parking_spaces")
    .update({ owner_id: hostId })
    .in("id", targetSpaceIds)
    .select("id, title");

  let hostSpaces = updatedSpaces || [];

  if (spaceUpdateError || hostSpaces.length === 0) {
    console.log("Specific deterministic space IDs not found; selecting top 3 existing spaces to assign to host...");
    const { data: existingAnySpaces } = await supabaseAdmin
      .from("parking_spaces")
      .select("id, title")
      .limit(3);

    if (existingAnySpaces && existingAnySpaces.length > 0) {
      const anyIds = existingAnySpaces.map((s) => s.id);
      await supabaseAdmin
        .from("parking_spaces")
        .update({ owner_id: hostId })
        .in("id", anyIds);
      hostSpaces = existingAnySpaces;
    }
  }

  console.log(`✅ Assigned ${hostSpaces.length} parking spaces to Demo Host:`);
  for (const s of hostSpaces) {
    console.log(`   - ${s.title} (${s.id})`);
  }

  // 4. Create existing demo bookings for host's spaces
  if (hostSpaces.length > 0) {
    console.log("\nEnsuring demo bookings exist for host spaces & demo driver...");
    const spaceId = hostSpaces[0].id;

    // Check if bookings already exist
    const { data: existingBookings } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("space_id", spaceId)
      .eq("driver_id", driverId);

    if (!existingBookings || existingBookings.length === 0) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(now.getTime() - 22 * 60 * 60 * 1000);

      const demoBookings = [
        {
          space_id: spaceId,
          driver_id: driverId,
          start_time: oneHourAgo.toISOString(),
          end_time: twoHoursLater.toISOString(),
          total_price: 135.0,
          status: "confirmed",
          otp_code: "4821",
          qr_code_data: "PARKIT-DEMO-ACTIVE-1",
        },
        {
          space_id: spaceId,
          driver_id: driverId,
          start_time: yesterday.toISOString(),
          end_time: yesterdayEnd.toISOString(),
          total_price: 180.0,
          status: "completed",
          otp_code: "1934",
          qr_code_data: "PARKIT-DEMO-DONE-1",
        },
      ];

      const { data: insertedBookings, error: bookingErr } = await supabaseAdmin
        .from("bookings")
        .insert(demoBookings)
        .select("id, status, total_price");

      if (bookingErr) {
        console.warn(`Warning inserting demo bookings: ${bookingErr.message}`);
      } else {
        console.log(`✅ Created ${insertedBookings?.length || 0} demo bookings.`);
      }
    } else {
      console.log(`✅ ${existingBookings.length} demo booking(s) already exist.`);
    }
  }

  console.log("\n=================================================");
  console.log("🎉 Real Supabase Auth Demo Users Seed Completed!");
  console.log("   Host:   demo.host@parkit.test   (Password: DemoHost123!)");
  console.log("   Driver: demo.driver@parkit.test (Password: DemoDriver123!)");
  console.log("=================================================\n");
}

main().catch((err) => {
  console.error("Unhandled error in seed script:", err);
  process.exit(1);
});
