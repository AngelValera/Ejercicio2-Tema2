var request = require('supertest'),
should = require('should'),
app = require('../app.js');

describe( "Vota empresas", function() {
    it('should return correct type', function (done) {
	request(app)
	    .get('/')
	    .expect('Content-Type', /html/)
	    .expect(200,done);
    });
});
