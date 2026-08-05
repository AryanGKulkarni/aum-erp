"use client";

import { useState } from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Divider from "@mui/joy/Divider";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { getGoogleAuthUrl, sendEmailLoginLink } from "@/services/api_service";

const COMPANY_NAME = "Austenite Metalworx Pvt. Ltd.";
const BRAND_NAVY = "#1E3A6E";
const BRAND_NAVY_DARK = "#152C56";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.68 9c0-.593.102-1.17.284-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendLink() {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      await sendEmailLoginLink(email.trim());
      setSent(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send login link");
    } finally {
      setSending(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.level1",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 390,
          backgroundColor: "background.surface",
          borderRadius: "lg",
          boxShadow: "md",
          p: 3.5,
        }}
      >
        <Box
          sx={{
            display: "flex", flexDirection: "column", alignItems: "center",
            pb: 2.5, mb: 2.5, borderBottom: "1px solid", borderColor: "neutral.200",
          }}
        >
          <Box
            sx={{
              width: 64, height: 64, borderRadius: "sm", border: "1px solid", borderColor: "neutral.300",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", mb: 1.5, p: "4px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.jpg"
              alt="Company logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Box>
          <Typography level="title-md" fontWeight="xl" sx={{ color: BRAND_NAVY, textAlign: "center" }}>
            {COMPANY_NAME}
          </Typography>
        </Box>

        <Button
          component="a"
          href={getGoogleAuthUrl()}
          variant="outlined"
          color="neutral"
          fullWidth
          startDecorator={<GoogleIcon />}
          sx={{ mb: 2 }}
        >
          Continue with Google
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Divider sx={{ flex: 1 }} />
          <Typography level="body-xs" sx={{ color: "neutral.400" }}>or</Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>

        {sent ? (
          <Typography level="body-sm" sx={{ color: "success.600", textAlign: "center", py: 1.5 }}>
            Check your inbox — we&apos;ve sent you a sign-in link.
          </Typography>
        ) : (
          <>
            <Input
              type="email"
              placeholder="Enter your email"
              startDecorator={<MailOutlineIcon />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendLink();
              }}
              sx={{ mb: 1.5 }}
            />
            <Button
              fullWidth
              loading={sending}
              startDecorator={<ArrowForwardIcon style={{ fontSize: 18 }} />}
              onClick={handleSendLink}
              sx={{ backgroundColor: BRAND_NAVY, "&:hover": { backgroundColor: BRAND_NAVY_DARK } }}
            >
              Send sign-in link
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
