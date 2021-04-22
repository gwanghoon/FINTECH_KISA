var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'fintech'
});
 
connection.connect();
 
connection.query('SELECT * FROM user', function (error, results, fields) {
    console.log(results);
});
 
connection.end();