# library imports
import os
from dotenv import load_dotenv
from flask import Flask, render_template
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from flask_bcrypt import Bcrypt 

# load environment variables from the .env file (if present)
load_dotenv()

# backend only deployment
# app = Flask(__name__) 

# full-stack deployment 
# instance_path required for vercel deployment because the rest of the instance is read-only
app = Flask(
    __name__,
    instance_path="/tmp/flask-instance",
    static_url_path='',
    static_folder='../client/dist',
    template_folder='../client/dist'
)
@app.errorhandler(404)
def not_found(e):
    return render_template("index.html")


#app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False
app.json.compact = False                                  
app.secret_key = os.getenv('SECRET_KEY')

metadata = MetaData(
  naming_convention={
    'pk': 'pk_%(table_name)s',
    'fk': 'fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s',
    'ix': 'ix_%(table_name)s_%(column_0_name)s',
    'uq': 'uq_%(table_name)s_%(column_0_name)s',
    'ck': 'ck_%(table_name)s_%(constraint_name)s',
    }
)
db = SQLAlchemy(metadata=metadata)
db.init_app(app)

migrate = Migrate(app, db)

bcrypt = Bcrypt(app)

# below, we monkey-patch flask-restful's Api class to overwrite it's error_router with Flask's native error handler so that we can use the custom errorhandler we've registered on app
Api.error_router = lambda self, handler, e: handler(e)
api = Api(app)

CORS(app)