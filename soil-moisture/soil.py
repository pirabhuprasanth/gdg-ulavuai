import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import os
import random
import json
from werkzeug.utils import secure_filename
import time
from threading import Thread
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# JSON database setup
DATABASE = 'database.json'
moisture_thread = None


def init_db():
    if not os.path.exists(DATABASE):
        with open(DATABASE, 'w') as db_file:
            json.dump({'equipment': [], 'orders': []}, db_file)

def read_db():
    with open(DATABASE, 'r') as db_file:
        return json.load(db_file)

def write_db(data):
    with open(DATABASE, 'w') as db_file:
        json.dump(data, db_file, indent=4)

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/equipment', methods=['GET', 'POST'])
def equipment_api():
    if request.method == 'POST':
        name = request.form['name']
        cost_per_day = float(request.form['cost_per_day'])
        image = request.files['image']
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        db = read_db()
        db['equipment'].append({
            'id': len(db['equipment']) + 1,
            'name': name,
            'image': filename,
            'cost_per_day': cost_per_day
        })
        write_db(db)
        return jsonify({'message': 'Equipment added successfully!'}), 201
    else:
        db = read_db()
        return jsonify({'equipment': db['equipment']})

@app.route('/equipment')
def equipment_page():
    return render_template('equipment.html')

@app.route('/orders', methods=['POST'])
def orders():
    data = request.json
    equipment_id = data['equipment_id']
    quantity = data['quantity']
    
    db = read_db()
    db['orders'].append({
        'id': len(db['orders']) + 1,
        'equipment_id': equipment_id,
        'quantity': quantity
    })
    write_db(db)
    return jsonify({'message': 'Order placed successfully!'}), 201

@app.route('/api/cart', methods=['GET', 'POST', 'DELETE'])
def cart():
    db = read_db()
    if request.method == 'POST':
        item = request.json
        db.setdefault('cart', []).append(item)
        write_db(db)
        return jsonify({'message': 'Item added to cart!'}), 201
    elif request.method == 'DELETE':
        db['cart'] = []
        write_db(db)
        return jsonify({'message': 'Cart cleared!'}), 200
    else:
        return jsonify({'cart': db.get('cart', [])})

@app.route('/api/orders', methods=['GET', 'POST'])
def orders_api():
    db = read_db()
    if request.method == 'POST':
        order = {
            'id': len(db['orders']) + 1,
            'items': db.get('cart', []),
            'total': sum(item['cost_per_day'] * item['quantity'] for item in db.get('cart', []))
        }
        db['orders'].append(order)
        db['cart'] = []
        write_db(db)
        return jsonify({'message': 'Order placed successfully!', 'order': order}), 201
    else:
        return jsonify({'orders': db['orders']})

sensors = [
    {"sensor_id": i, "level": 0, "lat": random.uniform(13.154096, 13.154096 + 0.001), "lng": random.uniform(79.778280, 79.778280 + 0.001)}
    for i in range(1, 11)
]

def generate_soil_moisture():
    with app.app_context():
        while True:
            for sensor in sensors:
                sensor["level"] = random.randint(0, 100)
            socketio.emit('moisture_update', {"sensors": sensors})
            time.sleep(10)

@app.route('/api/sensors', methods=['GET'])
def get_sensors():
    return jsonify({"sensors": sensors})

@app.route('/map')
def satellite_map():
    return render_template('map.html')

@socketio.on('connect')
def handle_connect():
    global moisture_thread
    if moisture_thread is None:
        moisture_thread = socketio.start_background_task(generate_soil_moisture)

if __name__ == '__main__':
        socketio.run(app, host='0.0.0.0', port=3045, debug=True)