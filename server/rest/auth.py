# library imports
import os
import sys
import hashlib
import secrets
from html import escape
from datetime import timedelta
from flask import request, abort, make_response, session
from flask_restful import Resource

from sqlalchemy import func

from config import db
from models import ProjectUser, User, Project, Unit, PasswordResetToken
from helpers import utc_now
from mailer import send_email, mailgun_configured

RESET_TOKEN_TTL = timedelta(hours=1)
# a new reset email is not sent while the previous one is younger than this
RESET_RESEND_INTERVAL = timedelta(minutes=2)

def allowed_projects():
    user = User.query.filter_by(id=session.get('user_id')).first()
    if not user:
        return []
    
    if user.is_admin:
        #print("Admin user, returning all projects")
        projects = Project.query.order_by(Project.name.asc()).all()
    else:
        projects = Project.query.join(ProjectUser, ProjectUser.project_id == Project.id).filter(
            ProjectUser.user_id == session.get('user_id'),
            ProjectUser.deleted == False
        ).order_by(Project.name.asc()).all()
    return projects

def current_user_is_admin():
    user = User.query.filter_by(id=session.get('user_id')).first()
    return bool(user and user.is_admin)

def admin_required_response():
    # project structure (templates, dependencies, groups, units) is managed by admins
    return make_response({"error": "Only administrators can change project structure"}, 403)

def can_access_project(project_id):
    try:
        project_id = int(project_id)
    except (TypeError, ValueError):
        return False
    return any(project.id == project_id for project in allowed_projects())

def get_user_object(user):
    user_obj = user.to_dict(only=('id','first_name','last_name','email','is_admin','selectedProject','selectedUnit'))

    projects = allowed_projects()
    if not user_obj.get('selectedProject') or user_obj['selectedProject'] not in [p.id for p in projects]:
        if projects:
            user_obj['selectedProject'] = projects[0].id
        else:
            user_obj['selectedProject'] = None
        
    if not user_obj.get('selectedUnit') or user_obj['selectedUnit'] not in [u.id for u in Unit.query.filter(Unit.project_id==user_obj['selectedProject']).all()]:
        get_unit = Unit.query.filter(Unit.project_id==user_obj['selectedProject']).first()
        if get_unit:
            user_obj['selectedUnit'] = get_unit.id
        else:
            user_obj['selectedUnit'] = None
    return user_obj

def find_user_by_email(email):
    email = email.strip()
    user = User.query.filter(User.email == email).first()
    if not user:
        # emails are case-insensitive; only fall back when the match is unambiguous
        matches = User.query.filter(func.lower(User.email) == email.lower()).all()
        user = matches[0] if len(matches) == 1 else None
    return user

def hash_reset_token(token):
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def reset_base_url():
    # never build links from the Host header in production: a forged Host would point the emailed link elsewhere
    base = os.getenv('APP_BASE_URL')
    if not base and not os.getenv('VERCEL'):
        base = request.host_url
    return base.rstrip('/') if base else None

class UserSignup(Resource):
    def post(self):
        try:
            data = request.get_json()
            if data['password'] != data['confirmPassword']:
                raise Exception("Passwords do not match")
            
            user = User(
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=data['email'],
            )
            user.password_hash=data['password']
            user.last_login_at = utc_now()
            db.session.add(user)
            db.session.commit()

            session['user_id'] = user.id

            return make_response(get_user_object(user), 201)
        
        except Exception as e:
            return make_response({"errors": e.args}, 422)

class UserLogin(Resource):
    def post(self):
        data = request.get_json(silent=True) or {}
        if not data.get('email') or not data.get('password'):
            return make_response({"errors": ["Email and password are required"]}, 400)
        user = find_user_by_email(data['email'])
        if user and user.authenticate(data['password']):
            session['user_id'] = user.id
            user.last_login_at = utc_now()
            db.session.commit()

            return make_response(get_user_object(user), 200)
        return make_response({"errors": ["Login Error"]}, 403)

class UserLogout(Resource):
    def delete(self):
        user_id = session.get('user_id')
        if user_id != None:
            session.clear()
            return make_response("", 204)
        return make_response({"errors":"User not logged in"}, 401)
    
class UserAuthorize(Resource):
    def get(self):
        try:
            user = User.query.filter_by(id=session["user_id"]).first()          
            response = make_response(get_user_object(user), 200)
            return response
        except:
            abort(401, "Unauthorized")
            #raise Unauthorized


class UserProfile(Resource):
    def patch(self):
        user = User.query.filter_by(id=session["user_id"]).first()
        data = request.get_json()
        try:
            if 'first_name' in data:
                setattr(user, 'first_name', data['first_name'])
            if 'last_name' in data:
                setattr(user, 'last_name', data['last_name'])
            if 'selectedProject' in data:
                setattr(user, 'selectedProject', data['selectedProject'])
            if 'selectedUnit' in data:
                setattr(user, 'selectedUnit', data['selectedUnit'])
            if 'password' in data:
                if data['password'] != data['confirmPassword']:
                    raise Exception("Passwords do not match")
                setattr(user, 'password_hash', data['password'])
                # log the user out after password change
                db.session.commit()
                session.clear()
                return make_response("", 204)
        except Exception as e:
            db.session.rollback()
            return make_response({"error": e.args}, 422)
        
        db.session.commit()

        return make_response(get_user_object(user), 202)

class PasswordForgot(Resource):
    def post(self):
        data = request.get_json(silent=True) or {}
        # same response whether or not the account exists, so this can't be used to probe for emails
        generic = make_response({"message": "If that email has an account, a reset link has been sent."}, 200)
        if not data.get('email'):
            return make_response({"error": "Email is required"}, 400)

        user = find_user_by_email(data['email'])
        if not user:
            return generic

        now = utc_now()
        outstanding = PasswordResetToken.query.filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        ).all()
        if any(t.created_at > now - RESET_RESEND_INTERVAL for t in outstanding):
            return generic

        base = reset_base_url()
        if not base:
            print("password reset: APP_BASE_URL is not set, no email sent", file=sys.stderr)
            return generic

        # only the newest link works
        for t in outstanding:
            t.used_at = now
        token = secrets.token_urlsafe(32)
        db.session.add(PasswordResetToken(
            user_id=user.id,
            token_hash=hash_reset_token(token),
            created_at=now,
            expires_at=now + RESET_TOKEN_TTL,
        ))
        db.session.commit()

        # the token travels in the URL fragment, which browsers never send to the server, so it stays out of request logs
        link = f"{base}/reset-password#token={token}"
        if not mailgun_configured():
            if not os.getenv('VERCEL'):
                print(f"password reset (Mailgun not configured) for {user.email}: {link}", flush=True)
            else:
                print("password reset: Mailgun is not configured, no email sent", file=sys.stderr)
            return generic

        text = (
            f"Hi {user.first_name},\n\n"
            "We received a request to reset your ProjectPilot password. "
            "Open the link below to choose a new one. It expires in 1 hour and can be used once.\n\n"
            f"{link}\n\n"
            "If you didn't ask for this, you can ignore this email; your password won't change."
        )
        html = (
            f"<p>Hi {escape(user.first_name)},</p>"
            "<p>We received a request to reset your ProjectPilot password. "
            "The link below expires in 1 hour and can be used once.</p>"
            f'<p><a href="{escape(link)}">Reset your password</a></p>'
            "<p>If you didn't ask for this, you can ignore this email; your password won't change.</p>"
        )
        try:
            send_email(user.email, "Reset your ProjectPilot password", text, html)
        except Exception as e:
            print(f"password reset: Mailgun send failed: {e!r}", file=sys.stderr)
        return generic

class PasswordReset(Resource):
    def post(self):
        data = request.get_json(silent=True) or {}
        token = data.get('token')
        password = data.get('password')
        if not token or not password:
            return make_response({"error": "Token and password are required"}, 400)
        if password != data.get('confirmPassword'):
            return make_response({"error": "Passwords do not match"}, 422)
        if len(password) < 4:
            return make_response({"error": "Password must be at least 4 characters"}, 422)

        now = utc_now()
        reset = PasswordResetToken.query.filter(
            PasswordResetToken.token_hash == hash_reset_token(token),
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        ).first()
        if not reset:
            return make_response({"error": "This reset link is invalid or has expired. Please request a new one."}, 400)

        reset.user.password_hash = password
        # redeem this link and retire any others still outstanding
        PasswordResetToken.query.filter(
            PasswordResetToken.user_id == reset.user_id,
            PasswordResetToken.used_at.is_(None),
        ).update({PasswordResetToken.used_at: now}, synchronize_session=False)
        db.session.commit()

        session.clear()
        return make_response({"message": "Password updated. Please log in."}, 200)
