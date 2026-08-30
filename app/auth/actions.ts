"use server";

import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { redirect } from "next/navigation";

/**
 * Server Actions for Authentication
 * Supports login & signup with Mobile Phone Number (+91) or Email.
 * Automatically auto-confirms accounts so farmers and reviewers never get blocked.
 */

// ----- REGISTER -----
export async function register(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const emailOrPhone = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!fullName || fullName.trim().length === 0) {
    return { error: "Full name is required." };
  }

  if (!emailOrPhone || emailOrPhone.trim().length === 0) {
    return { error: "Email or phone number is required." };
  }

  // Normalize phone / email input
  let targetEmail = emailOrPhone.trim();
  const cleanInput = emailOrPhone.replace(/[\s\-\+]/g, "");

  if (/^\d{10,12}$/.test(cleanInput)) {
    const mobileDigits = cleanInput.slice(-10);
    targetEmail = `farmer.${mobileDigits}@agrisync.in`;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      return { error: "Please enter a valid email address or 10-digit mobile number." };
    }
  }

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: targetEmail,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        phone_number: phone ? phone.trim() : cleanInput,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      // Account exists: Auto-confirm user and sign in
      return await login(formData);
    }
    return { error: error.message };
  }

  // Auto-confirm user email via admin API
  if (signUpData?.user?.id) {
    try {
      await admin.auth.admin.updateUserById(signUpData.user.id, {
        email_confirm: true,
      });
    } catch (e) {
      console.warn("Auto-confirm warning:", e);
    }
  }

  // Perform immediate sign in
  return await login(formData);
}

// ----- LOGIN -----
export async function login(formData: FormData) {
  const identifier = (formData.get("email") || formData.get("phone")) as string;
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Mobile number/email and password are required." };
  }

  let targetEmail = identifier.trim();
  const cleanInput = identifier.replace(/[\s\-\+]/g, "");

  if (/^\d{10,12}$/.test(cleanInput)) {
    const mobileDigits = cleanInput.slice(-10);
    targetEmail = `farmer.${mobileDigits}@agrisync.in`;
  }

  const supabase = await createClient();

  let { error } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password,
  });

  // If email is unconfirmed, auto-confirm via Admin Client and retry login
  if (error && error.message.toLowerCase().includes("email not confirmed")) {
    try {
      const admin = createAdminClient();
      const { data: usersData } = await admin.auth.admin.listUsers();
      const matchedUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
      );

      if (matchedUser?.id) {
        await admin.auth.admin.updateUserById(matchedUser.id, {
          email_confirm: true,
        });

        // Retry login
        const retryResult = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });
        error = retryResult.error;
      }
    } catch (adminErr) {
      console.error("Admin auto-confirm failed:", adminErr);
    }
  }

  if (error) {
    if (error.message.toLowerCase().includes("invalid")) {
      return { error: "Invalid mobile number/email or password." };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}

// ----- LOGOUT -----
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
