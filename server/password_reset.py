# usage: python server/password_reset.py user@example.com
import sys
import string, secrets
from app import app
from models import db, User

if len(sys.argv) != 2:
    print('usage: python server/password_reset.py <email>')
    sys.exit(1)

with app.app_context():
    # define user to reset password
    user_email = sys.argv[1]
    
    user = User.query.filter(User.email == user_email).first()
    if user == None:
        print(f'User {user_email} not found.')
        sys.exit(1)

    chars = string.ascii_letters + string.digits + string.punctuation
    password = "".join(secrets.choice(chars) for _ in range(16))
    
    user.password_hash = password
    db.session.commit()
    print(f'Password for {user_email} has been reset to {password}')
