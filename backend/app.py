from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User, ChatHistory
from config import Config
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import openai
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from flask_migrate import Migrate
import random  # Add this import

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={r"/*": {"origins": "*"}})

db.init_app(app)
jwt = JWTManager(app)

migrate = Migrate(app, db)

# Initialize OpenAI API key from environment variables
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.before_first_request
def create_tables():
    db.create_all()

# Load intents from file
intents_file_path = os.path.join(os.path.dirname(__file__), 'intents.json')
try:
    with open(intents_file_path, 'r') as file:
        intents = json.load(file)
        print("Intents loaded successfully")
except FileNotFoundError:
    print("Error: intents.json file not found.")
except json.JSONDecodeError:
    print("Error: Could not parse the intents.json file.")

# Preparing the data for the ML model
def prepare_training_data(intents):
    X = []
    y = []
    for intent in intents['intents']:
        for pattern in intent['patterns']:
            X.append(pattern)
            y.append(intent['tag'])
    return X, y

# Vectorizing data and training the Naive Bayes model
def train_model(intents):
    X, y = prepare_training_data(intents)
    vectorizer = TfidfVectorizer(tokenizer=lambda txt: txt.split(), stop_words='english')
    X_vectorized = vectorizer.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(X_vectorized, y, test_size=0.2, random_state=42)
    model = MultinomialNB()
    model.fit(X_train, y_train)

    return model, vectorizer

model, vectorizer = train_model(intents)

@app.route('/history', methods=['GET'])
@jwt_required
def history():
    user_id = get_jwt_identity()
    chats = ChatHistory.query.filter_by(user_id=user_id).all()
    history = [{"message": chat.message, "bot_response": chat.bot_response, "timestamp": chat.timestamp} for chat in chats]
    return jsonify({"history": history}), 200

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data['email']
    password = generate_password_hash(data['password'], method='sha256')
    name = data['name']

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400

    new_user = User(email=email, password=password, name=name)
    db.session.add(new_user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()  # Rollback the session on error
        return jsonify({"message": str(e)}), 500

    return jsonify({"message": "Signup successful"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data['email']
    password = data['password']

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify({"message": "Login successful", "token": access_token}), 200

    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/chat', methods=['POST'])
@jwt_required
def chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"message": "Bad request, 'message' field missing"}), 400

        user_message = data['message']
        user_id = get_jwt_identity()

        user = User.query.get(user_id)
        user_name = user.name if user else "User"

        bot_response = process_chat(user_message, user_name)

        new_chat = ChatHistory(user_id=user_id, message=user_message, bot_response=bot_response)
        db.session.add(new_chat)
        db.session.commit()

        return jsonify({"response": bot_response})
    except Exception as e:
        db.session.rollback()  # Rollback on error
        print(f"Error processing chat: {e}")
        return jsonify({"message": "An unknown error occurred."}), 500

# Chat processing logic
def process_chat(user_input, user_name):
    # Step 1: Check if the user's message matches any predefined intents
    for intent in intents['intents']:
        for pattern in intent['patterns']:
            if pattern.lower() in user_input.lower():
                return random.choice(intent['responses'])

    # Step 2: If no intent matches, use OpenAI GPT-3 to generate a response
    return fetch_ai_response(user_input)

# Fetch AI response from OpenAI API
# Fetch AI response from OpenAI API
def fetch_ai_response(user_input):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # Use "gpt-4" if you have access
            messages=[
                {"role": "user", "content": user_input}
            ],
            max_tokens=150,
            temperature=0.7
        )
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        return f"Sorry, I couldn't fetch a response. Error: {str(e)}"


if __name__ == "__main__":
    app.run(debug=True)
