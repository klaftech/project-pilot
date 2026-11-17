# Outgoing email through the Mailgun HTTP API (stdlib only, no extra dependency)
import os
import base64
import urllib.parse
import urllib.request
from dotenv import load_dotenv

load_dotenv()

def mailgun_configured():
    return bool(os.getenv('MAILGUN_API_KEY') and os.getenv('MAILGUN_DOMAIN') and os.getenv('MAIL_FROM'))

def send_email(to, subject, text, html=None):
    # raises on failure; callers decide whether that is fatal
    api_key = os.getenv('MAILGUN_API_KEY')
    domain = os.getenv('MAILGUN_DOMAIN')
    # EU-region domains use https://api.eu.mailgun.net
    base_url = os.getenv('MAILGUN_API_BASE', 'https://api.mailgun.net').rstrip('/')

    fields = {'from': os.getenv('MAIL_FROM'), 'to': to, 'subject': subject, 'text': text}
    if html:
        fields['html'] = html
    auth = base64.b64encode(f'api:{api_key}'.encode()).decode()
    req = urllib.request.Request(
        f'{base_url}/v3/{domain}/messages',
        data=urllib.parse.urlencode(fields).encode(),
        headers={'Authorization': f'Basic {auth}'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        return res.status
