// ==============================
// BLOOD BANK PROJECT - app.js
// ==============================


console.log("🔥 THIS FILE IS RUNNING 🔥");

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// ------------------------------
// Middleware Setup
// ------------------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files

app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------
// Session Setup
// ------------------------------
app.use(session({
    secret: 'bloodbank_secret_key',
    resave: false,
    saveUninitialized: true
}));

// ------------------------------
// MySQL Connection
// ------------------------------
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) console.log('DB Connection Error:', err);
    else console.log('Connected to MySQL Database!');
});

// ------------------------------
// Middleware: Protect Routes
// ------------------------------
function isLoggedIn(req, res, next) {
    if (req.session.user) next();
    else res.redirect('/login');
}

// ------------------------------
// GET ROUTES
// ------------------------------

app.use(express.static(path.join(__dirname, 'public')));


app.get('/check', (req, res) => {
    res.send('CHECK ROUTE WORKING');
});


app.get('/', (req, res) => {
    res.render('home');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

// Dashboard for all logged-in users
app.get('/dashboard', isLoggedIn, (req, res) => {
    res.render('dashboard', {
        name: req.session.user.name,
        role: req.session.user.role
    });
});

// Donor form (protected)
app.get('/donor', isLoggedIn, (req, res) => {
    res.render('donor_form');
});



// Search donor page (protected)
app.get('/search', isLoggedIn, (req, res) => {
    res.render('search_donor');
});

// Admin dashboard
app.get('/admin', isLoggedIn, (req, res) => {
    if (req.session.user.role !== 'admin') return res.send('Access Denied');
    res.render('admin_dashboard');
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// ------------------------------
// POST ROUTES
// ------------------------------

// Register user
app.post('/register', (req, res) => {
    const { name, email, password, role } = req.body;
    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, password, role], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error during registration");
        }
        res.redirect('/login');
    });
});

// Login user & create session
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.log(err);
            return res.send("Login error");
        }
        if (results.length > 0) {
            const user = results[0];
            // Save user in session
            req.session.user = {
                id: user.id,
                name: user.name,
                role: user.role
            };
            res.redirect('/dashboard');
        } else {
            res.send("Invalid email or password");
        }
    });
});

// Add donor details
// app.post('/donor', isLoggedIn, (req, res) => {
//     const { age, blood_group, contact_number, location, pincode } = req.body;
//     const user_id = req.session.user.id;

//     const sql = `
//         INSERT INTO donor_details
//         (user_id, age, blood_group, contact_number, location, pincode)
//         VALUES (?, ?, ?, ?, ?, ?)
//     `;
//     db.query(sql, [user_id, age, blood_group, contact_number, location, pincode], (err) => {
//         if (err) {
//             console.log(err);
//             return res.send("Error saving donor details");
//         }
//         res.send("Donor details added successfully");
//     });
// });

app.post('/donor', isLoggedIn, (req, res) => {
    const { age, blood_group, contact_number, location, pincode } = req.body;
    const user_id = req.session.user.id;

    // --------------------
    // VALIDATION
    // --------------------

    // Age validation
    if (age < 18) {
        return res.send("Donor age must be 18 or above");
    }

    // Blood group validation
    const validBloodGroups = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
    if (!validBloodGroups.includes(blood_group)) {
        return res.send("Invalid blood group");
    }

    // Phone number validation (10 digits)
    if (!/^\d{10}$/.test(contact_number)) {
        return res.send("Invalid contact number");
    }

    // --------------------
    // DUPLICATE DONOR CHECK
    // --------------------
    const checkSql = "SELECT * FROM donor_details WHERE user_id = ?";
    db.query(checkSql, [user_id], (err, results) => {
        if (err) {
            console.log(err);
            return res.send("Server error");
        }

        if (results.length > 0) {
            return res.send("You have already registered as a donor");
        }

        // --------------------
        // INSERT DONOR DETAILS
        // --------------------
        const insertSql = `
            INSERT INTO donor_details
            (user_id, age, blood_group, contact_number, location, pincode)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(insertSql, [user_id, age, blood_group, contact_number, location, pincode], (err2) => {
            if (err2) {
                console.log(err2);
                return res.send("Error saving donor details");
            }

            res.send("Donor details added successfully ✅");
        });
    });
});


// Search donor logic
// app.post('/search-donor', isLoggedIn, (req, res) => {
//     const { blood_group, location, pincode } = req.body;

//     const sqlPincode = `
//         SELECT * FROM donor_details
//         WHERE blood_group = ? AND pincode = ? AND available = TRUE
//     `;
//     db.query(sqlPincode, [blood_group, pincode], (err, results) => {
//         if (err) {
//             console.log(err);
//             return res.send("Search error");
//         }
//         if (results.length > 0) {
//             return res.render('donor_list', { donors: results });
//         }
//         // fallback to location if no pincode match
//         const sqlLocation = `
//             SELECT * FROM donor_details
//             WHERE blood_group = ? AND location = ? AND available = TRUE
//         `;
//         db.query(sqlLocation, [blood_group, location], (err2, results2) => {
//             if (err2) {
//                 console.log(err2);
//                 return res.send("Search error");
//             }
//             res.render('donor_list', { donors: results2 });
//         });
//     });
// });

// ------------------------------
// SEARCH DONOR ROUTE (CLEAN)
// ------------------------------
app.post('/search-donor', isLoggedIn, (req, res) => {
    const { blood_group, location, pincode } = req.body;

    // --------------------
    // BASIC VALIDATION
    // --------------------
    if (!blood_group) {
        return res.send("Please select a blood group");
    }

    if (!pincode && !location) {
        return res.send("Please enter pincode or location");
    }

    // --------------------
    // SEARCH BY PINCODE (PRIORITY)
    // --------------------
    const pincodeQuery = `
        SELECT blood_group, contact_number, location, pincode
        FROM donor_details
        WHERE blood_group = ?
          AND pincode = ?
          AND available = TRUE
    `;

    db.query(pincodeQuery, [blood_group, pincode], (err, pincodeResults) => {
        if (err) {
            console.log(err);
            return res.send("Server error while searching");
        }

        // If donors found by pincode → show results
        if (pincodeResults.length > 0) {
            return res.render('donor_list', {
                donors: pincodeResults,
                message: "Donors found near your pincode ✅"
            });
        }

        // --------------------
        // FALLBACK: SEARCH BY LOCATION
        // --------------------
        const locationQuery = `
            SELECT blood_group, contact_number, location, pincode
            FROM donor_details
            WHERE blood_group = ?
              AND location = ?
              AND available = TRUE
        `;

        db.query(locationQuery, [blood_group, location], (err2, locationResults) => {
            if (err2) {
                console.log(err2);
                return res.send("Server error while searching");
            }

            if (locationResults.length === 0) {
                return res.render('donor_list', {
                    donors: [],
                    message: "No donors available right now 😔"
                });
            }

            res.render('donor_list', {
                donors: locationResults,
                message: "Donors found in your location ✅"
            });
        });
    });
});



// Logout (GET) for links
// app.get('/logout', (req, res) => {
//     req.session.destroy(err => {
//         if (err) return res.send("Error logging out");
//         res.redirect('/login');
//     });
// });

// // Logout (POST) for forms
// app.post('/logout', (req, res) => {
//     req.session.destroy(err => {
//         if (err) return res.send("Error logging out");
//         res.redirect('/login');
//     });
// });


// ----------------------------
// LOGOUT ROUTE
// ----------------------------
app.get('/logout', (req, res) => {
    if (req.session.user) {
        req.session.destroy(err => {
            if (err) {
                console.log("Session destroy error:", err);
                return res.send("Error logging out");
            }
            res.redirect('/login');
        });
    } else {
        // If no session, just redirect
        res.redirect('/login');
    }
});



// ------------------------------
// Start Server
// ------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

