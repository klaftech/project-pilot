from app import app
from models import db, User

with app.app_context():
    # define user to reset password
    user_email = "admin@example.com"
    
    user = User.query.filter(User.email == user_email).first()
    if user == None:
        print(f'User {user_email} not found.')
        exit()
    user.password_hash = "123456"    
    db.session.commit()
    print(f'Password for {user_email} has been reset.')