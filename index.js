// Untuk memanggil express
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const hbs = require("hbs");

const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");

// Untuk Memanggil Koneksi ke database postgres
const db = require("./connection/db");
const upload = require("./middleware/fileUpload");
const fs = require("fs");

app.set("view engine", "hbs"); // Konfigurasi atau set View Engine Handlesbar
app.use("/public", express.static(__dirname + "/public")); // Konfigurasi untuk folder public sebagai path untuk assets
app.use(express.urlencoded({ extended: false })); // Mengkonversi request body
app.use(flash()); // Memanggil Flash Message

app.use(
  session({
    secret: "secret",
    rasave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 2 * 60 * 60 * 1000, // Session berlangsung selama 2 jam
    },
  })
);

let isLogin;

app.listen(port, function () {
  console.log(`Server listen on port ${port}`); // Untuk menjalankan server nodejs/express
});

// Index Routing
app.get("/", function (req, res) {
  let query = `
    SELECT tbl_projects.id, tbl_projects.project_name, 
    tbl_projects.start_date, tbl_projects.end_date, 
    tbl_projects.description, tbl_projects.technologies, 
    tbl_projects.image, tbl_projects.author_id, tbl_user.name FROM tbl_projects 
    LEFT JOIN tbl_user ON tbl_projects.author_id = tbl_user.id ORDER BY tbl_projects.id ASC
  `;
  db.query(query, function (err, result) {
    if (err) throw err;
    let data = result.rows;

    data = data.map(function (item) {
      return {
        ...item,
        duration: getDistanceTime(item.start_date, item.end_date),
        description: item.description.slice(0, 20) + " ...",
        isLogin: req.session.isLogin,
      };
    });

    isLogin = req.session.isLogin;
    let user = req.session.user;

    if (isLogin != null) {
      let dataBaru = data.filter((value) => {
        return user.id == value.author_id;
      });
      data = dataBaru;
    }
    return res.render("index", { projects: data, isLogin, user });
  });
});

// Add Project Route
app.get("/add-project", function (req, res) {
  isLogin = req.session.isLogin;
  let user = req.session.user;
  handleLogin(req, res, isLogin);
  res.render("add-project", { isLogin, user });
});

// Route untuk menambahkan data menggunakan method post
app.post("/add-project", upload.single("image"), function (req, res) {
  let data = req.body;
  let user = req.session.user;

  let technologies = [];
  if (data.nodejs) {
    technologies.push(data.nodejs);
  }
  if (data.reactjs) {
    technologies.push(data.reactjs);
  }
  if (data.javascript) {
    technologies.push(data.javascript);
  }
  if (data.tailwind) {
    technologies.push(data.tailwind);
  }

  if (!req.file) {
    db.query(
      "INSERT INTO tbl_projects (project_name, description, image, start_date, end_date, technologies, author_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        data.projectName,
        data.description,
        "no-thumbnail.png",
        data.startDate,
        data.endDate,
        technologies,
        user.id,
      ],
      function (err, result) {
        if (err) throw err;
        req.flash("success", "Data berhasil di tambahkan");
        res.redirect("/");
      }
    );
  } else {
    let image = req.file.filename;
    db.query(
      "INSERT INTO tbl_projects (project_name, description, image, start_date, end_date, technologies, author_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        data.projectName,
        data.description,
        image,
        data.startDate,
        data.endDate,
        technologies,
        user.id,
      ],
      function (err, result) {
        if (err) throw err;
        req.flash("success", "Data berhasil di tambahkan");
        res.redirect("/");
      }
    );
  }
});

// Route to load edit view
app.get("/edit-project/:id", (req, res) => {
  isLogin = req.session.isLogin;
  let user = req.session.user;

  handleLogin(req, res, isLogin);

  let id = req.params.id;

  db.query(`SELECT * FROM tbl_projects WHERE id=${id}`, function (err, result) {
    if (err) throw err;
    let data = result.rows;

    hbs.registerHelper("date", function (date) {
      let newDate = new Date(date);
      return newDate.toISOString().split("T")[0];
    });

    // Checked untuk technologies di form edit
    hbs.registerHelper("checked-nodejs", function (techno) {
      if (techno == "nodejs") {
        return "checked";
      }
    });
    hbs.registerHelper("checked-react", function (techno) {
      if (techno == "react") {
        return "checked";
      }
    });
    hbs.registerHelper("checked-javascript", function (techno) {
      if (techno == "javascript") {
        return "checked";
      }
    });
    hbs.registerHelper("checked-tailwind", function (techno) {
      if (techno == "tailwind-css") {
        return "checked";
      }
    });

    res.render("edit-project", { project: data, isLogin, user }); // Render dan lempar data
  });
  // });
});

// Route to Update Data Action
app.post("/update-project/:id", upload.single("image"), (req, res) => {
  isLogin = req.session.isLogin;
  handleLogin(req, res, isLogin);

  let data = req.body; // Mengambil data dari req.body
  let id = req.params.id;

  // Proses mengubah data
  let technologies = [];
  if (data.nodejs) {
    technologies.push(data.nodejs);
  }
  if (data.reactjs) {
    technologies.push(data.reactjs);
  }
  if (data.javascript) {
    technologies.push(data.javascript);
  }
  if (data.tailwind) {
    technologies.push(data.tailwind);
  }
  // return console.log(req.file);
  if (!req.file) {
    db.query(
      "UPDATE tbl_projects SET project_name=$1, description=$2, start_date=$3, end_date=$4, technologies=$5 WHERE id=$6",
      [
        data.projectName,
        data.description,
        data.startDate,
        data.endDate,
        technologies,
        id,
      ],
      function (err, result) {
        if (err) throw err;
        req.flash("success", "Data berhasil di ubah");
        res.redirect("/");
      }
    );
  } else {
    let imageValue = data.imageValue;
    let image = req.file.filename;

    // return console.log(image);
    if (imageValue != "no-thumbnail.png") {
      fs.unlink(`./public/assets/img/${imageValue}`, (error) => {
        if (error) throw error;
        db.query(
          "UPDATE tbl_projects SET project_name=$1, description=$2, start_date=$3, end_date=$4, technologies=$5, image=$6 WHERE id=$7",
          [
            data.projectName,
            data.description,
            data.startDate,
            data.endDate,
            technologies,
            image,
            id,
          ],
          function (err, result) {
            if (err) throw err;
            req.flash("success", "Data berhasil di ubah");
            res.redirect("/");
          }
        );
      });
    } else {
      db.query(
        "UPDATE tbl_projects SET project_name=$1, description=$2, start_date=$3, end_date=$4, technologies=$5, image=$6 WHERE id=$7",
        [
          data.projectName,
          data.description,
          data.startDate,
          data.endDate,
          technologies,
          image,
          id,
        ],
        function (err, result) {
          if (err) throw err;
          req.flash("success", "Data berhasil di ubah");
          res.redirect("/");
        }
      );
    }
  }

  // });
});

// Route detail project
app.get("/detail-project/:id", function (req, res) {
  isLogin = req.session.isLogin;
  let user = req.session.user;

  let id = req.params.id;

  // db.connect(function (err, client, done) {
  // if (err) throw err; // Jika gagal connect ke database
  // Query database
  db.query(`SELECT * FROM tbl_projects WHERE id=${id}`, function (err, result) {
    if (err) throw err; // Jika gagal dalam query
    let data = result.rows; //  Mengambil rows atau data dari query yang sudah di jalankan

    // Maping Data
    data = data.map(function (item) {
      return {
        ...item,
        duration: getDistanceTime(item.start_date, item.end_date),
        start_detail: getFullTime(item.start_date),
        end_detail: getFullTime(item.end_date),
      };
    });

    // Helper untuk kondisi pada saat looping technologies pada detail-project.hbs
    hbs.registerHelper("technologies-condition", function (technologies) {
      if (technologies == "react") {
        return "React JS";
      } else if (technologies == "nodejs") {
        return "Node JS";
      } else if (technologies == "javascript") {
        return "JavaScript";
      } else {
        return "Tailwind CSS";
      }
    });

    res.render("detail-project", { isLogin, project: data, user }); // Render dan lempar data ke halaman index
  });
  // });
});

// Route Delete Project
app.get("/delete-project/:id", function (req, res) {
  isLogin = req.session.isLogin;
  handleLogin(req, res, isLogin);

  let id = req.params.id;

  db.query(
    `SELECT image FROM tbl_projects WHERE id=${id}`,
    function (err, result) {
      if (err) throw err; // Jika gagal dalam query
      let dataImage = result.rows[0].image;

      if (dataImage != "no-thumbnail.png") {
        fs.unlink(`./public/assets/img/${dataImage}`, (error) => {
          if (error) {
            throw error;
          } else {
            db.query(
              `DELETE FROM tbl_projects WHERE id=${id}`,
              function (err, result) {
                if (err) throw err; // Jika gagal dalam query

                req.flash("success", "Berhasil hapus data");
                return res.redirect("/");
              }
            );
          }
        });
      } else {
        db.query(
          `DELETE FROM tbl_projects WHERE id=${id}`,
          function (err, result) {
            if (err) throw err; // Jika gagal dalam query

            req.flash("success", "Berhasil hapus data");
            return res.redirect("/");
          }
        );
      }
    }
  );
});

// Contact Route
app.get("/contact", function (req, res) {
  isLogin = req.session.isLogin;
  let user = req.session.user;

  res.render("contact", { isLogin, user });
});

// Login
app.get("/login", function (req, res) {
  isLogin = req.session.isLogin;
  res.render("login", { isLogin });
});

// Login action
app.post("/login", function (req, res) {
  let data = req.body;

  db.query(
    "SELECT * FROM tbl_user WHERE email=$1;",
    [data.email],
    function (err, result) {
      if (err) throw err; // Jika gagal dalam query

      if (result.rows.length == 0) {
        req.flash(
          "warning",
          "Maaf email tidak terdaftar. Silahkan daftar terlebih dahulu"
        );
        return res.redirect("login");
      }

      // Compare password hash
      const isMatch = bcrypt.compareSync(
        data.password,
        result.rows[0].password
      );

      if (isMatch) {
        req.session.isLogin = true;
        req.session.user = {
          id: result.rows[0].id,
          name: result.rows[0].name,
          email: result.rows[0].email,
        };
        req.flash("success", "Login Berhasil");
        res.redirect("/"); // Mengarahkan ke url "/"
      } else {
        req.flash("warning", "Maaf, password salah");
        res.redirect("/login");
      }
    }
  );
});

// Register
app.get("/register", function (req, res) {
  isLogin = req.session.isLogin;
  res.render("register", { isLogin });
});

// Register Action
app.post("/register", function (req, res) {
  let data = req.body;
  let hashPassword = bcrypt.hashSync(data.password, 10); // Hash Password | 10 Hash/second

  let query = `SELECT * FROM tbl_user WHERE email='${data.email}'`;

  db.query(query, function (err, result) {
    if (err) throw err;
    if (result.rows.length == 0) {
      db.query(
        "INSERT INTO tbl_user(name, email, password) VALUES ($1, $2, $3);",
        [data.name, data.email, hashPassword],
        function (err, result) {
          if (err) throw err; // Jika gagal dalam query
          req.flash("success", "Register Berhasil");
          res.redirect("/login");
        }
      );
    } else {
      req.flash("danger", "Maaf email yang anda masukkan sudah terdaftar");
      res.redirect("/register");
    }
  });
});

app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

// ==============================================================================================
// Kumpulan untuk function
// ==============================================================================================

// Function untuk menghitung durasi
function getDistanceTime(start, end) {
  let startDate = new Date(start);
  let endDate = new Date(end);

  let distance = endDate - startDate; // Menghitung jarak waktu antara waktu mulai dan selesai

  let miliseconds = 1000; // 1000 miliseconds dalam 1 detik
  let secondInHours = 3600; // 1 jam sama dengan 3600 detik
  let hoursInDay = 24; // 24 jam dalam 1 hari
  let dayInMonth = 31; // 31 hari dalam 1 bulan

  let distanceMonth = Math.floor(
    distance / (miliseconds * secondInHours * hoursInDay * dayInMonth) // Untuk menghitung waktu bulan
  );
  let distanceDay = Math.floor(
    distance / (miliseconds * secondInHours * hoursInDay) // Untuk menghitung waktu hari
  );
  let distanceHours = Math.floor(distance / (miliseconds * 60 * 60)); // Untuk menghitung waktu jam
  let distanceMinutes = Math.floor(distance / (miliseconds * 60)); // Untuk menghitung waktu menit
  let distanceSeconds = Math.floor(distance / miliseconds); // Untuk menghitung waktu detik

  if (distanceMonth > 0) {
    return `${distanceMonth} bulan`;
  } else if (distanceDay > 0) {
    return `${distanceDay} hari`;
  } else if (distanceHours > 0) {
    return `${distanceHours} jam`;
  } else if (distanceMinutes > 0) {
    return `${distanceMinutes} menit`;
  } else {
    return `${distanceSeconds} detik`;
  }
}

// Fucntion untuk menampilkan tanggal yang sudah kita input pada form
function getFullTime(timeInput) {
  let monthName = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  // let time = new Date(); // Mengambil waktu saat ini

  let date = timeInput.getDate(); // Mengambil tanggal dari waktu saat ini yang ada pada variabel timeInput
  let month = timeInput.getMonth(); // Mengambil bulan dari waktu saat ini yang ada pada variabel timeInput, dan index month dimulai dai 0
  let year = timeInput.getFullYear(); // Mengambil tahun dari waktu saat ini yang ada pada variabel timeInput
  let hour = timeInput.getHours(); // Mengambil jam dari waktu saat ini yang ada pada variabel timeInput
  let minute = timeInput.getMinutes(); // Mengambil jam dari waktu saat ini yang ada pada variabel timeInput

  // let fullTime = `${date} ${monthName[month]} ${year} ${hour}:${minute} WIB`;
  let fullTime = `${date} ${monthName[month]} ${year}`;
  return fullTime;
}

function handleLogin(req, res, masuk) {
  if (!masuk) {
    req.flash("danger", "Silahkan Login terlebih dahulu");
    return res.redirect("/login");
  }
}
