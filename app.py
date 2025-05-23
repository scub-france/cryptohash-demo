from flask import Flask, request, jsonify
from flask_cors import CORS
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
import base64

app = Flask(__name__)
CORS(app)

# Generate RSA key pair
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)
public_key = private_key.public_key()

@app.route('/public-key', methods=['GET'])
def get_public_key():
    """Send public key to client"""
    pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return jsonify({
        'public_key': pem.decode('utf-8')
    })

@app.route('/encrypt', methods=['POST'])
def encrypt_message():
    """Encrypt message using public key (for demo purposes)"""
    try:
        data = request.json
        message = data['message'].encode('utf-8')

        # Use the server's public key to encrypt
        encrypted = public_key.encrypt(
            message,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        return jsonify({
            'encrypted': base64.b64encode(encrypted).decode('utf-8')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/decrypt', methods=['POST'])
def decrypt_message():
    """Decrypt message using private key"""
    try:
        data = request.json
        encrypted_message = base64.b64decode(data['encrypted'])

        decrypted = private_key.decrypt(
            encrypted_message,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        return jsonify({
            'decrypted': decrypted.decode('utf-8')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/sign', methods=['POST'])
def sign_message():
    """Sign message with private key"""
    try:
        data = request.json
        message = data['message'].encode('utf-8')

        signature = private_key.sign(
            message,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )

        return jsonify({
            'signature': base64.b64encode(signature).decode('utf-8')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)