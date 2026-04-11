const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const path = require("path")
require('dotenv').config();

const cookieParser = require('cookie-parser');


const bcrypt = require('bcrypt')
const saltRounds = 10


const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET

const multer = require("multer")
const res = require("express/lib/response")

const app = express()
app.use(cookieParser());
app.use(express.json())
app.use(express.static("public"))

const db = new sqlite3.Database("lanchonete.db")


async function roda() {
    const passwordd = '1802971610'
    const hashedpassword = await bcrypt.hash(passwordd, saltRounds)
    db.run(`INSERT INTO lojasInfo (idLoja,user,password) VALUES (?,?,?)`,['burcaslanchonete','lucas',`${hashedpassword}`])
}
roda()