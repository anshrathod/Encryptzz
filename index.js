const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const router = express.Router();
const CryptoJS = require("crypto-js");
const openssl = require("openssl-nodejs");
const formidable = require('express-formidable');
const crypto = require('crypto');
const csrgen = require('csr-gen');



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


router.get("/dgst", function (req, res) {
	res.sendFile(path.join(__dirname + "/templates/dgst.html"));
});


router.get("/cert", function (req, res) {
	res.sendFile(path.join(__dirname + "/templates/cert.html"));
});


router.get("/indexcss", function (req, res) {
	res.sendFile(path.join(__dirname + "/css/index.css"));
});


router.get("/downloadsigned", function (req, res) {
	res.sendFile(path.join(__dirname + "/openssl/signed.txt"));
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
	openssl("openssl genrsa -out private-rsa.pem 2048".split(" "), function (
		err,
		buffer
	) {
		openssl(
			"openssl rsa -in private-rsa.pem -pubout -out public-rsa.pem".split(" "),
			function (err, buffer) {
				privatekey = fs.readFileSync("openssl/private-rsa.pem", "utf-8");
				publickey = fs.readFileSync("openssl/public-rsa.pem", "utf-8");
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


app.use(formidable());
router.post("/sign", function (req, res) {
	let files = req.files;
	let send = false;
	infile = files['input-file'];
	privfile = files['private-file'];
	var rawData = fs.readFileSync(infile.path);
	fs.writeFile('openssl/input-sign.txt', rawData, (err) => {
		if (err) {
			console.log(err);
		} else {
			console.log("Successfully uploaded");
			var rawData = fs.readFileSync(privfile.path);
			fs.writeFile('openssl/private-key-sign.pem', rawData, (err) => {
				if (err) console.log(err)
				console.log("Successfully uploaded")
				// 	openssl("openssl dgst -hex -sign private-key-sign.pem input-sign.txt".split(" "), function (
				// 		err,
				// 		buffer
				// 	) {
				// 		// console.log(buffer.toString('utf-8'));
				// 		fs.writeFileSync('openssl/signed.txt', buffer.toString('utf-8').split(' ')[1]);
				// 		send = true;
				// 	});

				const private_key = fs.readFileSync('openssl/private-key-sign.pem', {
					encoding: 'utf8'
				});
				const doc = fs.readFileSync('openssl/input-sign.txt', {
					encoding: 'utf8'
				});
				const signer = crypto.createSign('RSA-SHA256');
				signer.update(doc);
				signer.end();
				const signature = signer.sign(private_key, 'hex')
				fs.writeFileSync('openssl/signed.txt', signature.toString('utf-8'));

			});
		}
	});
	res.send(true);
});


router.post("/validate", function (req, res) {
	let files = req.files;
	infile = files['input-file'];
	pubfile = files['public-file'];
	signfile = files['signed-file'];
	var rawData = fs.readFileSync(infile.path);
	fs.writeFileSync('openssl/input-val.txt', rawData);
	var rawData = fs.readFileSync(pubfile.path);
	fs.writeFileSync('openssl/public-key-val.pem', rawData);
	var rawData = fs.readFileSync(signfile.path);
	fs.writeFileSync('openssl/signed-file-val.txt', rawData);
	const public_key = fs.readFileSync('openssl/public-key-val.pem', {
		encoding: 'utf8'
	});
	const doc = fs.readFileSync('openssl/signed-file-val.txt', {
		encoding: 'utf8'
	});
	const indoc = fs.readFileSync('openssl/input-val.txt', {
		encoding: 'utf8'
	});
	const verifier = crypto.createVerify('RSA-SHA256');
	verifier.update(indoc);
	const key = verifier.verify(Buffer.from(public_key, 'utf-8'), Buffer.from(doc, 'hex'));
	res.send(key);
});


router.get("/certgen", function (req, res) {
	const name = req.query.name.toString();
	var domain = name + '.com';
	csrgen(domain, {
		outputDir: __dirname,
		read: true,
		destroy: true,
		company: name,
		email: 'user@' + name + '.com',
	}, function (err, keys) {
		var file = fs.readFileSync("data/certs.json", "utf-8");
		file = JSON.parse(file);
		file[name] = {
			"certificate": keys.csr,
			"private": keys.key
		};
		fs.writeFileSync("data/certs.json", JSON.stringify(file));
	});
});


router.get("/getcertdata", function (req, res) {
	const name = req.query.name.toString();
	res.json(JSON.parse(fs.readFileSync("data/certs.json", "utf-8"))[name]);
});


router.get("/getcerts", function (req, res) {
	res.json(JSON.parse(fs.readFileSync("data/certs.json", "utf-8")));
	// res.send(JSON.stringify());
});


app.listen(3000, function () {
	console.log("Example app listening on port 3000!");
	app.use("/", router);
});