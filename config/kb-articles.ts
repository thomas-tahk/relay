import type { KbArticle } from "@/domain/types";

// Self-service knowledge base for the school-district skin.
//
// PART OF THE RESKIN SEAM. Deflection matches a requester's plain-language
// problem against these articles BEFORE a ticket is filed — an easy win that
// keeps trivial requests out of the queue. Swap this set (and the catalog) to
// retarget Relay; the deflection engine never changes.

export const kbArticles: KbArticle[] = [
  {
    id: "kb-password-reset",
    title: "Reset your district password",
    body: "You can reset your own password without a ticket. Go to portal.district.edu/reset, enter your staff email, and answer your security questions. New passwords take about five minutes to sync to email and Wi-Fi. If you are locked out after five failed attempts, wait 15 minutes and try again.",
  },
  {
    id: "kb-projector-power",
    title: "Projector or display won't turn on",
    body: "Before reporting a dead projector, check three things: (1) the wall switch and power strip are on, (2) the HDMI or VGA cable is seated at both ends, and (3) the correct input source is selected on the remote. Most classroom projectors have a standby light — a blinking red light usually means it is cooling down and will restart in 90 seconds.",
  },
  {
    id: "kb-email-phone",
    title: "Set up district email on your phone",
    body: "Add your district mailbox using the built-in Mail app. Choose 'Exchange' or 'Office 365', enter your full staff email and password, and accept the security profile. You do not need a ticket for this. If it rejects your password, reset it first at portal.district.edu/reset.",
  },
  {
    id: "kb-wifi-staff",
    title: "Connect to staff Wi-Fi",
    body: "Select the 'District-Staff' network (not 'District-Guest') and sign in with your staff email and password. Guest Wi-Fi cannot reach printers, drives, or the SIS. If your device keeps dropping, 'forget' the network and rejoin so it picks up the current certificate.",
  },
  {
    id: "kb-printer-offline",
    title: "Printer shows offline or won't print",
    body: "An 'offline' printer is usually a queue problem, not a broken printer. Cancel all stuck jobs, then power-cycle the printer (off 30 seconds, back on). Confirm you are on staff Wi-Fi — guest Wi-Fi cannot see printers. If prints come out faint, the toner is low; the model number on the front tells the supply room which cartridge to send.",
  },
  {
    id: "kb-sis-login",
    title: "Can't log in to the Student Information System",
    body: "SIS access is separate from your email login and must be granted by role. If you have never used the SIS, you likely need access provisioned — file a request. If you had access and it stopped working, confirm you are using your staff email (not a personal one) and that your account isn't locked from too many attempts.",
  },
  {
    id: "kb-mfa-setup",
    title: "Set up multi-factor authentication (MFA)",
    body: "MFA protects your account if your password leaks. Install the Authenticator app, sign in at portal.district.edu/security, and scan the QR code. Save the backup codes somewhere safe — they get you in if you lose your phone. Setup is self-service and takes about two minutes.",
  },
  {
    id: "kb-chromebook-frozen",
    title: "Student Chromebook is frozen or won't wake",
    body: "A hard reset fixes most frozen Chromebooks: hold Refresh (the circular arrow) and tap Power. The screen goes black and reboots in about 20 seconds — no data is lost. If it will not charge, try a different known-good charger before reporting hardware failure; classroom chargers fail more often than the laptops do.",
  },
  {
    id: "kb-shared-drive",
    title: "Find or reconnect a shared department drive",
    body: "Shared drives appear automatically when you log in on staff Wi-Fi. If a drive is missing, sign out and back in rather than restarting. New staff who have never seen the drive need access granted by their department — that is a request, not a fix.",
  },
  {
    id: "kb-smartboard-touch",
    title: "Smartboard touch is off or miscalibrated",
    body: "If taps land in the wrong spot, run calibration from the pen tray menu and touch each target exactly. If touch does nothing at all, check that the USB cable from the board to the computer is connected — it is the one that carries touch, separate from the video cable.",
  },
  {
    id: "kb-classroom-audio",
    title: "No sound from classroom speakers",
    body: "Check the volume in three places: the computer, the projector or display, and the physical speaker amplifier (often a small box on the wall). Confirm the computer's output is set to the classroom speakers and not to headphones or the internal speaker. A muted amplifier is the most common cause.",
  },
  {
    id: "kb-vpn-remote",
    title: "Access district files from home (VPN)",
    body: "To reach shared drives and the SIS from home, connect the district VPN client first, then sign in with your staff email. If the VPN rejects you, your password may have expired — reset it on the district portal, then reconnect. Streaming video over VPN is slow; download large files instead.",
  },
];

export function getKbArticle(id: string): KbArticle | undefined {
  return kbArticles.find((article) => article.id === id);
}
