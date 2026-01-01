from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, jsonify, render_template_string
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user #AUTH
from werkzeug.security import check_password_hash, generate_password_hash #AUTH
import os
from datetime import datetime
from werkzeug.utils import secure_filename
import pandas as pd
from dataclasses import dataclass
from typing import Optional

app = Flask(__name__)
app.secret_key = 'your_secret_key'

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

#AUTH#########
login_manager = LoginManager(app) 
login_manager.login_view = "login" 

@dataclass
class User(UserMixin):
    id: str
    username: str
    password_hash: str

#load user df
users_df = pd.read_csv('users.csv', dtype=str).fillna("")
# For quick lookups
users_by_username = {row.username: User(**row.to_dict()) for _, row in users_df.iterrows()}
users_by_id = {row.id: users_by_username[row.username] for _, row in users_df.iterrows()}

@login_manager.user_loader
def load_user(user_id: str) -> Optional[User]:
    return users_by_id.get(str(user_id))

###AUTH ENDS###############

### FLASK ROUTES ###

@app.route("/testlogin")
@login_required
def index():
    return f"Hello, {current_user.username}! You are logged in."

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""

        user = users_by_username.get(username)
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for("upload_file"))
        flash("Invalid username or password")
    return render_template('login.html')

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload_file():
    if request.method == 'POST':
        patient_id = request.form.get('patient_id')
        document_type = request.form.get('document_type')
        file = request.files.get('file')
        format = file.filename.split('.')[-1]

        if not patient_id or not document_type or not file:
            flash('All fields are required.')
            return redirect(request.url)

        # Sanitize inputs
        patient_id = secure_filename(patient_id)
        document_type = secure_filename(document_type)
        date_str = datetime.now().strftime("%Y%m%d")
        time_str = datetime.now().strftime("%Y%m%d_%H%M%S")

        filename = f"{time_str}_{document_type}.{format}"
        save_folder = os.path.join(app.config['UPLOAD_FOLDER'], patient_id, date_str)
        os.makedirs(save_folder, exist_ok=True)

        file_path = os.path.join(save_folder, filename)
        file.save(file_path)

        flash(f"File uploaded successfully to {file_path}")
        return redirect(request.url)
    
    return render_template('upload.html')

@app.route('/lookup')
@login_required
def lookup():
    return render_template('lookup.html')


@app.route('/getfile')
@login_required
def getfile(): 
    filename = request.args.get('filename')
    directory = request.args.get('directory')
    print(filename,directory)
    return send_from_directory(directory=directory, path=filename, as_attachment=False)

@app.route('/deletefile')
@login_required
def delete_file(): 
    filename = request.args.get('filename')
    directory = request.args.get('directory')
    file_path = os.path.join(directory,filename)
    print(filename,directory)
    if os.path.exists(file_path):
        os.remove(file_path)
        if len(os.listdir(directory)) == 0:
            os.rmdir(directory)
        print(f"File '{file_path}' deleted successfully.")
        return jsonify(f"File '{file_path}' deleted successfully.")
    else:
        print(f"File '{file_path}' does not exist.")
        return jsonify(f"File '{file_path}' does not exist.")
    
@app.route('/renamefile')
@login_required
def rename_file():
    filename = request.args.get('filename')
    directory = request.args.get('directory')
    new_type = request.args.get('document_type')
    format = filename.split('.')[-1]
    filename_body = filename.split('.')[0]
    new_filename = f"{filename_body.split('_')[0]}_{filename_body.split('_')[1]}_{new_type}.{format}"
    if os.path.exists(os.path.join(directory,filename)):
        os.rename(os.path.join(directory,filename), os.path.join(directory,new_filename))
        return jsonify(f"Filename {filename} renamed to {new_filename}")
    else:
        return jsonify(f"Filepath {os.path.join(directory,filename)} does not exist.") 

@app.route('/getrecords')
@login_required
def getrecords(): 
    records = {}
    patient_id = str(request.args.get('patient_id'))
    if os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'],patient_id)):
        for thisDate in os.listdir(os.path.join(app.config['UPLOAD_FOLDER'],patient_id)):
            records[thisDate] = os.listdir(os.path.join(app.config['UPLOAD_FOLDER'],patient_id,thisDate))
    return jsonify(records)


@app.route('/getrecordlist')
@login_required
def getrecordlist(): 
    recordlist = os.listdir(app.config['UPLOAD_FOLDER'])
    return jsonify(recordlist)