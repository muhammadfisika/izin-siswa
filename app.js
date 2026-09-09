/*************************************************
 * SISTEM IZIN SISWA
 * FRONTEND - WALI KELAS
 *************************************************/


/*
 * GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT
 */

const API_URL =
  "https://script.google.com/macros/s/AKfycbyM4Gkh07mP5FaiJVDSrn2K6aIMSnDkwEP7T5NP9apMt93Y5wYEDUFUl3WK9dnS0cdM/exec";


/* ==============================================
   GLOBAL USER
============================================== */

let currentUser = null;


/* ==============================================
   SAAT HALAMAN DIBUKA
============================================== */

document.addEventListener("DOMContentLoaded", function () {

  const savedUser =
    localStorage.getItem("izinSiswaUser");

  if (savedUser) {

    try {

      currentUser =
        JSON.parse(savedUser);

      if (
        currentUser.role === "WALI_KELAS"
      ) {

        tampilkanDashboard();

      } else {

        localStorage.removeItem(
          "izinSiswaUser"
        );

      }

    } catch (error) {

      localStorage.removeItem(
        "izinSiswaUser"
      );

    }

  }


  /*
   * Isi tanggal hari ini
   */

  const tanggal =
    document.getElementById("tanggal");

  if (tanggal) {

    tanggal.value =
      tanggalHariIni();

  }

});


/* ==============================================
   LOGIN
============================================== */

async function login() {

  const username =
    document.getElementById("username")
      .value.trim();

  const password =
    document.getElementById("password")
      .value.trim();


  if (!username || !password) {

    tampilkanPesan(
      "loginMessage",
      "Username dan password wajib diisi.",
      "error"
    );

    return;

  }


  tampilkanLoading(true);


  try {

    const result =
      await requestAPI({
        action: "login",
        username: username,
        password: password
      });


    if (!result.success) {

      tampilkanPesan(
        "loginMessage",
        result.message,
        "error"
      );

      return;

    }


    currentUser = result.user;


    /*
     * Tahap 3 hanya menangani
     * Wali Kelas.
     */

    if (
      currentUser.role !==
      "WALI_KELAS"
    ) {

      tampilkanPesan(
        "loginMessage",
        "Dashboard role tersebut belum dibuat pada Tahap 3.",
        "error"
      );

      currentUser = null;

      return;

    }


    localStorage.setItem(
      "izinSiswaUser",
      JSON.stringify(currentUser)
    );


    tampilkanDashboard();


  } catch (error) {

    tampilkanPesan(
      "loginMessage",
      error.message,
      "error"
    );

  } finally {

    tampilkanLoading(false);

  }

}


/* ==============================================
   DASHBOARD
============================================== */

function tampilkanDashboard() {

  document
    .getElementById("loginPage")
    .classList.add("hidden");


  document
    .getElementById("waliPage")
    .classList.remove("hidden");


  document
    .getElementById("namaWali")
    .textContent =
    currentUser.nama || "-";


  document
    .getElementById("kelasWali")
    .textContent =
    currentUser.kelas || "-";


  /*
   * Pastikan tanggal hari ini
   */

  document
    .getElementById("tanggal")
    .value =
    tanggalHariIni();

}


/* ==============================================
   LOGOUT
============================================== */

function logout() {

  localStorage.removeItem(
    "izinSiswaUser"
  );

  currentUser = null;

  location.reload();

}


/* ==============================================
   CARI SISWA DENGAN ENTER
============================================== */

function cariSiswaKey(event) {

  if (event.key === "Enter") {

    cariSiswa();

  }

}


/* ==============================================
   CARI SISWA
============================================== */

async function cariSiswa() {

  if (!currentUser) {

    return;

  }


  const keyword =
    document
      .getElementById("keywordSiswa")
      .value
      .trim();


  const hasil =
    document.getElementById(
      "hasilSiswa"
    );


  hasil.innerHTML =
    "<p>Mencari siswa...</p>";


  try {

    const result =
      await requestAPI({

        action: "cariSiswa",

        kelas:
          currentUser.kelas,

        keyword:
          keyword

      });


    if (!result.success) {

      hasil.innerHTML =
        `<p class="error-text">
          ${escapeHtml(result.message)}
        </p>`;

      return;

    }


    if (
      !result.data ||
      result.data.length === 0
    ) {

      hasil.innerHTML =
        "<p>❌ Siswa tidak ditemukan.</p>";

      return;

    }


    hasil.innerHTML = "";


    result.data.forEach(function (siswa) {

      const item =
        document.createElement("div");

      item.className =
        "student-item";


      item.innerHTML = `

        <div class="student-info">

          <div class="student-name">
            ${escapeHtml(siswa.NAMA_SISWA)}
          </div>

          <div class="student-class">
            NIS: ${escapeHtml(siswa.NIS)}
            •
            Kelas: ${escapeHtml(siswa.KELAS)}
          </div>

        </div>

        <button
          class="btn-select"
          onclick='pilihSiswa(${JSON.stringify(siswa)})'
        >
          Pilih
        </button>

      `;


      hasil.appendChild(item);

    });


  } catch (error) {

    hasil.innerHTML =
      `<p>❌ ${escapeHtml(error.message)}</p>`;

  }

}


/* ==============================================
   PILIH SISWA
============================================== */

function pilihSiswa(siswa) {

  document
    .getElementById("formIzinCard")
    .classList.remove("hidden");


  document
    .getElementById("idSiswa")
    .value =
    siswa.ID_SISWA;


  document
    .getElementById("siswaTerpilih")
    .innerHTML = `

      <strong>
        ${escapeHtml(siswa.NAMA_SISWA)}
      </strong>

      <br>

      <small>
        NIS: ${escapeHtml(siswa.NIS)}
        |
        Kelas: ${escapeHtml(siswa.KELAS)}
      </small>

    `;


  /*
   * Scroll ke form
   */

  document
    .getElementById("formIzinCard")
    .scrollIntoView({
      behavior: "smooth"
    });

}


/* ==============================================
   UBAH JENIS IZIN
============================================== */

function ubahJenisIzin() {

  const jenis =
    document.querySelector(
      'input[name="jenisIzin"]:checked'
    ).value;


  const groupKeluar =
    document.getElementById(
      "groupWaktuKeluar"
    );


  if (jenis === "KELUAR") {

    groupKeluar
      .classList
      .remove("hidden");

  } else {

    groupKeluar
      .classList
      .add("hidden");

  }

}


/* ==============================================
   SIMPAN IZIN
============================================== */

async function simpanIzin() {

  if (!currentUser) {

    return;

  }


  const idSiswa =
    document
      .getElementById("idSiswa")
      .value;


  const tanggal =
    document
      .getElementById("tanggal")
      .value;


  const jenis =
    document.querySelector(
      'input[name="jenisIzin"]:checked'
    ).value;


  const alasan =
    document
      .getElementById("alasan")
      .value
      .trim();


  const waktuKeluar =
    document
      .getElementById("waktuKeluar")
      .value;


  const waktuMasuk =
    document
      .getElementById("waktuMasuk")
      .value;


  /*
   * Validasi
   */

  if (!idSiswa) {

    tampilkanPesan(
      "izinMessage",
      "Silakan pilih siswa terlebih dahulu.",
      "error"
    );

    return;

  }


  if (!tanggal) {

    tampilkanPesan(
      "izinMessage",
      "Tanggal izin wajib diisi.",
      "error"
    );

    return;

  }


  if (!alasan) {

    tampilkanPesan(
      "izinMessage",
      "Alasan izin wajib diisi.",
      "error"
    );

    return;

  }


  if (
    jenis === "KELUAR" &&
    !waktuKeluar
  ) {

    tampilkanPesan(
      "izinMessage",
      "Waktu keluar wajib diisi.",
      "error"
    );

    return;

  }


  if (!waktuMasuk) {

    tampilkanPesan(
      "izinMessage",
      "Waktu masuk/kembali wajib diisi.",
      "error"
    );

    return;

  }


  tampilkanLoading(true);


  try {

    const result =
      await requestAPI({

        action:
          "simpanIzin",

        user:
          currentUser,

        idSiswa:
          idSiswa,

        tanggal:
          tanggal,

        jenisIzin:
          jenis,

        alasan:
          alasan,

        waktuKeluar:
          waktuKeluar,

        waktuMasuk:
          waktuMasuk

      });


    if (!result.success) {

      tampilkanPesan(
        "izinMessage",
        result.message,
        "error"
      );

      return;

    }


    tampilkanPesan(
      "izinMessage",
      "✅ Izin berhasil disimpan. ID: " +
        result.idIzin,
      "success"
    );


    /*
     * Reset form
     */

    resetFormIzin();


  } catch (error) {

    tampilkanPesan(
      "izinMessage",
      "Gagal menyimpan izin: " +
        error.message,
      "error"
    );

  } finally {

    tampilkanLoading(false);

  }

}


/* ==============================================
   RESET FORM
============================================== */

function resetFormIzin() {

  document
    .getElementById("idSiswa")
    .value = "";


  document
    .getElementById("alasan")
    .value = "";


  document
    .getElementById("waktuKeluar")
    .value = "";


  document
    .getElementById("waktuMasuk")
    .value = "";


  document
    .getElementById("keywordSiswa")
    .value = "";


  document
    .getElementById("hasilSiswa")
    .innerHTML = "";


  document
    .getElementById("formIzinCard")
    .classList
    .add("hidden");

}


/* ==============================================
   REQUEST API
============================================== */

async function requestAPI(data) {

  if (
    !API_URL ||
    API_URL.includes(
      "GANTI_DENGAN_URL"
    )
  ) {

    throw new Error(
      "URL Apps Script belum dimasukkan ke app.js."
    );

  }


  const response =
    await fetch(API_URL, {

      method: "POST",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body:
        JSON.stringify(data)

    });


  if (!response.ok) {

    throw new Error(
      "Server memberikan HTTP " +
      response.status
    );

  }


  return await response.json();

}


/* ==============================================
   TAMPILKAN PESAN
============================================== */

function tampilkanPesan(
  elementId,
  message,
  type
) {

  const element =
    document.getElementById(
      elementId
    );


  element.textContent =
    message;


  element.className =
    "message " + type;

}


/* ==============================================
   LOADING
============================================== */

function tampilkanLoading(show) {

  const element =
    document.getElementById(
      "loading"
    );


  if (show) {

    element
      .classList
      .remove("hidden");

  } else {

    element
      .classList
      .add("hidden");

  }

}


/* ==============================================
   TANGGAL HARI INI
============================================== */

function tanggalHariIni() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      now.getDate()
    ).padStart(2, "0");


  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


/* ==============================================
   KEAMANAN OUTPUT HTML
============================================== */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
