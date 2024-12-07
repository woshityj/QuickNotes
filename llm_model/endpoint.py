from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/summarize', methods = ['POST'])
def summarize():
    try:
        input_data = request.json['data']

        summarization = 
    
    except:
        throw()

if __name__ == '__main__':
    app.run(debug = True)