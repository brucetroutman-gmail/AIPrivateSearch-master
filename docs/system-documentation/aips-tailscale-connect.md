Here's the complete step-by-step, start to finish:

## Setting Up Screen Sharing with Your Friend's Mac via Tailscale

**On your friend's Mac:**

1. **Install Tailscale**
   - Download from tailscale.com/download and install
   - Sign up/log in using Google, Microsoft, Apple, GitHub, or email
   - Confirm the Tailscale menu bar icon shows "Connected"

2. **Enable Screen Sharing**
   - System Settings → General → Sharing
   - Toggle on **Screen Sharing**
   - Click the ⓘ next to it → set "Allow access for" to your friend's account (or "All users")

3. **Enable File Sharing** (optional, only if you also want file transfer access)
   - Same Sharing panel → toggle on **File Sharing**
   - Add/select specific folders if you want to limit access

4. **Enable Wake for Network Access** (recommended, so the Mac doesn't go unreachable)
   - System Settings → Battery (or Energy Saver) → Options → toggle on **Wake for network access**

5. **Share their device with you on Tailscale**
   - Go to [login.tailscale.com/admin/machines](https://login.tailscale.com/admin/machines) (logged into their own account)
   - Find their Mac in the list → click the **⋯** menu → **Share**
   - Choose **Share by email**, enter your email address
   - Send you the resulting invite link

**On your device:**

6. **Install Tailscale** (if you haven't already) and log into your own account

7. **Accept the share**
   - Click the invite link your friend sent
   - Log in to accept it
   - Their Mac now appears in your tailnet as `their-device-name.their-tailnet-name.ts.net`
   - (You can confirm the exact hostname in your admin console under **Machines**)

8. **Connect to their screen**
   - **If you're on a Mac:** Finder → Go menu → **Connect to Server** (`Cmd+K`) → enter `vnc://their-device-name.their-tailnet-name.ts.net` → log in with their Mac's username/password
   - **If you're on Windows/Linux:** Use a VNC client (RealVNC Viewer, TigerVNC, Screens) → connect to `their-device-name.their-tailnet-name.ts.net` on port `5900`

**Quick troubleshooting notes:**
- Their Mac needs to be awake (or at least at the login screen) — Screen Sharing can even get you to the login screen to log in remotely.
- If the connection fails, double-check the Tailscale hostname in the admin console — it must match exactly.
- Both your tailnet and theirs need default (or compatible) access control policies for the share to work.