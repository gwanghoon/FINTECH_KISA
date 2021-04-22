var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'fintech'
});
 
connection.connect();
 
console.log('connect ok');


connection.query('SELECT * FROM user', function (error, results, fields) {
    console.log(results);
});
 
connection.end();