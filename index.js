const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const router = express.Router();
const CryptoJS = require("crypto-js");
const openssl = require("openssl-nodejs");

var enc_algos = [
	CryptoJS.AES,
	CryptoJS.DES,
	CryptoJS.TripleDES,
	CryptoJS.Rabbit,
	CryptoJS.RC4,
];

var hash_algos = [
	CryptoJS.MD5,
	CryptoJS.SHA1,
	CryptoJS.SHA224,
	CryptoJS.SHA256,
	CryptoJS.SHA512,
	CryptoJS.SHA3,
	CryptoJS.RIPEMD160,
];

router.get("/", function (req, res) {
	// console.log(a);
	res.sendFile(path.join(__dirname + "/templates/index.html"));
});

router.get("/navbar", function (req, res) {
	res.sendFile(path.join(__dirname + "/templates/navbar.html"));
});

router.get("/hash", function (req, res) {
	res.sendFile(path.join(__dirname + "/templates/hash.html"));
});

router.get("/rsa", function (req, res) {
	res.sendFile(path.join(__dirname + "/templates/rsa.html"));
});

router.get("/indexcss", function (req, res) {
	res.sendFile(path.join(__dirname + "/css/index.css"));
});

router.get("/rsacss", function (req, res) {
	res.sendFile(path.join(__dirname + "/css/rsa.css"));
});

// ! /enc?text=heyy&key=Ansh&algo=0
router.get("/enc", function (req, res) {
	const textt = req.query.text.toString();
	const keyy = req.query.key.toString();
	const algo = enc_algos[parseInt(req.query.algo)];
	res.send(algo.encrypt(textt, keyy).toString());
});

// ! /dec?text=heyy&key=Ansh&algo=0
router.get("/dec", function (req, res) {
	const textt = req.query.text.toString();
	const keyy = req.query.key.toString();
	const algo = enc_algos[parseInt(req.query.algo)];
	console.log(textt);
	var bytes = algo.decrypt(textt, keyy);
	var originalText = bytes.toString(CryptoJS.enc.Utf8);
	res.send(originalText);
	// res.send(algo.decrypt(textt, keyy).toString());
});



// ! /hash?text=heyy&algo=0
router.get("/hashalgo", function (req, res) {
	const textt = req.query.text.toString();
	const algo = hash_algos[parseInt(req.query.algo)];
	console.log(textt);
	var bytes = algo(textt);
	res.send(bytes.toString());
	// res.send(algo.decrypt(textt, keyy).toString());
});

router.get("/getusers", function (req, res) {
	res.json(JSON.parse(fs.readFileSync("data/users.json", "utf-8")));
	// res.send(JSON.stringify());
});


router.get("/genrsa", function (req, res) {
	const name = req.query.name.toString();
	var privatekey = "";
	var publickey = "";
	openssl("openssl genrsa -out keypair.pem 2048".split(" "), function (
		err,
		buffer
	) {
		openssl(
			"openssl rsa -in keypair.pem -pubout -out publickey.pem".split(" "),
			function (err, buffer) {
				privatekey = fs.readFileSync("openssl/keypair.pem", "utf-8");
				publickey = fs.readFileSync("openssl/publickey.pem", "utf-8");
				var file = fs.readFileSync("data/users.json", "utf-8");
				file = JSON.parse(file);
				file[name] = {
					"public": publickey,
					"private": privatekey
				};
				fs.writeFileSync("data/users.json", JSON.stringify(file));
			}
		);
	});

	res.send("DOneeeee");
});


router.get("/getuserdata", function (req, res) {
	const name = req.query.name.toString();
	res.json(JSON.parse(fs.readFileSync("data/users.json", "utf-8"))[name]);
});


app.listen(3000, function () {
	console.log("Example app listening on port 3000!");
	app.use("/", router);
});