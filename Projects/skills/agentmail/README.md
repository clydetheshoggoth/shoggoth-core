# AgentMail - Quick Start

**Installation Status:** ✅ Installed at `/home/ubuntu/clawd/skills/agentmail/`

## Setup Steps

1. **Create account at** [console.agentmail.to](https://console.agentmail.to)
   - Username: `shoggoth`
   - Password: (your choice)
   - Email: `shoggothbyleviath@gmail.com`

2. **Generate API key** in console dashboard

3. **Install SDK:**
   ```bash
   pip install agentmail python-dotenv
   ```

4. **Set environment variable:**
   ```bash
   export AGENTMAIL_API_KEY="your_key_here"
   ```

## Quick Usage

### Send Email from Script
```bash
cd /home/ubuntu/clawd
node scripts/send_email.sh
```

## For More Information

See full documentation: `/home/ubuntu/clawd/skills/agentmail/SKILL.md`

## Security Note

⚠️ **CRITICAL:** Configure email webhook allowlist at `~/.clawdbot/hooks/email-allowlist.ts` to block untrusted senders. See SKILL.md for details.

---

**Ready to use for automated trading notifications and agent workflows.**
