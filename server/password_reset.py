from app import app
from models import db, User
import string, secrets

with app.app_context():
    # define user to reset password
    user_email = "user@example.com"
    
    user = User.query.filter(User.email == user_email).first()
    if user == None:
        print(f'User {user_email} not found.')
        exit()

    chars = string.ascii_letters + string.digits + string.punctuation
    password = "".join(secrets.choice(chars) for _ in range(16))
    
    user.password_hash = password
    db.session.commit()
    print(f'Password for {user_email} has been reset to {password}')