from decimal import Decimal, InvalidOperation

from flask import Flask, jsonify, request
from flask.json.provider import DefaultJSONProvider
from werkzeug.exceptions import BadRequest, HTTPException

from backend.errors import ValidationError
from backend.scenarios import get_scenarios
from backend.scheduling.engine import simulate
from backend.validation import validate_request

VERSION = '1.0.0'


class ExactJSONProvider(DefaultJSONProvider):
    def loads(self, data, **kwargs):
        kwargs.setdefault('parse_float', Decimal)
        return super().loads(data, **kwargs)


def create_app():
    app = Flask(__name__)
    app.json = ExactJSONProvider(app)
    app.config.update(MAX_CONTENT_LENGTH=1024 * 1024)

    @app.get('/api/health')
    def health():
        return jsonify(status='ok', version=VERSION)

    @app.get('/api/scenarios')
    def scenarios():
        return jsonify(scenarios=get_scenarios())

    @app.post('/api/simulate')
    def run_simulation():
        try:
            data = request.get_json()
        except (RecursionError, ValueError, InvalidOperation) as error:
            raise BadRequest('JSON nesting or numeric representation exceeds supported limits.') from error
        packets, algorithms, interval = validate_request(data)
        return jsonify(results={a: simulate(packets, a, interval) for a in algorithms})

    @app.errorhandler(ValidationError)
    def validation_error(error):
        return jsonify(error=dict(code='validation_error', message=str(error))), 400

    @app.errorhandler(HTTPException)
    def http_error(error):
        codes = {400: 'invalid_json', 413: 'request_too_large', 415: 'unsupported_media_type',
                 404: 'not_found', 405: 'method_not_allowed', 500: 'internal_error'}
        messages = {400: 'Body must contain valid JSON.',
                    413: 'Request body exceeds the 1 MiB limit.',
                    415: 'Send JSON with Content-Type: application/json.',
                    500: 'An unexpected server error occurred.'}
        response = error.get_response()
        response.data = app.json.dumps(dict(error=dict(
            code=codes.get(error.code, 'http_error'), message=messages.get(error.code, error.description))))
        response.content_type = 'application/json'
        return response

    return app


if __name__ == '__main__':
    create_app().run(host='127.0.0.1', port=5000, debug=False)
