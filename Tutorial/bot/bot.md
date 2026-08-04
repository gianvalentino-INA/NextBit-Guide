Worried about someone trying to log into your SSH server? Don't worry! In this tutorial, I will guide you step-by-step on how to create your own Telegram bot that alerts you whenever someone logs into your SSH server.

Step 1: Create a Bot on Telegram
Open Telegram and search for @BotFather (make sure it has the blue verification checkmark so you avoid using any malicious software).

Tap Start or send /start to @BotFather.

Type and send /newbot.

Enter a name for your bot (for example: login alertbot).

Choose a unique username for your bot. Note that the username must end with bot (e.g., my_login_alert_bot).

Once a valid username is accepted, BotFather will provide your HTTP API token. Keep this token safe, as you will need it later.

Next, search for @userinfobot in Telegram and tap Start or send /start. The bot will respond with your Chat ID.

Finally, search for your new bot's username and start a conversation with it by tapping Start or sending a quick message like "hello".

Step 2: Configure Your Bot on the Server
Connect to your server via SSH terminal.

Ensure curl and python3 are installed on your server. If they aren't installed yet, run:

Bash
sudo apt update && sudo apt install curl python3 -y
Create your script file using the following command:

Bash
sudo nano /usr/local/bin/telegram-ssh-login.sh
Paste the following configuration into the file. (Make sure to replace YOUR_TELEGRAM_BOT_TOKEN_HERE and YOUR_TELEGRAM_CHAT_ID_HERE with your actual Bot Token and Chat ID):

Bash
#!/usr/bin/env bash

# System PATH setup
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# --- Telegram Credentials ---
BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN_HERE"
CHAT_ID="YOUR_TELEGRAM_CHAT_ID_HERE"

# --- Session Details ---
HOSTNAME=$(hostname)
USER_NAME="${PAM_USER:-$(whoami)}"
IP="${PAM_RHOST:-127.0.0.1}"
[ -z "$IP" ] && IP="127.0.0.1"
TTY_VAL="${PAM_TTY:-pts/0}"
DATE_VAL=$(date '+%Y-%m-%d %H:%M:%S %Z')

# Detect Session Type (Login vs Logout)
if [ "${PAM_TYPE}" = "open_session" ]; then

    # Query detailed IP telemetry
    GEO_RAW=$(curl -s -m 3 "http://ip-api.com/json/${IP}?fields=status,country,regionName,city,zip,lat,lon,timezone,isp,org,mobile,proxy,hosting")

    # Parse JSON safely via Python3
    READ_GEO=$(echo "$GEO_RAW" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('status') == 'success':
        city = d.get('city', 'Unknown')
        region = d.get('regionName', 'Unknown')
        country = d.get('country', 'Unknown')
        zip_code = d.get('zip', 'N/A')
        lat = d.get('lat', 0)
        lon = d.get('lon', 0)
        isp = d.get('isp', 'Unknown')
        org = d.get('org', 'Unknown')
        tz = d.get('timezone', 'Unknown')
        
        is_mobile = '📱 Mobile Network' if d.get('mobile') else ''
        is_proxy = '🛡️ VPN/Proxy' if d.get('proxy') else ''
        is_host = '💻 Datacenter' if d.get('hosting') else ''
        net_type = ', '.join(filter(None, [is_mobile, is_proxy, is_host])) or '🏠 Residential Broadband'
        
        maps = f'https://www.google.com/maps?q={lat},{lon}'
        print(f'{city}|{region}|{country}|{zip_code}|{lat},{lon}|{isp}|{org}|{tz}|{net_type}|{maps}')
    else:
        print('Unknown|Unknown|Unknown|N/A|0,0|Unknown|Unknown|Unknown|Standard|https://maps.google.com')
except Exception:
    print('Unknown|Unknown|Unknown|N/A|0,0|Unknown|Unknown|Unknown|Standard|https://maps.google.com')
")

    IFS='|' read -r CITY REGION COUNTRY ZIP COORDS ISP ORG TZ NET_TYPE MAPS_LINK <<< "$READ_GEO"

    MESSAGE="🟢 <b>SSH Login Alert</b>

• <b>User:</b> <code>${USER_NAME}</code>
• <b>Server:</b> <code>${HOSTNAME}</code>
• <b>Terminal:</b> <code>${TTY_VAL}</code>

📍 <b>Detailed Location</b>
• <b>City/Region:</b> <code>${CITY}, ${REGION}</code>
• <b>Country:</b> <code>${COUNTRY}</code>
• <b>Postal Code:</b> <code>${ZIP}</code>
• <b>Coordinates:</b> <code>${COORDS}</code>
• <b>Map Pin:</b> <a href=\"${MAPS_LINK}\">Open Location in Google Maps 📍</a>

🌐 <b>Network & Telecom</b>
• <b>IP Address:</b> <code>${IP}</code>
• <b>ISP:</b> <code>${ISP}</code>
• <b>Organization:</b> <code>${ORG}</code>
• <b>Connection Type:</b> ${NET_TYPE}
• <b>Timezone:</b> <code>${TZ}</code>
• <b>Timestamp:</b> <code>${DATE_VAL}</code>"

    curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d "chat_id=${CHAT_ID}" \
        -d "parse_mode=HTML" \
        -d "disable_web_page_preview=true" \
        --data-urlencode "text=${MESSAGE}"

elif [ "${PAM_TYPE}" = "close_session" ]; then

    MESSAGE="🔴 <b>SSH Logout Alert</b>

• <b>User:</b> <code>${USER_NAME}</code>
• <b>Server:</b> <code>${HOSTNAME}</code>
• <b>Terminal:</b> <code>${TTY_VAL}</code>
• <b>IP:</b> <code>${IP}</code>
• <b>Timestamp:</b> <code>${DATE_VAL}</code>"

    curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d "chat_id=${CHAT_ID}" \
        -d "parse_mode=HTML" \
        --data-urlencode "text=${MESSAGE}"

fi
Save the file and make it executable by running:

Bash
sudo chmod +x /usr/local/bin/telegram-ssh-login.sh
Hook the script into Linux PAM by opening the SSH configuration file:

Bash
sudo nano /etc/pam.d/sshd
Scroll to the very bottom of the file and add the following line:

Plaintext
session optional pam_exec.so /usr/local/bin/telegram-ssh-login.sh
Step 3: Verification and Testing
Save the file and exit the editor.

Open a new terminal tab or window and log into your server via SSH.

Check your Telegram app—you should instantly receive a 🟢 SSH Login Alert containing detailed information about the login, including:

IP Address

City / Region / Country

ISP / Organization

Clickable Google Maps location link

Now you can rest easy knowing you'll be alerted if anyone accesses your server!