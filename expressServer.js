const express = require('express')
const path = require('path');
const app = express();
const request = require('request');
var jwt = require('jsonwebtoken');
var auth = require('./lib/auth')
var moment = require('moment');

var session = require('express-session');               

var companyId = "M202112103U"
require('dotenv').config();

// json 타입에 데이터 전송을 허용한다.
app.use(express.json());
// form 타입에 데이터 전송을 허용한다.
app.use(express.urlencoded({extended:false}));
// to us static asset 
app.use(express.static(path.join(__dirname, 'public')));

app.engine('html', require('ejs').renderFile);

// views 폴더에 view 파일 존재
app.set('views',__dirname+'/views');
// ejs를 view 엔진으로 사용
app.set('view engine','ejs');

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'fintech',
  dateStrings: 'date'
});

connection.connect();
connection.query('SELECT * FROM user', function (error, results, fields) {
	console.log('hoon 테스트');
    console.log(results);
});


app.get('/', function (req, res) {	
    res.render('success');
})

app.get('/authTest',auth,function(req,res){
  res.send("정상적으로 로그인 하셨다면 해당 화면이 보입니다.");
})

app.get('/signup',function(req,res){
  res.render('signup');
})

app.get('/main',function(req,res){
  res.render('main');  
})

app.get('/login',function(req,res){
  res.render('login');
})

app.post('/login',function(req,res){
  var userName = req.body.userName;
  var userPassword = req.body.userPassword;

  var sql = "SELECT * FROM user WHERE name = ?";
  connection.query(sql, [userName], function(err, result){
      if(err){
          console.error(err);
          //res.json(0);
          throw err;
      }
      else {
          if(result.length == 0){
	 		 res.json('사용자가 없습니다.')
             //res.json(3);
          }
          else {
              console.log(result[0].accesstoken);
              var dbPassword = result[0].password;
			  console.log('database password : ', dbPassword);
              if(dbPassword == userPassword){
				  console.log('login 성공!');
                  var tokenKey = process.env.token_key
                  jwt.sign(
                    {
                        userId : result[0].id,
                        userName : result[0].name
                    },
                    tokenKey,
                    {
                        expiresIn : '10d',
                        issuer : 'fintech.admin',
                        subject : 'user.login.info'
                    },
                    function(err, token){
                        console.log('우리가 발급한 토큰 : ',token);
                        res.json(token)
                    }
                  )            
              }
				else if(dbPassword != userPassword) {
                res.json('패스워드가 다릅니다');
            }
/*
              else {
                  res.json(2);
              }*/
          }
      }
  })
})

app.post('/list', auth, function(req, res){
  var user = req.decoded;
  var sql = "SELECT * FROM user WHERE id = ?";
  connection.query(sql,[user.userId], function(err, result){
      if(err) throw err;
      else {
          var dbUserData = result[0];
          var option = {
              method : "GET",
              url : "https://testapi.openbanking.or.kr/v2.0/user/me",
              headers : {
                  Authorization : "Bearer " + dbUserData.accesstoken
              },
              qs : {
                  user_seq_no : dbUserData.userseqno
              }
          }
          request(option, function(err, response, body){
              if(err){
                  console.error(err);
                  throw err;
              }
              else {
                  var listRequestResult = JSON.parse(body);
                  res.json(listRequestResult)
              }
          })        
      }
  })
})

app.get('/qrcode',function(req,res){
  res.render('qrcode');
})

app.get('/qrreader',function(req,res){
  res.render('qrreader');
})

app.get('/balance',function(req,res){
  res.render('balance');
})

app.post('/withdraw',auth,function(req,res){
  // 사용자 출금 이체 API 수행하기
  var user = req.decoded;
  var fin_use_num = req.body.fin_use_num;
  var to_fin_use_num = req.body.to_fin_use_num;
  var amount = req.body.amount;
  var countnum = Math.floor(Math.random() * 1000000000) + 1;
  var transId = companyId + countnum;
  var sql = "SELECT * FROM user WHERE id = ?";
  var transdtime = moment(new Date()).format('YYYYMMDDhhmmss');
  connection.query(sql,[user.userId], function(err, result){
      if(err) throw err;
      else {
          var dbUserData = result[0];
          var option = {
              method : "POST",
              url : "https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/fin_num",
              headers : {
                  Authorization : "Bearer " + dbUserData.accesstoken
              },
              json: {
                "bank_tran_id" : transId,
                "cntr_account_type" : "N",
                "cntr_account_num" : "100000000001",
                "dps_print_content": "쇼핑몰환불",
                "fintech_use_num": fin_use_num,
                "wd_print_content": "오픈뱅킹출금",
                "tran_amt": amount,
                "tran_dtime": transdtime,
                "req_client_name": "홍길동",
                "req_client_fintech_use_num" : to_fin_use_num,
                "req_client_num": "HONGGILDONG1234",
                "transfer_purpose": "ST",
                "recv_client_name": "홍길동",
                "recv_client_bank_code": "097",
                "recv_client_account_num": "100000000001"              
              }
          }
          request(option, function(err, response, body){
              if(err){
                  console.error(err);
                  throw err;
              }
              else {
                res.json(body);
              }
          })
      }
  })
})

app.post('/balance', auth, function(req,res){
  // 사용자 정보 조회
  // 사용자 정보를 바탕으로 request (잔액조회 api) 요청 작성하기 
  var user = req.decoded;
  var countnum = Math.floor(Math.random() * 1000000000) + 1;
  var transId = companyId + countnum;
  var sql = "SELECT * FROM user WHERE id = ?";
  var transdtime = moment(new Date()).format('YYYYMMDDhhmmss');
  connection.query(sql,[user.userId], function(err, result){
      if(err) throw err;
      else {
          var dbUserData = result[0];
          var option = {
              method : "GET",
              url : "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
              headers : {
                  Authorization : "Bearer " + dbUserData.accesstoken
              },
              qs : {
                bank_tran_id : transId,
                fintech_use_num : req.body.fin_use_num,
                tran_dtime : transdtime,
              }
          }
          request(option, function(err, response, body){
              if(err){
                  console.error(err);
                  throw err;
              }
              else {
                  var balanceRequestResult = JSON.parse(body);
                  res.json(balanceRequestResult)
              }
          })
      }
  })
})

app.get('/transaction',function(req,res){
  res.render('transaction');  
})

app.post('/transaction', auth, function(req,res){
  var user = req.decoded;
  var countnum = Math.floor(Math.random() * 1000000000);
  var transId = companyId + countnum;
  var sql = "SELECT * FROM user WHERE id = ?";
  var transdtime = moment(new Date()).format('YYYYMMDDhhmmss');
  connection.query(sql,[user.userId], function(err, result){
      if(err) throw err;
      else {
          var dbUserData = result[0];
          var option = {
              method : "GET",
              url : "https://testapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num",
              headers : {
                  Authorization : "Bearer " + dbUserData.accesstoken
              },
              qs : {
                bank_tran_id : transId,
                fintech_use_num : req.body.fin_use_num,
                inquiry_type : "A",
                inquiry_base : "D",
                from_date : "20190404", 
                to_date : "20210426",
                sort_order : "D",
                tran_dtime : transdtime
              }
          }
          request(option, function(err, response, body){
              if(err){
                  console.error(err);
                  throw err;
              }
              else {
                  var transRequestResult = JSON.parse(body);
                  res.json(transRequestResult)
              }
          })
      }
  }) 
})

app.post('/signup',function(req,res){
  // 사용자가 입력한 정보 저장
  var userName = req.body.userName;
  var userEmail = req.body.userEmail;
  var userPassword = req.body.userPassword;
  var userAccessToken = req.body.userAccessToken;
  var userRefreshToken = req.body.userRefreshToken;
  var userSeqNo = req.body.userSeqNo;

  var sql = "INSERT INTO user (name, email, password, accesstoken, refreshtoken, userseqno, create_time) VALUES (?,?,?,?,?,?,NOW())";
  connection.query(sql,[userName, userEmail, userPassword, userAccessToken, userRefreshToken, userSeqNo], function(error,results){
    if(error){
      console.error(error);
      throw error;
    }
    else{
      res.json(1);
    }
  });
})

// 인증 후 code를 받는 url
app.get('/authResult',function(req,res){
  var authCode = req.query.code;
  var option = {
      method : "POST",
      url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
      header : {
          'Content-Type' : 'application/x-www-form-urlencoded'
      },
      form : {
        code : authCode,
        client_id : "70aac4fd-e3cd-420c-81c3-322b4fbb797c",
        client_secret : process.env.client_secret,
        redirect_uri : "http://localhost/authResult",
        grant_type : "authorization_code"
      }
  }
  request(option, function(err, response, body){
      if(err){
          console.error(err);
          throw err;
      }
      else {
          var accessRequestResult = JSON.parse(body);
          console.log(accessRequestResult);
          res.render('resultChild', {data:accessRequestResult});
      }
  })
})


app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});