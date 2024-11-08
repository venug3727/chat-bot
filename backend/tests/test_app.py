import pytest
import json
from app import app, db
from models import User  # Import the User model

@pytest.fixture
def client():
    """Create a test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        with app.app_context():
            db.create_all()  # Create test database
        yield client


@pytest.fixture
def create_user(client):
    """Create a test user."""
    user = User(email='test@example.com', password='testpassword', name='Test User')
    db.session.add(user)
    db.session.commit()
    return user


def load_intents():
    """Load intents from intents.json."""
    with open('intents.json') as file:
        return json.load(file)


def test_chatbot_response(client, create_user):
    """Test chatbot responses with different inputs from intents.json."""

    # Log in to get a token
    login_response = client.post('/login', json={
        'email': 'test@example.com',
        'password': 'testpassword'
    })

    # Ensure login is successful
    assert login_response.status_code == 200
    assert 'token' in login_response.get_json()

    # Get the JWT token
    token = login_response.get_json()['token']

    # Load intents
    intents = load_intents()

    # Loop through intents and create test cases
    for intent in intents['intents']:
        for pattern in intent['patterns']:
            response = client.post('/chat', json={
                'message': pattern,
            }, headers={'Authorization': f'Bearer {token}'})

            # Check if the response is as expected
            assert response.status_code == 200
            assert 'response' in response.get_json()
            # Assert that the bot response is one of the expected responses
            assert response.get_json()['response'] in intent['responses']
